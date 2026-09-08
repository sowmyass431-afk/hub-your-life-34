import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EntityDialog } from "@/components/entity-dialog";
import { Empty, PageHeader, StatusPill } from "@/components/shell";
import { uid, useCollections } from "@/lib/store";
import { DAYS, type ClassSlot, type Day } from "@/lib/types";
import { classesFor, currentClass, dayName, fmtTime, nextClass, todayISO } from "@/lib/time";

export const Route = createFileRoute("/timetable")({
  head: () => ({
    meta: [
      { title: "Weekly Timetable — Student Hub" },
      {
        name: "description",
        content: "Add, edit and track your college classes across the week with teachers and rooms.",
      },
      { property: "og:title", content: "Weekly Timetable — Student Hub" },
      {
        property: "og:description",
        content: "Manage class slots, teachers, classrooms and see your next class.",
      },
    ],
  }),
  component: TimetablePage,
});

const fields = (subjects: string[]) => [
  { name: "subject", label: "Subject", required: true, placeholder: "Data Structures" },
  { name: "teacher", label: "Teacher", placeholder: "Dr. Rao" },
  { name: "room", label: "Classroom", placeholder: "CS-201" },
  { name: "day", label: "Day", type: "select" as const, options: DAYS, required: true },
  { name: "start", label: "Start time", type: "time" as const, required: true },
  { name: "end", label: "End time", type: "time" as const, required: true },
  ...(subjects.length
    ? []
    : []),
];

function TimetablePage() {
  const { data, classes } = useCollections();
  const [selectedDay, setSelectedDay] = useState<Day>(dayName());
  const today = dayName();
  const now = currentClass(data.classes);
  const upcoming = nextClass(data.classes);
  const subjectNames = data.subjects.map((s) => s.name);

  const save = (v: Record<string, string>, id?: string) => {
    if (v.start >= v.end) {
      toast.error("End time must be after start time.");
      return;
    }
    const payload = {
      subject: v.subject.trim(),
      teacher: v.teacher?.trim() ?? "",
      room: v.room?.trim() ?? "",
      day: v.day as Day,
      start: v.start,
      end: v.end,
    };
    if (id) {
      classes.edit(id, payload);
      toast.success("Class updated");
    } else {
      classes.add({ id: uid(), ...payload } as ClassSlot);
      toast.success("Class added");
    }
  };

  const Card = ({ slot }: { slot: ClassSlot }) => {
    const isNow = now?.id === slot.id;
    const done = slot.completedOn === todayISO();
    return (
      <div
        className={`surface flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between ${
          isNow ? "ring-2 ring-primary" : ""
        }`}
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{slot.subject}</p>
            {isNow && <StatusPill tone="primary">Happening now</StatusPill>}
            {done && <StatusPill tone="success">Completed today</StatusPill>}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {fmtTime(slot.start)} – {fmtTime(slot.end)}
            {slot.teacher ? ` · ${slot.teacher}` : ""}
            {slot.room ? ` · ${slot.room}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button
            size="sm"
            variant={done ? "secondary" : "outline"}
            onClick={() => {
              classes.edit(slot.id, { completedOn: done ? undefined : todayISO() });
              toast.success(done ? "Marked as not completed" : "Class marked completed");
            }}
          >
            <CheckCircle2 className="mr-1.5 size-4" />
            {done ? "Undo" : "Complete"}
          </Button>
          <EntityDialog
            title="Edit class"
            fields={fields(subjectNames)}
            initial={{
              subject: slot.subject,
              teacher: slot.teacher,
              room: slot.room,
              day: slot.day,
              start: slot.start,
              end: slot.end,
            }}
            onSubmit={(v) => save(v, slot.id)}
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
              classes.remove(slot.id);
              toast.success("Class deleted");
            }}
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div>
      <PageHeader
        title="Timetable"
        subtitle="Your weekly class schedule with teachers and classrooms."
        action={
          <EntityDialog
            title="Add class"
            description="Add a subject slot to your weekly schedule."
            fields={fields(subjectNames)}
            initial={{ day: today, start: "09:00", end: "10:00" }}
            onSubmit={(v) => save(v)}
            trigger={
              <Button>
                <Plus className="mr-1.5 size-4" /> Add class
              </Button>
            }
          />
        }
      />

      <div className="surface mb-6 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Next upcoming class
        </p>
        {upcoming ? (
          <p className="mt-1 font-semibold">
            {upcoming.slot.subject} · {upcoming.slot.day} {fmtTime(upcoming.slot.start)}
            {upcoming.slot.room ? ` · ${upcoming.slot.room}` : ""}
          </p>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">No classes scheduled yet.</p>
        )}
      </div>

      <Tabs defaultValue="day">
        <TabsList>
          <TabsTrigger value="day">Daily</TabsTrigger>
          <TabsTrigger value="week">Weekly</TabsTrigger>
        </TabsList>

        <TabsContent value="day" className="mt-4">
          <div className="mb-4 flex flex-wrap gap-2">
            {DAYS.map((d) => (
              <Button
                key={d}
                size="sm"
                variant={selectedDay === d ? "default" : "outline"}
                onClick={() => setSelectedDay(d)}
              >
                {d.slice(0, 3)}
              </Button>
            ))}
          </div>
          <div className="grid gap-3">
            {classesFor(selectedDay, data.classes).length ? (
              classesFor(selectedDay, data.classes).map((s) => <Card key={s.id} slot={s} />)
            ) : (
              <Empty text={`No classes on ${selectedDay}.`} />
            )}
          </div>
        </TabsContent>

        <TabsContent value="week" className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {DAYS.map((d) => (
              <div key={d} className="surface p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-bold">{d}</h3>
                  {d === today && <StatusPill tone="primary">Today</StatusPill>}
                </div>
                <div className="grid gap-2">
                  {classesFor(d, data.classes).length ? (
                    classesFor(d, data.classes).map((s) => (
                      <div
                        key={s.id}
                        className={`rounded-lg border border-border p-2.5 text-sm ${
                          now?.id === s.id ? "border-primary bg-primary/5" : ""
                        }`}
                      >
                        <p className="font-semibold">{s.subject}</p>
                        <p className="text-xs text-muted-foreground">
                          {fmtTime(s.start)} – {fmtTime(s.end)}
                          {s.room ? ` · ${s.room}` : ""}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">Free day</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
