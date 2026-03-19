import { Suspense } from "react";
import AuthPageClient from "@/components/AuthPageClient";

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <AuthPageClient />
    </Suspense>
  );
}
