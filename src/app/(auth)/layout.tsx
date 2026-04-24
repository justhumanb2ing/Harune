import AuthLayoutTransition from "@/components/animation/auth-layout-transition";
import type { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <AuthLayoutTransition>
      <main className="relative h-lvh flex flex-row bg-background">
        <div className="relative h-full flex-1 overflow-hidden">{children}</div>
        <section className="h-full flex-1 hidden lg:block">
          <div className="h-full">
            <img
              src={
                "https://images.unsplash.com/photo-1713508298272-7d0db139dc54?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              }
              alt="img"
              className="w-full h-full object-cover"
            />
          </div>
        </section>
      </main>
    </AuthLayoutTransition>
  );
}
