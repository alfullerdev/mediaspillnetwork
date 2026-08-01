"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

// Ctrl+Alt+Delete can't be used: on Windows it's the OS Secure Attention
// Sequence and never reaches the browser. Ctrl+Alt+S is the closest safe combo.
const HOTKEY = { code: "KeyS", ctrl: true, alt: true };

const ENDPOINT = "/api/stream";
const POLL_MS = 15000;

type Panel = "closed" | "passcode" | "url";

type Playable =
  | { kind: "iframe"; src: string }
  | { kind: "video"; src: string }
  | { kind: "unsupported" };

const VIDEO_FILE = /\.(m3u8|mp4|webm|mov|ogg)(\?|$)/i;

/** Works out how a given URL should be played, if at all. */
function resolvePlayer(raw: string): Playable {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { kind: "unsupported" };
  }
  const host = url.hostname.replace(/^www\./, "");
  const iframe = (src: string): Playable => ({ kind: "iframe", src });

  if (host === "youtu.be") {
    return iframe(`https://www.youtube.com/embed/${url.pathname.slice(1)}?autoplay=1`);
  }
  if (host === "youtube.com" || host === "m.youtube.com") {
    if (url.pathname === "/watch" && url.searchParams.get("v")) {
      return iframe(`https://www.youtube.com/embed/${url.searchParams.get("v")}?autoplay=1`);
    }
    if (url.pathname.startsWith("/live/")) {
      return iframe(`https://www.youtube.com/embed/${url.pathname.split("/")[2]}?autoplay=1`);
    }
    if (url.pathname.startsWith("/embed/")) return iframe(url.toString());
  }
  if (host === "twitch.tv") {
    const channel = url.pathname.split("/").filter(Boolean)[0];
    if (channel) {
      // Twitch refuses to embed unless the hosting domain is declared.
      const parent = typeof window === "undefined" ? "" : window.location.hostname;
      return iframe(`https://player.twitch.tv/?channel=${channel}&parent=${parent}&autoplay=true`);
    }
  }
  if (host === "vimeo.com") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    if (id) return iframe(`https://player.vimeo.com/video/${id}?autoplay=1`);
  }
  if (host === "player.vimeo.com" || host === "player.twitch.tv" || host === "facebook.com/plugins") {
    return iframe(url.toString());
  }
  // Facebook and Instagram lives go through Facebook's video plugin; the raw
  // page URL is HTML and would leave a black screen in a <video> tag.
  if (host === "facebook.com" || host === "fb.watch" || host === "instagram.com") {
    return iframe(
      `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url.toString())}&autoplay=1`,
    );
  }

  if (VIDEO_FILE.test(url.pathname)) return { kind: "video", src: url.toString() };

  // Anything else is almost certainly an HTML page, which would render as a
  // black box. Say so rather than pretending it is playing.
  return { kind: "unsupported" };
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

  // Focus moves inside a cross-origin player iframe as soon as it is clicked,
  // and key events there never reach this page — so the hotkey alone can lock
  // the operator out. ?stream-admin is a focus-proof way back in.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!new URLSearchParams(window.location.search).has("stream-admin")) return;
    const id = window.setTimeout(() => setPanel("passcode"), 0);
    return () => window.clearTimeout(id);
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

  const player = streamUrl ? resolvePlayer(streamUrl) : null;

  return (
    <>
      {streamUrl && (
        <div className="live-takeover" role="region" aria-label="Live stream">
          {player?.kind === "iframe" && (
            <iframe
              src={player.src}
              title="Live stream"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          )}
          {player?.kind === "video" && <video src={player.src} controls autoPlay playsInline />}
          {player?.kind === "unsupported" && (
            <p className="live-unsupported">
              This link can’t be embedded.<br />
              <a href={streamUrl} target="_blank" rel="noreferrer">Open the stream directly ↗</a>
            </p>
          )}
          <p className="live-badge">● Live</p>
          {/* Sits above the iframe so there is always a clickable way back to
              the controls, even once the player has taken keyboard focus. */}
          <button
            className="live-escape"
            onClick={() => setPanel("passcode")}
            aria-label="Live stream controls"
          />
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
