"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

// Ctrl+Alt+Delete can't be used: on Windows it's the OS Secure Attention
// Sequence and never reaches the browser. Ctrl+Alt+S is the closest safe combo.
const HOTKEY = { code: "KeyS", ctrl: true, alt: true };

const ENDPOINT = "/api/stream";
const POLL_MS = 15000;

type Panel = "closed" | "passcode" | "url";

/** Turns a share URL into something embeddable, or null if it's a direct file. */
function embedSrc(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\./, "");

  if (host === "youtu.be") {
    return `https://www.youtube.com/embed/${url.pathname.slice(1)}?autoplay=1`;
  }
  if (host === "youtube.com" || host === "m.youtube.com") {
    if (url.pathname === "/watch" && url.searchParams.get("v")) {
      return `https://www.youtube.com/embed/${url.searchParams.get("v")}?autoplay=1`;
    }
    if (url.pathname.startsWith("/live/")) {
      return `https://www.youtube.com/embed/${url.pathname.split("/")[2]}?autoplay=1`;
    }
    if (url.pathname.startsWith("/embed/")) return url.toString();
  }
  if (host === "twitch.tv") {
    const channel = url.pathname.split("/").filter(Boolean)[0];
    if (channel) {
      // Twitch requires the embedding hostname to be declared.
      const parent = typeof window === "undefined" ? "" : window.location.hostname;
      return `https://player.twitch.tv/?channel=${channel}&parent=${parent}&autoplay=true`;
    }
  }
  if (host === "vimeo.com") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    if (id) return `https://player.vimeo.com/video/${id}?autoplay=1`;
  }
  if (host === "player.vimeo.com" || host === "player.twitch.tv") return url.toString();

  return null;
}

export default function LiveStream() {
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel>("closed");
  const [passcode, setPasscode] = useState("");
  const [urlValue, setUrlValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  // Every visitor polls, so a stream set from one device takes the site over
  // for people already sitting on the page.
  useEffect(() => {
    let cancelled = false;

    const tick = async () => {
      try {
        const response = await fetch(ENDPOINT, { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as { url: string | null };
        if (!cancelled) setStreamUrl(data.url);
      } catch {
        // Offline or endpoint missing: leave the site as it is.
      }
    };

    void tick();
    const timer = window.setInterval(tick, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.code === HOTKEY.code && event.ctrlKey === HOTKEY.ctrl && event.altKey === HOTKEY.alt) {
        event.preventDefault();
        setPanel((current) => (current === "closed" ? "passcode" : "closed"));
        setError(null);
      }
      if (event.key === "Escape") setPanel("closed");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (panel !== "closed") firstFieldRef.current?.focus();
  }, [panel]);

  // Stop the site scrolling behind the player while a stream is up.
  useEffect(() => {
    if (!streamUrl) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [streamUrl]);

  const post = async (body: Record<string, unknown>) => {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.error || `Request failed (${response.status})`);
    return data;
  };

  const verify = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await post({ passcode, action: "verify" });
      setPanel("url");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Not authorized");
    } finally {
      setBusy(false);
    }
  };

  const apply = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const data = await post({ passcode, url: urlValue });
      setStreamUrl(data.url ?? null);
      setPanel("closed");
      setPasscode("");
      setUrlValue("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not set the stream");
    } finally {
      setBusy(false);
    }
  };

  const stop = async () => {
    setBusy(true);
    setError(null);
    try {
      await post({ passcode, url: "" });
      setStreamUrl(null);
      setPanel("closed");
      setPasscode("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not stop the stream");
    } finally {
      setBusy(false);
    }
  };

  const iframeSrc = streamUrl ? embedSrc(streamUrl) : null;

  return (
    <>
      {streamUrl && (
        <div className="live-takeover" role="region" aria-label="Live stream">
          {iframeSrc ? (
            <iframe
              src={iframeSrc}
              title="Live stream"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video src={streamUrl} controls autoPlay playsInline />
          )}
          <p className="live-badge">● Live</p>
        </div>
      )}

      {panel !== "closed" && (
        <div className="live-admin" role="dialog" aria-modal="true" aria-label="Live stream control">
          <button className="live-admin-backdrop" onClick={() => setPanel("closed")} aria-label="Close" />
          <div className="live-admin-card">
            {panel === "passcode" ? (
              <form onSubmit={verify}>
                <label htmlFor="live-passcode">Passcode</label>
                <input
                  id="live-passcode"
                  ref={firstFieldRef}
                  type="password"
                  value={passcode}
                  onChange={(event) => setPasscode(event.target.value)}
                  autoComplete="off"
                  disabled={busy}
                />
                <button type="submit" disabled={busy || !passcode}>
                  {busy ? "Checking…" : "Continue"}
                </button>
              </form>
            ) : (
              <form onSubmit={apply}>
                <label htmlFor="live-url">Stream URL</label>
                <input
                  id="live-url"
                  ref={firstFieldRef}
                  type="url"
                  placeholder="https://youtube.com/live/…"
                  value={urlValue}
                  onChange={(event) => setUrlValue(event.target.value)}
                  autoComplete="off"
                  disabled={busy}
                />
                <button type="submit" disabled={busy || !urlValue}>
                  {busy ? "Going live…" : "Go live"}
                </button>
                {streamUrl && (
                  <button type="button" className="live-stop" onClick={stop} disabled={busy}>
                    Stop stream and restore the site
                  </button>
                )}
              </form>
            )}
            {error && <p className="live-error" role="alert">{error}</p>}
          </div>
        </div>
      )}
    </>
  );
}
