'use client';

import { useState, useCallback } from 'react';
import { MediaItem } from '@/components/admin/MediaSelectionModal';

export interface MediaSelectionState {
  isOpen: boolean;
  targetVariable: string | null;
  filterType: 'image' | 'video' | 'audio' | 'all';
  multiSelect: boolean;
}

/**
 * Base hook — manages the open/close state of the MediaSelectionModal
 * and routes the chosen media URL(s) back to the caller via a callback.
 * Used as the foundation for the two specialized hooks below.
 */
export function useMediaSelection() {
  const [selectionState, setSelectionState] = useState<MediaSelectionState>({
    isOpen: false,
    targetVariable: null, // Identifies which form field will receive the selected URL
    filterType: 'all',
    multiSelect: false,
  });

  const openMediaSelection = useCallback((
    targetVariable: string,
    options: {
      filterType?: 'image' | 'video' | 'audio' | 'all';
      multiSelect?: boolean;
    } = {}
  ) => {
    setSelectionState({
      isOpen: true,
      targetVariable,
      filterType: options.filterType || 'all',
      multiSelect: options.multiSelect || false,
    });
  }, []);

  const closeMediaSelection = useCallback(() => {
    setSelectionState({
      isOpen: false,
      targetVariable: null,
      filterType: 'all',
      multiSelect: false,
    });
  }, []);

  // Extracts the URL(s) from the selection and fires the caller's onSelect callback
  const handleMediaSelect = useCallback((
    media: MediaItem | MediaItem[],
    onSelect: (variable: string, value: string | string[]) => void
  ) => {
    if (selectionState.targetVariable) {
      if (Array.isArray(media)) {
        const urls = media.map(item => item.url);
        onSelect(selectionState.targetVariable, urls);
      } else {
        onSelect(selectionState.targetVariable, media.url);
      }
    }
    closeMediaSelection();
  }, [selectionState.targetVariable, closeMediaSelection]);

  return {
    selectionState,
    openMediaSelection,
    closeMediaSelection,
    handleMediaSelect,
  };
}

/**
 * Specialized hook for Ad Template editors.
 * Connects the media picker to named template variables, inferring the
 * correct file-type filter (image/video/audio) from the variable name.
 */
export function useTemplateMediaIntegration(
  templateVariables: Record<string, any>,
  onVariableChange: (variables: Record<string, any>) => void
) {
  const { selectionState, openMediaSelection, closeMediaSelection, handleMediaSelect } = useMediaSelection();

  // Merges the selected URL into the template variables object and notifies the parent
  const handleVariableMediaSelect = useCallback((variable: string, value: string | string[]) => {
    const newVariables = {
      ...templateVariables,
      [variable]: Array.isArray(value) ? value.join(',') : value
    };
    onVariableChange(newVariables);
  }, [templateVariables, onVariableChange]);

  // Infers image/video/audio filter from the variable name so the picker pre-filters
  const openMediaSelectionForVariable = useCallback((
    variableName: string,
    variableType: 'text' | 'url' | 'media' | 'color' = 'media'
  ) => {
    let filterType: 'image' | 'video' | 'audio' | 'all' = 'all';

    if (variableType === 'media') {
      const varName = variableName.toLowerCase();
      if (varName.includes('image') || varName.includes('img') || varName.includes('photo')) {
        filterType = 'image';
      } else if (varName.includes('video') || varName.includes('vid')) {
        filterType = 'video';
      } else if (varName.includes('audio') || varName.includes('sound') || varName.includes('music')) {
        filterType = 'audio';
      }
    }

    openMediaSelection(variableName, { filterType });
  }, [openMediaSelection]);

  const onMediaSelect = useCallback((media: MediaItem | MediaItem[]) => {
    handleMediaSelect(media, handleVariableMediaSelect);
  }, [handleMediaSelect, handleVariableMediaSelect]);

  return {
    selectionState,
    openMediaSelectionForVariable,
    closeMediaSelection,
    onMediaSelect,
  };
}

/**
 * Specialized hook for inserting a media URL directly into a rich-text ad code editor.
 * Stores a one-shot callback so the chosen URL lands exactly at the cursor position.
 */
export function useAdCodeMediaInsertion() {
  const { selectionState, openMediaSelection, closeMediaSelection, handleMediaSelect } = useMediaSelection();
  // One-shot callback that injects the URL into the editor; cleared after each use
  const [insertionCallback, setInsertionCallback] = useState<((url: string) => void) | null>(null);

  const openMediaSelectionForInsertion = useCallback((
    callback: (url: string) => void,
    filterType: 'image' | 'video' | 'audio' | 'all' = 'all'
  ) => {
    setInsertionCallback(() => callback); // Store the editor's insert function
    openMediaSelection('insertion', { filterType });
  }, [openMediaSelection]);

  const onMediaSelect = useCallback((media: MediaItem | MediaItem[]) => {
    // Only single-select supported for code insertion
    if (insertionCallback && !Array.isArray(media)) {
      insertionCallback(media.url);
      setInsertionCallback(null); // Clear so next open starts fresh
    }
    closeMediaSelection();
  }, [insertionCallback, closeMediaSelection]);

  return {
    selectionState,
    openMediaSelectionForInsertion,
    closeMediaSelection,
    onMediaSelect,
  };
}