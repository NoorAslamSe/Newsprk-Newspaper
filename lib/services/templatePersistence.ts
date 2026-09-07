import { connectDB } from "@/lib/db";
import { AdTemplate } from "@/lib/models/AdTemplate";
import { AdSnippet } from "@/lib/models/AdSnippet";

/**
 * TemplatePersistenceService — manages draft/session state for ad template editing.
 *
 * Session storage: localStorage keyed by `template_session_{userId}_{templateId}`.
 *   - Chosen over Redis/DB for simplicity; sessions are per-browser, not cross-device.
 *   - Sessions auto-expire via cleanupOldSessions() (default: 7 days).
 *
 * Versioning: createTemplateVersion() stores each snapshot as a separate AdTemplate
 *   document (isActive: false). There is no dedicated TemplateVersion collection yet
 *   — the version history is effectively a set of inactive AdTemplate documents.
 *
 * useTemplatePersistence() at the bottom is a thin React adapter hook that exposes
 *   the service methods for use in Client Components without direct class imports.
 */

/** In-browser draft for a template being edited. Keyed by userId + templateId. */
export interface TemplateSession {
  templateId: string;
  variables: Record<string, any>;
  customCode?: string;
  lastModified: Date;
  userId: string;
}

/** A point-in-time snapshot of a template's code and variables. */
export interface TemplateVersion {
  id: string;
  templateId: string;
  version: number;
  code: string;
  variables: any[];
  createdAt: Date;
  createdBy: string;
  description?: string;
}

export class TemplatePersistenceService {
  /**
   * Save template modifications to user session
   */
  static async saveTemplateSession(
    userId: string,
    templateId: string,
    variables: Record<string, any>,
    customCode?: string
  ): Promise<void> {
    try {
      // localStorage key includes userId to prevent one user seeing another's unsaved draft
      const sessionData: TemplateSession = {
        templateId,
        variables,
        customCode,
        lastModified: new Date(),
        userId,
      };

      // Client-only: localStorage is not available on the server (Next.js SSR guard)
      if (typeof window !== 'undefined') {
        const sessionKey = `template_session_${userId}_${templateId}`;
        localStorage.setItem(sessionKey, JSON.stringify(sessionData));
      }
    } catch (error) {
      console.error('Error saving template session:', error);
      throw new Error('Failed to save template session');
    }
  }

  /**
   * Load template modifications from user session
   */
  static async loadTemplateSession(
    userId: string,
    templateId: string
  ): Promise<TemplateSession | null> {
    try {
      if (typeof window !== 'undefined') {
        const sessionKey = `template_session_${userId}_${templateId}`;
        const sessionData = localStorage.getItem(sessionKey);
        
        if (sessionData) {
          const parsed = JSON.parse(sessionData);
          return {
            ...parsed,
            lastModified: new Date(parsed.lastModified),
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error loading template session:', error);
      return null;
    }
  }

  /**
   * Clear template session
   */
  static async clearTemplateSession(
    userId: string,
    templateId: string
  ): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        const sessionKey = `template_session_${userId}_${templateId}`;
        localStorage.removeItem(sessionKey);
      }
    } catch (error) {
      console.error('Error clearing template session:', error);
    }
  }

  /**
   * Create a new version of a template
   */
  static async createTemplateVersion(
    templateId: string,
    code: string,
    variables: any[],
    userId: string,
    description?: string
  ): Promise<TemplateVersion> {
    try {
      await connectDB();
      
      // Get current template to determine next version number
      const template = await AdTemplate.findById(templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      // Snapshot: creates a new inactive AdTemplate doc to represent this version.
      // A dedicated TemplateVersion collection would be cleaner — this is a pragmatic shortcut.
      const versionData = {
        name: `${template.name} - Version ${Date.now()}`,
        description: description || `Version created on ${new Date().toISOString()}`,
        category: template.category,
        code,
        variables,
        preview: template.preview,
        isActive: false, // Inactive — only the canonical template is active
        createdBy: userId,
      };

      const version = await AdTemplate.create(versionData);
      
      return {
        id: version._id.toString(),
        templateId,
        version: 1, // Simplified version numbering
        code,
        variables,
        createdAt: version.createdAt,
        createdBy: userId,
        description,
      };
    } catch (error) {
      console.error('Error creating template version:', error);
      throw new Error('Failed to create template version');
    }
  }

  /**
   * Get template version history
   */
  static async getTemplateVersions(templateId: string): Promise<TemplateVersion[]> {
    try {
      await connectDB();
      
      // This is a simplified implementation
      // In a production app, you'd have a proper versioning system
      const template = await AdTemplate.findById(templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      // Return current version as the only version for now
      return [{
        id: template._id.toString(),
        templateId,
        version: 1,
        code: template.code,
        variables: template.variables,
        createdAt: template.createdAt,
        createdBy: template.createdBy.toString(),
        description: 'Current version',
      }];
    } catch (error) {
      console.error('Error getting template versions:', error);
      throw new Error('Failed to get template versions');
    }
  }

  /**
   * Restore a template from a specific version
   */
  static async restoreTemplateVersion(
    templateId: string,
    versionId: string,
    userId: string
  ): Promise<void> {
    try {
      await connectDB();
      
      const version = await AdTemplate.findById(versionId);
      if (!version) {
        throw new Error('Version not found');
      }

      // Update the main template with version data
      await AdTemplate.findByIdAndUpdate(templateId, {
        code: version.code,
        variables: version.variables,
        lastValidated: new Date(),
        // Don't update other fields like name, description, etc.
      });
    } catch (error) {
      console.error('Error restoring template version:', error);
      throw new Error('Failed to restore template version');
    }
  }

  /**
   * Auto-save template modifications (draft)
   */
  static async autoSaveTemplate(
    templateId: string,
    code: string,
    variables: Record<string, any>,
    userId: string
  ): Promise<void> {
    try {
      // Save as draft in session storage
      await this.saveTemplateSession(userId, templateId, variables, code);
      
      // Optionally, save to database as draft
      // This could be implemented with a separate drafts table
    } catch (error) {
      console.error('Error auto-saving template:', error);
      // Don't throw error for auto-save failures
    }
  }

  /**
   * Get user's template customizations
   */
  static async getUserTemplateCustomizations(userId: string): Promise<TemplateSession[]> {
    try {
      const customizations: TemplateSession[] = [];
      
      if (typeof window !== 'undefined') {
        // Get all template sessions for user from localStorage
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(`template_session_${userId}_`)) {
            const data = localStorage.getItem(key);
            if (data) {
              const parsed = JSON.parse(data);
              customizations.push({
                ...parsed,
                lastModified: new Date(parsed.lastModified),
              });
            }
          }
        }
      }
      
      return customizations;
    } catch (error) {
      console.error('Error getting user template customizations:', error);
      return [];
    }
  }

  /**
   * Clean up old template sessions
   */
  static async cleanupOldSessions(userId: string, maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    try {
      const now = new Date();
      const customizations = await this.getUserTemplateCustomizations(userId);
      
      for (const session of customizations) {
        const age = now.getTime() - session.lastModified.getTime();
        if (age > maxAge) {
          await this.clearTemplateSession(userId, session.templateId);
        }
      }
    } catch (error) {
      console.error('Error cleaning up old sessions:', error);
    }
  }
}

// Client-side hooks for React components
export const useTemplatePersistence = () => {
  const saveSession = async (
    userId: string,
    templateId: string,
    variables: Record<string, any>,
    customCode?: string
  ) => {
    return TemplatePersistenceService.saveTemplateSession(userId, templateId, variables, customCode);
  };

  const loadSession = async (userId: string, templateId: string) => {
    return TemplatePersistenceService.loadTemplateSession(userId, templateId);
  };

  const clearSession = async (userId: string, templateId: string) => {
    return TemplatePersistenceService.clearTemplateSession(userId, templateId);
  };

  const autoSave = async (
    templateId: string,
    code: string,
    variables: Record<string, any>,
    userId: string
  ) => {
    return TemplatePersistenceService.autoSaveTemplate(templateId, code, variables, userId);
  };

  return {
    saveSession,
    loadSession,
    clearSession,
    autoSave,
  };
};