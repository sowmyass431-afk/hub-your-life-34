import { useEffect, useState, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type Field = {
  name: string;
  label: string;
  type?: "text" | "number" | "date" | "time" | "url" | "textarea" | "select";
  options?: string[];
  required?: boolean;
  placeholder?: string;
  min?: number;
};

type Values = Record<string, string>;

export function EntityDialog({
  title,
  description,
  fields,
  initial,
  trigger,
  submitLabel = "Save",
  onSubmit,
}: {
  title: string;
  description?: string;
  fields: Field[];
  initial?: Values;
  trigger: ReactNode;
  submitLabel?: string;
  onSubmit: (values: Values) => void;
}) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Values>(initial ?? {});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setValues(initial ?? {});
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const set = (k: string, v: string) => setValues((s) => ({ ...s, [k]: v }));

  const submit = () => {
    for (const f of fields) {
      if (f.required && !String(values[f.name] ?? "").trim()) {
        setError(`${f.label} is required.`);
        return;
      }
    }
    onSubmit(values);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map((f) => (
            <div
              key={f.name}
              className={f.type === "textarea" ? "sm:col-span-2" : undefined}
            >
              <Label htmlFor={f.name} className="mb-1.5 block text-xs font-semibold">
                {f.label}
              </Label>
              {f.type === "textarea" ? (
                <Textarea
                  id={f.name}
                  rows={4}
                  placeholder={f.placeholder}
                  value={values[f.name] ?? ""}
                  onChange={(e) => set(f.name, e.target.value)}
                />
              ) : f.type === "select" ? (
                <Select value={values[f.name] ?? ""} onValueChange={(v) => set(f.name, v)}>
                  <SelectTrigger id={f.name}>
                    <SelectValue placeholder={`Select ${f.label.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {(f.options ?? []).map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id={f.name}
                  type={f.type ?? "text"}
                  min={f.min}
                  placeholder={f.placeholder}
                  value={values[f.name] ?? ""}
                  onChange={(e) => set(f.name, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
        {error && <p className="text-sm font-medium text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit}>{submitLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
