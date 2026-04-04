import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import "./landing.css";

/* ─── Scroll animation hook ─── */
function useFadeUp() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("visible");
          obs.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

/* ─── Icons ─── */
function IconArrowRight({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  );
}

function IconCheck({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function IconChartLine({ className = "w-5 h-5" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-8 4 4 4-12" />
    </svg>
  );
}

function IconDatabase({ className = "w-5 h-5" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
      <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3" />
    </svg>
  );
}

function IconShield({ className = "w-5 h-5" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  );
}

function IconClock({ className = "w-5 h-5" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M12 7v5l3 3" />
    </svg>
  );
}

/* ─── Product mockup card ─── */
function ProductMockup() {
  return (
    <div className="bg-slate-900 rounded-xl border border-slate-700/60 p-5 card-glow w-full max-w-sm mx-auto lg:mx-0">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-xs font-mono text-slate-400 tracking-wide uppercase">Sentiment OS · Live</span>
        </div>
        <span className="text-[10px] text-slate-600 font-mono">Updated 2m ago</span>
      </div>

      <div className="mb-4 p-3 bg-slate-800/70 rounded-lg border border-slate-700/50">
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Verdict</div>
        <div className="flex items-center gap-2">
          <span className="text-cyan-400 font-bold text-base tracking-tight">iPhone leads</span>
          <span className="text-[10px] text-slate-500 bg-slate-700 px-1.5 py-0.5 rounded">+13% conf.</span>
        </div>
      </div>

      <div className="space-y-2.5 mb-4">
        <div>
          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
            <span className="text-cyan-400 font-medium">iPhone</span>
            <span>74% positive signal</span>
          </div>
          <div className="h-1.5 bg-slate-700/60 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400" style={{ width: "74%" }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
            <span className="text-lime-400 font-medium">Android</span>
            <span>61% positive signal</span>
          </div>
          <div className="h-1.5 bg-slate-700/60 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-lime-500 to-lime-400" style={{ width: "61%" }} />
          </div>
        </div>
      </div>

      <div className="mb-4">
        <svg viewBox="0 0 240 48" className="w-full h-10" preserveAspectRatio="none">
          <polyline
            fill="none"
            stroke="rgba(34,211,238,0.4)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points="0,38 30,30 60,34 90,22 120,18 150,24 180,16 210,20 240,14"
          />
          <polyline
            fill="none"
            stroke="rgba(132,204,22,0.4)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points="0,42 30,36 60,40 90,30 120,28 150,32 180,26 210,28 240,24"
          />
        </svg>
      </div>

      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-700/50">
        <div>
          <div className="text-base font-bold text-white font-mono">1,847</div>
          <div className="text-[10px] text-slate-500">iPhone posts</div>
        </div>
        <div>
          <div className="text-base font-bold text-white font-mono">1,203</div>
          <div className="text-[10px] text-slate-500">Android posts</div>
        </div>
        <div>
          <div className="text-base font-bold text-white font-mono">74%</div>
          <div className="text-[10px] text-slate-500">coverage</div>
        </div>
      </div>
    </div>
  );
}

/* ─── Navbar ─── */
function Navbar() {
  return (
    <nav className="nav-blur fixed top-0 left-0 right-0 z-50 border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 no-underline">
          <div className="w-7 h-7 rounded-md bg-slate-900 flex items-center justify-center flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <span className="font-bold text-slate-900 text-sm tracking-tight">Sentiment OS</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {["Product", "How it works", "API"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
              className="text-sm text-slate-600 no-underline transition-colors duration-150 hover:text-slate-900"
            >
              {item}
            </a>
          ))}
        </div>

        <Link
          to="/app"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-slate-900 no-underline px-4 py-2 rounded-lg transition-all duration-150 hover:bg-slate-700"
        >
          Open Dashboard
          <IconArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </nav>
  );
}

/* ─── Hero ─── */
function Hero() {
  return (
    <section className="bg-slate-950 hero-grid pt-28 pb-20 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-full mb-6 tracking-wide uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              Public sentiment intelligence
            </div>

            <h1 className="text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight mb-5">
              Real-time public sentiment.{" "}
              <span className="text-brand-400">Measured precisely.</span>
            </h1>

            <p className="text-base text-slate-400 leading-relaxed mb-8 max-w-lg">
              Sentiment OS ingests YouTube comments and X posts, scores them with Azure AI Language,
              and surfaces a statistically rigorous verdict on public opinion — automatically, in real time.
            </p>

            <div className="flex flex-wrap items-center gap-3 mb-10">
              <Link
                to="/app"
                className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-brand-600 no-underline px-5 py-2.5 rounded-lg transition-all duration-150 hover:bg-brand-500"
              >
                Open Dashboard
                <IconArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 no-underline transition-colors duration-150 hover:text-white"
              >
                See how it works
                <IconArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="flex flex-wrap gap-4">
              {["Wilson confidence intervals", "Azure AI Language scoring", "YouTube + X ingestion"].map((item) => (
                <div key={item} className="flex items-center gap-1.5 text-xs text-slate-500">
                  <IconCheck className="w-3.5 h-3.5 text-brand-500" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <ProductMockup />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Trust bar ─── */
function TrustBar() {
  return (
    <div className="bg-slate-50 border-b border-slate-200 py-4 px-6">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
        <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Powered by</span>
        {["Azure AI Language", "YouTube Data API", "X (Twitter) API"].map((name) => (
          <span key={name} className="text-xs font-semibold text-slate-500 tracking-tight">
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Features ─── */
const FEATURES = [
  {
    icon: IconShield,
    title: "Statistical precision",
    desc: "A verdict isn't declared until Wilson confidence intervals confirm a statistically significant gap in positive-sentiment rate. No false positives. No misleading raw counts.",
    detail: "95% confidence · Wilson CI",
  },
  {
    icon: IconDatabase,
    title: "Multi-source ingestion",
    desc: "Fetch YouTube comments or X posts on demand — or both simultaneously. Every post is cleaned, scored, and stored with full provenance metadata.",
    detail: "YouTube + X · Up to 2,000 posts",
  },
  {
    icon: IconChartLine,
    title: "Temporal intelligence",
    desc: "Hourly, daily, and weekly trend curves reveal how public sentiment shifts in response to product launches, reviews, and breaking news cycles.",
    detail: "Hourly · Daily · Weekly granularity",
  },
  {
    icon: IconClock,
    title: "Real-time verdict",
    desc: "The platform computes a winner the moment new data lands. Statistical comparison runs automatically — no manual analysis, no waiting for a report.",
    detail: "Sub-second verdict computation",
  },
];

function Features() {
  const ref = useFadeUp();
  return (
    <section id="product" className="py-20 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="fade-up" ref={ref}>
          <div className="text-center mb-12">
            <div className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-3">Platform</div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-4">
              Built for accuracy, not just aesthetics
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto text-base leading-relaxed">
              Every design decision in Sentiment OS prioritizes statistical validity over surface-level dashboarding.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc, detail }) => (
              <div
                key={title}
                className="feature-card bg-white border border-slate-200 rounded-xl p-6"
              >
                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center mb-4 text-slate-700">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-2 tracking-tight">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-3">{desc}</p>
                <div className="text-xs font-mono text-brand-600 bg-brand-50 px-2 py-1 rounded inline-block">
                  {detail}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── How it works ─── */
const STEPS = [
  {
    num: "01",
    title: "Define your query",
    desc: "Enter a search term and choose a source. YouTube for long-form opinion; X for real-time reactions. Filter by topic or device to narrow the dataset.",
  },
  {
    num: "02",
    title: "Ingest and score",
    desc: "The backend fetches up to 2,000 posts, strips noise, and sends each one through Azure AI Language. Sentiment probabilities are stored with full confidence metadata.",
  },
  {
    num: "03",
    title: "Read the statistical verdict",
    desc: "Wilson intervals are computed for both iPhone and Android signals. The platform declares a leader — or withholds judgment when the data is insufficient — with full confidence metrics.",
  },
];

function HowItWorks() {
  const ref = useFadeUp();
  return (
    <section id="how-it-works" className="py-20 px-6 bg-slate-50 border-y border-slate-200">
      <div className="max-w-6xl mx-auto">
        <div className="fade-up" ref={ref}>
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            <div className="lg:sticky lg:top-24">
              <div className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-3">Process</div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-4">
                From query to verdict in three steps
              </h2>
              <p className="text-slate-500 text-base leading-relaxed mb-6">
                The entire pipeline — from live social data to statistical conclusion — runs automatically,
                without requiring any manual configuration or analysis.
              </p>
              <Link
                to="/app"
                className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 no-underline hover:text-brand-700 transition-colors"
              >
                Try it in the dashboard
                <IconArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="flex flex-col gap-0">
              {STEPS.map((step, i) => (
                <div key={step.num} className={`relative flex gap-5 pb-8 ${i < STEPS.length - 1 ? "step-line" : ""}`}>
                  <div className="flex-shrink-0 w-9 h-9 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center z-10">
                    <span className="text-xs font-bold text-slate-400 font-mono">{step.num}</span>
                  </div>
                  <div className="pt-1">
                    <h3 className="text-sm font-bold text-slate-900 mb-1.5">{step.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Stats ─── */
const STATS = [
  { value: "2,000", label: "Posts per query", sub: "YouTube or X" },
  { value: "95%", label: "Confidence interval", sub: "Wilson CI" },
  { value: "<2s", label: "Azure AI scoring", sub: "Per post, real-time" },
  { value: "3", label: "Sentiment classes", sub: "Positive · Neutral · Negative" },
];

function Stats() {
  const ref = useFadeUp();
  return (
    <section className="py-20 px-6 bg-slate-900">
      <div className="max-w-6xl mx-auto fade-up" ref={ref}>
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-white tracking-tight mb-2">
            Designed around the numbers that matter
          </h2>
          <p className="text-slate-500 text-sm">
            Not vanity metrics. The specifics of how Sentiment OS handles your data.
          </p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-slate-700/40 rounded-xl overflow-hidden border border-slate-700/40">
          {STATS.map(({ value, label, sub }) => (
            <div key={label} className="bg-slate-900 p-6 lg:p-8">
              <div className="text-3xl lg:text-4xl font-bold text-white font-mono tracking-tight mb-1.5">
                {value}
              </div>
              <div className="text-sm font-semibold text-slate-300 mb-1">{label}</div>
              <div className="text-xs text-slate-500">{sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── API callout ─── */
function ApiSection() {
  const ref = useFadeUp();
  return (
    <section id="api" className="py-20 px-6 bg-white border-b border-slate-200">
      <div className="max-w-6xl mx-auto">
        <div className="fade-up" ref={ref}>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-3">Backend</div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-4">
                Azure-hosted. Production-ready.
              </h2>
              <p className="text-slate-500 text-base leading-relaxed mb-6">
                The Sentiment OS backend runs on Azure Functions with Azure AI Language scoring every post.
                Data is stored, tagged, and queryable — with confidence gating applied at the scoring layer.
              </p>
              <ul className="space-y-2.5">
                {[
                  "POST /ingest — trigger live YouTube or X ingestion",
                  "GET /recent — retrieve scored, filtered post sets",
                  "GET /topics — list available topic buckets",
                  "GET /health — check backend connectivity",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-slate-600">
                    <span className="text-brand-500 mt-0.5 flex-shrink-0">
                      <IconCheck className="w-4 h-4" />
                    </span>
                    <code className="text-xs bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                      {item}
                    </code>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-slate-800">
                {["bg-red-500", "bg-amber-400", "bg-emerald-400"].map((c) => (
                  <div key={c} className={`w-2.5 h-2.5 rounded-full ${c}`} />
                ))}
                <span className="text-xs text-slate-500 ml-2 font-mono">GET /recent</span>
              </div>
              <div className="p-5 font-mono text-xs leading-relaxed">
                <div className="text-slate-500">{"{"}</div>
                <div className="pl-4">
                  <span className="text-cyan-400">"decision"</span>
                  <span className="text-slate-400">: </span>
                  <span className="text-slate-500">{"{"}</span>
                </div>
                <div className="pl-8">
                  <span className="text-cyan-400">"label"</span>
                  <span className="text-slate-400">: </span>
                  <span className="text-lime-400">"iPhone"</span>
                  <span className="text-slate-500">,</span>
                </div>
                <div className="pl-8">
                  <span className="text-cyan-400">"detail"</span>
                  <span className="text-slate-400">: </span>
                  <span className="text-lime-400">"statistically higher positive-rate"</span>
                  <span className="text-slate-500">,</span>
                </div>
                <div className="pl-8">
                  <span className="text-cyan-400">"confidence"</span>
                  <span className="text-slate-400">: </span>
                  <span className="text-amber-400">0.137</span>
                </div>
                <div className="pl-4 text-slate-500">{"}"}<span className="text-slate-500">,</span></div>
                <div className="pl-4">
                  <span className="text-cyan-400">"rows"</span>
                  <span className="text-slate-400">: </span>
                  <span className="text-amber-400">1847</span>
                  <span className="text-slate-500">,</span>
                </div>
                <div className="pl-4">
                  <span className="text-cyan-400">"coverage"</span>
                  <span className="text-slate-400">: </span>
                  <span className="text-amber-400">0.74</span>
                </div>
                <div className="text-slate-500">{"}"}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── CTA ─── */
function CallToAction() {
  const ref = useFadeUp();
  return (
    <section className="py-24 px-6 bg-slate-950">
      <div className="max-w-2xl mx-auto text-center fade-up" ref={ref}>
        <h2 className="text-3xl lg:text-4xl font-bold text-white tracking-tight mb-4">
          Start measuring public opinion today
        </h2>
        <p className="text-slate-400 text-base leading-relaxed mb-8">
          Open the dashboard and run your first sentiment analysis in under a minute.
          No setup required — the pipeline is ready.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            to="/app"
            className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-brand-600 no-underline px-6 py-3 rounded-lg transition-all duration-150 hover:bg-brand-500"
          >
            Open Dashboard
            <IconArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 bg-slate-800 no-underline px-5 py-3 rounded-lg transition-all duration-150 hover:bg-slate-700 hover:text-white border border-slate-700"
          >
            How it works
          </a>
        </div>
        <p className="text-xs text-slate-600 mt-6">
          Powered by Azure AI Language · Data from YouTube and X
        </p>
      </div>
    </section>
  );
}

/* ─── Footer ─── */
function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-slate-950 border-t border-slate-800 px-6 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <span className="text-sm font-bold text-white">Sentiment OS</span>
            </div>
            <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
              Real-time public opinion intelligence for iPhone vs. Android, powered by Azure AI Language.
            </p>
          </div>

          <div className="flex gap-12">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Product</div>
              <ul className="space-y-2">
                {[
                  { label: "Dashboard", href: "/app" },
                  { label: "How it works", href: "#how-it-works" },
                  { label: "API", href: "#api" },
                ].map(({ label, href }) => (
                  <li key={label}>
                    {href.startsWith("/") ? (
                      <Link to={href} className="text-xs text-slate-400 no-underline hover:text-white transition-colors duration-150">
                        {label}
                      </Link>
                    ) : (
                      <a href={href} className="text-xs text-slate-400 no-underline hover:text-white transition-colors duration-150">
                        {label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Platform</div>
              <ul className="space-y-2">
                {["Azure AI Language", "YouTube API", "X API"].map((name) => (
                  <li key={name}>
                    <span className="text-xs text-slate-500">{name}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-6 border-t border-slate-800">
          <p className="text-xs text-slate-600">
            &copy; {new Date().getFullYear()} Sentiment OS. All rights reserved.
          </p>
          <p className="text-xs text-slate-600">
            iPhone vs. Android · Public opinion measured in real time
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ─── Page ─── */
export default function Landing() {
  return (
    <div className="landing-root">
      <Navbar />
      <Hero />
      <TrustBar />
      <Features />
      <HowItWorks />
      <Stats />
      <ApiSection />
      <CallToAction />
      <Footer />
    </div>
  );
}