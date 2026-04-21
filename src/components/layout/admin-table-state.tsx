import { TableCell, TableRow } from "@/components/ui/table";
import type React from "react";

interface AdminTableStateProps {
  children: React.ReactNode;
  colSpan: number;
}

function Loading({
  children = "Loading...",
  colSpan,
}: Partial<AdminTableStateProps> & { colSpan: number }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="text-center">
        {children}
      </TableCell>
    </TableRow>
  );
}

function ErrorState({ children, colSpan }: AdminTableStateProps) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="text-center text-red-500">
        {children}
      </TableCell>
    </TableRow>
  );
}

function Empty({ children, colSpan }: AdminTableStateProps) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="text-center">
        {children}
      </TableCell>
    </TableRow>
  );
}

export const AdminTableState = {
  Empty,
  Error: ErrorState,
  Loading,
};
