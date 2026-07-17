"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export function AutoDownloadPdf({ buttonId }: { buttonId: string }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("download") !== "1") return;

    const timer = window.setTimeout(() => {
      document.getElementById(buttonId)?.click();
      const url = new URL(window.location.href);
      url.searchParams.delete("download");
      window.history.replaceState({}, "", url.toString());
    }, 400);

    return () => window.clearTimeout(timer);
  }, [buttonId, searchParams]);

  return null;
}
