"use client";

import type { ReactNode } from "react";
import { Search, ChevronLeft, ChevronRight, AlertTriangle, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface DataTableProps {
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  total: number;
  itemLabel?: string;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  actions?: ReactNode;
  children: ReactNode;
}

/**
 * Chrome shared by every admin list page: search input, error/retry state,
 * and a pagination footer. Table markup itself stays page-specific — this
 * component only owns the surrounding controls so they stay consistent.
 */
export function DataTable({
  search, onSearchChange, searchPlaceholder = "Search…",
  total, itemLabel = "result", page, totalPages, onPageChange,
  loading, error, onRetry, actions, children,
}: DataTableProps) {
  return (
    <div>
      {(onSearchChange || actions) && (
        <Card className="pcb-card border-slate-100 shadow-sm mb-6 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {onSearchChange && (
              <div className="relative max-w-sm flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder={searchPlaceholder}
                  className="pl-9 bg-slate-50 border-slate-200 text-sm"
                  value={search}
                  onChange={e => onSearchChange(e.target.value)}
                />
              </div>
            )}
            {actions}
          </div>
        </Card>
      )}

      <Card className="pcb-card border-slate-100 shadow-sm overflow-hidden">
        {error ? (
          <div className="flex flex-col items-center justify-center gap-3 px-5 py-16 text-center">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <p className="text-sm text-slate-500">{error}</p>
            <Button variant="outline" size="sm" onClick={onRetry} className="gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </Button>
          </div>
        ) : (
          children
        )}
      </Card>

      {!error && !loading && total > 0 && (
        <div className="flex items-center justify-between mt-4 text-xs text-slate-500">
          <span>
            {total} {itemLabel}{total !== 1 ? "s" : ""}
            {totalPages > 1 && <> · page {page} of {totalPages}</>}
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onPageChange(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
