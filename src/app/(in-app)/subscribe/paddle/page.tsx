import { Suspense } from "react";
import PaddleCheckoutPage from "./page-client";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PaddleCheckoutPage />
    </Suspense>
  );
}
