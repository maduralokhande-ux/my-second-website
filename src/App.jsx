import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);
const Scene = lazy(() => import("./Scene.jsx"));
const OK = "(prefers-reduced-motion: no-preference)";

/* Letter-by-letter text: every letter sits in a mask so it can slide up into view */
const Split = ({ text }) => (
  <span className="split" aria-label={text}>
    {text.split(" ").map((w, i) => (
      <span key={i} aria-hidden="true">
        {i > 0 && " "}
        <span className="w">{[...w].map((c, j) => <span className="m" key={j}><span className="ch">{c}</span></span>)}</span>
      </span>
    ))}
  </span>
);
const Words = ({ text }) => text.split(" ").map((w, i) => <span key={i}><span className="wd">{w}</span> </span>);

function Mag({ href, children, className = "btn", ...p }) {
  const r = useRef();
  const move = (e) => { const b = r.current.getBoundingClientRect(); gsap.to(r.current, { x: (e.clientX - b.left - b.width / 2) * 0.35, y: (e.clientY - b.top - b.height / 2) * 0.35, duration: 0.4 }); };
  const leave = () => gsap.to(r.current, { x: 0, y: 0, duration: 0.8, ease: "elastic.out(1,.4)" });
  return <a ref={r} href={href} className={className} data-hover onPointerMove={move} onPointerLeave={leave} {...p}>{children}</a>;
}

function Cursor() {
  const d = useRef();
  useEffect(() => {
    if (matchMedia("(pointer: coarse)").matches) return;
    const x = gsap.quickTo(d.current, "x", { duration: 0.25 }), y = gsap.quickTo(d.current, "y", { duration: 0.25 });
    const mv = (e) => { x(e.clientX); y(e.clientY); };
    const ov = (e) => d.current.classList.toggle("big", !!e.target.closest?.("[data-hover],a,button"));
    addEventListener("pointermove", mv); addEventListener("pointerover", ov);
    return () => { removeEventListener("pointermove", mv); removeEventListener("pointerover", ov); };
  }, []);
  return <div ref={d} className="cursor" aria-hidden="true" />;
}

function Intro({ onReveal, onDone }) {
  const root = useRef(), count = useRef();
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      if (!matchMedia(OK).matches) { onReveal(); onDone(); return; }
      const n = { v: 0 };
      gsap.timeline({ onComplete: onDone })
        .from(".in-ch", { yPercent: 115, stagger: 0.05, duration: 0.8, ease: "power4.out" })
        .to(n, { v: 100, duration: 1.5, ease: "power2.inOut", onUpdate: () => (count.current.textContent = String(Math.round(n.v)).padStart(3, "0")) }, 0)
        .to(".in-ch", { yPercent: -115, stagger: 0.03, duration: 0.5, ease: "power3.in" }, ">0.15")
        .call(onReveal)
        .to(root.current, { clipPath: "inset(0 0 100% 0)", duration: 1, ease: "power4.inOut" }, "<");
    }, root);
    return () => ctx.revert();
  }, []);
  return (
    <div ref={root} className="intro" aria-hidden="true">
      <div className="in-word">{[..."MOTIONVERSE"].map((c, i) => <span className="m" key={i}><span className="in-ch">{c}</span></span>)}</div>
      <div className="in-count"><span ref={count}>000</span>%</div>
    </div>
  );
}

const experiments = [
  ["01", "Orbit", "o-orbit"], ["02", "Morph", "o-morph"], ["03", "Stripes", "o-stripes"], ["04", "Pulse", "o-pulse"],
];
const gallery = [["Neon Drift", "g1"], ["Void Bloom", "g2"], ["Static Dream", "g3"], ["Prism Rain", "g4"], ["Afterglow", "g5"]];

export default function App() {
  const [ready, setReady] = useState(false);
  const [gone, setGone] = useState(false);
  const orbs = useRef(), play = useRef(), turb = useRef(), disp = useRef();

  useEffect(() => { document.body.classList.toggle("lock", !gone); if (gone) ScrollTrigger.refresh(); }, [gone]);

  /* hero: hide letters before first paint, play once the intro curtain lifts */
  useLayoutEffect(() => {
    const mm = gsap.matchMedia();
    mm.add(OK, () => { gsap.set(".hero .ch", { yPercent: 115 }); gsap.set(".hero .fade", { opacity: 0, y: 24 }); });
    return () => mm.revert();
  }, []);
  useEffect(() => {
    if (!ready) return;
    const mm = gsap.matchMedia();
    mm.add(OK, () => {
      gsap.to(".hero .ch", { yPercent: 0, stagger: 0.04, duration: 1.2, ease: "power4.out" });
      gsap.to(".hero .fade", { opacity: 1, y: 0, stagger: 0.15, delay: 0.7, duration: 0.9, ease: "power3.out" });
    });
    return () => mm.revert();
  }, [ready]);

  /* scroll experience */
  useLayoutEffect(() => {
    const mm = gsap.matchMedia();
    mm.add(OK, () => {
      const st = (trigger, extra = {}) => ({ trigger, start: "top bottom", end: "bottom top", scrub: 0.6, ...extra });
      gsap.to(".r1", { xPercent: -30, ease: "none", scrollTrigger: st(".kin") });
      gsap.fromTo(".r2", { xPercent: -30 }, { xPercent: 0, ease: "none", scrollTrigger: st(".kin") });
      gsap.fromTo(".stmt .wd", { opacity: 0.12 }, { opacity: 1, stagger: 0.1, ease: "none", scrollTrigger: { trigger: ".stmt", start: "top 80%", end: "bottom 55%", scrub: true } });

      gsap.from(".uni .ch", { yPercent: 115, stagger: 0.04, duration: 1, ease: "power4.out", scrollTrigger: { trigger: ".uni", start: "top 65%" } });
      gsap.utils.toArray("[data-speed]").forEach((el) => gsap.to(el, { y: -parseFloat(el.dataset.speed) * 140, ease: "none", scrollTrigger: st(".uni") }));

      gsap.utils.toArray(".tile").forEach((t) => {
        gsap.fromTo(t, { clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)", duration: 1.2, ease: "power4.out", scrollTrigger: { trigger: t, start: "top 88%" } });
        gsap.fromTo(t.querySelector(".art"), { yPercent: -10 }, { yPercent: 10, ease: "none", scrollTrigger: st(t) });
      });

      gsap.from(".fin .ch", { yPercent: 115, opacity: 0, stagger: 0.03, ease: "none", scrollTrigger: { trigger: ".fin", start: "top 60%", end: "center center", scrub: true } });
      gsap.fromTo(".fin-glow", { scale: 0.2, opacity: 0.2 }, { scale: 1.4, opacity: 1, ease: "none", scrollTrigger: { trigger: ".fin", start: "top bottom", end: "center center", scrub: true } });
    });
    mm.add(`(min-width: 900px) and ${OK}`, () => {
      const track = document.querySelector(".track");
      gsap.to(track, { x: () => -(track.scrollWidth - innerWidth), ease: "none", scrollTrigger: { trigger: ".exp", pin: true, scrub: 0.6, invalidateOnRefresh: true, end: () => "+=" + (track.scrollWidth - innerWidth) } });
    });
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    return () => mm.revert();
  }, []);

  /* text distortion (SVG turbulence + displacement) */
  const warp = (on) => {
    const s = { f: on ? 0 : 0.03, d: on ? 0 : 70 };
    gsap.to(s, { f: on ? 0.03 : 0, d: on ? 70 : 0, duration: 0.7, ease: "power2.out", onUpdate: () => { turb.current.setAttribute("baseFrequency", `${s.f} ${s.f * 3}`); disp.current.setAttribute("scale", s.d); } });
  };

  /* playground: spotlight + spawn glowing orbs */
  const spot = (e) => { const b = play.current.getBoundingClientRect(); play.current.style.setProperty("--x", e.clientX - b.left + "px"); play.current.style.setProperty("--y", e.clientY - b.top + "px"); };
  const spawn = (e) => {
    const b = play.current.getBoundingClientRect();
    const o = document.createElement("i"); o.className = "orb";
    const c = ["#c6ff3d", "#8b5cf6", "#f2efe6", "#ff5fd2"][Math.floor(Math.random() * 4)];
    o.style.cssText = `left:${e.clientX - b.left}px;top:${e.clientY - b.top}px;background:${c};box-shadow:0 0 40px 10px ${c}`;
    play.current.appendChild(o);
    orbs.current.textContent = String(+orbs.current.textContent + 1).padStart(2, "0");
    gsap.timeline({ onComplete: () => o.remove() })
      .fromTo(o, { scale: 0 }, { scale: gsap.utils.random(0.6, 2), duration: 0.5, ease: "back.out(3)" })
      .to(o, { x: gsap.utils.random(-120, 120), y: gsap.utils.random(-260, -120), opacity: 0, duration: 2, ease: "power2.out" }, 0.2);
  };

  return (
    <>
      <Cursor />
      {!gone && <Intro onReveal={() => setReady(true)} onDone={() => setGone(true)} />}
      <svg width="0" height="0" aria-hidden="true"><filter id="warp"><feTurbulence ref={turb} type="fractalNoise" baseFrequency="0 0" numOctaves="2" /><feDisplacementMap ref={disp} in="SourceGraphic" scale="0" /></filter></svg>

      <nav className="nav">
        <a href="#top" data-hover>MV®</a>
        <div>{["universe", "experiments", "playground", "gallery"].map((s) => <a key={s} href={`#${s}`} data-hover>{s}</a>)}</div>
      </nav>

      <main id="top">
        {/* ---------- HERO ---------- */}
        <section className="hero">
          <Suspense fallback={null}><Scene /></Suspense>
          <div className="hero-copy">
            <p className="fade eyebrow">An Interactive Digital Experience</p>
            <h1><span className="h-sm"><Split text="WELCOME TO" /></span><span className="h-lg"><Split text="MOTIONVERSE" /></span></h1>
            <p className="fade shimmer">BEYOND THE ORDINARY</p>
            <Mag className="btn fade" href="#universe">Enter the universe ↓</Mag>
          </div>
          <div className="fade scroll-cue" aria-hidden="true"><i /></div>
        </section>

        {/* ---------- KINETIC TYPE ---------- */}
        <section className="kin" aria-label="Kinetic typography">
          <div className="row r1">{Array(4).fill("MOTION ✦ LIGHT ✦ DEPTH ✦ RHYTHM ✦ ").join("")}</div>
          <div className="row r2 outline">{Array(4).fill("FEEL ✦ EVERY ✦ PIXEL ✦ MOVE ✦ ").join("")}</div>
          <p className="stmt"><Words text="We turn pixels into feeling. Every scroll is a scene, every cursor a camera, every click a spark of light." /></p>
          <h2 className="warp" data-hover onPointerEnter={() => warp(true)} onPointerLeave={() => warp(false)}>WARP&nbsp;ME</h2>
        </section>

        {/* ---------- DIGITAL UNIVERSE ---------- */}
        <section className="uni" id="universe">
          <div className="sun" data-speed="0.3" />
          <div className="ring r-a" data-speed="0.5"><i /></div>
          <div className="ring r-b" data-speed="0.9"><i /></div>
          <div className="ring r-c" data-speed="0.2"><i /></div>
          <div className="uni-copy">
            <p className="eyebrow">01 — Digital Universe</p>
            <h2><Split text="DIGITAL" /><br /><Split text="UNIVERSE" /></h2>
            <p>A weightless space built from light, code and motion. Scroll and watch the layers drift at their own speed.</p>
          </div>
        </section>

        {/* ---------- MOTION EXPERIMENTS (horizontal) ---------- */}
        <section className="exp" id="experiments">
          <div className="exp-head"><p className="eyebrow">02 — Motion Experiments</p><p className="hint">scroll → drag →</p></div>
          <div className="track">
            <div className="panel intro-panel"><h2>MOTION<br />EXPERI<br />MENTS</h2></div>
            {experiments.map(([n, t, c]) => (
              <div className="panel" key={n}><span className="num">{n}</span><div className={`lab ${c}`}><i /><i /><i /></div><h3>{t}</h3></div>
            ))}
          </div>
        </section>

        {/* ---------- PLAYGROUND ---------- */}
        <section className="play" id="playground">
          <p className="eyebrow">03 — Interactive Playground</p>
          <div ref={play} className="arena" data-hover onPointerMove={spot} onPointerDown={spawn} role="img" aria-label="Interactive area: click or tap to spawn glowing orbs">
            <span className="arena-hint">TAP · CLICK · HOLD<br />TO SPAWN LIGHT</span>
            <span className="arena-count">ORBS <b ref={orbs}>00</b></span>
          </div>
        </section>

        {/* ---------- GALLERY ---------- */}
        <section className="gal" id="gallery">
          <p className="eyebrow">04 — Creative Gallery</p>
          <div className="grid">
            {gallery.map(([t, g], i) => (
              <figure className={`tile t${i + 1}`} key={t} data-hover
                onPointerMove={(e) => { const b = e.currentTarget.getBoundingClientRect(); gsap.to(e.currentTarget.firstChild, { rotateY: ((e.clientX - b.left) / b.width - 0.5) * 10, rotateX: -((e.clientY - b.top) / b.height - 0.5) * 10, duration: 0.4 }); }}
                onPointerLeave={(e) => gsap.to(e.currentTarget.firstChild, { rotateX: 0, rotateY: 0, duration: 0.7 })}>
                <div className="tilt"><div className={`art ${g}`} /><figcaption>0{i + 1} — {t}</figcaption></div>
              </figure>
            ))}
          </div>
        </section>

        {/* ---------- FINAL ---------- */}
        <section className="fin">
          <div className="fin-glow" aria-hidden="true" />
          <p className="eyebrow">05 — Final Experience</p>
          <h2 aria-label="The internet is your canvas.">
            <span><Split text="THE INTERNET" /></span><span><Split text="IS YOUR" /></span><span className="lime"><Split text="CANVAS." /></span>
          </h2>
          <Mag href="#top" className="btn big">Start again ↑</Mag>
        </section>
      </main>
      <footer className="foot">MOTIONVERSE © {new Date().getFullYear()} — Built with React, GSAP &amp; Three.js</footer>
    </>
  );
}
