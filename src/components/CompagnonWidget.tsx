"use client";

import { useEffect, useRef, useState } from "react";

type ChatMessage = { role: "user" | "assistant"; content: string };

function generateSessionId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

// Phase 4 : widget de chat pour le Compagnon de test. Se vérifie
// lui-même côté client via /api/me pour ne s'afficher que si l'utilisateur
// est connecté — l'identité réelle est de toute façon relue côté serveur
// dans /api/compagnon, jamais reconstruite ici.
export function CompagnonWidget() {
  const [allowed, setAllowed] = useState(false);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId] = useState(generateSessionId);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.user) setAllowed(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, pending]);

  if (!allowed) return null;

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || pending) return;
    setInput("");
    setError(null);
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setPending(true);
    try {
      const res = await fetch("/api/compagnon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, sessionId }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(payload.error || "Erreur");
        return;
      }
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: payload.reply },
      ]);
    } catch {
      setError("Connexion impossible");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open ? (
        <div className="w-80 sm:w-96 h-[28rem] bg-bg-primary border border-border-tertiary rounded-lg shadow-lg flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border-tertiary shrink-0">
            <span className="text-sm font-medium text-text-primary">
              Compagnon de test
            </span>
            <button
              onClick={() => setOpen(false)}
              aria-label="Fermer le Compagnon de test"
              className="text-text-tertiary hover:text-text-primary"
            >
              ✕
            </button>
          </div>
          <div
            ref={listRef}
            className="flex-1 overflow-y-auto px-3 py-2 space-y-2 text-sm"
          >
            {messages.length === 0 && (
              <p className="text-text-tertiary text-xs">
                Pose une question sur le cahier de test, ou décris un
                feedback avant de le soumettre.
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`rounded-md px-2.5 py-1.5 max-w-[85%] whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-action text-text-info ml-auto"
                    : "bg-bg-secondary text-text-primary"
                }`}
              >
                {m.content}
              </div>
            ))}
            {pending && (
              <div className="bg-bg-secondary text-text-tertiary rounded-md px-2.5 py-1.5 max-w-[85%] text-xs">
                Le Compagnon réfléchit…
              </div>
            )}
            {error && (
              <p
                role="alert"
                className="text-xs text-type-bug-text bg-type-bug-bg rounded-md px-2 py-1"
              >
                {error}
              </p>
            )}
          </div>
          <form
            onSubmit={sendMessage}
            className="flex items-center gap-2 border-t border-border-tertiary p-2 shrink-0"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Écris ta question..."
              aria-label="Message pour le Compagnon de test"
              className="flex-1 rounded-md border border-border-tertiary bg-bg-secondary px-2.5 py-1.5 text-sm text-text-primary"
            />
            <button
              type="submit"
              disabled={pending || !input.trim()}
              className="rounded-md bg-action text-text-info px-3 py-1.5 text-sm font-medium disabled:opacity-50"
            >
              Envoyer
            </button>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="rounded-full bg-action text-text-info w-14 h-14 shadow-lg flex items-center justify-center text-xl"
          aria-label="Ouvrir le Compagnon de test"
        >
          💬
        </button>
      )}
    </div>
  );
}
