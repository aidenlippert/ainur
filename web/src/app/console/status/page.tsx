import { Activity, Wifi, Database, Gauge } from "lucide-react";

const cards = [
  {
    title: "Chain",
    subtitle: "Block / Finalized",
    metric: "#12,345 / #12,342",
    detail: "BABE/GRANDPA • 6s",
    icon: Gauge,
  },
  {
    title: "P2P",
    subtitle: "Peers",
    metric: "18",
    detail: "Libp2p • semantic routing",
    icon: Wifi,
  },
  {
    title: "Outbox",
    subtitle: "Submit success",
    metric: "99.2%",
    detail: "Retries: 3 • Dead: 0",
    icon: Activity,
  },
  {
    title: "DB",
    subtitle: "Postgres",
    metric: "Healthy",
    detail: "Latency p95: 12 ms",
    icon: Database,
  },
];

export default function StatusPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
          Status
        </div>
        <h1 className="text-2xl font-semibold text-white">Network health</h1>
        <p className="text-sm text-slate-300">
          Chain, P2P, outbox, and database signals. Hook this to Prometheus when
          ready.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"
            >
              <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-slate-400">
                {c.title}
                <Icon className="h-4 w-4 text-cyan-200" />
              </div>
              <div className="mt-2 text-xl font-semibold text-white">{c.metric}</div>
              <div className="text-sm text-slate-300">{c.subtitle}</div>
              <div className="text-xs text-slate-400">{c.detail}</div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
        <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
          Metrics endpoint
        </div>
        <div className="mt-2 font-mono text-sm text-cyan-200">
          http://localhost:8080/metrics
        </div>
        <div className="mt-1 text-sm text-slate-300">
          Prometheus-compatible. Add alerts for submit_fail, retry_count, dead
          queues, and replay lag.
        </div>
      </div>
    </div>
  );
}
