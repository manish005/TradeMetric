"use client";

import { motion } from "framer-motion";
import type { User } from "firebase/auth";
import { IconShield } from "@/components/icons";

export default function ProfileView({ user }: { user: User | null }) {
  if (!user) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.992 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto w-full max-w-3xl"
    >
      <div className="rounded-3xl border border-line bg-panel/70 p-6 backdrop-blur sm:p-8">
        <div className="flex flex-col items-center text-center sm:items-start sm:flex-row sm:gap-6 sm:text-left">
          {user.photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.photoURL}
              alt="Profile photo"
              className="h-24 w-24 shrink-0 rounded-3xl border border-line object-cover shadow-[0_0_40px_-12px_rgba(52,211,153,0.5)]"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl border border-mint/30 bg-gradient-to-br from-mint/20 to-teal/10 text-4xl font-black text-mint">
              {user.displayName?.[0] ?? user.email?.[0] ?? "G"}
            </span>
          )}
          <div className="mt-4 sm:mt-0 sm:min-w-0">
            <h2 className="text-2xl font-extrabold text-ink">
              {user.displayName ?? "TradeMetric user"}
            </h2>
            <p className="text-sm text-muted">{user.email}</p>
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-mint/30 bg-mint/10 px-3 py-1 text-[11px] font-semibold text-mint">
              <IconShield className="h-3.5 w-3.5" />
              Verified with Google
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Detail label="Display name" value={user.displayName ?? "—"} />
          <Detail label="Email" value={user.email ?? "—"} />
          <Detail
            label="Account created"
            value={
              user.metadata.creationTime
                ? new Date(user.metadata.creationTime).toLocaleDateString(
                    undefined,
                    { year: "numeric", month: "long", day: "numeric" }
                  )
                : "—"
            }
          />
          <Detail
            label="Last sign-in"
            value={
              user.metadata.lastSignInTime
                ? new Date(user.metadata.lastSignInTime).toLocaleDateString(
                    undefined,
                    { year: "numeric", month: "long", day: "numeric" }
                  )
                : "—"
            }
          />
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6">
          <p className="text-[12px] text-faint">
            Store your calculations privately — nothing leaves this browser.
          </p>
          <p className="text-[12px] font-semibold text-mint">
            Signed in with Google
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-panel2/60 px-4 py-3">
      <div className="text-[11px] font-medium uppercase tracking-wider text-faint">
        {label}
      </div>
      <div className="mt-1 truncate text-[14px] font-semibold text-ink">
        {value}
      </div>
    </div>
  );
}