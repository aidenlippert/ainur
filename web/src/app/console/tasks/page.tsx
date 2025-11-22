"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchTasks } from "@/lib/orchestrator";

export default function TasksPage() {
  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks"],
    queryFn: fetchTasks,
    refetchInterval: 3000,
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
            Tasks
          </div>
          <h1 className="text-2xl font-semibold text-white">Your tasks</h1>
          <p className="text-sm text-slate-300">
            Monitor bids, execution, verification, and settlement status.
          </p>
        </div>
        <Link href="/console/tasks/create">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create task
          </Button>
        </Link>
      </header>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur">
        <div className="grid grid-cols-5 border-b border-white/5 px-4 py-3 text-xs uppercase tracking-[0.12em] text-slate-400">
          <div>Title</div>
          <div>Status</div>
          <div>Budget</div>
          <div>Min rep</div>
          <div>Created</div>
        </div>
        {tasks.map((task) => (
          <Link
            key={task.id}
            href={`/console/tasks/${task.id}`}
            className="grid grid-cols-5 items-center border-b border-white/5 px-4 py-4 text-sm text-slate-200 transition hover:bg-white/5"
          >
            <div className="font-medium text-white">{task.title}</div>
            <div>
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs">
                {task.status}
              </span>
            </div>
            <div className="font-mono text-cyan-200">{task.budget}</div>
            <div className="text-slate-300">{task.minRep}</div>
            <div className="text-slate-400">{task.created}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
