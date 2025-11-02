import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "@/lib/admin-context";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Download, Eye, Copy, Mail, ArrowLeft } from "lucide-react";

type EmailTemplateType =
  | "order-created"
  | "order-payment-received"
  | "order-completed"
  | "order-status-changed"
  | "order-cancelled"
  | "refund-requested"
  | "refund-approved"
  | "refund-rejected"
  | "renewal-reminder"
  | "renewal-completed"
  | "signup-confirmation"
  | "account-verification"
  | "password-reset"
  | "transfer-form-submitted"
  | "transfer-form-status"
  | "document-uploaded"
  | "support-ticket-created"
  | "invoice-created"
  | "welcome-onboarding";

interface EmailTemplate {
  type: EmailTemplateType;
  category: string;
  name: string;
  description: string;
  subject: string;
}

const TEMPLATES: EmailTemplate[] = [
  { type: "order-created", category: "Orders", name: "Order Created", description: "Sent when customer completes checkout", subject: "Order Confirmed" },
  { type: "order-payment-received", category: "Orders", name: "Payment Received", description: "Sent when payment is processed", subject: "Payment Confirmed" },
  { type: "order-completed", category: "Orders", name: "Order Completed", description: "Sent when company is ready to use", subject: "Company Transfer Complete" },
  { type: "order-status-changed", category: "Orders", name: "Order Status Changed", description: "Sent on any status update", subject: "Order Status Updated" },
  { type: "order-cancelled", category: "Orders", name: "Order Cancelled", description: "Sent when order is cancelled", subject: "Order Cancelled" },
  
  { type: "refund-requested", category: "Refunds", name: "Refund Requested", description: "Sent when customer requests refund", subject: "Refund Request Received" },
  { type: "refund-approved", category: "Refunds", name: "Refund Approved", description: "Sent when admin approves refund", subject: "Refund Approved" },
  { type: "refund-rejected", category: "Refunds", name: "Refund Rejected", description: "Sent when admin rejects refund", subject: "Refund Request Status" },
  
  { type: "renewal-reminder", category: "Renewals", name: "Renewal Reminder", description: "Sent 30 days before expiry", subject: "Company Renewal Reminder" },
  { type: "renewal-completed", category: "Renewals", name: "Renewal Completed", description: "Sent after renewal processed", subject: "Company Renewal Complete" },
  
  { type: "signup-confirmation", category: "Accounts", name: "Sign-up Confirmation", description: "Sent when new account created", subject: "Welcome to Sharekte" },
  { type: "account-verification", category: "Accounts", name: "Account Verification", description: "Sent to verify email address", subject: "Verify Your Account" },
  { type: "password-reset", category: "Accounts", name: "Password Reset", description: "Sent when user requests reset", subject: "Reset Your Password" },
  
  { type: "transfer-form-submitted", category: "Transfer Forms", name: "Form Submitted", description: "Sent when form is submitted", subject: "Transfer Form Submitted" },
  { type: "transfer-form-status", category: "Transfer Forms", name: "Form Status Updated", description: "Sent when form status changes", subject: "Transfer Form Status Updated" },
  
  { type: "invoice-created", category: "Admin", name: "Invoice Created", description: "Sent when invoice generated", subject: "Invoice Created" },
  { type: "support-ticket-created", category: "Admin", name: "Support Ticket", description: "Sent on support request", subject: "Support Ticket Created" },
  { type: "document-uploaded", category: "Admin", name: "Document Uploaded", description: "Sent when file is uploaded", subject: "Document Uploaded" },
  { type: "welcome-onboarding", category: "Admin", name: "Welcome Guide", description: "Sent on first-time signup", subject: "Getting Started with Sharekte" },
];

export default function AdminEmailTemplates() {
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplateType | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [editSubject, setEditSubject] = useState<string>("");
  const [copied, setCopied] = useState(false);

  if (!isAdmin) {
    navigate("/admin/login");
    return null;
  }

  const handlePreview = async (type: EmailTemplateType) => {
    setSelectedTemplate(type);
    const template = TEMPLATES.find((t) => t.type === type);
    setEditSubject(template?.subject || "");
    
    try {
      const response = await fetch(`/api/email-preview?type=${type}`);
      const html = await response.text();
      setPreviewHtml(html);
      setPreviewOpen(true);
    } catch (error) {
      console.error("Failed to load preview:", error);
    }
  };

  const handleDownload = () => {
    if (!previewHtml) return;
    
    const element = document.createElement("a");
    element.setAttribute("href", "data:text/html;charset=utf-8," + encodeURIComponent(previewHtml));
    element.setAttribute("download", `email-${selectedTemplate}.html`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(previewHtml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendTest = async () => {
    const email = prompt("Enter email to send test:");
    if (!email) return;
    
    try {
      const response = await fetch("/api/send-test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: email,
          type: selectedTemplate,
        }),
      });
      
      if (response.ok) {
        alert("Test email sent successfully!");
      } else {
        alert("Failed to send test email");
      }
    } catch (error) {
      console.error("Error sending test email:", error);
      alert("Error sending test email");
    }
  };

  const categories = ["All", ...new Set(TEMPLATES.map((t) => t.category))];
  const filteredTemplates = filterCategory === "All" 
    ? TEMPLATES 
    : TEMPLATES.filter((t) => t.category === filterCategory);

  const groupedTemplates = filteredTemplates.reduce((acc, template) => {
    if (!acc[template.category]) acc[template.category] = [];
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, EmailTemplate[]>);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-7xl mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/admin")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
                <Mail className="w-6 h-6" />
                Email Templates
              </h1>
              <p className="text-xs text-muted-foreground">Manage and preview all email templates</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-7xl mx-auto px-4 py-8">
        {/* Filter */}
        <div className="mb-8 flex gap-2 flex-wrap">
          {categories.map((category) => (
            <Button
              key={category}
              variant={filterCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Templates Grid */}
        <div className="space-y-8">
          {Object.entries(groupedTemplates).map(([category, templates]) => (
            <div key={category}>
              <h2 className="text-xl font-semibold text-foreground mb-4">{category}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <div
                    key={template.type}
                    className="bg-card border border-border/40 rounded-lg p-6 hover:border-primary/50 transition-colors"
                  >
                    <h3 className="text-lg font-semibold text-foreground mb-2">{template.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{template.description}</p>
                    
                    <div className="mb-4 p-3 bg-muted rounded border border-border/50">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Subject Line:</p>
                      <p className="text-sm text-foreground font-medium">{template.subject}</p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handlePreview(template.type)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-6xl w-[95vw] h-[90vh] max-h-[90vh] flex flex-col p-0">
          <div className="flex justify-between items-start p-6 border-b">
            <div>
              <DialogTitle className="text-2xl">
                {TEMPLATES.find((t) => t.type === selectedTemplate)?.name}
              </DialogTitle>
              <DialogDescription>
                Preview your email template as recipients will see it
              </DialogDescription>
            </div>
          </div>

          <div className="flex-1 overflow-auto bg-muted rounded-none mx-6">
            <iframe
              srcDoc={previewHtml}
              className="w-full h-full border-none"
              title="Email Preview"
              sandbox="allow-same-origin"
            />
          </div>

          <div className="border-t p-6 flex gap-2 justify-between">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyCode}
              >
                <Copy className="w-4 h-4 mr-2" />
                {copied ? "Copied!" : "Copy HTML"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
            <Button
              variant="default"
              size="sm"
              onClick={handleSendTest}
            >
              <Mail className="w-4 h-4 mr-2" />
              Send Test
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
