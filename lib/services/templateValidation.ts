/**
 * TemplateCodeValidator — static class for validating ad template HTML/CSS/JS.
 *
 * Validation happens in three layers for a full-template check:
 *  1. validateHTML() — stack-based tag matching + security/accessibility linting.
 *  2. validateCSS()  — brace counting + missing-semicolon + vendor-prefix warnings.
 *  3. validateJavaScript() — dangerous-API warnings + `new Function()` syntax parse.
 *
 * validateTemplate() orchestrates all three by extracting <style> and <script>
 * blocks from the template HTML and passing them to the appropriate sub-validator.
 *
 * All validators are pure functions with no DB/network calls — safe to run in
 * the browser (dashboard editor) and on the server (API save endpoint).
 */

export interface ValidationError {
  line: number;
  column: number;
  message: string;
  type: 'syntax' | 'semantic' | 'security';
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  line: number;
  column: number;
  message: string;
  type: 'performance' | 'accessibility' | 'best-practice' | 'security';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export class TemplateCodeValidator {
  /**
   * Validates HTML syntax and structure
   */
  static validateHTML(code: string): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      // Basic HTML validation
      const htmlRegex = /<[^>]*>/g;
      const tags = code.match(htmlRegex) || [];
      const openTags: string[] = [];
      const lines = code.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNumber = i + 1;

        // Check for unclosed tags
        const lineTags = line.match(htmlRegex) || [];
        for (const tag of lineTags) {
          const tagName = tag.match(/<\/?([a-zA-Z][a-zA-Z0-9]*)/)?.[1];
          if (!tagName) continue;

          if (tag.startsWith('</')) {
            // Closing tag
            const lastOpenTag = openTags.pop();
            if (lastOpenTag !== tagName) {
              errors.push({
                line: lineNumber,
                column: line.indexOf(tag) + 1,
                message: `Mismatched closing tag: expected </${lastOpenTag}>, found </${tagName}>`,
                type: 'syntax',
                severity: 'error'
              });
            }
          } else if (!tag.endsWith('/>') && !['img', 'br', 'hr', 'input', 'meta', 'link'].includes(tagName.toLowerCase())) {
            // Opening tag (not self-closing)
            openTags.push(tagName);
          }
        }

        // Check for potential security issues
        if (line.includes('javascript:')) {
          warnings.push({
            line: lineNumber,
            column: line.indexOf('javascript:') + 1,
            message: 'Avoid javascript: URLs for security reasons',
            type: 'security'
          });
        }

        // Check for inline styles (performance warning)
        if (line.includes('style=')) {
          warnings.push({
            line: lineNumber,
            column: line.indexOf('style=') + 1,
            message: 'Consider using CSS classes instead of inline styles',
            type: 'performance'
          });
        }

        // Check for missing alt attributes on images
        if (line.includes('<img') && !line.includes('alt=')) {
          warnings.push({
            line: lineNumber,
            column: line.indexOf('<img') + 1,
            message: 'Image missing alt attribute for accessibility',
            type: 'accessibility'
          });
        }
      }

      // Check for unclosed tags at end
      for (const unclosedTag of openTags) {
        errors.push({
          line: lines.length,
          column: 1,
          message: `Unclosed tag: <${unclosedTag}>`,
          type: 'syntax',
          severity: 'error'
        });
      }

    } catch (error) {
      errors.push({
        line: 1,
        column: 1,
        message: `HTML parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'syntax',
        severity: 'error'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates JavaScript syntax and security
   */
  static validateJavaScript(code: string): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      // Basic JavaScript validation
      const lines = code.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNumber = i + 1;

        // Check for potentially dangerous functions
        const dangerousFunctions = ['eval', 'Function', 'setTimeout', 'setInterval'];
        for (const func of dangerousFunctions) {
          if (line.includes(func + '(')) {
            warnings.push({
              line: lineNumber,
              column: line.indexOf(func) + 1,
              message: `Potentially dangerous function: ${func}()`,
              type: 'security'
            });
          }
        }

        // Check for console statements (should be removed in production)
        if (line.includes('console.')) {
          warnings.push({
            line: lineNumber,
            column: line.indexOf('console.') + 1,
            message: 'Console statements should be removed in production',
            type: 'best-practice'
          });
        }

        // Basic syntax checks
        const openBraces = (line.match(/\{/g) || []).length;
        const closeBraces = (line.match(/\}/g) || []).length;
        if (openBraces !== closeBraces && line.trim() !== '') {
          // This is a simple check - in reality, braces can span multiple lines
          // For a more robust solution, we'd need a proper JavaScript parser
        }
      }

      // `new Function(code)` is a lightweight JS syntax check — it throws SyntaxError
      // without executing the code, making it safe to call in both browser and Node.
      try {
        new Function(code);
      } catch (syntaxError) {
        errors.push({
          line: 1,
          column: 1,
          message: `JavaScript syntax error: ${syntaxError instanceof Error ? syntaxError.message : 'Unknown error'}`,
          type: 'syntax',
          severity: 'error'
        });
      }

    } catch (error) {
      errors.push({
        line: 1,
        column: 1,
        message: `JavaScript validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'syntax',
        severity: 'error'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates CSS syntax and best practices
   */
  static validateCSS(code: string): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      const lines = code.split('\n');
      let inRule = false;
      let braceCount = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const lineNumber = i + 1;

        if (line === '') continue;

        // Count braces
        const openBraces = (line.match(/\{/g) || []).length;
        const closeBraces = (line.match(/\}/g) || []).length;
        braceCount += openBraces - closeBraces;

        // Check for basic CSS syntax
        if (line.includes('{')) {
          inRule = true;
        }

        if (inRule && line.includes(':') && !line.includes('{') && !line.includes('}')) {
          // Property line
          if (!line.endsWith(';') && !line.endsWith('{') && !line.endsWith('}')) {
            warnings.push({
              line: lineNumber,
              column: line.length,
              message: 'CSS property should end with semicolon',
              type: 'best-practice'
            });
          }
        }

        if (line.includes('}')) {
          inRule = false;
        }

        // Check for vendor prefixes without standard property
        const vendorPrefixes = ['-webkit-', '-moz-', '-ms-', '-o-'];
        for (const prefix of vendorPrefixes) {
          if (line.includes(prefix)) {
            warnings.push({
              line: lineNumber,
              column: line.indexOf(prefix) + 1,
              message: `Consider adding standard property after vendor prefix ${prefix}`,
              type: 'best-practice'
            });
          }
        }
      }

      // Check for unmatched braces
      if (braceCount !== 0) {
        errors.push({
          line: lines.length,
          column: 1,
          message: `Unmatched braces in CSS: ${braceCount > 0 ? 'missing closing' : 'extra closing'} braces`,
          type: 'syntax',
          severity: 'error'
        });
      }

    } catch (error) {
      errors.push({
        line: 1,
        column: 1,
        message: `CSS validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'syntax',
        severity: 'error'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates complete template code (HTML with embedded CSS/JS)
   */
  static validateTemplate(code: string): ValidationResult {
    const allErrors: ValidationError[] = [];
    const allWarnings: ValidationWarning[] = [];

    // Validate HTML structure
    const htmlResult = this.validateHTML(code);
    allErrors.push(...htmlResult.errors);
    allWarnings.push(...htmlResult.warnings);

    // Extract and validate CSS
    const cssMatches = code.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
    if (cssMatches) {
      for (const cssMatch of cssMatches) {
        const cssCode = cssMatch.replace(/<\/?style[^>]*>/gi, '');
        const cssResult = this.validateCSS(cssCode);
        allErrors.push(...cssResult.errors);
        allWarnings.push(...cssResult.warnings);
      }
    }

    // Extract and validate JavaScript
    const jsMatches = code.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
    if (jsMatches) {
      for (const jsMatch of jsMatches) {
        const jsCode = jsMatch.replace(/<\/?script[^>]*>/gi, '');
        const jsResult = this.validateJavaScript(jsCode);
        allErrors.push(...jsResult.errors);
        allWarnings.push(...jsResult.warnings);
      }
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings
    };
  }

  /**
   * Get helpful error messages for common syntax issues
   */
  static getHelpfulErrorMessage(error: ValidationError): string {
    const suggestions: Record<string, string> = {
      'Unclosed tag': 'Make sure every opening tag has a corresponding closing tag.',
      'Mismatched closing tag': 'Check that your opening and closing tags match exactly.',
      'JavaScript syntax error': 'Review your JavaScript code for missing semicolons, brackets, or quotes.',
      'Unmatched braces': 'Ensure every opening brace { has a corresponding closing brace }.',
      'CSS property should end with semicolon': 'Add a semicolon (;) at the end of CSS properties.',
    };

    for (const [key, suggestion] of Object.entries(suggestions)) {
      if (error.message.includes(key)) {
        return suggestion;
      }
    }

    return 'Please check the syntax and try again.';
  }
}