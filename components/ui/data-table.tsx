"use client";

import { useState, useMemo } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "./table";
import { Button } from "./button";
import { ArrowUp, ArrowDown, Download } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DataTableColumn<T> {
  id: string;
  label: string;
  sortable?: boolean;
  right?: boolean;
  render: (row: T) => React.ReactNode;
  sortValue?: (row: T) => number | string;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  keyExtractor: (row: T) => string | number;
  exportFilename?: string;
  exportData?: (row: T) => Record<string, string | number>;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  exportFilename = "export",
  exportData,
  onRowClick,
  emptyMessage = "No data",
}: DataTableProps<T>) {
  const [sortBy, setSortBy] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  function handleSort(colId: string) {
    if (sortBy === colId) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(colId);
      setSortOrder("desc");
    }
  }

  const sorted = useMemo(() => {
    if (!sortBy) return data;
    const col = columns.find((c) => c.id === sortBy);
    if (!col?.sortValue) return data;
    return [...data].sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
      return sortOrder === "asc" ? cmp : -cmp;
    });
  }, [data, sortBy, sortOrder, columns]);

  function handleExport() {
    if (!exportData) return;
    const rows = sorted.map(exportData);
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => JSON.stringify(r[h] ?? "")).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${exportFilename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-3">
      {exportData && (
        <div className="flex justify-end px-4 pt-3">
          <Button variant="secondary" size="sm" className="gap-1.5" onClick={handleExport}>
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
        </div>
      )}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={col.id}
                  className={cn(col.right && "text-right", col.sortable && "cursor-pointer select-none hover:text-on-surface transition-colors")}
                  onClick={col.sortable ? () => handleSort(col.id) : undefined}
                >
                  <div className={cn("flex items-center gap-1", col.right && "justify-end")}>
                    {col.label}
                    {col.sortable && sortBy === col.id && (
                      sortOrder === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-10 text-on-surface-variant text-sm">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((row) => (
                <TableRow
                  key={keyExtractor(row)}
                  className={cn(onRowClick && "cursor-pointer hover:bg-surface-container-high transition-colors")}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map((col) => (
                    <TableCell key={col.id} className={cn(col.right && "text-right")}>
                      {col.render(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {sorted.length > 0 && (
        <div className="px-4 pb-2 text-xs text-on-surface-variant">
          {sorted.length} record{sorted.length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}
