// src/App.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { fetchRecent, fetchTopics, apiUrl, youtubeSearchSync, twitterSearchSync } from "./api";
import "./styles.css";

/* ----------------------------
   SVG Icons
---------------------------- */

function IconPhone({ size = 28, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  );
}

function IconAndroid({ size = 28, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 18V10a6 6 0 0 1 12 0v8" />
      <rect x="4" y="12" width="2" height="5" rx="1" />
      <rect x="18" y="12" width="2" height="5" rx="1" />
      <circle cx="9" cy="10" r="0.8" fill={color} stroke="none" />
      <circle cx="15" cy="10" r="0.8" fill={color} stroke="none" />
      <line x1="8" y1="3" x2="6" y2="1" />
      <line x1="16" y1="3" x2="18" y2="1" />
    </svg>
  );
}

function IconMagnifier({ size = 28, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function IconPulse({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

/* ----------------------------
   UI bits
---------------------------- */

function SentimentTag({ label }) {
  const l = (label || "").toLowerCase();
  return (
    <span className={`sentimentTag sentimentTag--${l}`}>
      {label || "n/a"}
    </span>
  );
}

function fmt(n) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return Number(n).toFixed(2);
}

function fmtPct(n) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return `${Math.round(Number(n) * 100)}%`;
}

function fmtTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

/* ----------------------------
   Device classifier
---------------------------- */

function classifyDevice(text = "") {
  const t = text.toLowerCase();
  const apple =
    /\b(iphone|ios|imessage|facetime|airdrop|apple\s?pay|apple|macbook|ipad|watch\s?os|airpods)\b/.test(t);
  const android =
    /\b(android|pixel|galaxy|samsung|oneplus|motorola|xiaomi|play\s?store|google\s?pay|wear\s?os)\b/.test(t);
  if (apple && !android) return "iphone";
  if (android && !apple) return "android";
  if (apple && android) return "both";
  return "neither";
}

function labelForBucket(b) {
  if (b === "iphone") return "iPhone";
  if (b === "android") return "Android";
  if (b === "both") return "Both";
  return "Other";
}

/* ----------------------------
   Confidence policy
---------------------------- */

const MIN_MARGIN = (() => {
  const raw = import.meta.env.VITE_SENTIMENT_MIN_MARGIN;
  const n = raw == null ? NaN : Number(raw);
  return Number.isFinite(n) ? n : 0.05;
})();

function clamp01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function getScores(row) {
  const ai = row?.sentiment?.azure_ai || {};
  const raw = ai?.scores;
  const label = String(ai?.label || "").toLowerCase();
  const labelNorm =
    label === "positive" || label === "negative" || label === "neutral"
      ? label
      : "neutral";

  let p = 0, neu = 0, neg = 0;
  if (raw && typeof raw === "object") {
    p = clamp01(raw.positive);
    neu = clamp01(raw.neutral);
    neg = clamp01(raw.negative);
  }

  let s = p + neu + neg;
  if (s <= 0) {
    if (labelNorm === "positive") { p = 0.7; neu = 0.3; neg = 0.0; }
    else if (labelNorm === "negative") { p = 0.0; neu = 0.3; neg = 0.7; }
    else { p = 0.15; neu = 0.7; neg = 0.15; }
    s = p + neu + neg;
  }

  if (s <= 0) return { positive: 0, neutral: 1, negative: 0 };
  return { positive: p / s, neutral: neu / s, negative: neg / s };
}

function stableLabelFromScores(scores) {
  const p = Number(scores?.positive ?? 0);
  const n = Number(scores?.negative ?? 0);
  if (!Number.isFinite(p) || !Number.isFinite(n)) return "neutral";
  if (Math.abs(p - n) < MIN_MARGIN) return "neutral";
  return p > n ? "positive" : "negative";
}

/* ----------------------------
   Summaries
---------------------------- */

function summarizeMix(rows) {
  let pos = 0, neu = 0, neg = 0;
  let lastIngest = null;
  for (const r of rows) {
    if (r?.scored_at) {
      const d = new Date(r.scored_at);
      if (!Number.isNaN(d.getTime())) {
        if (!lastIngest || d > lastIngest) lastIngest = d;
      }
    }
    const scores = getScores(r);
    const label = stableLabelFromScores(scores);
    if (label === "positive") pos++;
    else if (label === "negative") neg++;
    else neu++;
  }
  return { total: rows.length, pos, neu, neg, lastIngest };
}

function summarizeSignal(rows) {
  const mix = summarizeMix(rows);
  const signal = mix.pos + mix.neg;
  const netSignal = signal ? (mix.pos - mix.neg) / signal : null;
  return { ...mix, signal, netSignal };
}

function wilsonInterval(pos, neg, z = 1.96) {
  const n = pos + neg;
  if (!n) return { lb: null, ub: null, phat: null, n: 0 };
  const phat = pos / n;
  const z2 = z * z;
  const denom = 1 + z2 / n;
  const center = phat + z2 / (2 * n);
  const adj = z * Math.sqrt((phat * (1 - phat) + z2 / (4 * n)) / n);
  return { lb: (center - adj) / denom, ub: (center + adj) / denom, phat, n };
}

function topTermsWithSentiment(rows, limit = 10) {
  const stop = new Set([
    "the","a","an","and","or","but","to","of","in","on","for","is","it","this","that","with","as","at","by","be","are","was","were",
    "from","you","your","they","them","their","we","our","i","me","my","just","like","have","has","had","not","dont","does","did","can",
    "could","should","would",
  ]);
  const counts = new Map();
  for (const r of rows) {
    const label = stableLabelFromScores(getScores(r));
    const t = (r?.clean_text || "").toLowerCase();
    const words = t.split(/[^a-z0-9]+/g);
    const seen = new Set();
    for (const w of words) {
      if (!w || w.length < 4 || stop.has(w) || seen.has(w)) continue;
      seen.add(w);
      if (!counts.has(w)) counts.set(w, { total: 0, pos: 0, neg: 0 });
      const c = counts.get(w);
      c.total++;
      if (label === "positive") c.pos++;
      else if (label === "negative") c.neg++;
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, limit)
    .map(([word, c]) => {
      const sig = c.pos + c.neg;
      const tone = sig < 3 ? "neu" : c.pos / sig > 0.60 ? "pos" : c.pos / sig < 0.40 ? "neg" : "neu";
      return [word, c.total, tone];
    });
}

function useCountUp(target, duration = 700) {
  const [display, setDisplay] = useState(target);
  const rafRef = useRef(null);
  const prevRef = useRef(target);
  useEffect(() => {
    const from = prevRef.current;
    if (from === target) { setDisplay(target); return; }
    prevRef.current = target;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (target - from) * eased));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);
  return display;
}

function useRelativeTime(date) {
  const [text, setText] = useState("");
  useEffect(() => {
    if (!date) { setText(""); return; }
    const update = () => {
      const s = Math.floor((Date.now() - date.getTime()) / 1000);
      if (s < 10) setText("just now");
      else if (s < 60) setText(`${s}s ago`);
      else setText(`${Math.floor(s / 60)}m ago`);
    };
    update();
    const id = setInterval(update, 10000);
    return () => clearInterval(id);
  }, [date]);
  return text;
}

function useSectionObserver() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { el.classList.add("is-visible"); obs.disconnect(); }
      },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

/* ----------------------------
   Trend chart
---------------------------- */

function toDateSafe(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatBucketLabel(key, granularity, prevKey) {
  if (granularity === "hour") {
    const hh = key.slice(11, 13);
    const day = key.slice(0, 10);
    const prevDay = prevKey ? prevKey.slice(0, 10) : null;
    if (!prevKey || day !== prevDay) {
      return `${key.slice(5, 7)}/${key.slice(8, 10)} ${hh}h`;
    }
    return `${hh}:00`;
  }
  return `${key.slice(5, 7)}/${key.slice(8, 10)}`;
}

function smoothLinePath(pts) {
  if (!pts.length) return "";
  if (pts.length === 1) return `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  if (pts.length === 2) {
    return `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)} L ${pts[1][0].toFixed(1)} ${pts[1][1].toFixed(1)}`;
  }
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  const t = 0.25;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const cp1x = p1[0] + (p2[0] - p0[0]) * t;
    const cp1y = p1[1] + (p2[1] - p0[1]) * t;
    const cp2x = p2[0] - (p3[0] - p1[0]) * t;
    const cp2y = p2[1] - (p3[1] - p1[1]) * t;
    d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

function TrendChart({ series, granularity = "day" }) {
  const W = 900, H = 220, PL = 38, PR = 12, PT = 12, PB = 26;
  const allPoints = series.flatMap((s) => s.points);
  if (!allPoints.length) {
    return (
      <div className="trendEmpty">
        <IconPulse size={32} color="var(--muted2)" />
        <span>No trend data yet — run a search to populate</span>
      </div>
    );
  }

  const xKeys = Array.from(new Set(allPoints.map((p) => p.xKey))).sort();
  const xIndex = new Map(xKeys.map((k, i) => [k, i]));
  const plotW = W - PL - PR;
  const plotH = H - PT - PB;
  const xs = (i) => xKeys.length === 1 ? PL + plotW / 2 : PL + (i * plotW) / (xKeys.length - 1);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const ys = (y) => PT + (1 - (clamp(y, -1, 1) + 1) / 2) * plotH;
  const gridLines = [-1, -0.5, 0, 0.5, 1];
  const buildPts = (points) =>
    points.filter((p) => xIndex.has(p.xKey) && p.y != null).map((p) => [xs(xIndex.get(p.xKey)), ys(p.y)]);

  const labelCount = Math.min(9, xKeys.length);
  const labelEvery = Math.max(1, Math.floor(xKeys.length / labelCount));
  const visibleLabelIdxs = new Set(
    xKeys.map((_, i) => i).filter((i) => i % labelEvery === 0 || i === xKeys.length - 1)
  );

  return (
    <div className="trendWrap">
      <div className="trendHeader">
        <div className="trendTitle">Sentiment Trend</div>
        <div className="trendSub">
          Net signal = (pos − neg) / (pos + neg) per{" "}
          {granularity === "hour" ? "hour" : granularity === "week" ? "week" : "day"} · min 3 posts/bucket
        </div>
        <div className="trendLegend">
          {series.map((s) => (
            <span key={s.name} className={`legendChip legendChip--${s.tone}`}>
              <span className={`legendDot legendDot--${s.tone}`} />
              {s.name}
            </span>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="trendSvg" role="img" aria-label="Sentiment trend chart">
        {gridLines.map((g) => (
          <g key={g}>
            <line x1={PL} x2={W - PR} y1={ys(g)} y2={ys(g)} className={g === 0 ? "gridLine gridLine--mid" : "gridLine"} />
            <text x={PL - 5} y={ys(g) + 4} textAnchor="end" className="gridLabel">{g.toFixed(1)}</text>
          </g>
        ))}
        {series.map((s) => {
          const pts = buildPts(s.points);
          if (!pts.length) return null;
          if (pts.length === 1) {
            return (
              <g key={s.name}>
                <line x1={PL} x2={W - PR} y1={pts[0][1]} y2={pts[0][1]} className="gridLine" strokeDasharray="4 4" />
                <circle cx={pts[0][0]} cy={pts[0][1]} r={4} className={`trendDot trendDot--${s.tone}`} />
              </g>
            );
          }
          return (
            <g key={s.name}>
              <path d={smoothLinePath(pts)} className={`trendLine trendLine--${s.tone}`} fill="none" />
              {pts.map(([px, py], di) => (
                <circle key={di} cx={px} cy={py} r={3} className={`trendDot trendDot--${s.tone}`} />
              ))}
            </g>
          );
        })}
        {xKeys.map((k, idx) => {
          if (!visibleLabelIdxs.has(idx)) return null;
          const prevVisIdx = [...visibleLabelIdxs].filter((i) => i < idx).pop();
          const prevKey = prevVisIdx != null ? xKeys[prevVisIdx] : null;
          return (
            <text key={k} x={xs(idx)} y={H - 5} textAnchor="middle" className="xLabel">
              {formatBucketLabel(k, granularity, prevKey)}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

/* ----------------------------
   Donut chart
---------------------------- */

function polarXY(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

function donutArc(cx, cy, R, r, startDeg, endDeg) {
  const span = endDeg - startDeg;
  if (span <= 0) return "";
  const end = span >= 360 ? startDeg + 359.9 : endDeg;
  const [x1, y1] = polarXY(cx, cy, R, startDeg);
  const [x2, y2] = polarXY(cx, cy, R, end);
  const [ix1, iy1] = polarXY(cx, cy, r, end);
  const [ix2, iy2] = polarXY(cx, cy, r, startDeg);
  const large = span > 180 ? 1 : 0;
  return `M ${x1.toFixed(2)},${y1.toFixed(2)} A ${R},${R} 0 ${large} 1 ${x2.toFixed(2)},${y2.toFixed(2)} L ${ix1.toFixed(2)},${iy1.toFixed(2)} A ${r},${r} 0 ${large} 0 ${ix2.toFixed(2)},${iy2.toFixed(2)} Z`;
}

function DonutChart({ label, pos, neu, neg, compact = false }) {
  const sz = compact ? 120 : 180;
  const W = sz, H = sz, cx = sz / 2, cy = sz / 2;
  const R = compact ? 44 : 68;
  const r = compact ? 28 : 44;
  const total = pos + neu + neg;

  if (!total) {
    return (
      <div className="donutWrap">
        {label && <div className="donutTitle">{label}</div>}
        <div className="donutEmpty">No data yet</div>
      </div>
    );
  }

  const pPct = pos / total;
  const neuPct = neu / total;
  const negPct = neg / total;
  const posEnd = pPct * 360;
  const neuEnd = posEnd + neuPct * 360;
  const dominant = pos >= neg && pos >= neu ? "positive" : neg >= pos && neg >= neu ? "negative" : "neutral";
  const domPct = dominant === "positive" ? pPct : dominant === "negative" ? negPct : neuPct;

  const segments = [
    { key: "pos", start: 0, end: posEnd, cls: "donutSeg--pos" },
    { key: "neu", start: posEnd, end: neuEnd, cls: "donutSeg--neu" },
    { key: "neg", start: neuEnd, end: 360, cls: "donutSeg--neg" },
  ];

  return (
    <div className="donutWrap">
      {label && <div className="donutTitle">{label}</div>}
      <svg viewBox={`0 0 ${W} ${H}`} className="donutSvg">
        {segments.map((s) =>
          (s.end - s.start) > 0.5 ? (
            <path key={s.key} d={donutArc(cx, cy, R, r, s.start, s.end)} className={`donutSeg ${s.cls}`} />
          ) : null
        )}
        <text x={cx} y={cy - 6} className="donutCenterBig" textAnchor="middle">
          {Math.round(domPct * 100)}%
        </text>
        <text x={cx} y={cy + 14} className="donutCenterSub" textAnchor="middle">
          {dominant}
        </text>
      </svg>
      {!compact && (
        <div className="donutLegend">
          <span className="donutLegItem donutLegItem--pos">{Math.round(pPct * 100)}% pos</span>
          <span className="donutLegItem donutLegItem--neu">{Math.round(neuPct * 100)}% neu</span>
          <span className="donutLegItem donutLegItem--neg">{Math.round(negPct * 100)}% neg</span>
        </div>
      )}
    </div>
  );
}

function getPageNums(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total]);
  for (let i = Math.max(1, current - 1); i <= Math.min(total, current + 1); i++) pages.add(i);
  const sorted = [...pages].sort((a, b) => a - b);
  const result = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) result.push("...");
    result.push(p);
    prev = p;
  }
  return result;
}

/* ----------------------------
   App
---------------------------- */

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

export default function Dashboard() {
  const [apiStatus, setApiStatus] = useState("checking");
  const [lastCheck, setLastCheck] = useState(null);

  const [topics, setTopics] = useState([]);
  const [topic, setTopic] = useState("");
  const [limit, setLimit] = useState(2000);
  const [query, setQuery] = useState("");
  const [deviceFilter, setDeviceFilter] = useState("any");
  const [source, setSource] = useState("youtube");

  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadPhase, setLoadPhase] = useState("");
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const [tablePage, setTablePage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sentFilter, setSentFilter] = useState("all");

  const sectionHero  = useSectionObserver();
  const sectionSide  = useSectionObserver();
  const sectionIpie  = useSectionObserver();
  const sectionApie  = useSectionObserver();
  const sectionTable = useSectionObserver();

  async function checkHealth() {
    try {
      const res = await fetch(apiUrl("/health"), { cache: "no-store" });
      setApiStatus(res.ok ? "online" : "degraded");
    } catch {
      setApiStatus("offline");
    } finally {
      setLastCheck(new Date());
    }
  }

  async function load({ silent = false, dbOnly = false } = {}) {
    if (!silent) setErr("");
    setLoading(true);
    const qText = query.trim();
    const doIngest = Boolean(qText) && !dbOnly;

    try {
      if (doIngest) {
        if (source === "youtube") {
          setLoadPhase("Searching YouTube…");
          const ytData = await youtubeSearchSync({ topic: topic || "demo", query: qText, max_videos: 5, comments_per_video: 200 });
          setRows(Array.isArray(ytData) ? ytData : []);
          setTablePage(1); setLastRefreshed(new Date()); setApiStatus("online"); setLastCheck(new Date());
          return;
        }
        if (source === "twitter") {
          setLoadPhase("Fetching from X / Twitter…");
          const twitterData = await twitterSearchSync({ topic: topic || "demo", query: qText, max_results: 100 });
          setRows(Array.isArray(twitterData) ? twitterData : []);
          setTablePage(1); setLastRefreshed(new Date()); setApiStatus("online"); setLastCheck(new Date());
          return;
        }
        if (source === "both") {
          setLoadPhase("Searching YouTube + X…");
          const [ytData, twitterData] = await Promise.all([
            youtubeSearchSync({ topic: topic || "demo", query: qText, max_videos: 5, comments_per_video: 200 }),
            twitterSearchSync({ topic: topic || "demo", query: qText, max_results: 100 }),
          ]);
          const combined = [...(Array.isArray(ytData) ? ytData : []), ...(Array.isArray(twitterData) ? twitterData : [])];
          setRows(combined);
          setTablePage(1); setLastRefreshed(new Date()); setApiStatus("online"); setLastCheck(new Date());
          return;
        }
      }

      setLoadPhase("Loading data…");
      const ingestStart = doIngest ? Date.now() - 2000 : null;
      let data = [];

      for (let attempt = 0; attempt < 5; attempt++) {
        if (attempt > 0) { setLoadPhase(`Waiting for scoring… (${attempt}/4)`); await sleep(800); }
        data = await fetchRecent({
          topic: topic || undefined,
          limit,
          q: qText || undefined,
          device: deviceFilter !== "any" ? deviceFilter : undefined,
          backfill: attempt === 0,
          min_margin: MIN_MARGIN,
        });
        if (!Array.isArray(data)) { data = []; break; }
        if (!ingestStart) { if (data.length > 0) break; continue; }
        const hasNew = data.some((r) => {
          const t = r?.scored_at ? new Date(r.scored_at).getTime() : 0;
          return t >= ingestStart;
        });
        if (hasNew) break;
      }

      setRows(data);
      setTablePage(1); setLastRefreshed(new Date()); setApiStatus("online"); setLastCheck(new Date());
    } catch (e) {
      if (!silent) setErr(e?.message || "Request failed");
      setApiStatus("offline"); setLastCheck(new Date()); setRows([]);
    } finally {
      setLoading(false); setLoadPhase("");
    }
  }

  useEffect(() => {
    checkHealth();
    Promise.all([
      fetchTopics({ limit: 200 }).then(setTopics).catch(() => setTopics(["demo", "iphone_vs_android"])),
      load({ silent: true }),
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!rows.length) return;
    const timer = setTimeout(() => load({ silent: true }), 5 * 60 * 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows.length]);

  const buckets = useMemo(() => {
    const iphone = [], android = [], both = [], neither = [];
    for (const r of rows) {
      const bucket = classifyDevice(r?.clean_text || "");
      if (bucket === "iphone") iphone.push(r);
      else if (bucket === "android") android.push(r);
      else if (bucket === "both") both.push(r);
      else neither.push(r);
    }
    return { iphone, android, both, neither };
  }, [rows]);

  const sumIphone  = useMemo(() => summarizeSignal([...buckets.iphone, ...buckets.both]), [buckets.iphone, buckets.both]);
  const sumAndroid = useMemo(() => summarizeSignal([...buckets.android, ...buckets.both]), [buckets.android, buckets.both]);
  const overall    = useMemo(() => summarizeMix(rows), [rows]);

  const coverage = useMemo(() => {
    const matched = buckets.iphone.length + buckets.android.length + buckets.both.length;
    return overall.total ? matched / overall.total : null;
  }, [buckets, overall.total]);

  const ipWilson = useMemo(() => wilsonInterval(sumIphone.pos, sumIphone.neg), [sumIphone.pos, sumIphone.neg]);
  const anWilson = useMemo(() => wilsonInterval(sumAndroid.pos, sumAndroid.neg), [sumAndroid.pos, sumAndroid.neg]);

  const MIN_EFFECTIVE_SIGNAL = Math.max(5, Math.min(25, Math.floor(rows.length * 0.05)));

  const decision = useMemo(() => {
    const ipSig = sumIphone.signal;
    const anSig = sumAndroid.signal;
    if (ipSig < MIN_EFFECTIVE_SIGNAL || anSig < MIN_EFFECTIVE_SIGNAL) {
      return { label: "Not enough signal", detail: `Need ≥ ${MIN_EFFECTIVE_SIGNAL} pos/neg per side (iPhone ${ipSig}, Android ${anSig}).`, confidence: null };
    }
    if (ipWilson.lb != null && anWilson.lb != null) {
      if (ipWilson.lb > anWilson.ub) return { label: "iPhone", detail: "statistically higher positive-rate", confidence: ipWilson.lb - anWilson.ub };
      if (anWilson.lb > ipWilson.ub) return { label: "Android", detail: "statistically higher positive-rate", confidence: anWilson.lb - ipWilson.ub };
    }
    const netDiff = (sumIphone.netSignal ?? 0) - (sumAndroid.netSignal ?? 0);
    const deadzone = 0.08;
    if (netDiff > deadzone) return { label: "iPhone", detail: "leaning positive (signal)", confidence: Math.abs(netDiff) };
    if (netDiff < -deadzone) return { label: "Android", detail: "leaning positive (signal)", confidence: Math.abs(netDiff) };
    return { label: "Even", detail: "confidence intervals overlap", confidence: Math.abs(netDiff) };
  }, [sumIphone.signal, sumAndroid.signal, sumIphone.netSignal, sumAndroid.netSignal, ipWilson, anWilson]);

  const trend = useMemo(() => {
    const allDates = rows.map((r) => toDateSafe(r?.created_at) ?? toDateSafe(r?.scored_at)).filter(Boolean);
    if (!allDates.length) return { granularity: "day", series: [] };

    const minMs = Math.min(...allDates.map((d) => d.getTime()));
    const maxMs = Math.max(...allDates.map((d) => d.getTime()));
    const spanDays = (maxMs - minMs) / (1000 * 60 * 60 * 24);
    const granularity = spanDays <= 3 ? "hour" : spanDays <= 60 ? "day" : "week";
    const MIN_BUCKET = 3;

    function weekStart(d) {
      const copy = new Date(d);
      copy.setDate(copy.getDate() - copy.getDay());
      return copy;
    }
    function bucketKey(d) {
      const fmt2 = (x) => String(x).padStart(2, "0");
      if (granularity === "hour") return `${d.getFullYear()}-${fmt2(d.getMonth() + 1)}-${fmt2(d.getDate())} ${fmt2(d.getHours())}`;
      if (granularity === "week") { const ws = weekStart(d); return `${ws.getFullYear()}-${fmt2(ws.getMonth() + 1)}-${fmt2(ws.getDate())}`; }
      return `${d.getFullYear()}-${fmt2(d.getMonth() + 1)}-${fmt2(d.getDate())}`;
    }
    function netSignalForRows(rowsInBucket) {
      let pos = 0, neg = 0;
      for (const r of rowsInBucket) {
        const scores = getScores(r);
        const label = stableLabelFromScores(scores);
        if (label === "positive") pos++;
        else if (label === "negative") neg++;
      }
      const sig = pos + neg;
      return sig ? (pos - neg) / sig : null;
    }
    function buildSeries(name, rowsArr, tone) {
      const map = new Map();
      for (const r of rowsArr) {
        const d = toDateSafe(r?.created_at) ?? toDateSafe(r?.scored_at);
        if (!d) continue;
        const k = bucketKey(d);
        if (!map.has(k)) map.set(k, []);
        map.get(k).push(r);
      }
      const keys = Array.from(map.keys()).sort();
      const points = keys.filter((k) => map.get(k).length >= MIN_BUCKET).map((k) => ({ xKey: k, y: netSignalForRows(map.get(k)) }));
      return { name, tone, points };
    }
    return {
      granularity,
      series: [
        buildSeries("iPhone", [...buckets.iphone, ...buckets.both], "pos"),
        buildSeries("Android", [...buckets.android, ...buckets.both], "neg"),
      ],
    };
  }, [rows, buckets.iphone, buckets.android, buckets.both]);

  const iphoneTerms  = useMemo(() => topTermsWithSentiment([...buckets.iphone, ...buckets.both], 10), [buckets.iphone, buckets.both]);
  const androidTerms = useMemo(() => topTermsWithSentiment([...buckets.android, ...buckets.both], 10), [buckets.android, buckets.both]);

  const refreshedAgo = useRelativeTime(lastRefreshed);
  const ipCountUp    = useCountUp(sumIphone.total);
  const anCountUp    = useCountUp(sumAndroid.total);

  const heroText = useMemo(() => {
    if (!overall.total) return "No data yet — enter a search query to load scored posts.";
    const cov = coverage == null ? "—" : `${Math.round(coverage * 100)}%`;
    if (decision.label === "Not enough signal") return `Insufficient signal to determine a leader. Coverage: ${cov} of posts mention iPhone or Android.`;
    if (decision.label === "Even") return `Sentiment is within statistical margin — no clear leader. Coverage: ${cov} of posts mention iPhone or Android.`;
    return `${decision.label} has a statistically higher positive sentiment rate. Coverage: ${cov} of posts mention iPhone or Android (or both).`;
  }, [overall.total, coverage, decision.label]);

  const ipPosRate = sumIphone.signal > 0 ? sumIphone.pos / sumIphone.signal : null;
  const anPosRate = sumAndroid.signal > 0 ? sumAndroid.pos / sumAndroid.signal : null;

  function signalArrow(netSig) {
    if (netSig == null) return { cls: "sigArrow--flat", char: "→" };
    if (netSig > 0.08) return { cls: "sigArrow--up", char: "↑" };
    if (netSig < -0.08) return { cls: "sigArrow--down", char: "↓" };
    return { cls: "sigArrow--flat", char: "→" };
  }

  const ipArrow = signalArrow(sumIphone.netSignal);
  const anArrow = signalArrow(sumAndroid.netSignal);

  const filteredRows = useMemo(() => {
    if (sentFilter === "all") return rows;
    return rows.filter(r => stableLabelFromScores(getScores(r)) === sentFilter);
  }, [rows, sentFilter]);

  useEffect(() => { setTablePage(1); }, [rows, sentFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage  = Math.min(tablePage, pageCount);
  const pageRows  = filteredRows.slice((safePage - 1) * pageSize, safePage * pageSize);

  const ipSignalTotal = sumIphone.signal || 0;
  const anSignalTotal = sumAndroid.signal || 0;
  const signalTotal   = ipSignalTotal + anSignalTotal || 1;
  const ipBarW = ((ipSignalTotal / signalTotal) * 100).toFixed(1);
  const anBarW = ((anSignalTotal / signalTotal) * 100).toFixed(1);

  const verdictDevice = decision.label === "iPhone" ? "ip" : decision.label === "Android" ? "an" : null;

  return (
    <div className="shell">
      {loading && <div className="loadBar" />}

      {/* ── SIDEBAR ── */}
      <aside className="sidebar">
        <div className="sidebarBrand">
          <div className="sidebarLogoMark">
            <IconPulse size={15} color="#fff" />
          </div>
          <div>
            <div className="sidebarTitle">Sentiment OS</div>
            <div className="sidebarTagline">Real-time opinion intelligence</div>
          </div>
        </div>

        <div className="sideStatus">
          <span className="statusDot" data-status={apiStatus} />
          <span className="sideStatusLabel">{apiStatus}</span>
          {refreshedAgo && <span className="sideStatusAge">{refreshedAgo}</span>}
        </div>

        {/* iPhone device panel */}
        <div className="sideDevice sideDevice--ip">
          <div className="sideDeviceHead">
            <IconPhone size={14} color="var(--ip)" />
            <span className="sideDeviceName">iPhone</span>
            <span className={`sigArrow ${ipArrow.cls}`}>{ipArrow.char}</span>
          </div>
          <div className="sideDeviceStat">{ipCountUp.toLocaleString()}</div>
          <div className="sideDeviceMeta">
            {sumIphone.signal} signals
            {ipPosRate != null && <span className="sideDeviceRate"> · {Math.round(ipPosRate * 100)}% pos</span>}
          </div>
          {loading
            ? <div className="donutSkeletonWrap compact"><div className="skeleton" style={{ width: 90, height: 90, borderRadius: "50%" }} /></div>
            : <DonutChart label="" pos={sumIphone.pos} neu={sumIphone.neu} neg={sumIphone.neg} compact />
          }
        </div>

        {/* Android device panel */}
        <div className="sideDevice sideDevice--an">
          <div className="sideDeviceHead">
            <IconAndroid size={14} color="var(--an)" />
            <span className="sideDeviceName">Android</span>
            <span className={`sigArrow ${anArrow.cls}`}>{anArrow.char}</span>
          </div>
          <div className="sideDeviceStat">{anCountUp.toLocaleString()}</div>
          <div className="sideDeviceMeta">
            {sumAndroid.signal} signals
            {anPosRate != null && <span className="sideDeviceRate"> · {Math.round(anPosRate * 100)}% pos</span>}
          </div>
          {loading
            ? <div className="donutSkeletonWrap compact"><div className="skeleton" style={{ width: 90, height: 90, borderRadius: "50%" }} /></div>
            : <DonutChart label="" pos={sumAndroid.pos} neu={sumAndroid.neu} neg={sumAndroid.neg} compact />
          }
        </div>

        {/* Signal mix */}
        <div className="sideSignalMix">
          <div className="sideSignalTitle">Signal Mix</div>

          <div className="sideSignalBlock">
            <div className="sideSignalDevice sideSignalDevice--ip">
              <IconPhone size={11} color="var(--ip)" /> iPhone
            </div>
            {[["Pos", sumIphone.pos, sumIphone.total, "pos"], ["Neu", sumIphone.neu, sumIphone.total, "neu"], ["Neg", sumIphone.neg, sumIphone.total, "neg"]].map(([lbl, val, tot, tone]) => (
              <div key={lbl} className="signalBarRow">
                <span className="signalBarLabel">{lbl}</span>
                <div className="signalBarTrack"><div className={`signalBarFill signalBarFill--${tone}`} style={{ width: tot ? `${(val / tot) * 100}%` : "0%" }} /></div>
                <span className="signalBarCount">{val}</span>
              </div>
            ))}
          </div>

          <div className="sideSignalBlock">
            <div className="sideSignalDevice sideSignalDevice--an">
              <IconAndroid size={11} color="var(--an)" /> Android
            </div>
            {[["Pos", sumAndroid.pos, sumAndroid.total, "pos"], ["Neu", sumAndroid.neu, sumAndroid.total, "neu"], ["Neg", sumAndroid.neg, sumAndroid.total, "neg"]].map(([lbl, val, tot, tone]) => (
              <div key={lbl} className="signalBarRow">
                <span className="signalBarLabel">{lbl}</span>
                <div className="signalBarTrack"><div className={`signalBarFill signalBarFill--${tone}`} style={{ width: tot ? `${(val / tot) * 100}%` : "0%" }} /></div>
                <span className="signalBarCount">{val}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="sideFooterNote">
          Wilson CI + net signal fallback · min margin {MIN_MARGIN.toFixed(2)}
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="mainContent">

        {/* Search strip */}
        <div className="searchStrip">
          <div className="searchStripRow">
            <div className="field field--topic">
              <label>Topic</label>
              <select className="select" value={topic} onChange={(e) => setTopic(e.target.value)}>
                <option value="">All topics</option>
                {topics.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="field field--limit">
              <label>Limit</label>
              <input type="number" value={limit} min={1} max={5000} onChange={(e) => setLimit(Number(e.target.value))} />
            </div>

            <div className="field field--search">
              <label>Search</label>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); load(); } }}
                placeholder='e.g. "iphone battery", "android camera", "samsung overheating"'
              />
            </div>

            <div className="field field--device">
              <label>Device</label>
              <select className="select" value={deviceFilter} onChange={(e) => setDeviceFilter(e.target.value)}>
                <option value="any">All</option>
                <option value="iphone">iPhone</option>
                <option value="android">Android</option>
                <option value="both">Both</option>
              </select>
            </div>

            <div className="field field--source">
              <label>Source</label>
              <div className="sourcePills">
                <button className={`sourcePill${source === "youtube" ? " sourcePill--active sourcePill--yt" : ""}`} onClick={() => setSource("youtube")}>YouTube</button>
                <button className={`sourcePill${source === "twitter" ? " sourcePill--active sourcePill--x" : ""}`} onClick={() => setSource("twitter")}>X</button>
                <button className={`sourcePill${source === "both" ? " sourcePill--active sourcePill--both" : ""}`} onClick={() => setSource("both")}>Both</button>
              </div>
            </div>

            <div className="field field--btn">
              <label>&nbsp;</label>
              <div className="btnGroup">
                {query.trim() ? (
                  <>
                    <button className="btn btn--ghost" onClick={() => load({ dbOnly: true })} disabled={loading} title="Read from database — no API calls">
                      Load from DB
                    </button>
                    <button
                      className={`btn btn--primary${source === "twitter" ? " btn--twitter" : source === "both" ? "" : " btn--youtube"}`}
                      onClick={() => load()}
                      disabled={loading}
                    >
                      {loading
                        ? (loadPhase || "Searching…")
                        : source === "youtube" ? "Search YouTube"
                        : source === "twitter" ? "Search X"
                        : "Search Both"}
                    </button>
                  </>
                ) : (
                  <button className="btn btn--primary" onClick={() => load()} disabled={loading}>
                    {loading ? (loadPhase || "Loading…") : "Refresh"}
                  </button>
                )}
              </div>
            </div>
          </div>

          {err && (
            <div className="alert">
              <span className="alertDot" />
              <div>
                <div className="alertTitle">Request failed</div>
                <div className="alertMsg">{err}</div>
              </div>
            </div>
          )}
        </div>

        {/* Verdict strip */}
        <div className={`verdictStrip${verdictDevice ? ` verdictStrip--${verdictDevice}` : ""}`}>
          <div className="verdictLeft">
            {loading ? (
              <div className="verdictLabel">Analyzing…</div>
            ) : decision.label === "Not enough signal" ? (
              <>
                <div className="verdictLabel">Not enough signal</div>
                <div className="verdictDetail">{decision.detail}</div>
              </>
            ) : decision.label === "Even" ? (
              <>
                <div className="verdictLabel">Too close to call</div>
                <div className="verdictDetail">{decision.detail}</div>
              </>
            ) : (
              <>
                <div className="verdictWinner">
                  {decision.label === "iPhone"
                    ? <IconPhone size={18} color="var(--ip)" />
                    : <IconAndroid size={18} color="var(--an)" />}
                  <span className={`verdictName verdictName--${verdictDevice}`}>{decision.label}</span>
                  <span className="verdictLeads">leads in public sentiment</span>
                </div>
                <div className="verdictDetail">
                  {decision.detail}
                  {decision.confidence != null && ` · ${fmtPct(decision.confidence)} confidence`}
                </div>
              </>
            )}
          </div>

          <div className="verdictRight">
            <div className="verdictBarTrack">
              <div className="verdictBarFill--ip" style={{ width: `${ipBarW}%` }} />
              <div className="verdictBarFill--an" style={{ width: `${anBarW}%` }} />
            </div>
            <div className="verdictBarLegend">
              <span className="verdictLeg--ip">{ipSignalTotal} iPhone signals</span>
              <span className="verdictLeg--an">{anSignalTotal} Android signals</span>
            </div>
            <div className="verdictCoverage">
              {coverage == null ? "No data" : `${Math.round(coverage * 100)}% coverage`} · {overall.total.toLocaleString()} posts · {buckets.both.length} mention both
            </div>
          </div>
        </div>

        {/* KPI bar */}
        <div className="kpiBar">
          <div className="kpiCard card--anim" style={{ animationDelay: "0ms" }}>
            <div className="kpiCardAccent kpiCardAccent--ip" />
            <div className="kpiCardLabel">iPhone Posts</div>
            <div className="kpiCardStat">{ipCountUp.toLocaleString()}</div>
            <div className="kpiCardSub">{sumIphone.signal} signals</div>
          </div>
          <div className="kpiCard card--anim" style={{ animationDelay: "20ms" }}>
            <div className="kpiCardAccent kpiCardAccent--an" />
            <div className="kpiCardLabel">Android Posts</div>
            <div className="kpiCardStat">{anCountUp.toLocaleString()}</div>
            <div className="kpiCardSub">{sumAndroid.signal} signals</div>
          </div>
          <div className="kpiCard card--anim" style={{ animationDelay: "40ms" }}>
            <div className="kpiCardAccent kpiCardAccent--win" />
            <div className="kpiCardLabel">Leading Device</div>
            <div className="kpiCardStat" style={{
              fontSize: 18,
              color: decision.label === "iPhone" ? "var(--ip)"
                   : decision.label === "Android" ? "var(--an)"
                   : "var(--text)"
            }}>
              {decision.label}
            </div>
            <div className="kpiCardSub">{decision.detail}</div>
          </div>
          <div className="kpiCard card--anim" style={{ animationDelay: "60ms" }}>
            <div className="kpiCardAccent kpiCardAccent--cov" />
            <div className="kpiCardLabel">Coverage</div>
            <div className="kpiCardStat">{coverage == null ? "—" : `${Math.round(coverage * 100)}%`}</div>
            <div className="kpiCardSub">{overall.total.toLocaleString()} total posts</div>
          </div>
        </div>

        {/* Charts row: trend + terms */}
        <div className="chartsRow">
          <section ref={sectionHero} className="chartCard section-animate">
            {!overall.total && !loading && (
              <div className="onboardHero">
                <div className="onboardComparison">
                  <div className="onboardSide">
                    <div className="onboardDeviceIcon"><IconPhone size={22} color="var(--ip)" /></div>
                    <div className="onboardLabel onboardLabel--ip">iPhone</div>
                  </div>
                  <div className="onboardVs">VS</div>
                  <div className="onboardSide">
                    <div className="onboardDeviceIcon"><IconAndroid size={22} color="var(--an)" /></div>
                    <div className="onboardLabel onboardLabel--an">Android</div>
                  </div>
                </div>
                <div className="onboardSteps">
                  <div className="onboardStep">
                    <div className="onboardStepNum">1</div>
                    <div className="onboardStepText"><strong>Enter a search query</strong> — try "iPhone 16 review" or "Samsung Galaxy S25"</div>
                  </div>
                  <div className="onboardStep">
                    <div className="onboardStepNum">2</div>
                    <div className="onboardStepText"><strong>Select a source</strong> — YouTube comments or X posts, scored with Azure AI Language</div>
                  </div>
                  <div className="onboardStep">
                    <div className="onboardStepNum">3</div>
                    <div className="onboardStepText"><strong>Review results</strong> — real sentiment from real users, not curated reviews</div>
                  </div>
                </div>
              </div>
            )}
            {overall.total > 0 && <div className="heroHeadline">{heroText}</div>}
            <TrendChart series={trend.series} granularity={trend.granularity} />
            <div className="queryBadges">
              <span className="badge">Rows: <b style={{ marginLeft: 4 }}>{overall.total}</b></span>
              <span className="badge">Topic: <b style={{ marginLeft: 4 }}>{topic || "All"}</b></span>
              <span className="badge">Search: <b style={{ marginLeft: 4 }}>{query.trim() || "—"}</b></span>
              <span className="badge">Device: <b style={{ marginLeft: 4 }}>{deviceFilter}</b></span>
              <span className="badge">Margin: <b style={{ marginLeft: 4 }}>{MIN_MARGIN.toFixed(2)}</b></span>
            </div>
          </section>

          <section ref={sectionSide} className="termsCard section-animate">
            <div className="cardTitle">Top Terms</div>
            <div className="compareGrid">
              <div className="compareCol">
                <div className="compareTitle">
                  <IconPhone size={12} color="var(--ip)" /> iPhone
                </div>
                <div className="termWrap">
                  {iphoneTerms.length
                    ? iphoneTerms.map(([w, c, tone]) => (
                        <span key={`ip-${w}`} className={`termPill termPill--${tone}`} title={`${c} mentions · ${tone}`}>
                          {w} <span className="termCount">{c}</span>
                        </span>
                      ))
                    : <div className="dim">No iPhone terms yet.</div>}
                </div>
              </div>
              <div className="compareCol">
                <div className="compareTitle">
                  <IconAndroid size={12} color="var(--an)" /> Android
                </div>
                <div className="termWrap">
                  {androidTerms.length
                    ? androidTerms.map(([w, c, tone]) => (
                        <span key={`an-${w}`} className={`termPill termPill--${tone}`} title={`${c} mentions · ${tone}`}>
                          {w} <span className="termCount">{c}</span>
                        </span>
                      ))
                    : <div className="dim">No Android terms yet.</div>}
                </div>
              </div>
            </div>
            <div className="footerHint" style={{ marginTop: "auto", paddingTop: 16 }}>
              Signal = pos + neg after confidence gating. Neutrals excluded from leader determination.
            </div>
          </section>
        </div>

        {/* Donut row */}
        <div className="donutRow">
          <section ref={sectionIpie} className="donutRowCard section-animate">
            <div className="cardTitle">iPhone · Sentiment Breakdown</div>
            {loading
              ? <div className="donutSkeletonWrap"><div className="skeleton" style={{ width: 150, height: 150, borderRadius: "50%" }} /></div>
              : <DonutChart label="iPhone" pos={sumIphone.pos} neu={sumIphone.neu} neg={sumIphone.neg} />}
          </section>
          <section ref={sectionApie} className="donutRowCard section-animate">
            <div className="cardTitle">Android · Sentiment Breakdown</div>
            {loading
              ? <div className="donutSkeletonWrap"><div className="skeleton" style={{ width: 150, height: 150, borderRadius: "50%" }} /></div>
              : <DonutChart label="Android" pos={sumAndroid.pos} neu={sumAndroid.neu} neg={sumAndroid.neg} />}
          </section>
        </div>

        {/* Table */}
        <section ref={sectionTable} className="tableSection section-animate">
          <div className="tableHeader">
            <div className="cardTitle" style={{ marginBottom: 0 }}>Recent Scored Posts</div>
            <div className="tableToolbar">
              <div className="sentFilterPills">
                {[["all","All"],["positive","Positive"],["neutral","Neutral"],["negative","Negative"]].map(([v, label]) => (
                  <button key={v} className={`sentPill sentPill--${v}${sentFilter === v ? " sentPill--active" : ""}`} onClick={() => setSentFilter(v)}>
                    {label}
                  </button>
                ))}
              </div>
              <select className="pageSizeSelect" value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setTablePage(1); }}>
                <option value={10}>10 / page</option>
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
                <option value={100}>100 / page</option>
              </select>
            </div>
          </div>

          <div className="tableWrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Platform</th>
                  <th>Topic</th>
                  <th>Device</th>
                  <th>Sentiment</th>
                  <th>Scores</th>
                  <th>Text</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((r, idx) => {
                  const s = getScores(r);
                  const stable = stableLabelFromScores(s);
                  const key = r?._id || `${r?.platform || "p"}-${r?.scored_at || "t"}-${idx}`;
                  return (
                    <tr key={key} className={`row--${stable}`}>
                      <td className="mono">{fmtTime(r.scored_at)}</td>
                      <td>
                        {r.platform === "twitter"
                          ? <span className="platformBadge platformBadge--x">𝕏</span>
                          : r.platform === "youtube"
                          ? <span className="platformBadge platformBadge--yt">YT</span>
                          : <span className="platformBadge">{r.platform || "—"}</span>}
                      </td>
                      <td>{r.topic || ""}</td>
                      <td className="dim">{labelForBucket(classifyDevice(r?.clean_text || ""))}</td>
                      <td><SentimentTag label={stable} /></td>
                      <td className="scoreCell">
                        <span className="scoreVal scoreVal--pos">P:{fmt(s.positive)}</span>
                        <span className="scoreVal scoreVal--neu">N:{fmt(s.neutral)}</span>
                        <span className="scoreVal scoreVal--neg">Ng:{fmt(s.negative)}</span>
                      </td>
                      <td className="textCell">{r.clean_text || r.text || ""}</td>
                    </tr>
                  );
                })}
                {!pageRows.length && (
                  <tr>
                    <td colSpan={7} className="tableEmpty">
                      {loading ? "Loading…"
                        : filteredRows.length === 0 && rows.length > 0 ? "No posts match this filter."
                        : "No data yet — run a search above."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {pageCount > 1 && (
            <div className="pagination">
              <button className="pageBtn" onClick={() => setTablePage(p => Math.max(1, p - 1))} disabled={safePage <= 1}>‹</button>
              {getPageNums(safePage, pageCount).map((p, i) =>
                p === "..." ? <span key={`e-${i}`} className="pageEllipsis">…</span>
                  : <button key={p} className={`pageBtn${safePage === p ? " pageBtn--active" : ""}`} onClick={() => setTablePage(p)}>{p}</button>
              )}
              <button className="pageBtn" onClick={() => setTablePage(p => Math.min(pageCount, p + 1))} disabled={safePage >= pageCount}>›</button>
              <span className="pageInfo">{(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filteredRows.length)} of {filteredRows.length}</span>
            </div>
          )}
        </section>

        <footer className="pageFooter">
          <span className="footerBrand">Sentiment OS</span>
          <span className="footerMid">Public opinion intelligence · iPhone vs. Android</span>
          <span className="footerRight">Powered by Azure AI Language · Data from YouTube & X</span>
        </footer>
      </div>
    </div>
  );
}
