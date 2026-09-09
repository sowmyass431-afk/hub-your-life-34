import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EntityDialog, type Field } from "@/components/entity-dialog";
import { Empty, PageHeader, StatusPill } from "@/components/shell";
import { uid, useCollections } from "@/lib/store";
import type { LinkItem } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/links")({
  head: () => ({
    meta: [
      { title: "Important Links — Student Hub" },
      {
        name: "description",
        content: "Save the portals, drives and study resources you open every week.",
      },
      { property: "og:title", content: "Important Links — Student Hub" },
      { property: "og:description", content: "All your college portals and study resources in one list." },
    ],
  }),
  component: LinksPage,
});

const fields: Field[] = [
  { name: "label", label: "Label", required: true, placeholder: "College Portal" },
  { name: "url", label: "URL", type: "url", required: true, placeholder: "https://" },
  { name: "category", label: "Category", placeholder: "Academics" },
];

function LinksPage() {
  const { data, links } = useCollections();

  const save = (v: (k: string) => string, id?: string) => {
    let url = v("url");
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    const payload = { label: v("label"), url, category: v("category") || "General" };
    if (id) {
      links.edit(id, payload);
      toast.success("Link updated");
    } else {
      links.add({ id: uid(), ...payload } as LinkItem);
      toast.success("Link added");
    }
  };

  return (
    <div>
      <PageHeader
        title="Important links"
        subtitle="Portals, drives and study resources."
        action={
          <EntityDialog
            title="Add link"
            fields={fields}
            onSubmit={(v) => save(v)}
            trigger={
              <Button>
                <Plus className="mr-1.5 size-4" /> Add link
              </Button>
            }
          />
        }
      />

      <div className="grid gap-3 md:grid-cols-2">
        {data.links.length ? (
          data.links.map((l) => (
            <div key={l.id} className="surface flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{l.label}</p>
                  <StatusPill tone="muted">{l.category}</StatusPill>
                </div>
                <p className="truncate text-sm text-muted-foreground">{l.url}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button size="sm" variant="outline" asChild>
                  <a href={l.url} target="_blank" rel="noreferrer noopener" aria-label="Open link">
                    <ExternalLink className="size-4" />
                  </a>
                </Button>
                <EntityDialog
                  title="Edit link"
                  fields={fields}
                  initial={{ label: l.label, url: l.url, category: l.category }}
                  onSubmit={(v) => save(v, l.id)}
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
                    links.remove(l.id);
                    toast.success("Link deleted");
                  }}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))
        ) : (
          <Empty text="No links saved yet." />
        )}
      </div>
    </div>
  );
}
