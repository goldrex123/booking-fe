"use client";

import type { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";

export type DataTableColumn<T> = {
  key: string;
  header: ReactNode;
  headerClassName?: string;
  cell: (row: T) => ReactNode;
  cellClassName?: string;
};

type Props<T> = {
  columns: DataTableColumn<T>[];
  data: T[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyIcon?: ReactNode;
  getRowKey: (row: T) => string | number;
  getRowClassName?: (row: T) => string;
  skeletonRows?: number;
};

function SkeletonRow<T>({ columns }: { columns: DataTableColumn<T>[] }) {
  return (
    <TableRow>
      {columns.map((col) => (
        <TableCell key={col.key} className={col.cellClassName}>
          <div className="h-4 animate-pulse rounded bg-muted" />
        </TableCell>
      ))}
    </TableRow>
  );
}

export function DataTable<T>({
  columns,
  data,
  isLoading = false,
  emptyTitle = "데이터가 없습니다",
  emptyIcon,
  getRowKey,
  getRowClassName,
  skeletonRows = 4,
}: Props<T>) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border/60 bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.key} className={col.headerClassName}>
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: skeletonRows }).map((_, i) => (
              <SkeletonRow key={i} columns={columns} />
            ))
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="py-0">
                <EmptyState
                  icon={emptyIcon}
                  title={emptyTitle}
                  className="rounded-none border-none"
                />
              </TableCell>
            </TableRow>
          ) : (
            data.map((row) => (
              <TableRow key={getRowKey(row)} className={getRowClassName?.(row)}>
                {columns.map((col) => (
                  <TableCell key={col.key} className={col.cellClassName}>
                    {col.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
