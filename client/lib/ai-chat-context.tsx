import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface AIChatContextType {
  sessions: ChatSession[];
  currentSessionId: string | null;
  currentSession: ChatSession | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  startNewSession: (title?: string) => void;
  selectSession: (sessionId: string) => void;
  addMessage: (content: string, role: "user" | "assistant") => void;
  sendMessage: (content: string) => Promise<void>;
  updateCustomerData: (email: string, name: string, phone: string) => void;
  saveSession: () => Promise<void>;
  deleteSession: (sessionId: string) => void;
  clearError: () => void;
}

const AIChatContext = createContext<AIChatContextType | undefined>(undefined);

export function AIChatProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentSession =
    sessions.find((s) => s.id === currentSessionId) || null;

  const startNewSession = useCallback((title?: string) => {
    const newSession: ChatSession = {
      id: `session_${Date.now()}`,
      title: title || `Chat ${new Date().toLocaleDateString()}`,
      messages: [
        {
          id: `msg_${Date.now()}`,
          role: "assistant",
          content: `Hello! 👋 I'm Sharekte's AI Sales Agent. I can help you:\n\n✓ Browse our company listings\n✓ Answer questions about our services\n✓ Help you create and complete orders\n✓ Assist with checkout\n✓ Collect your information for processing\n\nWhat would you like to do today?`,
          timestamp: new Date(),
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
  }, []);

  const selectSession = useCallback((sessionId: string) => {
    setCurrentSessionId(sessionId);
  }, []);

  const addMessage = useCallback(
    (content: string, role: "user" | "assistant") => {
      if (!currentSessionId) return;

      const newMessage: Message = {
        id: `msg_${Date.now()}`,
        role,
        content,
        timestamp: new Date(),
      };

      setSessions((prev) =>
        prev.map((session) => {
          if (session.id === currentSessionId) {
            return {
              ...session,
              messages: [...session.messages, newMessage],
              updatedAt: new Date(),
            };
          }
          return session;
        }),
      );
    },
    [currentSessionId],
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (!currentSessionId) return;

      // Add user message
      addMessage(content, "user");
      setIsLoading(true);
      setError(null);

      try {
        // Send to backend for AI processing
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: currentSessionId,
            message: content,
            customerData: {
              email: currentSession?.customerEmail,
              name: currentSession?.customerName,
              phone: currentSession?.customerPhone,
            },
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to get AI response");
        }

        const data = await response.json();
        addMessage(data.reply, "assistant");
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        setError(errorMsg);
        addMessage(`Sorry, I encountered an error: ${errorMsg}`, "assistant");
      } finally {
        setIsLoading(false);
      }
    },
    [currentSessionId, currentSession, addMessage],
  );

  const updateCustomerData = useCallback(
    (email: string, name: string, phone: string) => {
      if (!currentSessionId) return;

      setSessions((prev) =>
        prev.map((session) => {
          if (session.id === currentSessionId) {
            return {
              ...session,
              customerEmail: email,
              customerName: name,
              customerPhone: phone,
            };
          }
          return session;
        }),
      );
    },
    [currentSessionId],
  );

  const saveSession = useCallback(async () => {
    if (!currentSession) return;

    try {
      const response = await fetch("/api/chat-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session: {
            id: currentSession.id,
            title: currentSession.title,
            messages: currentSession.messages,
            customerEmail: currentSession.customerEmail,
            customerName: currentSession.customerName,
            customerPhone: currentSession.customerPhone,
            createdAt: currentSession.createdAt,
            updatedAt: currentSession.updatedAt,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save session");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setError(errorMsg);
    }
  }, [currentSession]);

  const deleteSession = useCallback(
    (sessionId: string) => {
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (currentSessionId === sessionId) {
        setCurrentSessionId(sessions[0]?.id || null);
      }
    },
    [currentSessionId, sessions],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: AIChatContextType = {
    sessions,
    currentSessionId,
    currentSession,
    isLoading,
    error,
    startNewSession,
    selectSession,
    addMessage,
    sendMessage,
    updateCustomerData,
    saveSession,
    deleteSession,
    clearError,
  };

  return (
    <AIChatContext.Provider value={value}>{children}</AIChatContext.Provider>
  );
}

export function useAIChat() {
  const context = useContext(AIChatContext);
  if (context === undefined) {
    throw new Error("useAIChat must be used within AIChatProvider");
  }
  return context;
}
