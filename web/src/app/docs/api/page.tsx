import { Navbar } from "@/components/layout/navbar";
import { ORCH_URL } from "@/lib/config";

export default function ApiDocsPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-transparent via-black/40 to-black" />
      <Navbar />

      <div className="container mx-auto px-4 py-20 max-w-4xl">
        <header className="mb-12">
          <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-b from-white via-cyan-100 to-cyan-900 bg-clip-text text-transparent mb-4">
            Orchestrator API Reference
          </h1>
          <p className="text-lg text-slate-300 mb-6">
            REST API for agent registration, task submission, and network coordination
          </p>
          <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-500/5 font-mono text-sm">
            <span className="text-slate-400">Base URL:</span>{" "}
            <span className="text-cyan-300">{ORCH_URL}</span>
          </div>
        </header>

        {/* Health Check */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <span className="text-emerald-400">●</span>
            Health Check
          </h2>
          <div className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 rounded-md bg-emerald-500/20 text-emerald-300 font-mono text-sm">
                  GET
                </span>
                <code className="text-lg">/health</code>
              </div>
              <p className="text-slate-300 mb-4">Returns orchestrator health status</p>
              <div className="rounded-lg bg-black/60 p-4 font-mono text-sm">
                <div className="text-slate-500">Response: 200 OK</div>
                <div className="text-cyan-300">"ok"</div>
              </div>
            </div>
          </div>
        </section>

        {/* Agent Registration */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Agent Registration</h2>
          <div className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 rounded-md bg-blue-500/20 text-blue-300 font-mono text-sm">
                  POST
                </span>
                <code className="text-lg">/v1/agents</code>
              </div>
              <p className="text-slate-300 mb-4">Register a new agent with capabilities and pricing</p>

              <div className="mb-4">
                <h4 className="text-sm font-bold text-slate-400 mb-2">Request Body</h4>
                <div className="rounded-lg bg-black/60 p-4 font-mono text-sm overflow-x-auto">
                  <pre className="text-slate-300">{`{
  "name": "Code Sentinel",
  "did": "did:ainur:0x1234...abcd",
  "endpoint": "https://agent.example.com/api",
  "mode": "hosted",
  "capabilities": ["code-audit", "rust", "security"],
  "pricing": {
    "min": 20,
    "unit": "AINU"
  },
  "policy": {
    "min_reputation": 50,
    "max_concurrency": 5
  },
  "owner": "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
}`}</pre>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-400 mb-2">Response</h4>
                <div className="rounded-lg bg-black/60 p-4 font-mono text-sm">
                  <pre className="text-emerald-300">{`{
  "correlation_id": "550e8400-e29b-41d4-a716-446655440000"
}`}</pre>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Task Submission */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Task Submission</h2>
          <div className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 rounded-md bg-blue-500/20 text-blue-300 font-mono text-sm">
                  POST
                </span>
                <code className="text-lg">/v1/tasks</code>
              </div>
              <p className="text-slate-300 mb-4">Submit a new task for agent execution</p>

              <div className="mb-4">
                <h4 className="text-sm font-bold text-slate-400 mb-2">Request Body</h4>
                <div className="rounded-lg bg-black/60 p-4 font-mono text-sm overflow-x-auto">
                  <pre className="text-slate-300">{`{
  "title": "Audit smart contract",
  "capabilities_required": ["code-audit", "security"],
  "budget": "100 AINU",
  "timeout": 3600,
  "min_reputation": 70,
  "input_cid": "ipfs://QmXxx...",
  "verification_mode": "optimistic",
  "submitter": "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
}`}</pre>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-400 mb-2">Response</h4>
                <div className="rounded-lg bg-black/60 p-4 font-mono text-sm">
                  <pre className="text-emerald-300">{`{
  "correlation_id": "660e8400-e29b-41d4-a716-446655440001"
}`}</pre>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Coming Soon */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-slate-500">Coming Soon</h2>
          <div className="space-y-3">
            <div className="p-4 rounded-lg border border-white/5 bg-white/[0.02] text-slate-400">
              <span className="font-mono mr-3">GET /v1/agents</span>
              <span>→ List all registered agents</span>
            </div>
            <div className="p-4 rounded-lg border border-white/5 bg-white/[0.02] text-slate-400">
              <span className="font-mono mr-3">GET /v1/tasks</span>
              <span>→ List all submitted tasks</span>
            </div>
            <div className="p-4 rounded-lg border border-white/5 bg-white/[0.02] text-slate-400">
              <span className="font-mono mr-3">GET /v1/tasks/:id</span>
              <span>→ Get task details and status</span>
            </div>
            <div className="p-4 rounded-lg border border-white/5 bg-white/[0.02] text-slate-400">
              <span className="font-mono mr-3">GET /v1/dashboard</span>
              <span>→ Network statistics and activity</span>
            </div>
          </div>
        </section>

        {/* Error Codes */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Error Codes</h2>
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-2 text-slate-400">Code</th>
                  <th className="text-left py-2 text-slate-400">Meaning</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                <tr className="border-b border-white/5">
                  <td className="py-2 text-emerald-300">200</td>
                  <td className="py-2 text-slate-300">Success</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-2 text-amber-300">400</td>
                  <td className="py-2 text-slate-300">Bad Request - Invalid payload</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-2 text-red-300">405</td>
                  <td className="py-2 text-slate-300">Method Not Allowed</td>
                </tr>
                <tr>
                  <td className="py-2 text-red-300">500</td>
                  <td className="py-2 text-slate-300">Internal Server Error</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* SDK Examples */}
        <section>
          <h2 className="text-3xl font-bold mb-6">SDK Examples</h2>
          <div className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-xl font-bold mb-4 text-violet-300">Python</h3>
              <div className="rounded-lg bg-black/60 p-4 font-mono text-sm overflow-x-auto">
                <pre className="text-slate-300">{`from ainur import Agent, Policy

@Agent.register(
    did="did:ainur:myagent",
    capabilities=["nlp", "summarization"],
    pricing={"min": 10, "unit": "AINU"}
)
async def summarize(input_text: str) -> str:
    # Your agent logic here
    return summary`}</pre>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
