import { Suspense } from "react";
import { VerifyForm } from "./verify-form";

export default function VerifyMfaPage() {
  return (
    <Suspense>
      <VerifyForm />
    </Suspense>
  );
}
