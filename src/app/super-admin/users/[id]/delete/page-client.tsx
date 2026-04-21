"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/react-query/fetcher";
import { queryKeys } from "@/lib/react-query/query-keys";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface User {
  id: string;
  name: string | null;
  email: string;
}

export default function DeleteUserPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const queryClient = useQueryClient();
  const [confirmation, setConfirmation] = useState("");

  const {
    data: user,
    error,
    isPending,
  } = useQuery({
    queryKey: queryKeys.superAdmin.users.detail(id),
    queryFn: ({ signal }) => apiFetch<User>(`/api/super-admin/users/${id}`, { signal }),
  });

  const confirmationText = "delete this user";

  const deleteUserMutation = useMutation({
    mutationFn: () =>
      apiFetch(`/api/super-admin/users/${id}`, {
        method: "DELETE",
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.superAdmin.users.all() });
      toast.success("User deleted successfully");
      router.push("/super-admin/users");
    },
    onError: (error) => {
      toast.error("Failed to delete user");
      console.error(error);
    },
  });

  const handleDelete = () => {
    if (!user) return;
    if (confirmation !== confirmationText) {
      toast.error("Please enter the correct confirmation text");
      return;
    }

    deleteUserMutation.mutate();
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-14rem)]">
        <div className="text-center">
          <h2 className="text-lg font-medium">Error loading user</h2>
          <p className="text-sm text-muted-foreground">
            Failed to load user details. Please try again.
          </p>
          <Button variant="ghost" size="sm" asChild className="mt-4">
            <Link href="/super-admin/users">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-14rem)]">
        <div className="text-center">
          <h2 className="text-lg font-medium">Loading...</h2>
          <p className="text-sm text-muted-foreground">
            Please wait while we load the user details.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/super-admin/users/${id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Delete User</h1>
      </div>

      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Warning: This action cannot be undone</AlertTitle>
        <AlertDescription>
          Deleting this user will permanently remove their account and all associated data.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Confirm Deletion</CardTitle>
          <CardDescription>Please review the information below carefully.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium">Email:</p>
            <p className="text-sm">{user?.email}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Name:</p>
            <p className="text-sm">{user?.name || "Unnamed User"}</p>
          </div>
          <div>
            <p className="text-sm font-medium">User ID:</p>
            <p className="text-sm font-mono">{user?.id}</p>
          </div>

          <div className="pt-4">
            <p className="text-sm font-medium mb-2">
              To confirm deletion, type &quot;{confirmationText}&quot; below:
            </p>
            <Input
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder={confirmationText}
              className="max-w-md"
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href={`/super-admin/users/${id}`}>Cancel</Link>
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteUserMutation.isPending || confirmation !== confirmationText}
          >
            {deleteUserMutation.isPending ? "Deleting..." : "Delete User"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
