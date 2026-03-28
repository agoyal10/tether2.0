"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface PendingRequest {
  id: string;
  requesterName: string;
}

export default function PendingConnectionBanner({ requests }: { requests: PendingRequest[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<string[]>([]);

  const visible = requests.filter((r) => !dismissed.includes(r.id));
  if (!visible.length) return null;

  async function respond(connectionId: string, action: "approve" | "decline") {
    setLoading(`${connectionId}-${action}`);
    await fetch("/api/connections/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ connectionId, action }),
    });
    setLoading(null);
    setDismissed((prev) => [...prev, connectionId]);
    if (action === "approve") router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      {visible.map((req) => (
        <div
          key={req.id}
          className="rounded-3xl border border-lavender/30 bg-lavender-light/40 p-4"
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">💌</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-lavender-dark">
                {req.requesterName} wants to connect
              </p>
              <p className="mt-0.5 text-xs text-gray-500">
                They used your invite link
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => respond(req.id, "approve")}
                  disabled={loading !== null}
                  className="flex-1 rounded-2xl bg-lavender py-2 text-xs font-semibold text-white disabled:opacity-60 transition-all"
                >
                  {loading === `${req.id}-approve` ? "Approving…" : "Accept"}
                </button>
                <button
                  onClick={() => respond(req.id, "decline")}
                  disabled={loading !== null}
                  className="flex-1 rounded-2xl border border-gray-200 py-2 text-xs font-semibold text-gray-500 disabled:opacity-60 transition-all dark:border-gray-700"
                >
                  {loading === `${req.id}-decline` ? "Declining…" : "Decline"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
