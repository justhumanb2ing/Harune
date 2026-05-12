import type { ReactNode } from "react";
import { SquigglyText } from "@/components/ui/squiggly-text";

interface AuthLayoutProps {
  children: ReactNode;
}

const squigglyTexts = [
  {
    text: "Hello",
    className: "left-[8%] top-[14%] text-6xl rotate-[-12deg]",
  },
  {
    text: "こんにちは",
    className: "right-[12%] top-[10%] text-5xl rotate-[10deg] text-red-400",
  },
  {
    text: "안녕하세요",
    className: "left-[18%] top-[36%] text-7xl rotate-[4deg] text-indigo-400",
  },
  {
    text: "Olá",
    className: "right-[20%] top-[28%] text-4xl rotate-[-16deg] text-blue-400",
  },
  {
    text: "Bonjour",
    className: "left-[12%] bottom-[22%] text-5xl rotate-[-14deg] text-green-400",
  },
  {
    text: "Привет",
    className: "right-[8%] bottom-[28%] text-6xl rotate-[-8deg] text-amber-400",
  },
  {
    text: "Ciao",
    className: "left-[36%] bottom-[14%] text-4xl rotate-[18deg] text-pink-400",
  },
  {
    text: "Hallo",
    className: "right-[32%] bottom-[12%] text-5xl rotate-[-6deg] text-purple-400",
  },
  {
    text: "Xin chào",
    className: "left-[42%] top-[52%] text-4xl rotate-[-22deg] text-orange-400",
  },
] as const;

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className="relative h-lvh flex flex-row bg-background">
      <div className="relative h-full flex-2 overflow-hidden">
        {/* Replace with Logo */}
        {/*<aside className="absolute top-5 left-5 z-10">
          <Link href={'/'}>
            <div className="size-10 aspect-square rounded-xl">
              <Image
                src={"/assets/logo.png"}
                alt="Harune Logo"
                width={256}
                height={256}
                className="mb-4 size-full rounded-lg object-cover"
              />
            </div>
          </Link>
        </aside>*/}

        {children}
      </div>
      <section className="relative h-full flex-3 hidden overflow-hidden xl:block">
        {/*<div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(245,158,11,0.12),_transparent_55%)]" />*/}
        <div className="relative h-full w-full text-5xl leading-tight font-bold">
          {squigglyTexts.map(({ text, className }) => (
            <div key={text} className={`absolute whitespace-nowrap ${className}`}>
              <SquigglyText steps={8} stepDuration={100} scale={[8, 9]}>
                {text}
              </SquigglyText>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
