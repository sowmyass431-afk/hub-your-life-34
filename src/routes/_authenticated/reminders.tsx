import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { EntityDialog, type Field } from "@/components/entity-dialog";
import { Empty, PageHeader, StatusPill } from "@/components/shell";
import { uid, useCollections } from "@/lib/store";
import type { Reminder } from "@/lib/types";
import { fmtTime, prettyDate, todayISO } from "@/lib/time";

export const Route = createFileRoute("/_authenticated/reminders")({
  head: () => ({
    meta: [
      { title: "Reminders — Student Hub" },
      {
        name: "description",
        content: "Never miss a fee deadline, lab record or club meeting with dated reminders.",
      },
      { property: "og:title", content: "Reminders — Student Hub" },
      { property: "og:description", content: "Dated reminders for everything college throws at you." },
    ],
  }),
  component: RemindersPage,
});

const fields: Field[] = [
  { name: "title", label: "Reminder", required: true, placeholder: "Submit lab record" },
  { name: "date", label: "Date", type: "date", required: true },
  { name: "time", label: "Time", type: "time", required: true },
];

function RemindersPage() {
  const { data, reminders } = useCollections();

  const save = (v: (k: string) => string, id?: string) => {
    const payload = { title: v("title"), date: v("date"), time: v("time") };
    if (id) {
      reminders.edit(id, payload);
      toast.success("Reminder updated");
    } else {
      reminders.add({ id: uid(), done: false, ...payload } as Reminder);
      toast.success("Reminder added");
    }
  };

  const sorted = [...data.reminders].sort((a, b) =>
    (a.date + a.time).localeCompare(b.date + b.time),
  );

  return (
    <div>
      <PageHeader
        title="Reminders"
        subtitle="Small things that cost marks when forgotten."
        action={
          <EntityDialog
            title="Add reminder"
            fields={fields}
            initial={{ date: todayISO(), time: "09:00" }}
            onSubmit={(v) => save(v)}
            trigger={
              <Button>
                <Plus className="mr-1.5 size-4" /> Add reminder
              </Button>
            }
          />
        }
      />

      <div className="grid gap-3">
        {sorted.length ? (
          sorted.map((r) => {
            const overdue = !r.done && r.date < todayISO();
            return (
              <div key={r.id} className="surface flex items-center gap-3 p-4">
                <Checkbox
                  checked={r.done}
                  onCheckedChange={(c) => reminders.edit(r.id, { done: Boolean(c) })}
                  aria-label="Mark reminder done"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className={`font-semibold ${r.done ? "text-muted-foreground line-through" : ""}`}>
                      {r.title}
                    </p>
                    {overdue && <StatusPill tone="danger">Overdue</StatusPill>}
                    {r.done && <StatusPill tone="success">Done</StatusPill>}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {prettyDate(r.date)} · {fmtTime(r.time)}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <EntityDialog
                    title="Edit reminder"
                    fields={fields}
                    initial={{ title: r.title, date: r.date, time: r.time }}
                    onSubmit={(v) => save(v, r.id)}
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
                      reminders.remove(r.id);
                      toast.success("Reminder deleted");
                    }}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </div>
            );
          })
        ) : (
          <Empty text="No reminders yet." />
        )}
      </div>
    </div>
  );
}
