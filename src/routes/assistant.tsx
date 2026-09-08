import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Send, Sparkles } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/shell";
import { askAssistant } from "@/lib/ai.functions";
import { useStore } from "@/lib/store";
import { overall, percent, status } from "@/lib/attendance";
import { nextClass, todayISO } from "@/lib/time";

export const Route = createFileRoute("/assistant")({
  head: () => ({
    meta: [
      { title: "AI Study Assistant — Student Hub" },
      {
        name: "description",
        content:
          "Ask an AI study assistant for study plans, doubt solving and attendance strategy based on your own data.",
      },
      { property: "og:title", content: "AI Study Assistant — Student Hub" },
      {
        property: "og:description",
        content: "Personalised study help that knows your timetable, attendance and deadlines.",
      },
    ],
  }),
  component: AssistantPage,
});

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Make me a study plan for this week",
  "Which subject should I focus on based on my attendance?",
  "Explain normalization in DBMS simply",
  "How do I prepare for my next exam?",
];

function AssistantPage() {
  const { data } = useStore();
  const ask = useServerFn(askAssistant);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const buildContext = () => {
    const all = overall(data.subjects);
    const next = nextClass(data.classes);
    const pending = data.assignments.filter((a) => a.status !== "Completed");
    return [
      `Overall attendance: ${all.pct.toFixed(1)}% (${all.attended}/${all.total}).`,
      `Subjects: ${
        data.subjects
          .map(
            (s) =>
              `${s.name} ${percent(s.attended, s.total).toFixed(0)}% (${status(
                percent(s.attended, s.total),
              )})`,
          )
          .join("; ") || "none"
      }.`,
      next
        ? `Next class: ${next.slot.subject} on ${next.slot.day} at ${next.slot.start}.`
        : "No classes scheduled.",
      `Pending assignments: ${
        pending.map((a) => `${a.title} (${a.subject}, due ${a.due}, ${a.priority})`).join("; ") ||
        "none"
      }.`,
      `Upcoming exams: ${
        data.exams
          .filter((e) => e.date >= todayISO())
          .map((e) => `${e.subject} on ${e.date}`)
          .join("; ") || "none"
      }.`,
    ].join("\n");
  };

  const send = async (text: string) => {
    const question = text.trim();
    if (!question || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: question }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await ask({ data: { messages: next.slice(-12), context: buildContext() } });
      setMessages([...next, { role: "assistant", content: res.reply }]);
      if (res.error) toast.error("The assistant had trouble answering.");
    } catch {
      toast.error("Could not reach the assistant.");
      setMessages([
        ...next,
        { role: "assistant", content: "Something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
      requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: "smooth" }));
    }
  };

  return (
    <div>
      <PageHeader
        title="AI study assistant"
        subtitle="It already knows your attendance, timetable and deadlines."
      />

      <div className="surface flex min-h-[60vh] flex-col p-4">
        <div className="flex-1 space-y-4 overflow-y-auto">
          {messages.length === 0 && (
            <div className="py-8 text-center">
              <span className="hero-gradient mx-auto grid size-12 place-items-center rounded-2xl">
                <Sparkles className="size-6" />
              </span>
              <p className="mt-4 font-semibold">Ask anything about your studies</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Study plans, doubts, exam prep or attendance strategy.
              </p>
              <div className="mx-auto mt-5 flex max-w-xl flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <Button key={s} size="sm" variant="outline" onClick={() => send(s)}>
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Thinking…
            </div>
          )}
          <div ref={endRef} />
        </div>

        <form
          className="mt-4 flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
        >
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send(input);
              }
            }}
            rows={2}
            placeholder="Ask your question…"
            className="min-h-11 resize-none"
          />
          <Button type="submit" disabled={loading || !input.trim()} className="h-11">
            <Send className="size-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
