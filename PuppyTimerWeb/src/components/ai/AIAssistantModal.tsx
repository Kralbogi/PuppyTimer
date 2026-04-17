// =============================================================================
// PawLand - AI Assistant Modal
// Claude API powered dog care assistant
// =============================================================================

import React, { useState, useRef, useEffect } from "react";
import { X, Send, Bot, Loader2 } from "lucide-react";
import { getir } from "../../services/apiKeyStorage";

interface AIAssistantModalProps {
  onClose: () => void;
  dogName?: string;
  dogBreed?: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  onClose,
  dogName = "köpeğiniz",
  dogBreed = "",
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Merhaba! Ben PawLand AI asistanınızım. ${dogName}${
        dogBreed ? ` (${dogBreed})` : ""
      } hakkında sorularınızı cevaplayabilirim. Sağlık, davranış, beslenme, eğitim konularında yardımcı olabilirim. `,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if API key exists
    const checkApiKey = async () => {
      const key = await getir();
      setHasApiKey(!!key);
    };
    checkApiKey();
  }, []);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || !hasApiKey) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const apiKey = await getir();
      if (!apiKey) {
        throw new Error("API key bulunamadı");
      }

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 1024,
          messages: [
            {
              role: "user",
              content: `Sen bir köpek bakım uzmanısın. ${
                dogBreed
                  ? `${dogBreed} ırkı hakkında bilgin var.`
                  : ""
              } Kısa ve yardımcı cevaplar ver. Soru: ${userMessage}`,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error("API isteği başarısız");
      }

      const data = await response.json();
      const assistantMessage =
        data.content[0]?.text || "Üzgünüm, bir sorun oluştu.";

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: assistantMessage },
      ]);
    } catch (error) {
      console.error("AI error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Üzgünüm, bir hata oluştu. API anahtarınızı kontrol edin veya daha sonra tekrar deneyin.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <Bot size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                AI Köpek Asistanı
              </h2>
              <p className="text-xs text-gray-500">
                Claude AI tarafından destekleniyor
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!hasApiKey ? (
            <div className="text-center py-8">
              <Bot size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-600 mb-2">
                AI asistanı kullanmak için Claude API anahtarı gerekli
              </p>
              <p className="text-sm text-gray-500">
                Ayarlar → Claude API bölümünden ekleyebilirsiniz
              </p>
            </div>
          ) : (
            <>
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      msg.role === "user"
                        ? "bg-orange-500 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-2xl px-4 py-2">
                    <Loader2
                      size={16}
                      className="animate-spin text-gray-600"
                    />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        {hasApiKey && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSend()}
                placeholder="Sorunuzu yazın..."
                disabled={isLoading}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all disabled:bg-gray-50"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-300 disabled:to-gray-400 text-white font-medium rounded-xl transition-colors flex items-center gap-2"
              >
                <Send size={18} />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
               İpucu: Sağlık, davranış, beslenme ve eğitim hakkında soru
              sorabilirsiniz
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAssistantModal;
