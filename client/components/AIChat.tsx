import { useState, useRef, useEffect } from "react";
import { useAIChat } from "@/lib/ai-chat-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Send, MessageCircle, Loader, Plus } from "lucide-react";

export function AIChat() {
  const {
    currentSession,
    isLoading,
    sendMessage,
    startNewSession,
    addMessage,
  } = useAIChat();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [customerData, setCustomerData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentSession?.messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const message = input.trim();
    setInput("");
    await sendMessage(message);
  };

  const handleCollectData = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerData.email || !customerData.name || !customerData.phone) {
      alert("Please fill all fields");
      return;
    }

    addMessage(
      `My information:\nName: ${customerData.name}\nEmail: ${customerData.email}\nPhone: ${customerData.phone}`,
      "user",
    );
    setShowCustomerForm(false);
    setCustomerData({ name: "", email: "", phone: "" });
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
        aria-label="Open chat"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold">
          AI
        </span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 w-96 max-h-[600px] bg-white rounded-lg shadow-2xl flex flex-col border border-border/40">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-4 rounded-t-lg flex justify-between items-center">
        <div>
          <h3 className="font-semibold">Sharekte Sales Agent</h3>
          <p className="text-xs opacity-90">Powered by AI</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => startNewSession()}
            className="hover:bg-white/20 text-white"
            title="New conversation"
          >
            <Plus className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="hover:bg-white/20 text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
        {currentSession?.messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-lg ${
                msg.role === "user"
                  ? "bg-blue-600 text-white rounded-br-none"
                  : "bg-muted text-foreground rounded-bl-none"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap break-words">
                {msg.content}
              </p>
              <p className="text-xs opacity-70 mt-1">
                {msg.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted text-foreground px-4 py-2 rounded-lg rounded-bl-none flex items-center gap-2">
              <Loader className="w-4 h-4 animate-spin" />
              <span className="text-sm">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Customer Data Collection Form */}
      {showCustomerForm && (
        <div className="border-t p-4 bg-muted/50">
          <h4 className="text-sm font-semibold mb-3">Your Information</h4>
          <form onSubmit={handleCollectData} className="space-y-2">
            <Input
              type="text"
              placeholder="Full Name"
              value={customerData.name}
              onChange={(e) =>
                setCustomerData({ ...customerData, name: e.target.value })
              }
              className="text-sm"
            />
            <Input
              type="email"
              placeholder="Email Address"
              value={customerData.email}
              onChange={(e) =>
                setCustomerData({ ...customerData, email: e.target.value })
              }
              className="text-sm"
            />
            <Input
              type="tel"
              placeholder="Phone Number"
              value={customerData.phone}
              onChange={(e) =>
                setCustomerData({ ...customerData, phone: e.target.value })
              }
              className="text-sm"
            />
            <div className="flex gap-2">
              <Button type="submit" size="sm" className="flex-1 text-xs">
                Save
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCustomerForm(false)}
                className="flex-1 text-xs"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t p-4 bg-background space-y-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowCustomerForm(!showCustomerForm)}
          className="w-full text-xs"
        >
          {showCustomerForm ? "Hide Form" : "📋 Provide Your Info"}
        </Button>

        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            type="text"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="text-sm"
          />
          <Button
            type="submit"
            size="sm"
            disabled={!input.trim() || isLoading}
            className="px-3"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
