
"use client";

import { useEffect, useState, FormEvent } from "react";

type Message = {
  id: string;
  text: string;
  sender: "user" | "assistant";
};

type Conversation = {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
};

type AssistantChatProps = {
  embedded?: boolean;
};

const suggestions = [
  "Help me find a rental home",
  "How does HOMZY work?",
  "What should I check before renting?",
  "How can I book a property visit?",
];

const welcomeMessage: Message = {
  id: "welcome",
  text: "Hello! Welcome to HOMZY. I'm your AI rental assistant. How can I help you find your perfect home today?",
  sender: "assistant",
};

export default function AssistantChat({
  embedded = false,
}: AssistantChatProps) {
  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      try {
        const response = await fetch("/api/assistant", {
          method: "GET",
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to load chat history.");
        }

        if (cancelled) return;

        const savedConversations: Conversation[] =
          data.conversations || [];

        setConversations(savedConversations);

        if (savedConversations.length > 0) {
          const latest = savedConversations[0];

          const detailResponse = await fetch(
            `/api/assistant?conversationId=${encodeURIComponent(latest.id)}`,
            { cache: "no-store" }
          );

          const detailData = await detailResponse.json();

          if (!detailResponse.ok) {
            throw new Error(
              detailData.error || "Unable to load conversation."
            );
          }

          if (cancelled) return;

          setConversationId(latest.id);

          const savedMessages: Message[] =
            (detailData.conversation?.messages || []).map(
              (message: {
                id: string;
                role: "USER" | "ASSISTANT";
                content: string;
              }) => ({
                id: message.id,
                text: message.content,
                sender:
                  message.role === "USER" ? "user" : "assistant",
              })
            );

          setMessages(
            savedMessages.length > 0
              ? savedMessages
              : [welcomeMessage]
          );
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Chat history error:", err);
          setError("Unable to load your previous conversations.");
        }
      } finally {
        if (!cancelled) {
          setHistoryLoading(false);
        }
      }
    }

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, []);

  async function refreshConversations() {
    try {
      const response = await fetch("/api/assistant", {
        cache: "no-store",
      });

      const data = await response.json();

      if (response.ok) {
        setConversations(data.conversations || []);
      }
    } catch (err) {
      console.error("Unable to refresh conversations:", err);
    }
  }

  async function openConversation(id: string) {
    if (loading || historyLoading) return;

    setHistoryLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/assistant?conversationId=${encodeURIComponent(id)}`,
        { cache: "no-store" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to open conversation.");
      }

      const savedMessages: Message[] =
        (data.conversation?.messages || []).map(
          (message: {
            id: string;
            role: "USER" | "ASSISTANT";
            content: string;
          }) => ({
            id: message.id,
            text: message.content,
            sender: message.role === "USER" ? "user" : "assistant",
          })
        );

      setConversationId(id);

      setMessages(
        savedMessages.length > 0
          ? savedMessages
          : [welcomeMessage]
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to open this conversation."
      );
    } finally {
      setHistoryLoading(false);
    }
  }

  function startNewChat() {
    if (loading) return;

    setConversationId(null);
    setMessages([welcomeMessage]);
    setInput("");
    setError("");
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const question = input.trim();

    if (!question || loading || historyLoading) return;

    const temporaryId = `user-${Date.now()}`;

    setMessages((previous) => [
      ...previous,
      {
        id: temporaryId,
        text: question,
        sender: "user",
      },
    ]);

    setInput("");
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: question,
          ...(conversationId ? { conversationId } : {}),
        }),
      });

      const data = await response.json();

      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to get a response from HOMZY AI."
        );
      }

      setMessages((previous) => [
        ...previous,
        {
          id: `assistant-${Date.now()}`,
          text: data.reply,
          sender: "assistant",
        },
      ]);

      if (data.conversationId) {
        await refreshConversations();
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.";

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  function handleSuggestion(suggestion: string) {
    setInput(suggestion);
  }

  return (
    <main
      className={
        embedded
          ? "bg-[#F5F0E6] px-4 py-10 sm:px-6"
          : "min-h-screen bg-[#F5F0E6] px-4 py-8 sm:px-6"
      }
    >
      <div className="mx-auto max-w-6xl">
        {/* HEADER */}
        <div className="mb-6 rounded-2xl bg-[#17233F] p-6 text-white shadow-lg sm:p-8">
          <p className="mb-2 text-sm font-semibold tracking-[0.25em] text-[#B18A42]">
            HOMZY
          </p>

          <h1 className="text-3xl font-bold sm:text-4xl">
            Your AI Home Assistant
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-200 sm:text-base">
            Ask questions, explore rental options and get help throughout
            your home-finding journey.
          </p>

          <div className="mt-5 h-1 w-20 rounded-full bg-[#B18A42]" />
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[260px_1fr]">
          {/* CONVERSATION HISTORY */}
          <aside className="rounded-2xl border border-[#E5DCCB] bg-white p-4 shadow-lg">
            <button
              type="button"
              onClick={startNewChat}
              disabled={loading}
              className="w-full rounded-xl bg-[#17233F] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#26395F] disabled:opacity-50"
            >
              + New Conversation
            </button>

            <h2 className="mb-3 mt-6 text-xs font-bold uppercase tracking-wider text-[#8B754C]">
              Recent Conversations
            </h2>

            {historyLoading ? (
              <p className="text-sm text-gray-500">
                Loading conversations...
              </p>
            ) : conversations.length === 0 ? (
              <p className="text-sm text-gray-500">
                Your conversations will appear here.
              </p>
            ) : (
              <div className="flex max-h-[350px] flex-col gap-2 overflow-y-auto">
                {conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => openConversation(conversation.id)}
                    disabled={loading}
                    className={`rounded-lg border px-3 py-3 text-left text-sm transition ${
                      conversationId === conversation.id
                        ? "border-[#B18A42] bg-[#F5F0E6] text-[#17233F]"
                        : "border-transparent bg-[#FAF8F3] text-[#27334B] hover:border-[#D8C69F]"
                    }`}
                  >
                    <span className="block truncate font-medium">
                      {conversation.title || "New conversation"}
                    </span>

                    <span className="mt-1 block text-xs text-gray-500">
                      {new Date(
                        conversation.updatedAt
                      ).toLocaleDateString()}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </aside>

          {/* CHAT WINDOW */}
          <section className="overflow-hidden rounded-2xl border border-[#E5DCCB] bg-white shadow-lg">
            {/* CHAT HEADER */}
            <div className="flex items-center gap-3 bg-[#17233F] px-5 py-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#B18A42] text-xl text-white">
                ✦
              </div>

              <div>
                <h2 className="font-semibold text-white">
                  HOMZY Assistant
                </h2>

                <p className="text-xs text-gray-300">
                  Your rental help companion
                </p>
              </div>

              <div className="ml-auto flex items-center gap-2 text-xs text-[#E7C77D]">
                <span className="h-2 w-2 rounded-full bg-green-400" />
                Ready
              </div>
            </div>

            {/* MESSAGES */}
            <div className="flex min-h-[380px] max-h-[520px] flex-col gap-5 overflow-y-auto bg-[#FAF8F3] p-4 sm:p-6">
              {historyLoading && (
                <p className="text-center text-sm text-gray-500">
                  Loading your conversation...
                </p>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender === "user"
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm sm:max-w-[75%] ${
                      message.sender === "user"
                        ? "rounded-br-sm bg-[#17233F] text-white"
                        : "rounded-bl-sm border border-[#E5DCCB] bg-white text-[#27334B]"
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-white px-4 py-3 text-sm text-[#8B754C] shadow-sm">
                    HOMZY is thinking...
                  </div>
                </div>
              )}
            </div>

            {/* INPUT AREA */}
            <div className="border-t border-[#E5DCCB] bg-white p-4 sm:p-5">
              {error && (
                <div
                  role="alert"
                  className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                >
                  {error}
                </div>
              )}

              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#8B754C]">
                Suggested questions
              </p>

              <div className="mb-5 flex flex-wrap gap-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => handleSuggestion(suggestion)}
                    disabled={loading || historyLoading}
                    className="rounded-full border border-[#D8C69F] bg-[#FAF8F3] px-3 py-2 text-xs text-[#17233F] transition hover:bg-[#F0E5CC] disabled:opacity-50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask HOMZY anything about renting..."
                  maxLength={1000}
                  disabled={loading || historyLoading}
                  className="min-w-0 flex-1 rounded-xl border border-[#D9D3C8] px-4 py-3 text-sm text-[#17233F] outline-none transition focus:border-[#B18A42] focus:ring-2 focus:ring-[#B18A42]/20 disabled:bg-gray-100"
                />

                <button
                  type="submit"
                  disabled={!input.trim() || loading || historyLoading}
                  className="rounded-xl bg-[#17233F] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#26395F] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Send"}
                </button>
              </form>

              <p className="mt-3 text-center text-xs text-gray-400">
                HOMZY AI Assistant • Your home, your comfort
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
