import { Suspense } from "react";
import ResetPasswordConfirmPage from "./page-client";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordConfirmPage />
    </Suspense>
  );
}
