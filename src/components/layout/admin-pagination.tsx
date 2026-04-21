import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface AdminPaginationProps {
  itemLabel: string;
  limit: number;
  page: number;
  pageCount: number;
  total: number;
  onNextPage: () => void;
  onPreviousPage: () => void;
}

export function AdminPagination({
  itemLabel,
  limit,
  page,
  pageCount,
  total,
  onNextPage,
  onPreviousPage,
}: AdminPaginationProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-muted-foreground text-center sm:text-left">
        Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} {itemLabel}
      </div>
      <div className="flex items-center justify-center gap-2">
        <Button variant="outline" size="sm" onClick={onPreviousPage} disabled={page <= 1}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={onNextPage} disabled={page >= pageCount}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
