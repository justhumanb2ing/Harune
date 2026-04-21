import { SignUpHandleForm } from "@/components/auth/sign-up-handle-form";
import { appConfig } from "@/lib/config";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up",
  description: `Create your ${appConfig.projectName} account`,
};

export default function SignUpPage() {
  return (
    <div className="space-y-6 min-h-80">
      <h1 className="text-center text-2xl font-semibold tracking-tight">Claim your handle</h1>
      <SignUpHandleForm />
    </div>
  );
}
