"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { ChevronDown, Columns3, Loader2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface DataTableToolbarAction {
  label: string;
  onClick: () => void;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  icon?: React.ReactNode;
}

export interface DataTableBulkAction {
  label: string;
  onClick: (selectedIds: string[]) => void | Promise<void>;
  variant?: "default" | "destructive";
}

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageCount?: number;
  isLoading?: boolean;
  
  // Pagination
  pagination?: PaginationState;
  onPaginationChange?: (updaterOrValue: PaginationState | ((old: PaginationState) => PaginationState)) => void;
  
  // Sorting
  sorting?: SortingState;
  onSortingChange?: (updaterOrValue: SortingState | ((old: SortingState) => SortingState)) => void;
  
  // Search
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  
  // Row selection
  enableRowSelection?: boolean;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: (updaterOrValue: RowSelectionState | ((old: RowSelectionState) => RowSelectionState)) => void;
  getRowId?: (row: TData) => string;
  
  // Toolbar
  toolbarActions?: DataTableToolbarAction[];
  bulkActions?: DataTableBulkAction[];
  
  // Empty state
  emptyMessage?: string;
  
  // Column visibility
  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: (updaterOrValue: VisibilityState | ((old: VisibilityState) => VisibilityState)) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageCount = 0,
  isLoading = false,
  pagination,
  onPaginationChange,
  sorting,
  onSortingChange,
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search...",
  enableRowSelection = false,
  rowSelection = {},
  onRowSelectionChange,
  getRowId,
  toolbarActions = [],
  bulkActions = [],
  emptyMessage = "No results found.",
  columnVisibility,
  onColumnVisibilityChange,
}: DataTableProps<TData, TValue>) {
  const [localColumnVisibility, setLocalColumnVisibility] = React.useState<VisibilityState>({});
  const [localRowSelection, setLocalRowSelection] = React.useState<RowSelectionState>({});
  const [bulkActionLoading, setBulkActionLoading] = React.useState(false);

  const table = useReactTable({
    data,
    columns,
    pageCount,
    state: {
      sorting,
      columnVisibility: columnVisibility ?? localColumnVisibility,
      rowSelection: enableRowSelection ? (rowSelection ?? localRowSelection) : {},
      pagination: pagination ?? { pageIndex: 0, pageSize: 10 },
    },
    enableRowSelection,
    getRowId,
    onSortingChange,
    onColumnVisibilityChange: onColumnVisibilityChange ?? setLocalColumnVisibility,
    onRowSelectionChange: onRowSelectionChange ?? setLocalRowSelection,
    onPaginationChange,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedIds = selectedRows.map((row) => (getRowId ? getRowId(row.original) : (row.original as any).id || (row.original as any)._id));

  const handleBulkAction = async (action: DataTableBulkAction) => {
    setBulkActionLoading(true);
    try {
      await action.onClick(selectedIds);
      table.resetRowSelection();
    } finally {
      setBulkActionLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Bulk Actions */}
          {enableRowSelection && bulkActions.length > 0 && selectedRows.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={bulkActionLoading}>
                  {bulkActionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Bulk Actions ({selectedRows.length})
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {bulkActions.map((action, idx) => (
                  <DropdownMenuItem
                    key={idx}
                    onClick={() => handleBulkAction(action)}
                    className={cn(
                      action.variant === "destructive" && "text-destructive focus:text-destructive"
                    )}
                  >
                    {action.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Column Visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns3 className="h-4 w-4" />
                <span className="ml-2 hidden sm:inline">Columns</span>
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Toolbar Actions */}
          {toolbarActions.map((action, idx) => (
            <Button
              key={idx}
              variant={action.variant ?? "default"}
              size="sm"
              onClick={action.onClick}
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && onPaginationChange && pageCount > 0 && (
        <DataTablePagination
          table={table}
          pagination={pagination}
          onPaginationChange={onPaginationChange}
          pageCount={pageCount}
        />
      )}
    </div>
  );
}

interface DataTablePaginationProps {
  table: any;
  pagination: PaginationState;
  onPaginationChange: (pagination: PaginationState) => void;
  pageCount: number;
}

function DataTablePagination({
  pagination,
  onPaginationChange,
  pageCount,
}: DataTablePaginationProps) {
  const currentPage = pagination.pageIndex + 1;
  const canPreviousPage = pagination.pageIndex > 0;
  const canNextPage = pagination.pageIndex < pageCount - 1;

  return (
    <div className="flex items-center justify-between px-2">
      <div className="flex-1 text-sm text-muted-foreground">
        Page {currentPage} of {pageCount}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            onPaginationChange({
              ...pagination,
              pageIndex: 0,
            })
          }
          disabled={!canPreviousPage}
        >
          First
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            onPaginationChange({
              ...pagination,
              pageIndex: pagination.pageIndex - 1,
            })
          }
          disabled={!canPreviousPage}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            onPaginationChange({
              ...pagination,
              pageIndex: pagination.pageIndex + 1,
            })
          }
          disabled={!canNextPage}
        >
          Next
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            onPaginationChange({
              ...pagination,
              pageIndex: pageCount - 1,
            })
          }
          disabled={!canNextPage}
        >
          Last
        </Button>
      </div>
    </div>
  );
}
