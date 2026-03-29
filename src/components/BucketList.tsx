"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface BucketItem {
  id: string;
  text: string;
  is_done: boolean;
  done_at: string | null;
  added_by: string;
  created_at: string;
}

export default function BucketList({ connectionId, userId }: { connectionId: string; userId: string }) {
  const supabase = createClient();
  const [items, setItems] = useState<BucketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [adding, setAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/bucket-list")
      .then((r) => r.json())
      .then(({ items }) => { setItems(items ?? []); setLoading(false); });

    // Realtime
    const channel = supabase
      .channel(`bucket-${connectionId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "bucket_list", filter: `connection_id=eq.${connectionId}` }, (payload) => {
        if (payload.eventType === "INSERT") {
          setItems((prev) => sortItems([...prev, payload.new as BucketItem]));
        } else if (payload.eventType === "UPDATE") {
          setItems((prev) => sortItems(prev.map((i) => i.id === payload.new.id ? payload.new as BucketItem : i)));
        } else if (payload.eventType === "DELETE") {
          setItems((prev) => prev.filter((i) => i.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [connectionId, supabase]);

  function sortItems(list: BucketItem[]) {
    return [...list].sort((a, b) => {
      if (a.is_done !== b.is_done) return a.is_done ? 1 : -1;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
  }

  async function addItem() {
    const text = input.trim();
    if (!text || adding) return;
    setAdding(true);
    setInput("");
    const res = await fetch("/api/bucket-list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) setInput(text); // restore on error
    setAdding(false);
    inputRef.current?.focus();
  }

  async function toggle(item: BucketItem) {
    setItems((prev) => sortItems(prev.map((i) => i.id === item.id ? { ...i, is_done: !i.is_done } : i)));
    await fetch(`/api/bucket-list/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_done: !item.is_done }),
    });
  }

  async function remove(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await fetch(`/api/bucket-list/${id}`, { method: "DELETE" });
  }

  const pending = items.filter((i) => !i.is_done);
  const done = items.filter((i) => i.is_done);

  if (loading) {
    return (
      <div className="flex flex-col gap-3 animate-pulse">
        {[1, 2, 3].map((i) => <div key={i} className="h-14 rounded-2xl bg-gray-100 dark:bg-gray-800" />)}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Add input */}
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addItem(); } }}
          placeholder="Add something to your list…"
          className="flex-1 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-800 dark:text-gray-100 focus:border-lavender focus:outline-none focus:ring-2 focus:ring-lavender/30 transition-all"
        />
        <button
          onClick={addItem}
          disabled={!input.trim() || adding}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-lavender text-white disabled:opacity-40 hover:bg-lavender-dark transition-all"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
        </button>
      </div>

      {/* Empty state */}
      {items.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <span className="text-4xl">🪣</span>
          <p className="font-semibold text-gray-700 dark:text-gray-200">Your bucket list is empty</p>
          <p className="text-sm text-gray-400">Add things you want to do together</p>
        </div>
      )}

      {/* Pending items */}
      {pending.length > 0 && (
        <div className="flex flex-col gap-2">
          {pending.map((item) => (
            <BucketRow key={item.id} item={item} userId={userId} onToggle={toggle} onDelete={remove} />
          ))}
        </div>
      )}

      {/* Done items */}
      {done.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Done ✓</p>
          {done.map((item) => (
            <BucketRow key={item.id} item={item} userId={userId} onToggle={toggle} onDelete={remove} />
          ))}
        </div>
      )}
    </div>
  );
}

function BucketRow({ item, userId, onToggle, onDelete }: {
  item: BucketItem;
  userId: string;
  onToggle: (item: BucketItem) => void;
  onDelete: (id: string) => void;
}) {
  const isOwn = item.added_by === userId;

  return (
    <div className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition-colors ${item.is_done ? "bg-gray-50 dark:bg-gray-800/50" : "bg-white dark:bg-gray-800"} border border-gray-100 dark:border-gray-700`}>
      <button
        onClick={() => onToggle(item)}
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all ${item.is_done ? "bg-lavender border-lavender" : "border-gray-300 dark:border-gray-600 hover:border-lavender"}`}
      >
        {item.is_done && (
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
        )}
      </button>
      <p className={`flex-1 text-sm ${item.is_done ? "line-through text-gray-400" : "text-gray-800 dark:text-gray-100"}`}>
        {item.text}
      </p>
      {(isOwn || item.is_done) && (
        <button
          onClick={() => onDelete(item.id)}
          className="text-gray-300 hover:text-red-400 transition-colors text-lg leading-none px-1"
        >
          ×
        </button>
      )}
    </div>
  );
}
