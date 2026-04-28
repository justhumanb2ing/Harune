import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="h-full flex items-center justify-center">
      <section className="flex flex-col items-center gap-10">
        <header className="flex flex-col items-center gap-1">
          <h2 className="text-xl font-bold">This space doesn’t exist</h2>
          <p className="text-muted-foreground">or it’s no longer here.</p>
        </header>

        <Button
          size={"lg"}
          nativeButton={false}
          className={
            "h-12 w-52 max-w-52 text-lg! font-bold! brand-button shadow-brand-small py-7 px-8"
          }
          render={<Link href="/">Take me home</Link>}
        />
      </section>
    </main>
  );
}
