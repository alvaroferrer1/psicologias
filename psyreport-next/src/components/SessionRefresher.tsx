"use client";

import { useEffect } from "react";

export function SessionRefresher() {
  useEffect(() => {
    fetch("/api/auth/refresh", { method: "POST" }).catch(() => {});
  }, []);

  return null;
}
