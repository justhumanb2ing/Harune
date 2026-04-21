import { appConfig } from "@/lib/config";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="">
      <div className="mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Brand and Description */}
          <div className="flex-1">
            <Link href="/" className="text-lg font-semibold">
              {appConfig.projectName}
            </Link>
            <p className="mt-2 text-sm text-muted-foreground">{appConfig.description}</p>
          </div>


          {/* Legal Links */}
          <div className="flex-1">
            <h3 className="text-sm font-semibold">Legal</h3>
            <ul className="mt-2 space-y-2 text-sm">
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-primary">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-primary">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Social Links */}
          <div className="flex-1">
            <h3 className="text-sm font-semibold uppercase">Social</h3>
            <ul className="mt-2 space-y-2 text-sm">
              {appConfig.social.twitter && (
                <li>
                  <a
                    href={appConfig.social.twitter}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary"
                  >
                    <span>Twitter</span>
                  </a>
                </li>
              )}
              {appConfig.social.instagram && (
                <li>
                  <a
                    href={appConfig.social.instagram}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary"
                  >
                    <span>Instagram</span>
                  </a>
                </li>
              )}
              {appConfig.social.youtube && (
                <li>
                  <a
                    href={appConfig.social.youtube}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary"
                  >
                    <span>Youtube</span>
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 pt-8 text-center sm:flex-row sm:text-left">
          <p className="text-sm text-muted-foreground">
            Copyright © {new Date().getFullYear()} {appConfig.projectName}
          </p>
        </div>
      </div>
    </footer>
  );
}
