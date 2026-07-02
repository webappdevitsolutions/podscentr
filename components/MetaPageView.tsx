"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackAnalyticsEvent } from "@/lib/analytics-client";

function MetaPageViewInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstRender = useRef(true);
  const lastAnalyticsPath = useRef("");

  useEffect(() => {
    const nextPath = `${pathname}?${searchParams.toString()}`;
    if (!pathname.startsWith("/admin") && lastAnalyticsPath.current !== nextPath) {
      lastAnalyticsPath.current = nextPath;
      void trackAnalyticsEvent("page_view");
    }

    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("track", "PageView");
    }
  }, [pathname, searchParams]);

  return null;
}

export function MetaPageView() {
  return (
    <Suspense fallback={null}>
      <MetaPageViewInner />
    </Suspense>
  );
}
