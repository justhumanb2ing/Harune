"use client";

import { AdminPagination } from "@/components/layout/admin-pagination";
import { AdminTableState } from "@/components/layout/admin-table-state";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { mutationToasts } from "@/lib/react-query/query-client";
import { queryKeys } from "@/lib/react-query/query-keys";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, Search, Trash2 } from "lucide-react";
import { useState } from "react";

interface Message {
  id: string;
  name: string;
  email: string;
  company: string | null;
  message: string;
  createdAt: string;
  readAt: string | null;
}

interface PaginationInfo {
  total: number;
  pageCount: number;
  currentPage: number;
  perPage: number;
}

const limit = 10;
const formatDate = (date: string) => new Date(date).toLocaleString();

interface UpdateMessageInput {
  id: string;
  readAt: boolean;
}

export default function MessagesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const debouncedSearch = useDebounce(search);
  const queryKey = queryKeys.superAdmin.messages.list({ limit, page, search: debouncedSearch });

  const { data, error, isPending } = useQuery<{
    messages: Message[];
    pagination: PaginationInfo;
  }>({
    queryKey,
    queryFn: ({ signal }) => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search: debouncedSearch,
      });

      return apiFetch(`/api/super-admin/messages?${params.toString()}`, { signal });
    },
    placeholderData: keepPreviousData,
  });

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const refreshMessages = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.superAdmin.messages.all() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.superAdmin.stats.unreadMessages() }),
    ]);
  };

  const updateMessageMutation = useMutation({
    mutationFn: (input: UpdateMessageInput) =>
      apiFetch<Message>("/api/super-admin/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
    onSuccess: async (updatedMessage) => {
      setSelectedMessage((current) =>
        current?.id === updatedMessage.id ? { ...current, readAt: updatedMessage.readAt } : current
      );
      await refreshMessages();
    },
    meta: {
      toast: mutationToasts.messageUpdated,
    },
    onError: (requestError) => {
      console.error("Error toggling message read status:", requestError);
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/super-admin/messages?id=${id}`, {
        method: "DELETE",
      }),
    onSuccess: async () => {
      setSelectedMessage(null);
      await refreshMessages();
    },
    meta: {
      toast: mutationToasts.messageDeleted,
    },
    onError: (requestError) => {
      console.error("Error deleting message:", requestError);
    },
  });

  const handleOpenMessage = (message: Message) => {
    setSelectedMessage(message);

    if (!message.readAt) {
      updateMessageMutation.mutate({ id: message.id, readAt: true });
    }
  };

  const handleToggleRead = (message: Message) => {
    updateMessageMutation.mutate({ id: message.id, readAt: !message.readAt });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <h1 className="text-2xl font-bold">Messages</h1>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search messages..."
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
              <TableHead className="min-w-[200px]">From</TableHead>
              <TableHead className="min-w-[120px]">Company</TableHead>
              <TableHead className="min-w-[200px]">Message</TableHead>
              <TableHead className="min-w-[120px]">Date</TableHead>
              <TableHead className="min-w-[100px]">Status</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending ? (
              <AdminTableState.Loading colSpan={6} />
            ) : error ? (
              <AdminTableState.Error colSpan={6}>Error loading messages</AdminTableState.Error>
            ) : data?.messages.length === 0 ? (
              <AdminTableState.Empty colSpan={6}>No messages found</AdminTableState.Empty>
            ) : (
              data?.messages.map((message) => (
                <TableRow key={message.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{message.name}</div>
                      <div className="text-sm text-muted-foreground">{message.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{message.company || "-"}</TableCell>
                  <TableCell className="max-w-[300px] truncate">{message.message}</TableCell>
                  <TableCell>{formatDate(message.createdAt)}</TableCell>
                  <TableCell>
                    <Badge variant={message.readAt ? "secondary" : "default"}>
                      {message.readAt ? "Read" : "Unread"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => handleOpenMessage(message)}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data?.pagination && (
        <AdminPagination
          itemLabel="messages"
          limit={limit}
          page={page}
          pageCount={data.pagination.pageCount}
          total={data.pagination.total}
          onPreviousPage={() => setPage((currentPage) => currentPage - 1)}
          onNextPage={() => setPage((currentPage) => currentPage + 1)}
        />
      )}

      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="w-[95vw] max-w-[600px] sm:w-full">
          <DialogHeader>
            <DialogTitle>Message Details</DialogTitle>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4">
              <div className="grid grid-cols-[100px_1fr] gap-2">
                <div className="font-medium">From:</div>
                <div>{selectedMessage.name}</div>
                <div className="font-medium">Email:</div>
                <div>{selectedMessage.email}</div>
                {selectedMessage.company && (
                  <>
                    <div className="font-medium">Company:</div>
                    <div>{selectedMessage.company}</div>
                  </>
                )}
                <div className="font-medium">Date:</div>
                <div>{formatDate(selectedMessage.createdAt)}</div>
              </div>
              <div className="space-y-2">
                <div className="font-medium">Message:</div>
                <div className="whitespace-pre-wrap rounded-lg border bg-muted/50 p-4">
                  {selectedMessage.message}
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                variant="outline"
                onClick={() => selectedMessage && handleToggleRead(selectedMessage)}
                disabled={updateMessageMutation.isPending}
              >
                Mark as {selectedMessage?.readAt ? "unread" : "read"}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Message</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this message? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      disabled={deleteMessageMutation.isPending}
                      onClick={() =>
                        selectedMessage && deleteMessageMutation.mutate(selectedMessage.id)
                      }
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            <Button
              onClick={() => {
                if (selectedMessage) {
                  window.location.href = `mailto:${
                    selectedMessage.email
                  }?subject=Re: Message from ${
                    selectedMessage.name
                  }&body=\n\n------------------\nOriginal message:\n${selectedMessage.message}`;
                }
              }}
            >
              <Mail className="h-4 w-4 mr-2" />
              Reply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
