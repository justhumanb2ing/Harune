import { cn } from "@/lib/utils"

export default function Loading() {
  return (
    <main className="flex h-full w-full items-center justify-center bg-background/10">
      <div className={cn("relative", "size-12")}>
        <div className="absolute inset-0 animate-[smoothMorph_3s_ease-in-out_infinite] bg-indigo-400" />
      </div>
    </main>
  );
}