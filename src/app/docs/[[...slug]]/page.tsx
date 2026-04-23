import type { Metadata } from "next";

export default function Page() {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-3xl items-center justify-center px-6 py-16">
      <div className="w-full rounded-xl border border-border bg-card p-8">
        <h1 className="text-2xl font-semibold text-card-foreground">문서 준비 중</h1>
        <p className="mt-3 text-muted-foreground">
          기존 문서 시스템은 제거되었습니다. 필요한 내용은 추후 새로운 문서 페이지로 제공될
          예정입니다.
        </p>
      </div>
    </main>
  );
}
export const metadata: Metadata = {
  title: "Docs",
  description: "Documentation is under maintenance.",
};
