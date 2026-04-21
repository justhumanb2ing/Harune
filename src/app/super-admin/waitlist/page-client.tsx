"use client";

import { AdminPagination } from "@/components/layout/admin-pagination";
import { AdminTableState } from "@/components/layout/admin-table-state";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import { useDebounce } from "@/hooks/use-debounce";
import { apiFetch } from "@/lib/react-query/fetcher";
import { queryKeys } from "@/lib/react-query/query-keys";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface WaitlistEntry {
  id: number;
  name: string;
  email: string;
  twitterAccount: string | null;
  createdAt: string;
}

interface PaginationInfo {
  total: number;
  pageCount: number;
  currentPage: number;
  perPage: number;
}

const limit = 10;
const formatDate = (date: string) => new Date(date).toLocaleDateString();

export default function WaitlistPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const debouncedSearch = useDebounce(search);
  const queryKey = queryKeys.superAdmin.waitlist.list({ limit, page, search: debouncedSearch });

  const { data, error, isPending } = useQuery<{
    entries: WaitlistEntry[];
    pagination: PaginationInfo;
  }>({
    queryKey,
    queryFn: ({ signal }) => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search: debouncedSearch,
      });

      return apiFetch(`/api/super-admin/waitlist-entries?${params.toString()}`, { signal });
    },
    placeholderData: keepPreviousData,
  });

  const deleteEntryMutation = useMutation({
    mutationFn: (id: number) =>
      apiFetch(`/api/super-admin/waitlist-entries?id=${id}`, {
        method: "DELETE",
      }),
    onSuccess: async () => {
      toast.success("Entry deleted successfully");
      await queryClient.invalidateQueries({ queryKey: queryKeys.superAdmin.waitlist.all() });
    },
    onError: (requestError) => {
      console.error("Failed to delete entry", requestError);
      toast.error("Failed to delete entry");
    },
  });

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const response = await fetch("/api/super-admin/waitlist-entries/export");

      if (!response.ok) {
        throw new Error("Failed to export waitlist");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `waitlist-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Waitlist exported successfully");
    } catch (requestError) {
      console.error("Failed to export waitlist", requestError);
      toast.error("Failed to export waitlist");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <h1 className="text-2xl font-bold">Waitlist</h1>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search waitlist..."
              className="pl-8"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isExporting}
            className="w-full sm:w-auto"
          >
            {isExporting ? (
              "Exporting..."
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[150px]">Name</TableHead>
              <TableHead className="min-w-[200px]">Email</TableHead>
              <TableHead className="min-w-[120px]">Twitter</TableHead>
              <TableHead className="min-w-[120px]">Joined</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending ? (
              <AdminTableState.Loading colSpan={5} />
            ) : error ? (
              <AdminTableState.Error colSpan={5}>
                Error loading waitlist entries
              </AdminTableState.Error>
            ) : data?.entries.length === 0 ? (
              <AdminTableState.Empty colSpan={5}>No entries found</AdminTableState.Empty>
            ) : (
              data?.entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">{entry.name}</TableCell>
                  <TableCell>{entry.email}</TableCell>
                  <TableCell>{entry.twitterAccount || "-"}</TableCell>
                  <TableCell>{formatDate(entry.createdAt)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => deleteEntryMutation.mutate(entry.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Entry
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data?.pagination && (
        <AdminPagination
          itemLabel="entries"
          limit={limit}
          page={page}
          pageCount={data.pagination.pageCount}
          total={data.pagination.total}
          onPreviousPage={() => setPage((currentPage) => currentPage - 1)}
          onNextPage={() => setPage((currentPage) => currentPage + 1)}
        />
      )}
    </div>
  );
}
