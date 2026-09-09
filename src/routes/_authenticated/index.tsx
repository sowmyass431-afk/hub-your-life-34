import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlarmClock,
  ArrowRight,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  PercentCircle,
  Sparkles,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { Bar, StatusPill } from "@/components/shell";
import type { Day } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/")({
  component: Dashboard,
});

const today = () => new Date().toISOString().slice(0, 10);
const dayName = () =>
  new Date().toLocaleDateString("en-US", { weekday: "long" }) as Day;

function Dashboard() {
  const { data } = useStore();
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const todaysClasses = data.classes
    .filter((c) => c.day === dayName())
    .sort((a, b) => a.start.localeCompare(b.start));

  const nextClass = todaysClasses.find((c) => c.end > now.toTimeString().slice(0, 5));

  const totalClasses = data.subjects.reduce((s, x) => s + x.total, 0);
  const totalAttended = data.subjects.reduce((s, x) => s + x.attended, 0);
  const overall = totalClasses ? Math.round((totalAttended / totalClasses) * 1000) / 10 : 0;
  const lowSubjects = data.subjects.filter(
    (s) => s.total > 0 && (s.attended / s.total) * 100 < data.target,
  );

  const pending = data.assignments
    .filter((a) => a.status !== "Completed")
    .sort((a, b) => a.due.localeCompare(b.due));
  const overdue = pending.filter((a) => a.due < today());

  const upcomingExams = data.exams
    .filter((e) => e.date >= today())
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  const upcomingReminders = data.reminders
    .filter((r) => !r.done && r.date >= today())
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
    .slice(0, 3);

  return (
    <div>
      <div className="surface hero-gradient mb-6 p-6 sm:p-8">
        <p className="text-sm font-medium opacity-90">{dateStr}</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
          Hello, {data.name || "Student"} 👋
        </h1>
        <p className="mt-1 text-sm opacity-90">
          {todaysClasses.length
            ? `You have ${todaysClasses.length} class${todaysClasses.length > 1 ? "es" : ""} today.`
            : "No classes today — great day to revise."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<CalendarDays className="size-4" />}
          label="Classes today"
          value={String(todaysClasses.length)}
        />
        <StatCard
          icon={<PercentCircle className="size-4" />}
          label="Overall attendance"
          value={`${overall}%`}
        />
        <StatCard
          icon={<ClipboardList className="size-4" />}
          label="Pending assignments"
          value={String(pending.length)}
          alert={overdue.length > 0 ? `${overdue.length} overdue` : undefined}
        />
        <StatCard
          icon={<GraduationCap className="size-4" />}
          label="Upcoming exams"
          value={String(upcomingExams.length)}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="surface p-5">
          <SectionTitle to="/timetable" title="Today's classes" />
          {todaysClasses.length ? (
            <ul className="mt-3 space-y-3">
              {todaysClasses.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{c.subject}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.teacher} · {c.room}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-primary">
                    {c.start}–{c.end}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">Nothing scheduled today.</p>
          )}
          {nextClass && (
            <p className="mt-4 rounded-lg bg-primary/10 px-3 py-2 text-xs font-medium text-primary">
              Next up: {nextClass.subject} at {nextClass.start} in {nextClass.room}
            </p>
          )}
        </section>

        <section className="surface p-5">
          <SectionTitle to="/attendance" title="Attendance" />
          <div className="mt-3">
            <div className="mb-1 flex justify-between text-sm">
              <span className="font-medium">Overall</span>
              <span className="font-semibold">
                {overall}% <span className="text-muted-foreground">/ target {data.target}%</span>
              </span>
            </div>
            <Bar
              value={overall}
              tone={overall >= data.target ? "var(--color-success)" : "var(--color-destructive)"}
            />
          </div>
          {lowSubjects.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold text-muted-foreground">
                Below your {data.target}% target
              </p>
              <div className="flex flex-wrap gap-2">
                {lowSubjects.map((s) => (
                  <StatusPill key={s.id} tone="danger">
                    {s.name} · {s.total ? Math.round((s.attended / s.total) * 100) : 0}%
                  </StatusPill>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="surface p-5">
          <SectionTitle to="/assignments" title="Assignments due" />
          {pending.length ? (
            <ul className="mt-3 space-y-3">
              {pending.slice(0, 4).map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.subject}</p>
                  </div>
                  <StatusPill tone={a.due < today() ? "danger" : "muted"}>
                    {a.due < today() ? "Overdue" : a.due}
                  </StatusPill>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">All caught up — nothing pending.</p>
          )}
        </section>

        <section className="surface p-5">
          <SectionTitle to="/reminders" title="Reminders & exams" />
          {upcomingReminders.length || upcomingExams.length ? (
            <ul className="mt-3 space-y-3">
              {upcomingExams.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <GraduationCap className="size-4 shrink-0 text-primary" />
                    <p className="truncate font-medium">{e.subject} exam</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {e.date} {e.time}
                  </span>
                </li>
              ))}
              {upcomingReminders.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <AlarmClock className="size-4 shrink-0 text-muted-foreground" />
                    <p className="truncate font-medium">{r.title}</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {r.date} {r.time}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">No upcoming reminders or exams.</p>
          )}
        </section>
      </div>

      <Link
        to="/assistant"
        className="surface mt-4 flex items-center justify-between gap-3 p-5 transition-colors hover:border-primary/40"
      >
        <div className="flex items-center gap-3">
          <span className="hero-gradient grid size-9 place-items-center rounded-xl">
            <Sparkles className="size-4" />
          </span>
          <div>
            <p className="font-semibold">AI Study Assistant</p>
            <p className="text-xs text-muted-foreground">
              Ask anything — summaries, explanations, revision plans.
            </p>
          </div>
        </div>
        <ArrowRight className="size-4 text-muted-foreground" />
      </Link>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  alert,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  alert?: string;
}) {
  return (
    <div className="surface p-4">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      {alert && <p className="mt-1 text-xs font-semibold text-destructive">{alert}</p>}
    </div>
  );
}

function SectionTitle({ title, to }: { title: string; to: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="font-semibold">{title}</h2>
      <Link
        to={to}
        className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
      >
        View all <ArrowRight className="size-3" />
      </Link>
    </div>
  );
}
