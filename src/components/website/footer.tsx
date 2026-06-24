import Image from "next/image";
import Link from "next/link";
import { AppEntryCtaButton } from "@/components/website/app-entry-cta-button";
import { Badge } from "../ui/badge";

export function Footer() {
  return (
    <footer className="min-h-[20rem] py-20">
      <div className="mx-auto flex items-center justify-center px-4 py-8  sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-18 text-neutral-500">
          {/* Hooking Title */}
          <div className="text-sm font-medium flex flex-col gap-4 text-center">

            <div className="relative">
              <Image src="/assets/logo.png" alt="Harune logo" width={400} height={400} className="mx-auto size-24" />
            </div>
            
            <div className="flex flex-row gap-2">
              <p>Crafted somewhere on earth.</p>
              <p>Built for Makers.</p>
            </div>
            
            <p>
              built by{" "}
              <a href="https://x.com/kinmongsang" target="_blank" rel="noopener noreferrer" className="font-bold">
                someone
              </a>
            </p>
          </div>

          
          {/* Legal Links */}
          <div className="flex-1">
            <ul className="flex flex-col items-center md:flex-row gap-10 text-sm font-medium ">
              <li>
                <Link href="/" className="inline-block hover:text-primary">
                  Home
                </Link>
              </li>
              <li>
                <AppEntryCtaButton
                  next="/"
                  size="sm"
                  variant="ghost"
                  className="inline-block text-sm hover:bg-inherit"
                >
                  Log In
                </AppEntryCtaButton>
              </li>
              <li>
                <Link prefetch={false} href="/explore" className="inline-block hover:text-primary">
                  Explore
                </Link>
              </li>
              <li>
                <Link href="/changelog" className="inline-block hover:text-primary">
                  Changelog
                </Link>
              </li>
              <li>
                <a
                  href="https://buymeacoffee.com/justhumanb2ing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary"
                >
                  Support us
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
