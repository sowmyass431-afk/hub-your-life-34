import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EntityDialog, type Field } from "@/components/entity-dialog";
import { Empty, PageHeader } from "@/components/shell";
import { uid, useCollections } from "@/lib/store";
import type { Note } from "@/lib/types";

export const Route = createFileRoute("/notes")({
  head: () => ({
    meta: [
      { title: "Study Notes — Student Hub" },
      {
        name: "description",
        content: "Write and search subject-wise study notes for quick revision before exams.",
      },
      { property: "og:title", content: "Study Notes — Student Hub" },
      { property: "og:description", content: "Subject-wise notes you can search and revise anytime." },
    ],
  }),
  component: NotesPage,
});

function NotesPage() {
  const { data, notes } = useCollections();
  const [q, setQ] = useState("");

  const fields: Field[] = [
    { name: "title", label: "Title", required: true, placeholder: "Normalization forms" },
    {
      name: "subject",
      label: "Subject",
      type: data.subjects.length ? "select" : "text",
      options: data.subjects.map((s) => s.name),
    },
    { name: "body", label: "Notes", type: "textarea", required: true },
  ];

  const save = (v: (k: string) => string, id?: string) => {
    const payload = {
      title: v("title"),
      subject: v("subject"),
      body: v("body"),
      updatedAt: new Date().toISOString(),
    };
    if (id) {
      notes.edit(id, payload);
      toast.success("Note updated");
    } else {
      notes.add({ id: uid(), ...payload } as Note);
      toast.success("Note saved");
    }
  };

  const list = data.notes
    .filter((n) =>
      `${n.title} ${n.subject} ${n.body}`.toLowerCase().includes(q.trim().toLowerCase()),
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <div>
      <PageHeader
        title="Notes"
        subtitle="Quick revision notes, searchable."
        action={
          <EntityDialog
            title="New note"
            fields={fields}
            onSubmit={(v) => save(v)}
            trigger={
              <Button>
                <Plus className="mr-1.5 size-4" /> New note
              </Button>
            }
          />
        }
      />

      <div className="relative mb-4 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search notes"
          className="pl-9"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {list.length ? (
          list.map((n) => (
            <div key={n.id} className="surface flex flex-col p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold">{n.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {n.subject || "General"} · {new Date(n.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <EntityDialog
                    title="Edit note"
                    fields={fields}
                    initial={{ title: n.title, subject: n.subject, body: n.body }}
                    onSubmit={(v) => save(v, n.id)}
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
                      notes.remove(n.id);
                      toast.success("Note deleted");
                    }}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm text-foreground/90">{n.body}</p>
            </div>
          ))
        ) : (
          <Empty text={q ? "No notes match your search." : "No notes yet — write your first one."} />
        )}
      </div>
    </div>
  );
}
