import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EntityDialog, type Field } from "@/components/entity-dialog";
import { Empty, PageHeader, StatusPill } from "@/components/shell";
import { uid, useCollections } from "@/lib/store";
import type { Assignment, Priority, Status } from "@/lib/types";
import { daysUntil, prettyDate, todayISO } from "@/lib/time";

export const Route = createFileRoute("/_authenticated/assignments")({
  head: () => ({
    meta: [
      { title: "Assignments & Tasks — Student Hub" },
      {
        name: "description",
        content:
          "Track college assignments with subject, due date, priority and status. Spot overdue work instantly.",
      },
      { property: "og:title", content: "Assignments & Tasks — Student Hub" },
      {
        property: "og:description",
        content: "Add, edit, complete and filter your assignments by status and priority.",
      },
    ],
  }),
  component: AssignmentsPage,
});

const PRIORITIES: Priority[] = ["Low", "Medium", "High"];
const STATUSES: Status[] = ["Pending", "In Progress", "Completed"];

function AssignmentsPage() {
  const { data, assignments } = useCollections();
  const [filter, setFilter] = useState<"All" | Status | "Overdue">("All");

  const fields: Field[] = [
    { name: "title", label: "Title", required: true, placeholder: "DBMS ER diagram" },
    {
      name: "subject",
      label: "Subject",
      type: data.subjects.length ? "select" : "text",
      options: data.subjects.map((s) => s.name),
      required: true,
    },
    { name: "due", label: "Due date", type: "date", required: true },
    { name: "priority", label: "Priority", type: "select", options: PRIORITIES, required: true },
    { name: "status", label: "Status", type: "select", options: STATUSES, required: true },
    { name: "description", label: "Description", type: "textarea" },
  ];

  const save = (v: (k: string) => string, id?: string) => {
    const payload = {
      title: v("title"),
      subject: v("subject"),
      description: v("description"),
      due: v("due"),
      priority: v("priority") as Priority,
      status: v("status") as Status,
    };
    if (id) {
      assignments.edit(id, payload);
      toast.success("Assignment updated");
    } else {
      assignments.add({ id: uid(), ...payload } as Assignment);
      toast.success("Assignment added");
    }
  };

  const list = useMemo(() => {
    const sorted = [...data.assignments].sort((a, b) => a.due.localeCompare(b.due));
    if (filter === "All") return sorted;
    if (filter === "Overdue")
      return sorted.filter((a) => a.status !== "Completed" && a.due < todayISO());
    return sorted.filter((a) => a.status === filter);
  }, [data.assignments, filter]);

  const counts = {
    Pending: data.assignments.filter((a) => a.status === "Pending").length,
    "In Progress": data.assignments.filter((a) => a.status === "In Progress").length,
    Completed: data.assignments.filter((a) => a.status === "Completed").length,
    Overdue: data.assignments.filter((a) => a.status !== "Completed" && a.due < todayISO()).length,
  };

  return (
    <div>
      <PageHeader
        title="Assignments"
        subtitle="Everything you owe, sorted by due date."
        action={
          <EntityDialog
            title="Add assignment"
            fields={fields}
            initial={{ priority: "Medium", status: "Pending", due: todayISO() }}
            onSubmit={(v) => save(v)}
            trigger={
              <Button>
                <Plus className="mr-1.5 size-4" /> Add assignment
              </Button>
            }
          />
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(["Pending", "In Progress", "Completed", "Overdue"] as const).map((k) => (
          <div key={k} className="surface p-4">
            <p className="text-xs font-medium text-muted-foreground">{k}</p>
            <p className="mt-1 text-2xl font-bold">{counts[k]}</p>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {(["All", "Pending", "In Progress", "Completed", "Overdue"] as const).map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? "default" : "outline"}
            onClick={() => setFilter(f)}
          >
            {f}
          </Button>
        ))}
      </div>

      <div className="grid gap-3">
        {list.length ? (
          list.map((a) => {
            const overdue = a.status !== "Completed" && a.due < todayISO();
            const dLeft = daysUntil(a.due);
            return (
              <div key={a.id} className="surface p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3
                        className={`font-semibold ${
                          a.status === "Completed" ? "text-muted-foreground line-through" : ""
                        }`}
                      >
                        {a.title}
                      </h3>
                      <StatusPill
                        tone={
                          a.priority === "High"
                            ? "danger"
                            : a.priority === "Medium"
                              ? "warning"
                              : "muted"
                        }
                      >
                        {a.priority}
                      </StatusPill>
                      <StatusPill
                        tone={
                          a.status === "Completed"
                            ? "success"
                            : a.status === "In Progress"
                              ? "primary"
                              : "muted"
                        }
                      >
                        {a.status}
                      </StatusPill>
                      {overdue && <StatusPill tone="danger">Overdue</StatusPill>}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {a.subject} · due {prettyDate(a.due)}
                      {a.status !== "Completed" &&
                        ` · ${dLeft === 0 ? "today" : dLeft > 0 ? `in ${dLeft} day${dLeft > 1 ? "s" : ""}` : `${Math.abs(dLeft)} day${Math.abs(dLeft) > 1 ? "s" : ""} late`}`}
                    </p>
                    {a.description && <p className="mt-2 text-sm">{a.description}</p>}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant={a.status === "Completed" ? "secondary" : "outline"}
                      onClick={() => {
                        assignments.edit(a.id, {
                          status: a.status === "Completed" ? "Pending" : "Completed",
                        });
                        toast.success(
                          a.status === "Completed" ? "Marked pending" : "Assignment completed",
                        );
                      }}
                    >
                      <CheckCircle2 className="mr-1.5 size-4" />
                      {a.status === "Completed" ? "Undo" : "Complete"}
                    </Button>
                    <EntityDialog
                      title="Edit assignment"
                      fields={fields}
                      initial={{
                        title: a.title,
                        subject: a.subject,
                        due: a.due,
                        priority: a.priority,
                        status: a.status,
                        description: a.description,
                      }}
                      onSubmit={(v) => save(v, a.id)}
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
                        assignments.remove(a.id);
                        toast.success("Assignment deleted");
                      }}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <Empty text="Nothing here yet — add an assignment to get started." />
        )}
      </div>
    </div>
  );
}
