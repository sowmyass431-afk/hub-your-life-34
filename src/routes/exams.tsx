import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EntityDialog, type Field } from "@/components/entity-dialog";
import { Empty, PageHeader, StatusPill } from "@/components/shell";
import { uid, useCollections } from "@/lib/store";
import type { Exam } from "@/lib/types";
import { daysUntil, fmtTime, prettyDate, todayISO } from "@/lib/time";

export const Route = createFileRoute("/exams")({
  head: () => ({
    meta: [
      { title: "Exam Schedule — Student Hub" },
      {
        name: "description",
        content: "Keep your exam dates, rooms and syllabus in one place with a live countdown.",
      },
      { property: "og:title", content: "Exam Schedule — Student Hub" },
      {
        property: "og:description",
        content: "Upcoming exams with dates, timings, rooms and syllabus notes.",
      },
    ],
  }),
  component: ExamsPage,
});

function ExamsPage() {
  const { data, exams } = useCollections();

  const fields: Field[] = [
    {
      name: "subject",
      label: "Subject",
      type: data.subjects.length ? "select" : "text",
      options: data.subjects.map((s) => s.name),
      required: true,
    },
    { name: "date", label: "Date", type: "date", required: true },
    { name: "time", label: "Time", type: "time", required: true },
    { name: "room", label: "Room / Hall", placeholder: "Exam Hall 2" },
    { name: "syllabus", label: "Syllabus / topics", type: "textarea" },
  ];

  const save = (v: (k: string) => string, id?: string) => {
    const payload = {
      subject: v("subject"),
      date: v("date"),
      time: v("time"),
      room: v("room"),
      syllabus: v("syllabus"),
    };
    if (id) {
      exams.edit(id, payload);
      toast.success("Exam updated");
    } else {
      exams.add({ id: uid(), ...payload } as Exam);
      toast.success("Exam added");
    }
  };

  const sorted = [...data.exams].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const upcoming = sorted.filter((e) => e.date >= todayISO());
  const past = sorted.filter((e) => e.date < todayISO());

  return (
    <div>
      <PageHeader
        title="Exams"
        subtitle="Countdown to every upcoming exam."
        action={
          <EntityDialog
            title="Add exam"
            fields={fields}
            initial={{ date: todayISO(), time: "09:00" }}
            onSubmit={(v) => save(v)}
            trigger={
              <Button>
                <Plus className="mr-1.5 size-4" /> Add exam
              </Button>
            }
          />
        }
      />

      <div className="grid gap-3">
        {upcoming.length ? (
          upcoming.map((e) => {
            const d = daysUntil(e.date);
            return (
              <div key={e.id} className="surface p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{e.subject}</h3>
                      <StatusPill tone={d <= 3 ? "danger" : d <= 7 ? "warning" : "primary"}>
                        {d === 0 ? "Today" : d === 1 ? "Tomorrow" : `in ${d} days`}
                      </StatusPill>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {prettyDate(e.date)} · {fmtTime(e.time)}
                      {e.room ? ` · ${e.room}` : ""}
                    </p>
                    {e.syllabus && <p className="mt-2 text-sm">{e.syllabus}</p>}
                  </div>
                  <Actions
                    fields={fields}
                    exam={e}
                    onSave={(v) => save(v, e.id)}
                    onDelete={() => {
                      exams.remove(e.id);
                      toast.success("Exam deleted");
                    }}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <Empty text="No upcoming exams. Add one to start the countdown." />
        )}
      </div>

      {past.length > 0 && (
        <>
          <h2 className="mt-8 mb-3 text-lg font-bold">Past exams</h2>
          <div className="grid gap-3">
            {past.map((e) => (
              <div key={e.id} className="surface flex items-center justify-between p-4 opacity-70">
                <div>
                  <p className="font-semibold">{e.subject}</p>
                  <p className="text-sm text-muted-foreground">{prettyDate(e.date)}</p>
                </div>
                <Actions
                  fields={fields}
                  exam={e}
                  onSave={(v) => save(v, e.id)}
                  onDelete={() => {
                    exams.remove(e.id);
                    toast.success("Exam deleted");
                  }}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Actions({
  fields,
  exam,
  onSave,
  onDelete,
}: {
  fields: Field[];
  exam: Exam;
  onSave: (v: (k: string) => string) => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex shrink-0 gap-2">
      <EntityDialog
        title="Edit exam"
        fields={fields}
        initial={{
          subject: exam.subject,
          date: exam.date,
          time: exam.time,
          room: exam.room,
          syllabus: exam.syllabus,
        }}
        onSubmit={onSave}
        trigger={
          <Button size="sm" variant="outline">
            <Pencil className="size-4" />
          </Button>
        }
      />
      <Button size="sm" variant="outline" onClick={onDelete}>
        <Trash2 className="size-4 text-destructive" />
      </Button>
    </div>
  );
}
