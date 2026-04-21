"use client";

import { AdminPagination } from "@/components/layout/admin-pagination";
import { AdminTableState } from "@/components/layout/admin-table-state";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  active: boolean;
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
const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const queryKey = queryKeys.superAdmin.users.list({ limit, page, search: debouncedSearch });

  const { data, error, isPending } = useQuery<{
    users: User[];
    pagination: PaginationInfo;
  }>({
    queryKey,
    queryFn: ({ signal }) => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search: debouncedSearch,
      });

      return apiFetch(`/api/super-admin/users?${params.toString()}`, { signal });
    },
    placeholderData: keepPreviousData,
  });

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <h1 className="text-2xl font-bold">Users</h1>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="pl-8"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px]">User</TableHead>
              <TableHead className="min-w-[200px]">Email</TableHead>
              <TableHead className="min-w-[100px]">Status</TableHead>
              <TableHead className="min-w-[120px]">Created At</TableHead>
              <TableHead className="min-w-[150px]">ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending ? (
              <AdminTableState.Loading colSpan={5} />
            ) : error ? (
              <AdminTableState.Error colSpan={5}>Error loading users</AdminTableState.Error>
            ) : data?.users.length === 0 ? (
              <AdminTableState.Empty colSpan={5}>No users found</AdminTableState.Empty>
            ) : (
              data?.users.map((user) => (
                <TableRow key={user.id}>
                  <Link href={`/super-admin/users/${user.id}`}>
                    <TableCell className="flex items-center gap-2">
                      <Avatar>
                        <AvatarImage src={user.image || undefined} />
                        <AvatarFallback>{user.name ? getInitials(user.name) : "?"}</AvatarFallback>
                      </Avatar>
                      <span>{user.name || "Unnamed"}</span>
                    </TableCell>
                  </Link>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.active ? "default" : "secondary"}>
                      {user.active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell className="font-mono text-sm">{user.id}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data?.pagination && (
        <AdminPagination
          itemLabel="users"
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
