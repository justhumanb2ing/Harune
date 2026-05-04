import Link from "next/link";
import type { ReactNode } from "react";
import AuthBentoShowcase from "@/components/auth/auth-bento-showcase";
import AuthLayoutTransition from "@/components/transition/auth-layout-transition";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <AuthLayoutTransition>
      <main className="relative h-lvh flex flex-row bg-background">
        <div className="relative h-full flex-2 overflow-hidden">
          {/* Replace with Logo */}
          <aside className="absolute top-5 left-5 z-10">
            <Link
              href={"/"}
              aria-label="Close authentication"
              className="font-extrabold tracking-tighter text-3xl"
            >
              Harune
            </Link>
          </aside>

          {children}
        </div>
        <section className="h-full flex-3 hidden xl:block">
          <div className="h-full">
            <AuthBentoShowcase />
          </div>
        </section>
      </main>
    </AuthLayoutTransition>
  );
}
