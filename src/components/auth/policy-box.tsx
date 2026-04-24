import Link from "next/link";

export default function PolicyBox() {
  return (
    <p className="text-center text-xs text-muted-foreground">
      By continuing, you agree to our{" "}
      <Link href="/terms" className="font-medium text-primary/80">
        Terms of Service
      </Link>{" "}
      and{" "}
      <Link href="/privacy" className="font-medium text-primary/80">
        Privacy Policy
      </Link>
    </p>
  );
}
