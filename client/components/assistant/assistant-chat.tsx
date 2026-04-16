"use client";

import { useState } from "react";
import { Bot, LoaderCircle, SendHorizonal, Sparkles, User2 } from "lucide-react";

import { getErrorMessage } from "@/lib/utils";
import { aiService } from "@/services";

interface AssistantMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface AssistantChatProps {
  initialContext?: string;
}

const starterPrompts = [
  "Which hospital module should I use for equipment tracking?",
  "How can patients find cardiology hospitals faster?",
  "Summarize how this platform helps hospital coordination.",
];

export function AssistantChat({ initialContext = "" }: AssistantChatProps) {
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: "assistant-welcome",
      role: "assistant",
      content:
        "Ask about hospitals, equipment coordination, appointments, or patient support flows. I’ll keep the answers short and practical.",
    },
  ]);
  const [message, setMessage] = useState("");
  const [context, setContext] = useState(initialContext);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const sendMessage = async (nextMessage: string) => {
    const trimmed = nextMessage.trim();
    if (!trimmed || isLoading) {
      return;
    }

    const userMessage: AssistantMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
    };

    setMessages((current) => [...current, userMessage]);
    setMessage("");
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const response = await aiService.chat({
        message: trimmed,
        context: context.trim() || undefined,
      });

      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: response.response.trim(),
        },
      ]);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Unable to reach the assistant right now."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 pb-20 pt-10 sm:px-8 lg:px-12">
      <section className="overflow-hidden rounded-[34px] border border-[var(--border)] bg-white/95 shadow-[var(--shadow)]">
        <div className="border-b border-[var(--border)] bg-[linear-gradient(140deg,rgba(10,32,28,0.98),rgba(15,118,110,0.94))] px-8 py-10 text-white">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-teal-100">
              <Sparkles className="h-4 w-4" />
              AI Assistant
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight">Healthcare coordination assistant</h1>
            <p className="mt-4 text-sm leading-8 text-white/78">
              Use this assistant for quick guidance on hospitals, equipment coordination, patient support flows, or MVP feature ideas.
            </p>
          </div>
        </div>

        <div className="grid gap-6 px-6 py-6 lg:grid-cols-[0.88fr_1.12fr] lg:px-8">
          <aside className="space-y-5">
            <div className="rounded-[26px] border border-[var(--border)] bg-[var(--card)] p-5">
              <p className="text-sm font-semibold text-[var(--foreground)]">Optional context</p>
              <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                Add page context if you want more grounded answers, for example a hospital profile summary or current user flow.
              </p>
              <textarea
                value={context}
                onChange={(event) => setContext(event.target.value)}
                rows={8}
                placeholder="Example: User is on the hospital detail page comparing cardiology facilities in Delhi."
                className="mt-4 w-full rounded-[22px] border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
              />
            </div>

            <div className="rounded-[26px] border border-[var(--border)] bg-[var(--card)] p-5">
              <p className="text-sm font-semibold text-[var(--foreground)]">Quick prompts</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {starterPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => {
                      setMessage(prompt);
                      void sendMessage(prompt);
                    }}
                    disabled={isLoading}
                    className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-left text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--primary)] disabled:opacity-60"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <section className="flex min-h-[560px] flex-col rounded-[28px] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(249,252,251,0.98),rgba(255,255,255,0.98))]">
            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
              {messages.map((entry) => {
                const isAssistant = entry.role === "assistant";

                return (
                  <article
                    key={entry.id}
                    className={`flex ${isAssistant ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-[24px] px-4 py-3 shadow-sm ${
                        isAssistant
                          ? "border border-[var(--border)] bg-white text-[var(--foreground)]"
                          : "bg-[var(--primary)] text-white"
                      }`}
                    >
                      <div
                        className={`mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] ${
                          isAssistant ? "text-[var(--primary)]" : "text-white/80"
                        }`}
                      >
                        {isAssistant ? <Bot className="h-3.5 w-3.5" /> : <User2 className="h-3.5 w-3.5" />}
                        {isAssistant ? "Assistant" : "You"}
                      </div>
                      <p className={`text-sm leading-7 ${isAssistant ? "text-[var(--muted)]" : "text-white"}`}>
                        {entry.content}
                      </p>
                    </div>
                  </article>
                );
              })}

              {isLoading ? (
                <div className="flex justify-start">
                  <div className="inline-flex items-center gap-2 rounded-[22px] border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--muted)] shadow-sm">
                    <LoaderCircle className="h-4 w-4 animate-spin text-[var(--primary)]" />
                    Thinking...
                  </div>
                </div>
              ) : null}
            </div>

            <div className="border-t border-[var(--border)] px-5 py-4">
              {errorMessage ? (
                <div className="mb-3 rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {errorMessage}
                </div>
              ) : null}

              <form
                className="flex flex-col gap-3 sm:flex-row"
                onSubmit={(event) => {
                  event.preventDefault();
                  void sendMessage(message);
                }}
              >
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows={3}
                  placeholder="Ask about hospitals, equipment support, appointments, or patient coordination..."
                  className="min-h-[84px] flex-1 rounded-[22px] border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
                />
                <button
                  type="submit"
                  disabled={isLoading || !message.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--primary-strong)] disabled:cursor-not-allowed disabled:opacity-70 sm:self-end"
                >
                  <SendHorizonal className="h-4 w-4" />
                  Send
                </button>
              </form>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
