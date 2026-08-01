"use client";

import { FormEvent, useEffect, useState } from "react";

const CDN =
  "https://d2kt395i2p6b75.cloudfront.net/01KXNV0AYM7AXB6G3VQJEDT8D9/media";

const work = [
  { id: "01KXNV0G47BH9AT70HCDDT9N5C", name: "THE WATCHLIST", kind: "Discovery series" },
  { id: "01KXNV0G47WQK7492J2YZR986T", name: "ON LOCATION", kind: "Live sessions" },
  { id: "01KXNV0G4779WSF680P60F4B9V", name: "THE CUT", kind: "Performance film" },
  { id: "01KXNV0G46SNYWYY44J9S9Z0H5", name: "NEXT UP", kind: "Artist spotlight" },
  { id: "01KXNV0G46AX31B9MS08QJ4W62", name: "THE NETWORK", kind: "Culture & community" },
  { id: "01KXNV0G46CA0R8M248KT1MNP8", name: "AFTER HOURS", kind: "Behind the scenes" },
];

const services = [
  {
    number: "01",
    title: "Featured Artists",
    headline: "Cinematic Music Discovery For Emerging Artists",
    package: "Artist Spotlight Package",
    detail: "30-minute feature · HD production",
    intro: "Showcase your sound in a visually stunning series that highlights new talent.",
    body: [
      "This comprehensive package includes a professionally shot and edited music discovery feature, artistic direction, and music licensing support. Your story gets told through cinematic visuals that match your sonic identity.",
      "The package features a 30-minute feature that airs across multiple platforms, ensuring your music reaches diverse audiences through high-quality, engaging content.",
    ],
    cta: "Contact me",
  },
  {
    number: "02",
    title: "Artist Development",
    headline: "Elevate Your Artistry To Professional Excellence",
    package: "Performance Mastery Package",
    detail: "90-minute evaluation session · 3 sessions",
    intro: "Personalized performance evaluations and strategic career guidance for artists ready to shine.",
    body: [
      "This comprehensive package includes detailed technical assessments, personalized practice strategies, and live feedback sessions designed to elevate your performance capabilities. Artists gain clarity on their unique artistic voice while developing professional-level technique.",
      "The package features three 90-minute evaluation sessions with targeted development exercises and a customized improvement plan.",
    ],
    cta: "Let's Talk",
  },
  {
    number: "03",
    title: "Live Event Production",
    headline: "Premium Live Event Production Services",
    package: "Signature Live Music Package",
    detail: "Multi-camera setup · 4+ camera rig",
    intro: "Elevate your music experience with expert coordination and professional filming for unforgettable moments.",
    body: [
      "This comprehensive package includes full event coordination, multi-camera filming, and professional sound engineering. Perfect for artists looking to create high-quality recordings of their live performances.",
      "The package features dedicated crew members, state-of-the-art equipment, and post-production support to ensure your event is captured perfectly.",
    ],
    cta: "Let's connect",
  },
  {
    number: "04",
    title: "Content Collaboration",
    headline: "Elevate Your Brand With Content Collaboration",
    package: "Brand Story Video Package",
    detail: "Full production cycle · Concept tofinal",
    intro: "Turn your vision into compelling video content that captivates and converts.",
    body: [
      "This comprehensive package takes your brand story from concept to screen. We work closely with you to develop a compelling narrative, plan the shoot, and produce a polished video that aligns with your brand identity and marketing goals. The result is a versatile asset that can be used across multiple platforms to engage your audience and drive conversions.",
      "Included in this package is a discovery workshop, script development, professional filming, editing, and strategic distribution planning.",
    ],
    cta: "Let's connect",
  },
  {
    number: "05",
    title: "DJ Services",
    headline: "DJ Services",
    package: "Premium Wedding Dj Package",
    // Only service the reference site actually publishes a price for.
    price: "$150",
    detail: "Full-day service · 8+ hours",
    intro: "I craft vibrant soundscapes that elevate your celebration with energy and style.",
    body: [
      "This comprehensive package includes a full-day service from ceremony to reception, featuring a custom playlist curation, dual microphones for seamless transitions, and a professional sound system setup. The experience begins with a pre-event consultation where we discuss your musical preferences, event timeline, and any special requests to ensure every note aligns with your celebration.",
      "Clients love this package for its seamless execution and ability to keep guests dancing throughout the night. The package includes a backup DJ for extended events and a complimentary soundcheck to guarantee crystal-clear audio quality from start to finish.",
    ],
    cta: "Contact me",
  },
];

const mediafestArtists = [
  { id: "01KXNV0G45SYK29M0K2ZKQQB9K", event: "MediaFest 26", title: "Ruggo", role: "West Coast artist" },
  { id: "01KXNV0G46SNYWYY44J9S9Z0H5", event: "MediaFest 26", title: "Kutty Briggs", role: "Featured artist" },
  { id: "01KXNV0G47WQK7492J2YZR986T", event: "MediaFest 26", title: "Live performance", role: "Artist showcase" },
  { id: "01KXNV0G4779WSF680P60F4B9V", event: "MediaFest 26", title: "Live performance", role: "Artist showcase" },
  { id: "01KXNV0G46AX31B9MS08QJ4W62", event: "MediaFest 26", title: "Live performance", role: "Artist showcase" },
];

// MediaFest section is parked for now. Flip to true to bring it back; the hero
// scroll arrow follows this so it never points at a hidden anchor.
const SHOW_MEDIAFEST = false;

// Community comments carried over from the live Instagram feedback wall.
const feedback = [
  { handle: "1stafricanovo", id: "01KXNV0G47BH9AT70HCDDT9N5C", text: "🔥🔥🔥🔥" },
  { handle: "that1vetty", id: "01KXNV0G47WQK7492J2YZR986T", text: "This is 🔥🔥🔥 me and my family are just now finally seeing the whole video 📸 and Damnit you did yo thug thizzle! 👏🏽👏🏽 Those Bars was flowing like butter 🧈 keep doing what you do I am sooooo proud of you and will always be a fan 🪭" },
  { handle: "juelsofrome", id: "01KXNV0G4779WSF680P60F4B9V", text: "🔥🔥🔥🔥🔥🔥" },
  { handle: "xbfyhmm", id: "01KXNV0G46SNYWYY44J9S9Z0H5", text: "🔥🔥🔥🔥🔥" },
  { handle: "rosecranshopout", id: "01KXNV0G46AX31B9MS08QJ4W62", text: "Royalty my nigga on Bompton 🌹👌🏾🤞🏾" },
  { handle: "snagglay", id: "01KXNV0G46CA0R8M248KT1MNP8", text: "🔥🔥🔥" },
];

function Poster({ id, alt, className = "" }: { id: string; alt: string; className?: string }) {
  return <img className={className} src={`${CDN}/videos/posters/${id}.jpg`} alt={alt} />;
}

export default function Home() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeService, setActiveService] = useState<number | null>(null);
  const [activeWork, setActiveWork] = useState<number | null>(null);
  const activeArtist = mediafestArtists[activeSlide];

  useEffect(() => {
    const timer = window.setInterval(
      () => setActiveSlide((current) => (current + 1) % mediafestArtists.length),
      6000,
    );
    return () => window.clearInterval(timer);
  }, []);
  // Netlify Forms takes a urlencoded POST to any path on the site, with the
  // form's name in a `form-name` field. JSON is not supported.
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const body = new URLSearchParams();
    new FormData(form).forEach((value, key) => body.append(key, String(value)));

    setStatus("sending");
    try {
      const response = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });
      if (!response.ok) throw new Error(`Netlify returned ${response.status}`);
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  };

  return (
    <main>
      <nav className="nav">
        <div className="nav-inner">
          <a href="#top" className="brand" aria-label="Media Spill Network home">MED!A<br />SP!LL</a>
          <div className="nav-links"><a href="#about">About</a><a href="#work">Work</a><a href="#services">Services</a></div>
          <a className="nav-cta" href="#contact">Reach out <span>↗</span></a>
        </div>
      </nav>
      <section className="hero" id="top">
        {mediafestArtists.map((artist, index) => <Poster key={artist.id} id={artist.id} alt={`${artist.title} at ${artist.event}`} className={`hero-image ${index === activeSlide ? "is-active" : ""}`} />)}
        <div className="hero-shade" />
        <div className="hero-content wrap">
          <p className="eyebrow">Independent media platform · Los Angeles</p>
          <h1>The next<br /><em>sound</em> starts here.</h1>
          <div className="hero-bottom">
            <div className="hero-feature"><span>{activeArtist.event} · {activeArtist.role}</span><p>{activeArtist.title}</p><div className="slide-controls">{mediafestArtists.map((artist, index) => <button className={index === activeSlide ? "slide-dot is-active" : "slide-dot"} key={artist.id} onClick={() => setActiveSlide(index)} aria-label={`Show ${artist.title}`} />)}</div></div>
            <a className="round-link" href={SHOW_MEDIAFEST ? "#mediafest" : "#work"} aria-label={SHOW_MEDIAFEST ? "View MediaFest 26" : "View selected work"}>↓</a>
          </div>
        </div>
        <div className="hero-stats"><span>350K+ monthly reach</span><span>17.7K community</span><span>Est. 2026</span></div>
      </section>

      <section className="intro wrap" id="about">
        <div className="intro-head"><p className="section-label">01 / About Media Spill</p><h2>Built for the artists <em>before</em> everyone knows their name.</h2></div>
        <div className="intro-copy">
          <p>Media Spill Network is a dynamic media and production platform dedicated to discovering and promoting emerging talent. We create high-quality content that reaches over 350K accounts monthly.</p>
          <p>Through innovative formats like <strong>THE WATCHLIST</strong>, artists take a cinematic journey toward recognition. Authentic storytelling and strategic partnerships turn potential into professional success.</p>
          <a className="text-link" href="https://instagram.com/mediaspill" target="_blank" rel="noreferrer">Follow the spill <span>↗</span></a>
        </div>
      </section>

      {SHOW_MEDIAFEST && <section className="watchlist" id="mediafest">
        <div className="watchlist-head wrap">
          <div className="watchlist-intro"><p className="section-label">02 / MediaFest 26</p><h2>One night.<br /><em>Every voice.</em></h2><p>MediaFest 26 brought the community together for an all-in artist showcase. These are moments from one event—captured by the Media Spill Network.</p></div>
          <div className="watchlist-grid">{mediafestArtists.map((artist) => <article key={artist.id} className="watchlist-card"><Poster id={artist.id} alt={`${artist.title} at ${artist.event}`} /><div><span>{artist.event}</span><h3>{artist.title}</h3><p>{artist.role}</p></div></article>)}</div>
        </div>
        <div className="watchlist-footer wrap"><span>MediaFest 26 · Artist showcase · Live performance</span><a href="#contact">Book the network <b>↗</b></a></div>
      </section>}

      <section className="reel" id="work">
        <div className="reel-head wrap">
          <div className="reel-intro"><p className="section-label">03 / Selected work</p><h2>Watch what’s <em>next.</em></h2><p>Exclusive performances, artist stories, and the raw energy behind the camera.</p></div>
          <div className="work-grid">
          {work.map((item, index) => <button className={`work-card work-${index + 1}`} key={item.id} onClick={() => setActiveWork(index)} aria-label={`Play ${item.name}`}>
            <Poster id={item.id} alt={item.name} />
            <div><span>{item.kind}</span><h3>{item.name}</h3></div>
            <span className="work-play" aria-hidden="true">▶</span>
          </button>)}
          </div>
        </div>
      </section>

      <section className="services" id="services">
        <div className="wrap">
          <div className="service-header">
            <div className="service-intro"><p className="section-label">04 / What we do</p><h2>More than<br />a <em>moment.</em></h2><p className="service-summary">End-to-end creative support for artists, brands, and ideas ready to take up space.</p></div>
            <div className="service-grid">{services.map((service, index) => <button className="service-card" key={service.number} onClick={() => setActiveService(index)} aria-label={`View ${service.title} package details`}><span>{service.number}</span><h3>{service.title}</h3><p>{service.intro}</p><div><small>{service.detail}</small><b>↗</b></div></button>)}</div>
          </div>
        </div>
      </section>

      {activeWork !== null && <div className="work-modal" role="dialog" aria-modal="true" aria-label={`${work[activeWork].name} video`}>
        <button className="modal-backdrop" onClick={() => setActiveWork(null)} aria-label="Close video" />
        <div className="work-player">
          <button className="modal-close" onClick={() => setActiveWork(null)} aria-label="Close">×</button>
          {/* key forces a remount on change so the next clip actually autoplays */}
          <video
            key={work[activeWork].id}
            src={`${CDN}/videos/${work[activeWork].id}/original.mp4`}
            poster={`${CDN}/videos/posters/${work[activeWork].id}.jpg`}
            controls
            autoPlay
            playsInline
            preload="none"
            onEnded={() => setActiveWork((current) => (current === null ? null : (current + 1) % work.length))}
          />
          <p className="work-player-caption"><span>{work[activeWork].kind}</span>{work[activeWork].name}</p>
        </div>
      </div>}

      {activeService !== null && <div className="service-modal" role="dialog" aria-modal="true" aria-labelledby="service-title"><button className="modal-backdrop" onClick={() => setActiveService(null)} aria-label="Close service details" /><article className="modal-card"><button className="modal-close" onClick={() => setActiveService(null)} aria-label="Close">×</button><p className="section-label">{services[activeService].number} / {services[activeService].title}</p><h2 id="service-title">{services[activeService].package}</h2>{services[activeService].price && <p className="modal-price">{services[activeService].price}</p>}<p className="modal-detail">{services[activeService].detail}</p><p className="modal-intro">{services[activeService].intro}</p>{services[activeService].body.map((para) => <p className="modal-description" key={para.slice(0, 24)}>{para}</p>)}<a href="#contact" onClick={() => setActiveService(null)} className="modal-cta">{services[activeService].cta} <span>↗</span></a></article></div>}

      <section className="quote">
        <div className="wrap"><p className="section-label">The spill effect</p><blockquote>“Real feedback from real collaborations. The work always speaks louder.”</blockquote><p className="quote-source">— Media Spill community</p></div>
        {/* Three copies: the keyframe shifts by exactly one copy, so the two
            remaining copies keep the strip full even on very wide screens. */}
        <div className="feedback" aria-label="Community feedback">
          <div className="feedback-track">
            {[...feedback, ...feedback, ...feedback].map((item, index) => (
              <figure className="feedback-card" key={`${item.handle}-${index}`} aria-hidden={index >= feedback.length}>
                <Poster id={item.id} alt="" />
                <figcaption><span>@{item.handle}</span><p>{item.text}</p></figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="contact wrap" id="contact">
        <div><p className="section-label">05 / Contact</p><h2>Let’s make<br />something <em>unforgettable.</em></h2><p>Ready to create? Let’s build your vision together and make it happen.</p><a href="mailto:thespillnetwork@gmail.com" className="contact-email">thespillnetwork@gmail.com <span>↗</span></a><a href="tel:+13059888463" className="phone">+1 305 988 8463</a></div>
        <form name="contact" method="POST" data-netlify="true" netlify-honeypot="bot-field" onSubmit={submit}>
          {status === "sent" ? <div className="form-success"><span>✓</span><h3>Message received.</h3><p>We’ll be in touch soon.</p></div> : <>
            <input type="hidden" name="form-name" value="contact" />
            <p className="form-hp" aria-hidden="true"><label>Leave this empty<input name="bot-field" tabIndex={-1} autoComplete="off" /></label></p>
            <label>Name<input required name="name" placeholder="Your name" /></label>
            <label>Email<input required type="email" name="email" placeholder="you@email.com" /></label>
            <label>Tell us about it<textarea required name="message" placeholder="Project, idea, or just say hello..." rows={4} /></label>
            {status === "error" && <p className="form-error" role="alert">Something went wrong sending that. Email <a href="mailto:thespillnetwork@gmail.com">thespillnetwork@gmail.com</a> and we’ll pick it up.</p>}
            <button type="submit" disabled={status === "sending"}>{status === "sending" ? "Sending…" : <>Send message <span>↗</span></>}</button>
          </>}
        </form>
      </section>

      <footer className="footer"><div className="wrap"><a href="#top" className="footer-mark">MED!A SP!LL</a><div><a href="https://instagram.com/mediaspill" target="_blank" rel="noreferrer">Instagram ↗</a><a href="mailto:thespillnetwork@gmail.com">Email ↗</a></div><p>© 2026 Media Spill Network</p></div></footer>
    </main>
  );
}
