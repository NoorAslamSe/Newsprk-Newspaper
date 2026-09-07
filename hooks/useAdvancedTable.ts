'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export interface TableState {
  page: number;
  pageSize: number;
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc' | null;
  filters: Record<string, any>;
  search: string;
}

export interface UseAdvancedTableOptions {
  initialPageSize?: number;
  persistState?: boolean;
  stateKey?: string;
  syncWithUrl?: boolean;
}

/**
 * Generic data-table hook handling search, column filters, sort, and pagination.
 * Supports three state persistence strategies (in order of priority):
 *   1. URL query params (`syncWithUrl: true`) — shareable/bookmarkable
 *   2. localStorage (`persistState: true`) — survives refresh
 *   3. In-memory default — reset on navigation
 */
export function useAdvancedTable<T>(
  data: T[],
  options: UseAdvancedTableOptions = {}
) {
  const {
    initialPageSize = 10,
    persistState = false,
    stateKey = 'table-state',
    syncWithUrl = false,
  } = options;

  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize state from URL or localStorage
  const getInitialState = useCallback((): TableState => {
    if (syncWithUrl) {
      return {
        page: parseInt(searchParams.get('page') || '1'),
        pageSize: parseInt(searchParams.get('pageSize') || initialPageSize.toString()),
        sortColumn: searchParams.get('sortColumn'),
        sortDirection: (searchParams.get('sortDirection') as 'asc' | 'desc') || null,
        filters: {},
        search: searchParams.get('search') || '',
      };
    }

    if (persistState && typeof window !== 'undefined') {
      const saved = localStorage.getItem(stateKey);
      if (saved) {
        try {
          return { ...getDefaultState(), ...JSON.parse(saved) };
        } catch {
          // Fall back to default if parsing fails
        }
      }
    }

    return getDefaultState();
  }, [searchParams, initialPageSize, persistState, stateKey, syncWithUrl]);

  const getDefaultState = (): TableState => ({
    page: 1,
    pageSize: initialPageSize,
    sortColumn: null,
    sortDirection: null,
    filters: {},
    search: '',
  });

  const [state, setState] = useState<TableState>(getInitialState);

  // Persist state changes
  useEffect(() => {
    if (persistState && typeof window !== 'undefined') {
      localStorage.setItem(stateKey, JSON.stringify(state));
    }
  }, [state, persistState, stateKey]);

  // Sync with URL
  useEffect(() => {
    if (syncWithUrl) {
      const params = new URLSearchParams();
      
      if (state.page > 1) params.set('page', state.page.toString());
      if (state.pageSize !== initialPageSize) params.set('pageSize', state.pageSize.toString());
      if (state.sortColumn) params.set('sortColumn', state.sortColumn);
      if (state.sortDirection) params.set('sortDirection', state.sortDirection);
      if (state.search) params.set('search', state.search);

      const newUrl = params.toString() ? `?${params.toString()}` : '';
      router.replace(newUrl, { scroll: false });
    }
  }, [state, syncWithUrl, router, initialPageSize]);

  // Pipeline: search → column filters → sort (all applied before slicing for pagination)
  const processedData = useMemo(() => {
    let result = [...data];

    // Full-text search across all string fields of each row
    if (state.search) {
      const searchLower = state.search.toLowerCase();
      result = result.filter((item) =>
        Object.values(item as any).some((value) =>
          String(value).toLowerCase().includes(searchLower)
        )
      );
    }

    // Column-level filters: supports exact match and array (multi-select) values
    Object.entries(state.filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        result = result.filter((item) => {
          const itemValue = (item as any)[key];
          if (Array.isArray(value)) {
            return value.includes(itemValue);
          }
          return itemValue === value;
        });
      }
    });

    // Type-aware sort: numbers and Dates use numeric comparison, strings use localeCompare
    if (state.sortColumn && state.sortDirection) {
      result.sort((a, b) => {
        const aValue = (a as any)[state.sortColumn!];
        const bValue = (b as any)[state.sortColumn!];

        let comparison = 0;

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          comparison = aValue - bValue;
        } else if (aValue instanceof Date && bValue instanceof Date) {
          comparison = aValue.getTime() - bValue.getTime();
        } else {
          comparison = String(aValue).localeCompare(String(bValue));
        }

        return state.sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return result;
  }, [data, state]);

  // Paginated data
  const paginatedData = useMemo(() => {
    const startIndex = (state.page - 1) * state.pageSize;
    const endIndex = startIndex + state.pageSize;
    return processedData.slice(startIndex, endIndex);
  }, [processedData, state.page, state.pageSize]);

  // Pagination info
  const pagination = useMemo(() => {
    const totalItems = processedData.length;
    const totalPages = Math.ceil(totalItems / state.pageSize);
    const hasNextPage = state.page < totalPages;
    const hasPreviousPage = state.page > 1;

    return {
      totalItems,
      totalPages,
      currentPage: state.page,
      pageSize: state.pageSize,
      hasNextPage,
      hasPreviousPage,
      startIndex: (state.page - 1) * state.pageSize + 1,
      endIndex: Math.min(state.page * state.pageSize, totalItems),
    };
  }, [processedData.length, state.page, state.pageSize]);

  // Actions
  const setPage = useCallback((page: number) => {
    setState((prev) => ({ ...prev, page: Math.max(1, page) }));
  }, []);

  const setPageSize = useCallback((pageSize: number) => {
    setState((prev) => ({ ...prev, pageSize, page: 1 }));
  }, []);

  // Cycles: unsorted → asc → desc → unsorted when clicking the same column header
  const setSort = useCallback((column: string | null, direction: 'asc' | 'desc' | null = null) => {
    setState((prev) => {
      if (!column) {
        return { ...prev, sortColumn: null, sortDirection: null, page: 1 };
      }

      let newDirection = direction;
      if (!newDirection) {
        if (prev.sortColumn === column) {
          // Cycle through: asc → desc → null (cleared)
          newDirection = prev.sortDirection === 'asc' ? 'desc' : prev.sortDirection === 'desc' ? null : 'asc';
        } else {
          newDirection = 'asc'; // New column always starts ascending
        }
      }

      return {
        ...prev,
        sortColumn: newDirection ? column : null,
        sortDirection: newDirection,
        page: 1, // Reset to page 1 after any sort change
      };
    });
  }, []);

  const setFilter = useCallback((key: string, value: any) => {
    setState((prev) => ({
      ...prev,
      filters: { ...prev.filters, [key]: value },
      page: 1,
    }));
  }, []);

  const clearFilter = useCallback((key: string) => {
    setState((prev) => {
      const newFilters = { ...prev.filters };
      delete newFilters[key];
      return { ...prev, filters: newFilters, page: 1 };
    });
  }, []);

  const clearAllFilters = useCallback(() => {
    setState((prev) => ({ ...prev, filters: {}, page: 1 }));
  }, []);

  const setSearch = useCallback((search: string) => {
    setState((prev) => ({ ...prev, search, page: 1 }));
  }, []);

  const reset = useCallback(() => {
    setState(getDefaultState());
  }, []);

  const nextPage = useCallback(() => {
    if (pagination.hasNextPage) {
      setPage(state.page + 1);
    }
  }, [pagination.hasNextPage, state.page, setPage]);

  const previousPage = useCallback(() => {
    if (pagination.hasPreviousPage) {
      setPage(state.page - 1);
    }
  }, [pagination.hasPreviousPage, state.page, setPage]);

  const firstPage = useCallback(() => {
    setPage(1);
  }, [setPage]);

  const lastPage = useCallback(() => {
    setPage(pagination.totalPages);
  }, [pagination.totalPages, setPage]);

  return {
    // Data
    data: paginatedData,
    allData: processedData,
    originalData: data,

    // State
    state,
    pagination,

    // Actions
    setPage,
    setPageSize,
    setSort,
    setFilter,
    clearFilter,
    clearAllFilters,
    setSearch,
    reset,

    // Navigation
    nextPage,
    previousPage,
    firstPage,
    lastPage,

    // Utilities
    isFiltered: Object.keys(state.filters).length > 0 || state.search !== '',
    isSorted: state.sortColumn !== null,
  };
}