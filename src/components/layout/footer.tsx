import Link from "next/link";

export function Footer() {
  return (
    <footer className="">
      <div className="mx-auto flex items-center justify-center px-4 py-8 h-[400px] sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-18">
          {/* Hooking Title */}
          <div className="text-sm text-muted-foreground font-medium flex flex-row gap-1 text-center">
            <p>Designed in Berlin.</p>
            <p>Built for Makers.</p>
          </div>

          {/* Legal Links */}
          <div className="flex-1">
            <ul className="flex flex-row gap-10 text-sm font-medium text-muted-foreground">
              <li>
                <Link href="/sign-in" className="inline-block hover:text-primary">
                  Log In
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
