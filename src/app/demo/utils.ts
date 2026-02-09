import type { Severity, StepStatus, MemoryHit } from "./data";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatNumber(n: number) {
  return new Intl.NumberFormat().format(n);
}

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function badgeForSeverity(sev: Severity) {
  switch (sev) {
    case "critical":
      return "bg-red-500/10 text-red-300 ring-1 ring-red-500/20";
    case "warning":
      return "bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/20";
    default:
      return "bg-sky-500/10 text-sky-300 ring-1 ring-sky-500/20";
  }
}

export function dotForStatus(status: StepStatus) {
  switch (status) {
    case "running":
      return "bg-violet-400 animate-pulse";
    case "done":
      return "bg-emerald-400";
    case "error":
      return "bg-red-400";
    default:
      return "bg-white/20";
  }
}

export function riskPill(score: number) {
  const s = clamp(score, 0, 100);
  if (s >= 75) return "bg-red-500/10 text-red-200 ring-1 ring-red-500/20";
  if (s >= 45) return "bg-amber-500/10 text-amber-200 ring-1 ring-amber-500/20";
  return "bg-emerald-500/10 text-emerald-200 ring-1 ring-emerald-500/20";
}

export function prettySource(source: MemoryHit["source"]) {
  if (source === "style-guide") return "Style Guide";
  if (source === "past-pr") return "Past PR";
  if (source === "module-pattern") return "Module Pattern";
  return "Postmortem";
}
