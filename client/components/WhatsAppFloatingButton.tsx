import { useEffect, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface WhatsAppNumber {
  id: string;
  number: string;
  label: string;
  isActive: boolean;
}

interface WhatsAppConfig {
  numbers: WhatsAppNumber[];
  initialMessage: string;
}

export function WhatsAppFloatingButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<WhatsAppConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch("/api/whatsapp/config");
        if (response.ok) {
          const data = await response.json();
          setConfig(data);
        }
      } catch (error) {
        console.error("Error fetching WhatsApp config:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  const handleWhatsAppClick = (number: string) => {
    const message = encodeURIComponent(config?.initialMessage || "Hello!");
    const whatsappUrl = `https://wa.me/${number.replace(/\D/g, "")}?text=${message}`;
    window.open(whatsappUrl, "_blank");
    setIsOpen(false);
  };

  // Filter to show only active numbers
  const activeNumbers = config?.numbers.filter((n) => n.isActive) || [];

  if (loading || !config || activeNumbers.length === 0) {
    return null;
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
        title="Chat with WhatsApp"
        aria-label="Open WhatsApp chat"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* Sheet for selecting number */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="bottom" className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-green-500" />
              Contact us via WhatsApp
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-3">
            {config.numbers.length === 1 ? (
              <div>
                <p className="text-sm text-muted-foreground mb-4">
                  Click below to chat with us on WhatsApp:
                </p>
                <Button
                  onClick={() => handleWhatsAppClick(config.numbers[0].number)}
                  className="w-full bg-green-500 hover:bg-green-600 text-white"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  {config.numbers[0].label}
                </Button>
              </div>
            ) : (
              <div>
                <p className="text-sm text-muted-foreground mb-4">
                  Choose a support team to chat with:
                </p>
                {config.numbers.map((number) => (
                  <button
                    key={number.id}
                    onClick={() => handleWhatsAppClick(number.number)}
                    className="w-full p-3 mb-2 text-left border border-border rounded-lg hover:bg-muted transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <p className="font-medium text-sm">{number.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {number.number}
                      </p>
                    </div>
                    <MessageCircle className="w-4 h-4 text-green-500 group-hover:scale-110 transition-transform" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
