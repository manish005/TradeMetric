"use client";

import { MotionConfig } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";
import Landing from "@/components/Landing";
import AppShell from "@/components/AppShell";
import { TradeMetricLogo } from "@/components/Header";

export default function Home() {
  const { user, ready } = useAuth();

  return (
    <MotionConfig reducedMotion="user">
      {!ready ? (
        <div className="grid-bg flex min-h-screen flex-col items-center justify-center gap-6">
          <TradeMetricLogo />
          <div className="h-2 w-40 overflow-hidden rounded-full bg-panel2">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-mint/60" />
          </div>
        </div>
      ) : user ? (
        <AppShell />
      ) : (
        <Landing />
      )}
    </MotionConfig>
  );
}