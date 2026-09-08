import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  Link2,
  Menu,
  NotebookPen,
  PercentCircle,
  Sparkles,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/timetable", label: "Timetable", icon: CalendarDays },
  { to: "/attendance", label: "Attendance", icon: PercentCircle },
  { to: "/assignments", label: "Assignments", icon: ClipboardList },
  { to: "/exams", label: "Exams", icon: GraduationCap },
  { to: "/reminders", label: "Reminders", icon: BookOpen },
  { to: "/notes", label: "Notes", icon: NotebookPen },
  { to: "/links", label: "Links", icon: Link2 },
  { to: "/assistant", label: "AI Assistant", icon: Sparkles },
] as const;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          onClick={onNavigate}
          activeOptions={{ exact: to === "/" }}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          activeProps={{ className: "bg-primary/10 text-primary hover:bg-primary/10" }}
        >
          <Icon className="size-4 shrink-0" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen lg:flex">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-sidebar p-4 lg:flex lg:flex-col lg:sticky lg:top-0 lg:h-screen">
        <Brand />
        <div className="mt-6 flex-1 overflow-y-auto">
          <NavLinks />
        </div>
        <p className="pt-4 text-xs text-muted-foreground">Saved on this device</p>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/85 px-4 py-3 backdrop-blur lg:hidden">
          <Brand />
          <button
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
            className="rounded-lg border border-border p-2"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </header>

        {open && (
          <div className="border-b border-border bg-card px-4 py-3 lg:hidden">
            <NavLinks onNavigate={() => setOpen(false)} />
          </div>
        )}

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <span className="hero-gradient grid size-9 place-items-center rounded-xl">
        <GraduationCap className="size-5" />
      </span>
      <span className="text-base font-bold tracking-tight">Student Hub</span>
    </Link>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Empty({ text }: { text: string }) {
  return (
    <p className="surface p-8 text-center text-sm text-muted-foreground">{text}</p>
  );
}

export function StatusPill({
  tone,
  children,
}: {
  tone: "success" | "warning" | "danger" | "muted" | "primary";
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        tone === "success" && "bg-success/12 text-success",
        tone === "warning" && "bg-warning/20 text-warning-foreground",
        tone === "danger" && "bg-destructive/12 text-destructive",
        tone === "primary" && "bg-primary/10 text-primary",
        tone === "muted" && "bg-secondary text-secondary-foreground",
      )}
    >
      {children}
    </span>
  );
}

export function Bar({ value, tone }: { value: number; tone: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: tone }}
      />
    </div>
  );
}
