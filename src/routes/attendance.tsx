import { createFileRoute } from "@tanstack/react-router";
import { Minus, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Bar,
  Cell,
  ResponsiveContainer,
  BarChart as ReBarChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EntityDialog } from "@/components/entity-dialog";
import { Empty, PageHeader, StatusPill } from "@/components/shell";
import { uid, useCollections } from "@/lib/store";
import type { Subject } from "@/lib/types";
import {
  afterAttending,
  afterMissing,
  canMiss,
  needToAttend,
  overall,
  percent,
  status,
} from "@/lib/attendance";

export const Route = createFileRoute("/attendance")({
  head: () => ({
    meta: [
      { title: "Attendance Tracker — Student Hub" },
      {
        name: "description",
        content:
          "Track subject-wise attendance, see safe-to-miss classes and how many classes to attend to hit your target.",
      },
      { property: "og:title", content: "Attendance Tracker — Student Hub" },
      {
        property: "og:description",
        content: "Attendance percentages, risk status and bunk calculator for every subject.",
      },
    ],
  }),
  component: AttendancePage,
});

const tone = (s: string) =>
  s === "Safe"
    ? "var(--success)"
    : s === "Warning"
      ? "var(--warning)"
      : "var(--destructive)";

const pill = (s: string) => (s === "Safe" ? "success" : s === "Warning" ? "warning" : "danger");

const fields = [
  { name: "name", label: "Subject name", required: true },
  { name: "total", label: "Total classes", type: "number" as const, min: 0, required: true },
  { name: "attended", label: "Attended classes", type: "number" as const, min: 0, required: true },
];

function AttendancePage() {
  const { data, subjects, update } = useCollections();
  const all = overall(data.subjects);
  const target = data.target;

  const save = (v: (k: string) => string, id?: string) => {
    const total = Math.max(0, Number(v("total")) || 0);
    const attended = Math.max(0, Number(v("attended")) || 0);
    if (attended > total) {
      toast.error("Attended classes cannot exceed total classes.");
      return;
    }
    const payload = { name: v("name"), total, attended };
    if (id) {
      subjects.edit(id, payload);
      toast.success("Subject updated");
    } else {
      subjects.add({ id: uid(), ...payload } as Subject);
      toast.success("Subject added");
    }
  };

  const mark = (s: Subject, present: boolean) =>
    subjects.edit(s.id, {
      total: s.total + 1,
      attended: present ? s.attended + 1 : s.attended,
    });

  const chartData = data.subjects.map((s) => ({
    name: s.name.length > 12 ? `${s.name.slice(0, 11)}…` : s.name,
    pct: Number(percent(s.attended, s.total).toFixed(1)),
  }));

  return (
    <div>
      <PageHeader
        title="Attendance"
        subtitle="Percentages, risk status and how many classes you can safely miss."
        action={
          <EntityDialog
            title="Add subject"
            fields={fields}
            initial={{ total: "0", attended: "0" }}
            onSubmit={(v) => save(v)}
            trigger={
              <Button>
                <Plus className="mr-1.5 size-4" /> Add subject
              </Button>
            }
          />
        }
      />

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className="surface p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Overall attendance
          </p>
          <p className="mt-2 text-4xl font-bold">{all.pct.toFixed(1)}%</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {all.attended} attended of {all.total} classes
          </p>
          <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full"
              style={{ width: `${all.pct}%`, backgroundColor: tone(status(all.pct)) }}
            />
          </div>
          <div className="mt-3">
            <StatusPill tone={pill(status(all.pct)) as "success"}>{status(all.pct)}</StatusPill>
          </div>
        </div>

        <div className="surface p-5 lg:col-span-2">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Subject-wise attendance
            </p>
            <div className="flex items-center gap-2">
              <Label htmlFor="target" className="text-xs font-semibold">
                Target %
              </Label>
              <Input
                id="target"
                type="number"
                min={1}
                max={100}
                value={target}
                onChange={(e) =>
                  update((d) => ({
                    ...d,
                    target: Math.min(100, Math.max(1, Number(e.target.value) || 75)),
                  }))
                }
                className="w-20"
              />
            </div>
          </div>
          {chartData.length ? (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ReBarChart data={chartData}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} width={30} />
                  <Tooltip formatter={(v) => `${v}%`} />
                  <Bar dataKey="pct" radius={[6, 6, 0, 0]}>
                    {chartData.map((d) => (
                      <Cell key={d.name} fill={tone(status(d.pct))} />
                    ))}
                  </Bar>
                </ReBarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Add a subject to see the chart.</p>
          )}
        </div>
      </div>

      <div className="grid gap-4">
        {data.subjects.length ? (
          data.subjects.map((s) => {
            const p = percent(s.attended, s.total);
            const st = status(p);
            const need = needToAttend(s.attended, s.total, target);
            return (
              <div key={s.id} className="surface p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold">{s.name}</h3>
                      <StatusPill tone={pill(st) as "success"}>{st}</StatusPill>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {s.attended} attended · {s.total - s.attended} missed · {s.total} total
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => mark(s, true)}>
                      <Plus className="mr-1.5 size-4" /> Present
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => mark(s, false)}>
                      <Minus className="mr-1.5 size-4" /> Absent
                    </Button>
                    <EntityDialog
                      title="Edit subject"
                      fields={fields}
                      initial={{
                        name: s.name,
                        total: String(s.total),
                        attended: String(s.attended),
                      }}
                      onSubmit={(v) => save(v, s.id)}
                      trigger={
                        <Button size="sm" variant="outline">
                          <Pencil className="size-4" />
                        </Button>
                      }
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        subjects.remove(s.id);
                        toast.success("Subject deleted");
                      }}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="mb-1.5 flex justify-between text-sm font-semibold">
                    <span>{p.toFixed(1)}%</span>
                    <span className="text-muted-foreground">75% required</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${p}%`, backgroundColor: tone(st) }}
                    />
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <Stat label="Can miss (stay ≥75%)" value={`${canMiss(s.attended, s.total)}`} />
                  <Stat
                    label={`Attend to reach ${target}%`}
                    value={need === 0 ? "Target met" : `${need} classes`}
                  />
                  <Stat
                    label="If you attend next class"
                    value={`${afterAttending(s.attended, s.total).toFixed(1)}%`}
                  />
                  <Stat
                    label="If you miss next class"
                    value={`${afterMissing(s.attended, s.total).toFixed(1)}%`}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <Empty text="No subjects yet — add your first subject to start tracking attendance." />
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-secondary/60 p-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-base font-bold">{value}</p>
    </div>
  );
}
