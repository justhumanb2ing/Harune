import Link from "next/link";

export function Footer() {
  return (
    <footer className="min-h-[20rem] py-20">
      <div className="mx-auto flex items-center justify-center px-4 py-8  sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-18">
          {/* Hooking Title */}
          <div className="text-sm text-muted-foreground font-medium flex flex-row gap-2 text-center">
            <p>Crafted somewhere on earth.</p>
            <p>Built for Makers.</p>
          </div>

          {/* Legal Links */}
          <div className="flex-1">
            <ul className="flex flex-col items-center md:flex-row gap-10 text-sm font-medium text-muted-foreground">
              <li>
                <Link href="/" className="inline-block hover:text-primary">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/join" prefetch={false} className="inline-block hover:text-primary">
                  Log In
                </Link>
              </li>
              <li>
                <Link href="/leaderboard" className="inline-block hover:text-primary">
                  Leaderboard
                </Link>
              </li>
              <li>
                <Link href="/changelog" className="inline-block hover:text-primary">
                  Changelog
                </Link>
              </li>
              <li>
                <Link href="/roadmap" className="inline-block hover:text-primary">
                  Roadmap
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="inline-block hover:text-primary">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-primary">
                  Terms of Service
                </Link>
              </li>
              <li>
                <a
                  href="https://buymeacoffee.com/justhumanb2ing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary"
                >
                  Keep us going
                </a>
              </li>
            </ul>
          </div>

          {/* Brand and Description */}
          {/* <div className="flex-1">
            <Link href="/" className="text-5xl font-semibold">
              {appConfig.projectName}
            </Link>
          </div> */}
        </div>
      </div>
    </footer>
  );
}
