'use client';

import React, { useState, useMemo } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type PaginationState,
  type RowSelectionState,
  type Column,
  type AccessorKeyColumnDef,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronUp, 
  ChevronDown, 
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Filter,
  Columns3,
  ChevronDown as ChevronDownIcon,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SortableColumn<T> {
  key: keyof T;
  label: string;
  sortType: 'string' | 'number' | 'date' | 'boolean';
  customSortFn?: (a: T, b: T) => number;
  width?: string;
  className?: string;
}

export interface SortConfig {
  column: string;
  direction: 'asc' | 'desc';
}

interface SortableDataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  sortableColumns?: SortableColumn<T>[];
  defaultSort?: SortConfig;
  onSortChange?: (sort: SortConfig | null) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  filterable?: boolean;
  paginated?: boolean;
  pageSize?: number;
  showColumnToggle?: boolean;
  className?: string;
  emptyMessage?: string;
  loading?: boolean;
  // Bulk selection and actions
  enableRowSelection?: boolean;
  onBulkDelete?: (selectedRows: T[]) => Promise<void>;
  getRowId?: (row: T) => string;
  bulkActions?: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick: (selectedRows: T[]) => void;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  }>;
}

export function SortableDataTable<T>({
  data,
  columns: baseColumns,
  sortableColumns = [],
  defaultSort,
  onSortChange,
  searchable = true,
  searchPlaceholder = 'Search...',
  filterable = false,
  paginated = true,
  pageSize = 10,
  showColumnToggle = true,
  className,
  emptyMessage = 'No data available',
  loading = false,
  enableRowSelection = false,
  onBulkDelete,
  getRowId,
  bulkActions = [],
}: SortableDataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>(
    defaultSort ? [{ id: defaultSort.column, desc: defaultSort.direction === 'desc' }] : []
  );
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Enhance columns with sorting functionality and selection
  const columns = useMemo(() => {
    const enhancedColumns: ColumnDef<T>[] = [...baseColumns];

    // Add selection column if enabled
    if (enableRowSelection) {
      enhancedColumns.unshift({
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
            className="border-2 border-solid border-black dark:border-white bg-[#f3f4f3] dark:bg-gray-800 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600 data-[state=checked]:text-white hover:border-red-500 focus-visible:ring-red-500/50 focus-visible:ring-2"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            className="border-2 border-solid border-black dark:border-white bg-[#f3f4f3] dark:bg-gray-800 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600 data-[state=checked]:text-white hover:border-red-500 focus-visible:ring-red-500/50 focus-visible:ring-2"
          />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 40,
      });
    }

    return enhancedColumns.map((column) => {
      const accessorKey = (column as AccessorKeyColumnDef<T>).accessorKey;
      const sortableColumn = sortableColumns.find(
        (sc) => sc.key === accessorKey
      );

      if (sortableColumn && accessorKey) {
        return {
          ...column,
          enableSorting: true,
          sortingFn: sortableColumn.customSortFn ? 
            (rowA: any, rowB: any) => sortableColumn.customSortFn!(rowA.original, rowB.original) :
            sortableColumn.sortType === 'number' ? 'alphanumeric' :
            sortableColumn.sortType === 'date' ? 'datetime' :
            'alphanumeric',
          header: ({ column: tableColumn }: { column: Column<T> }) => {
            const isSorted = tableColumn.getIsSorted();
            
            return (
              <Button
                variant="ghost"
                onClick={() => tableColumn.toggleSorting(isSorted === 'asc')}
                className={cn(
                  'h-auto p-0 font-semibold hover:bg-transparent',
                  sortableColumn.className
                )}
              >
                {sortableColumn.label}
                <div className="ml-2 flex flex-col">
                  {isSorted === 'asc' ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : isSorted === 'desc' ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronsUpDown className="h-3 w-3 opacity-50" />
                  )}
                </div>
              </Button>
            );
          },
        } as ColumnDef<T>;
      }

      return column;
    });
  }, [baseColumns, sortableColumns, enableRowSelection]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
      pagination,
      rowSelection,
    },
    enableRowSelection: enableRowSelection,
    getRowId: getRowId ? (row) => getRowId(row) : undefined,
    onRowSelectionChange: setRowSelection,
    onSortingChange: (updater) => {
      setSorting(updater);
      
      // Notify parent of sort changes
      if (onSortChange) {
        const newSorting = typeof updater === 'function' ? updater(sorting) : updater;
        if (newSorting.length > 0) {
          const sort = newSorting[0];
          onSortChange({
            column: sort.id,
            direction: sort.desc ? 'desc' : 'asc',
          });
        } else {
          onSortChange(null);
        }
      }
    },
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: paginated ? getPaginationRowModel() : undefined,
    globalFilterFn: 'includesString',
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows.map(row => row.original);
  const selectedCount = selectedRows.length;

  const handleBulkDelete = async () => {
    if (onBulkDelete && selectedRows.length > 0) {
      try {
        await onBulkDelete(selectedRows);
        setRowSelection({});
        setShowDeleteDialog(false);
      } catch (error) {
        console.error('Bulk delete failed:', error);
      }
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Selection and Bulk Actions Bar */}
      {enableRowSelection && selectedCount > 0 && (
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">
              {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
            </span>
            {selectedCount === table.getFilteredRowModel().rows.length && (
              <Badge variant="secondary" className="text-xs">
                All {data.length} items selected
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {bulkActions.map((action) => (
              <Button
                key={action.label}
                variant={action.variant || 'outline'}
                size="sm"
                onClick={() => action.onClick(selectedRows)}
              >
                {action.icon}
                {action.label}
              </Button>
            ))}
            {onBulkDelete && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Controls */}
      {(searchable || showColumnToggle) && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {searchable && (
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pl-8 max-w-sm"
                />
              </div>
            )}
            
            {filterable && (
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            )}
          </div>

          {showColumnToggle && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Columns3 className="h-4 w-4 mr-2" />
                  Columns
                  <ChevronDownIcon className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="ml-2">Loading...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {paginated && (
        <div className="flex items-center justify-between px-2">
          <div className="flex-1 text-sm text-muted-foreground">
            {table.getFilteredRowModel().rows.length} total rows
          </div>
          <div className="flex items-center space-x-6 lg:space-x-8">
            <div className="flex items-center space-x-2">
              <Label className="text-sm font-medium">Rows per page</Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue placeholder={table.getState().pagination.pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-[100px] items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of{' '}
              {table.getPageCount()}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      {table.getFilteredRowModel().rows.length > 0 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div>
            Showing {table.getRowModel().rows.length} of{' '}
            {table.getFilteredRowModel().rows.length} rows
            {globalFilter && ` (filtered from ${data.length} total)`}
          </div>
          {sorting.length > 0 && (
            <div className="flex items-center space-x-2">
              <span>Sorted by:</span>
              {sorting.map((sort) => (
                <Badge key={sort.id} variant="secondary" className="text-xs">
                  {sort.id} {sort.desc ? '↓' : '↑'}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedCount} selected item{selectedCount !== 1 ? 's' : ''}? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete {selectedCount} item{selectedCount !== 1 ? 's' : ''}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Hook for managing table state
export function useSortableTable<T>(initialData: T[]) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState<SortConfig | null>(null);

  const updateData = (newData: T[]) => {
    setData(newData);
  };

  const refresh = async (fetchFn: () => Promise<T[]>) => {
    setLoading(true);
    try {
      const newData = await fetchFn();
      setData(newData);
    } catch (error) {
      console.error('Error refreshing table data:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    sort,
    setSort,
    updateData,
    refresh,
  };
}