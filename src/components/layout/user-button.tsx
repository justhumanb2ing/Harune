"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import useUser from "@/lib/users/useUser";
import { CreditCard, LayoutDashboard, LogOut, UserIcon } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "../ui/skeleton";

export function UserButton() {
  const { user } = useUser();

  return (
    <Avatar>
      <AvatarImage src={user?.image || undefined} />
      <AvatarFallback>
        <Skeleton className="size-4" />
      </AvatarFallback>
    </Avatar>
  );
}
