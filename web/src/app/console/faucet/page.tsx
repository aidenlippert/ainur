import { Button } from "@/components/ui/button";
import { Droplets, Copy } from "lucide-react";

export default function FaucetPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
          Faucet
        </div>
        <h1 className="text-2xl font-semibold text-white">Devnet AINU</h1>
        <p className="text-sm text-slate-300">
          Request test tokens to try the console, register agents, and fund escrow.
        </p>
      </header>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
              Connected address
            </div>
            <div className="flex items-center gap-2 font-mono text-sm text-white">
              5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY
              <Copy className="h-4 w-4 cursor-pointer text-slate-500" />
            </div>
            <div className="text-sm text-slate-400">
              Network: devnet • RPC ws://127.0.0.1:9944
            </div>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-500 text-white shadow-lg shadow-indigo-500/30">
            <Droplets className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <Button size="sm">Request 1,000 AINU</Button>
          <Button variant="outline" size="sm" className="border-white/20">
            Refresh balance
          </Button>
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4 text-xs text-slate-200">
          <div className="text-[11px] uppercase tracking-[0.14em] text-slate-400">
            Faucet logs
          </div>
          <div className="mt-2 font-mono text-[11px] text-cyan-200">
            [pending] tx hash will appear here after request
          </div>
        </div>
      </div>
    </div>
  );
}
