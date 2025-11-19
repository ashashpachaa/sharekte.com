import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "@/lib/admin-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MessageCircle, Trash2, Plus, LogOut, ArrowLeft } from "lucide-react";

interface WhatsAppNumber {
  id: string;
  number: string;
  label: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface WhatsAppConfig {
  id: string;
  numbers: WhatsAppNumber[];
  initialMessage: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminWhatsAppSupport() {
  const { isAdmin, adminEmail, logout } = useAdmin();
  const navigate = useNavigate();

  const [config, setConfig] = useState<WhatsAppConfig | null>(null);
  const [initialMessage, setInitialMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newNumber, setNewNumber] = useState("");
  const [newLabel, setNewLabel] = useState("");

  useEffect(() => {
    if (!isAdmin) {
      navigate("/admin/login");
    }
  }, [isAdmin, navigate]);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/whatsapp/config");
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
        setInitialMessage(data.initialMessage);
      }
    } catch (error) {
      console.error("Error fetching config:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNumber = async () => {
    if (!newNumber || !newLabel) {
      alert("Please fill in both fields");
      return;
    }

    try {
      const response = await fetch("/api/whatsapp/numbers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number: newNumber, label: newLabel }),
      });

      if (response.ok) {
        setNewNumber("");
        setNewLabel("");
        setIsAddDialogOpen(false);
        await fetchConfig();
      }
    } catch (error) {
      console.error("Error adding number:", error);
      alert("Failed to add number");
    }
  };

  const handleDeleteNumber = async (id: string) => {
    if (!confirm("Are you sure you want to delete this number?")) {
      return;
    }

    try {
      const response = await fetch(`/api/whatsapp/numbers/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchConfig();
      }
    } catch (error) {
      console.error("Error deleting number:", error);
      alert("Failed to delete number");
    }
  };

  const handleSaveMessage = async () => {
    try {
      setSaving(true);
      const response = await fetch("/api/whatsapp/message", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: initialMessage }),
      });

      if (response.ok) {
        alert("Message saved successfully!");
        await fetchConfig();
      }
    } catch (error) {
      console.error("Error saving message:", error);
      alert("Failed to save message");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur">
        <div className="container max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/admin/dashboard")}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-2xl font-bold">WhatsApp Support Settings</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{adminEmail}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 py-8">
        <div className="grid gap-6">
          {/* Initial Message Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-green-500" />
                Initial Message
              </CardTitle>
              <CardDescription>
                This message will be sent to customers when they click the
                WhatsApp button
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={initialMessage}
                onChange={(e) => setInitialMessage(e.target.value)}
                placeholder="Enter the initial message..."
                className="min-h-24"
              />
              <Button
                onClick={handleSaveMessage}
                disabled={saving}
                className="bg-green-500 hover:bg-green-600"
              >
                {saving ? "Saving..." : "Save Message"}
              </Button>
            </CardContent>
          </Card>

          {/* Support Numbers Section */}
          <Card>
            <CardHeader>
              <CardTitle>Support Phone Numbers</CardTitle>
              <CardDescription>
                Add or manage WhatsApp support phone numbers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Number
              </Button>

              <div className="space-y-2">
                {config?.numbers && config.numbers.length > 0 ? (
                  config.numbers
                    .sort((a, b) => a.order - b.order)
                    .map((number) => (
                      <div
                        key={number.id}
                        className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div>
                          <p className="font-medium">{number.label}</p>
                          <p className="text-sm text-muted-foreground">
                            {number.number}
                          </p>
                          {!number.isActive && (
                            <p className="text-xs text-destructive">Inactive</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteNumber(number.id)}
                          className="p-2 hover:bg-destructive/10 rounded-lg transition-colors text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No support numbers added yet. Add one to get started.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Add Number Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Support Number</DialogTitle>
            <DialogDescription>
              Add a WhatsApp support number. Use the international format
              (e.g., +971501234567)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="tel"
              placeholder="Phone number (e.g., +971501234567)"
              value={newNumber}
              onChange={(e) => setNewNumber(e.target.value)}
            />
            <Input
              type="text"
              placeholder="Label (e.g., Sales Support)"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddNumber}
              className="bg-green-500 hover:bg-green-600"
            >
              Add Number
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
