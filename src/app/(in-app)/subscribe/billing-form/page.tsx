import { Suspense } from "react";
import BillingFormPage from "./page-client";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <BillingFormPage />
    </Suspense>
  );
}
