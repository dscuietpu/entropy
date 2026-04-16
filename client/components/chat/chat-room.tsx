"use client";

import { useEffect, useMemo, useState } from "react";
import { ImagePlus, LoaderCircle, SendHorizonal } from "lucide-react";

import { AuthGuard } from "@/components/auth/auth-guard";
import { cn, getErrorMessage } from "@/lib/utils";
import { useAuth, useSocket, useToast } from "@/hooks";
import { chatService } from "@/services";
import type { ChatMessage, MediaAttachment, UserRole } from "@/types";

interface ChatRoomProps {
  title: string;
  description: string;
  defaultRoomId: string;
  allowedRoles: UserRole[];
}

type IncomingSocketMessage = ChatMessage | { persisted?: boolean; id?: string };

function getAttachmentLabel(attachment: MediaAttachment) {
  return attachment.originalName || attachment.format || attachment.resourceType;
}

export function ChatRoom({ title, description, defaultRoomId, allowedRoles }: ChatRoomProps) {
  const { token, user } = useAuth();
  const { socket, isConnected, connect } = useSocket();
  const toast = useToast();
  const [chatRoomId, setChatRoomId] = useState(defaultRoomId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isReady = Boolean(token && chatRoomId.trim());

  useEffect(() => {
    if (!token || !chatRoomId.trim()) {
      setMessages([]);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const loadMessages = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await chatService.listRoomMessages(chatRoomId.trim(), token, { limit: 100 });
        if (isMounted) {
          setMessages(response.data);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(getErrorMessage(loadError, "Failed to load chat messages."));
          toast.error("Unable to load chat messages", getErrorMessage(loadError, "Failed to load chat messages."));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadMessages();

    return () => {
      isMounted = false;
    };
  }, [chatRoomId, token]);

  useEffect(() => {
    if (!socket || !chatRoomId.trim()) {
      return;
    }

    connect();
    socket.emit("chat:join", { chatRoomId: chatRoomId.trim() });

    const handleMessage = (payload: IncomingSocketMessage) => {
      if (!payload || typeof payload !== "object") {
        return;
      }

      if (!("chatRoomId" in payload) || payload.chatRoomId !== chatRoomId.trim()) {
        return;
      }

      setMessages((current) => {
        const typedPayload = payload as ChatMessage;

        const existingId = "id" in typedPayload ? typedPayload.id : undefined;
        if (existingId && current.some((item) => item.id === existingId)) {
          return current;
        }

        return [...current, typedPayload];
      });
    };

    socket.on("chat:message", handleMessage);

    return () => {
      socket.emit("chat:leave", { chatRoomId: chatRoomId.trim() });
      socket.off("chat:message", handleMessage);
    };
  }, [chatRoomId, connect, socket]);

  const sortedMessages = useMemo(
    () =>
      [...messages].sort(
        (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
      ),
    [messages],
  );

  const handleSend = async () => {
    if (!token || !chatRoomId.trim()) {
      setError("Choose a valid room before sending a message.");
      toast.info("Select a room first", "Choose a valid chat room before sending a message.");
      return;
    }

    if (!messageText.trim() && attachments.length === 0) {
      setError("Type a message or attach media before sending.");
      toast.info("Message required", "Type a message or attach media before sending.");
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      const createdMessage = await chatService.sendMessage(
        {
          chatRoomId: chatRoomId.trim(),
          message: messageText,
          attachments,
        },
        token,
      );

      setMessages((current) =>
        current.some((item) => item.id === createdMessage.id) ? current : [...current, createdMessage],
      );
      setMessageText("");
      setAttachments([]);
      toast.success("Message sent", "Your chat message was delivered.");
    } catch (sendError) {
      setError(getErrorMessage(sendError, "Failed to send message."));
      toast.error("Message failed", getErrorMessage(sendError, "Failed to send message."));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AuthGuard allowedRoles={allowedRoles}>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 pb-20 pt-6 sm:px-8 lg:px-12">
        <section className="rounded-[34px] border border-[var(--border)] bg-[linear-gradient(135deg,#0f766e_0%,#134e4a_55%,#10231b_100%)] px-6 py-8 text-white shadow-[0_25px_70px_rgba(15,118,110,0.24)] sm:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-100/90">Realtime chat</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-teal-50/86">{description}</p>
            </div>
            <div className="rounded-[24px] border border-white/12 bg-white/8 px-5 py-4 text-sm text-white/88 backdrop-blur">
              Socket: {isConnected ? "connected" : "connecting"}
            </div>
          </div>
        </section>

        <section className="rounded-[30px] border border-[var(--border)] bg-white/92 p-6 shadow-[0_20px_50px_rgba(16,35,27,0.06)]">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[var(--foreground)]">Chat room ID</span>
              <input
                value={chatRoomId}
                onChange={(event) => setChatRoomId(event.target.value)}
                placeholder="patient-hospital-room"
                className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
              />
            </label>

            <div className="flex items-end">
              <div className="rounded-2xl bg-[rgba(16,35,27,0.04)] px-4 py-3 text-sm text-[var(--muted)]">
                Signed in as {user?.name}
              </div>
            </div>
          </div>
        </section>

        {error ? (
          <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[30px] border border-[var(--border)] bg-white/92 shadow-[0_20px_50px_rgba(16,35,27,0.06)]">
            <div className="border-b border-[var(--border)] px-6 py-5">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Messages</h2>
              <p className="text-sm text-[var(--muted)]">Room: {chatRoomId || "Not selected"}</p>
            </div>

            <div className="max-h-[620px] space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
              {isLoading ? (
                <div className="flex items-center justify-center gap-3 py-16 text-sm text-[var(--muted)]">
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                  Loading messages...
                </div>
              ) : sortedMessages.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-lg font-semibold text-[var(--foreground)]">No messages yet</p>
                  <p className="mt-2 text-sm text-[var(--muted)]">Start the conversation in this room.</p>
                </div>
              ) : (
                sortedMessages.map((item) => {
                  const isOwnMessage = item.sender?._id === user?.id;

                  return (
                    <article
                      key={item.id}
                      className={cn(
                        "max-w-[92%] rounded-[24px] border px-4 py-4",
                        isOwnMessage
                          ? "ml-auto border-teal-200 bg-teal-50"
                          : "border-[var(--border)] bg-white",
                      )}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-[var(--foreground)]">
                            {item.sender?.name || item.senderRole}
                          </p>
                          <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                            {item.senderRole.replace("_", " ")}
                          </p>
                        </div>
                        <p className="text-xs text-[var(--muted)]">
                          {new Date(item.createdAt).toLocaleString()}
                        </p>
                      </div>

                      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[var(--foreground)]">
                        {item.message}
                      </p>

                      {item.attachments.length ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {item.attachments.map((attachment) =>
                            attachment.resourceType === "image" ? (
                              <img
                                key={attachment.publicId}
                                src={attachment.url}
                                alt={attachment.originalName || "Chat attachment"}
                                className="h-20 w-20 rounded-2xl border border-[var(--border)] object-cover"
                              />
                            ) : (
                              <a
                                key={attachment.publicId}
                                href={attachment.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex rounded-2xl border border-[var(--border)] bg-white px-3 py-2 text-xs font-medium text-[var(--foreground)]"
                              >
                                {getAttachmentLabel(attachment)}
                              </a>
                            ),
                          )}
                        </div>
                      ) : null}
                    </article>
                  );
                })
              )}
            </div>
          </div>

          <div className="rounded-[30px] border border-[var(--border)] bg-white/92 p-6 shadow-[0_20px_50px_rgba(16,35,27,0.06)]">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Send message</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Text and media attachments both work. Messages are sent through the backend and broadcast live over Socket.IO.
            </p>

            <div className="mt-6 space-y-4">
              <textarea
                value={messageText}
                onChange={(event) => setMessageText(event.target.value)}
                rows={7}
                placeholder="Type a message for this room..."
                className="w-full rounded-[24px] border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
              />

              <label className="flex cursor-pointer items-center gap-2 rounded-2xl border border-dashed border-[var(--border)] px-4 py-3 text-sm text-[var(--muted)] transition hover:border-[var(--primary)]">
                <ImagePlus className="h-4 w-4" />
                <span>{attachments.length ? `${attachments.length} file(s) selected` : "Add optional media attachments"}</span>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={(event) => setAttachments(Array.from(event.target.files ?? []))}
                />
              </label>

              {attachments.length ? (
                <div className="flex flex-wrap gap-2">
                  {attachments.map((file) => (
                    <span
                      key={`${file.name}-${file.size}`}
                      className="inline-flex rounded-full bg-[rgba(16,35,27,0.06)] px-3 py-1 text-xs font-medium text-[var(--foreground)]"
                    >
                      {file.name}
                    </span>
                  ))}
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={!isReady || isSending}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--primary-strong)] disabled:opacity-70"
              >
                {isSending ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <SendHorizonal className="h-4 w-4" />
                    Send message
                  </>
                )}
              </button>
            </div>
          </div>
        </section>
      </div>
    </AuthGuard>
  );
}
