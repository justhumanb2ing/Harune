import { TextLoop } from "@/components/ui/text-loop";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
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
        <div className="h-full flex items-center justify-center">
          <div className='inline-flex gap-4  whitespace-pre-wrap text-3xl'>
            <span>for</span>
            <TextLoop
              className='overflow-y-clip flex-1 min-w-80'
              transition={{
                    type: 'spring',
                    stiffness: 900,
                    damping: 80,
                    mass: 10,
                  }}
                  variants={{
                    initial: {
                      y: 20,
                      rotateX: 90,
                      opacity: 0,
                      filter: 'blur(4px)',
                    },
                    animate: {
                      y: 0,
                      rotateX: 0,
                      opacity: 1,
                      filter: 'blur(0px)',
                    },
                    exit: {
                      y: -20,
                      rotateX: -90,
                      opacity: 0,
                      filter: 'blur(4px)',
                    },
                  }}
                >
              <span>Founders</span>
              <span>Developers</span>
              <span>Designers</span>
              <span>Makers</span>
              <span>Musician</span>
              <span>Writers</span>
              <span>Everyone</span>
            </TextLoop>
          </div>
        </div>
      </section>
    </main>
  );
}
