"use client";

import { useEffect, useRef, useState } from "react";

export function SyncedHorizontalScroll({ children }: { children: React.ReactNode }) {
  const topRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [scrollWidth, setScrollWidth] = useState(0);
  const [clientWidth, setClientWidth] = useState(0);

  useEffect(() => {
    const updateSizes = () => {
      if (!bottomRef.current) return;
      setScrollWidth(bottomRef.current.scrollWidth);
      setClientWidth(bottomRef.current.clientWidth);
    };

    updateSizes();
    window.addEventListener("resize", updateSizes);

    const observer = new ResizeObserver(updateSizes);
    if (bottomRef.current) observer.observe(bottomRef.current);

    return () => {
      window.removeEventListener("resize", updateSizes);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const top = topRef.current;
    const bottom = bottomRef.current;
    if (!top || !bottom) return;

    let syncingTop = false;
    let syncingBottom = false;

    const syncFromTop = () => {
      if (syncingBottom) {
        syncingBottom = false;
        return;
      }
      syncingTop = true;
      bottom.scrollLeft = top.scrollLeft;
    };

    const syncFromBottom = () => {
      if (syncingTop) {
        syncingTop = false;
        return;
      }
      syncingBottom = true;
      top.scrollLeft = bottom.scrollLeft;
    };

    top.addEventListener("scroll", syncFromTop);
    bottom.addEventListener("scroll", syncFromBottom);

    return () => {
      top.removeEventListener("scroll", syncFromTop);
      bottom.removeEventListener("scroll", syncFromBottom);
    };
  }, [scrollWidth, clientWidth]);

  return (
    <div>
      <div className="border-b border-secondary-border bg-slate-50/70 px-4 py-3">
        <div ref={topRef} className="top-scrollbar overflow-x-auto">
          <div style={{ width: scrollWidth || clientWidth || "100%", minWidth: "100%", height: 1 }} />
        </div>
      </div>
      <div ref={bottomRef} className="overflow-x-auto">
        {children}
      </div>
    </div>
  );
}
