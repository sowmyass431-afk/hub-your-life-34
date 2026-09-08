import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      }),
    )
    .min(1)
    .max(30),
  context: z.string().max(4000).optional(),
});

export const askAssistant = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => schema.parse(input))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { reply: "The study assistant is not configured yet.", error: true };

    const system = [
      "You are the Student Hub study assistant for a Computer Science Engineering college student.",
      "Help with study plans, doubt solving, exam prep, attendance strategy and time management.",
      "Be concise, structured and practical. Use short markdown-free plain text with dashes for lists.",
      data.context ? `Student's current data summary:\n${data.context}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "system", content: system }, ...data.messages],
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("AI gateway error", res.status, text);
        return {
          reply:
            res.status === 429
              ? "Too many requests right now — please try again in a moment."
              : "The assistant could not answer right now. Please try again.",
          error: true,
        };
      }

      const json = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      return {
        reply: json.choices?.[0]?.message?.content ?? "No answer was returned.",
        error: false,
      };
    } catch (e) {
      console.error("AI request failed", e);
      return { reply: "The assistant is unreachable right now. Please try again.", error: true };
    }
  });
