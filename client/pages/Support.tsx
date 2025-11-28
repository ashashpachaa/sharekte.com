import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useSEO, getPageSEOMetadata } from "@/lib/seo";
import { useState } from "react";
import {
  Building2,
  DollarSign,
  FileText,
  User,
  HelpCircle,
  Mail,
  MessageSquare,
  FileUp,
  ChevronRight,
  Loader2,
  Search,
  X as CloseIcon,
  Download,
} from "lucide-react";

interface SupportCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
  topics: string[];
  color: string;
}

interface TopicDetail {
  categoryId: string;
  topic: string;
  content: string[];
  faqs?: Array<{ question: string; answer: string }>;
}

interface Resource {
  title: string;
  description: string;
  type: string;
  content?: string[];
  downloadUrl?: string;
}

export default function Support() {
  const { i18n } = useTranslation();
  const seoMetadata = getPageSEOMetadata("support", i18n.language);
  useSEO(seoMetadata, i18n.language);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    companyName: "",
    inquiryType: "general",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [resourceSearch, setResourceSearch] = useState("");

  const categories: SupportCategory[] = [
    {
      id: "transfers",
      title: "Company Transfers & Ownership",
      icon: <Building2 className="w-6 h-6" />,
      topics: [
        "How to fill out the transfer form",
        "Understanding company statuses",
        "Required documents for ownership transfer",
      ],
      color: "from-blue-500 to-blue-600",
    },
    {
      id: "payments",
      title: "Payments & Renewals",
      icon: <DollarSign className="w-6 h-6" />,
      topics: [
        "How to renew your company",
        "Understanding renewal fees",
        "Refunds & cancellation policy",
      ],
      color: "from-green-500 to-green-600",
    },
    {
      id: "documents",
      title: "Documents & Apostille",
      icon: <FileText className="w-6 h-6" />,
      topics: [
        "How to request Apostille or POA",
        "Delivery time for documents",
        "Certified copies and notarizations",
      ],
      color: "from-purple-500 to-purple-600",
    },
    {
      id: "invoices",
      title: "Invoices & Orders",
      icon: <FileUp className="w-6 h-6" />,
      topics: [
        "How to download invoices",
        "Checking order status",
        "Editing order details before submission",
      ],
      color: "from-orange-500 to-orange-600",
    },
    {
      id: "account",
      title: "Account & Security",
      icon: <User className="w-6 h-6" />,
      topics: [
        "Updating personal details",
        "Resetting password",
        "Login security and two-factor authentication",
      ],
      color: "from-red-500 to-red-600",
    },
    {
      id: "faqs",
      title: "General FAQs",
      icon: <HelpCircle className="w-6 h-6" />,
      topics: [
        "What is Right of Use?",
        "Can I change shareholders later?",
        "What happens if I don't renew?",
      ],
      color: "from-cyan-500 to-cyan-600",
    },
  ];

  const topicDetails: TopicDetail[] = [
    {
      categoryId: "transfers",
      topic: "How to fill out the transfer form",
      content: [
        "The transfer form is the official document required to change company ownership. Follow these steps:",
        "1. Download the transfer form from our Resources section",
        "2. Enter the current owner's details accurately",
        "3. Fill in the new owner's information",
        "4. Provide company number and incorporation date",
        "5. Ensure all signatures are witnessed",
        "6. Submit with required supporting documents",
        "Tips: Double-check spelling of names, ensure dates are in correct format, keep copies for your records.",
      ],
      faqs: [
        {
          question: "What if I make a mistake on the form?",
          answer: "Submit a corrected form with a note explaining the changes. Our support team will assist in processing amendments.",
        },
        {
          question: "How long does the transfer process take?",
          answer: "Typically 7-14 business days after submission of all required documents.",
        },
      ],
    },
    {
      categoryId: "transfers",
      topic: "Understanding company statuses",
      content: [
        "Companies have different statuses based on their legal standing:",
        "Active: Company is in good standing and operating normally",
        "Dormant: Company exists but has no business activity",
        "Strike Off: Company is being removed from register (irreversible)",
        "Dissolved: Company no longer exists legally",
        "In Liquidation: Company is being wound down",
        "Your company status affects transfer eligibility and fees. Active companies are easiest to transfer.",
      ],
    },
    {
      categoryId: "transfers",
      topic: "Required documents for ownership transfer",
      content: [
        "To complete an ownership transfer, you'll need:",
        "• Transfer Form (signed and witnessed)",
        "• ID verification of both buyer and seller",
        "• Company incorporation certificate",
        "• Confirmation statement (latest accounts)",
        "• Directors' and shareholders' consent",
        "• Proof of address (for both parties)",
        "• Articles of Association or similar documents",
        "All documents must be certified copies or officially notarized.",
      ],
    },
    {
      categoryId: "payments",
      topic: "How to renew your company",
      content: [
        "Company renewal ensures your business remains active and compliant:",
        "1. Log into your Sharekte account dashboard",
        "2. Navigate to 'My Companies' section",
        "3. Select the company you want to renew",
        "4. Click 'Renew Company' button",
        "5. Review the renewal fees and terms",
        "6. Complete payment through our secure checkout",
        "7. Receive confirmation and updated documentation",
        "Renewal is required annually to maintain active status.",
      ],
    },
    {
      categoryId: "payments",
      topic: "Understanding renewal fees",
      content: [
        "Renewal fees cover filing, administration, and regulatory compliance:",
        "Base renewal fee: £150-300 depending on company type",
        "Express renewal (24-48 hours): Additional £50 fee",
        "Document fees: £20-50 per additional document",
        "Apostille/POA services: £40-80 per document",
        "Multi-year renewal discounts available",
        "Payment can be made via credit card, bank transfer, or PayPal.",
      ],
    },
    {
      categoryId: "payments",
      topic: "Refunds & cancellation policy",
      content: [
        "Our refund policy ensures fair treatment:",
        "• Cancellations within 7 days: Full refund minus £20 processing fee",
        "• After 7 days: 50% refund if work hasn't started",
        "• After work begins: Non-refundable",
        "• Service credits available as alternative to refunds",
        "Contact support@sharekte.com to request refunds with order number.",
      ],
    },
    {
      categoryId: "documents",
      topic: "How to request Apostille or POA",
      content: [
        "Apostille and Power of Attorney documents are used internationally:",
        "Apostille: Certificate authenticating the origin of documents",
        "POA: Legal authorization to act on behalf of someone else",
        "To request:",
        "1. Select 'Request Apostille/POA' from your dashboard",
        "2. Choose document type and required copies",
        "3. Verify recipient country and requirements",
        "4. Complete payment (£40-80 per document)",
        "5. Submit through our system",
        "6. Receive authenticated documents via courier (5-7 business days)",
      ],
    },
    {
      categoryId: "documents",
      topic: "Delivery time for documents",
      content: [
        "Standard delivery timeline:",
        "• Standard Processing: 7-10 business days",
        "• Express Processing: 3-5 business days (£50 extra)",
        "• Next Day Delivery: Available in UK only (£75 extra)",
        "• International Courier: 10-15 business days",
        "Processing begins after payment and document submission.",
        "You'll receive tracking information via email.",
      ],
    },
    {
      categoryId: "documents",
      topic: "Certified copies and notarizations",
      content: [
        "Certified copies are legally accepted reproductions of originals:",
        "What we certify: Company documents, incorporation certificates, accounts",
        "Notarization: Official verification by authorized notary",
        "£20-30 per certified copy",
        "Requirements: Original document, identification, payment",
        "All certified copies include our official seal and certificate of authenticity.",
      ],
    },
    {
      categoryId: "invoices",
      topic: "How to download invoices",
      content: [
        "Access your invoices anytime from the dashboard:",
        "1. Log into your Sharekte account",
        "2. Go to 'Invoices & Billing' section",
        "3. View all transactions and invoices",
        "4. Click 'Download' or 'View PDF' for any invoice",
        "5. Invoices can be downloaded in PDF format",
        "6. Keep for your accounting records",
        "Invoices are available for download within 2 hours of payment.",
      ],
    },
    {
      categoryId: "invoices",
      topic: "Checking order status",
      content: [
        "Track your orders in real-time:",
        "1. Visit your dashboard 'Active Orders' section",
        "2. View detailed timeline of each order",
        "3. See current status and next steps",
        "4. Receive email notifications for status changes",
        "Status types: Pending, Processing, Completed, On Hold, Cancelled",
        "Estimated completion dates are provided at order creation.",
      ],
    },
    {
      categoryId: "invoices",
      topic: "Editing order details before submission",
      content: [
        "You can edit order details while in 'Pending' status:",
        "1. Find the order in your dashboard",
        "2. Click 'Edit' if status is 'Pending'",
        "3. Modify required information",
        "4. Review changes before submitting",
        "Once submitted to processing, edits require contacting support.",
        "Some details cannot be changed after payment.",
      ],
    },
    {
      categoryId: "account",
      topic: "Updating personal details",
      content: [
        "Keep your account information current:",
        "1. Click your profile icon in top right",
        "2. Select 'Account Settings'",
        "3. Update name, email, phone number",
        "4. Change address information",
        "5. Verify changes via email confirmation",
        "6. Save changes",
        "Changes take effect immediately for new orders.",
      ],
    },
    {
      categoryId: "account",
      topic: "Resetting password",
      content: [
        "Secure password reset process:",
        "1. Go to login page and click 'Forgot Password'",
        "2. Enter your email address",
        "3. Check your email for reset link (expires in 1 hour)",
        "4. Click the link and create new password",
        "5. Must be at least 8 characters with uppercase, lowercase, and number",
        "6. Login with new password",
        "For security, never share your password with anyone.",
      ],
    },
    {
      categoryId: "account",
      topic: "Login security and two-factor authentication",
      content: [
        "Protect your account with two-factor authentication (2FA):",
        "1. Go to Security Settings in Account",
        "2. Enable 'Two-Factor Authentication'",
        "3. Choose authentication method: SMS or Authenticator App",
        "4. Verify by entering code",
        "5. Save backup codes in secure location",
        "With 2FA enabled: Login with password + verification code",
        "Highly recommended for accounts with payment methods.",
      ],
    },
    {
      categoryId: "faqs",
      topic: "What is Right of Use?",
      content: [
        "Right of Use (RoU) is an accounting concept for assets and leases:",
        "Applies to assets under IFRS 16 and ASC 842 standards",
        "Companies must recognize lease assets on balance sheet",
        "Affects financial reporting and creditor requirements",
        "Primarily important for larger companies and financial institutions",
        "Consult your accountant for specific requirements.",
      ],
    },
    {
      categoryId: "faqs",
      topic: "Can I change shareholders later?",
      content: [
        "Yes, shareholders can be changed at any time:",
        "File Form SH01 (Notification of change in shareholders)",
        "Requires consent of existing shareholders",
        "New shareholder must be identified (individual or corporate)",
        "Processing fee: £30-50",
        "Takes 1-2 weeks after submission",
        "Required annual accounts must be up to date.",
      ],
    },
    {
      categoryId: "faqs",
      topic: "What happens if I don't renew?",
      content: [
        "Non-renewal has serious consequences:",
        "First 3 months: Company enters 'Overdue' status",
        "Next 6 months: Company can be struck off register",
        "After strike-off: Company legally dissolved",
        "Cannot trade or operate once struck off",
        "Reactivation costs more and requires additional documents",
        "Avoid these issues by renewing annually.",
      ],
    },
  ];

  const resources: Resource[] = [
    {
      title: "Company Transfer Form Guide",
      description: "Complete guide for filling out the transfer form",
      type: "PDF",
      content: [
        "This comprehensive guide covers every step of the company transfer process.",
        "Sections included:",
        "• Introduction to company transfers",
        "• Step-by-step form completion instructions",
        "• Document requirements checklist",
        "• Common mistakes to avoid",
        "• Timeline and costs",
        "• FAQ section",
        "Download this guide to keep for reference during your transfer.",
      ],
    },
    {
      title: "Apostille & POA Explanation",
      description: "Understanding Apostille and Power of Attorney documents",
      type: "Guide",
      content: [
        "Essential reading for international transactions:",
        "What is an Apostille?",
        "• Certification under Hague Convention",
        "• Accepted in 190+ countries",
        "• Proves document authenticity",
        "What is Power of Attorney (POA)?",
        "• Legal authorization to act on someone's behalf",
        "• Can be limited or general",
        "• Internationally recognized with Apostille",
        "When you need them:",
        "• International business transactions",
        "• Property purchases abroad",
        "• Legal proceedings outside UK",
      ],
    },
    {
      title: "AML / KYC Policy",
      description: "Anti-Money Laundering and Know Your Customer policies",
      type: "Policy",
      content: [
        "Our commitment to financial compliance and security:",
        "AML (Anti-Money Laundering):",
        "• Prevents financial crimes and fraud",
        "• Identifies suspicious transactions",
        "• Cooperation with authorities",
        "KYC (Know Your Customer):",
        "• Verify customer identity",
        "• Assess beneficial ownership",
        "• Understand customer's business",
        "What we require:",
        "• Government-issued ID",
        "• Proof of address",
        "• Source of funds verification",
        "• Beneficial owner identification",
        "Your data is protected under GDPR.",
      ],
    },
    {
      title: "Refund Policy",
      description: "Our refund and cancellation terms",
      type: "Policy",
      content: [
        "Clear refund terms for all services:",
        "Refund eligibility:",
        "• Within 7 days: Full refund minus £20 fee",
        "• 7-14 days: 50% refund if no work started",
        "• After work begins: Non-refundable",
        "How to request:",
        "• Contact support@sharekte.com",
        "• Provide order number and reason",
        "• Response within 2 business days",
        "Service credits:",
        "• Alternative to refunds",
        "• Can be used for future orders",
        "• No expiration date",
      ],
    },
    {
      title: "Terms & Conditions",
      description: "Legal terms and conditions for using Sharekte",
      type: "Legal",
      content: [
        "Complete legal framework for Sharekte services:",
        "Service scope:",
        "• Company transfer facilitation",
        "• Document authentication services",
        "• Marketplace for buying/selling companies",
        "User responsibilities:",
        "• Accurate information provision",
        "• Compliance with local laws",
        "• Payment of fees",
        "Liability limitations:",
        "• We act as facilitators, not legal advisors",
        "• Users conduct due diligence independently",
        "• Maximum liability limited to fees paid",
        "Payment and fees:",
        "• Non-refundable upon service delivery",
        "• Additional fees may apply",
      ],
    },
    {
      title: "Privacy Policy",
      description: "How we protect and handle your data",
      type: "Legal",
      content: [
        "Your privacy is our priority:",
        "Data we collect:",
        "• Personal identification information",
        "• Company and business details",
        "• Payment and transaction information",
        "• Communication records",
        "How we use your data:",
        "• Process transactions",
        "• Improve our services",
        "• Send important notifications",
        "• Comply with legal obligations",
        "Your rights:",
        "• Access your data anytime",
        "• Request corrections",
        "• Data portability",
        "• Right to deletion (subject to legal holds)",
        "Security measures:",
        "• SSL/TLS encryption",
        "• Regular security audits",
        "• GDPR compliant",
      ],
    },
  ];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      inquiryType: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName || !formData.email || !formData.message) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/support/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to submit support request");
      }

      toast.success(
        "Support request submitted successfully! We'll get back to you soon.",
      );
      setFormData({
        fullName: "",
        email: "",
        companyName: "",
        inquiryType: "general",
        message: "",
      });
    } catch (error) {
      console.error("Error submitting support request:", error);
      toast.error("Failed to submit support request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="border-b border-border/40 bg-gradient-to-b from-primary/5 to-transparent">
          <div className="container max-w-6xl mx-auto px-4 py-12 md:py-16">
            <div className="text-center space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                Support Center
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Welcome to Sharekte Support. Our team is here to help you with
                company transfers, renewals, document authentication, and
                technical inquiries.
              </p>
            </div>
          </div>
        </section>

        {/* Support Categories Grid */}
        <section className="border-b border-border/40 py-12 md:py-16">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-12">
              <h2 className="text-3xl font-bold text-foreground">
                Browse Help Topics
              </h2>
              <div className="flex-1 md:flex-initial md:w-64 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search categories..."
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  className="pl-10 pr-4"
                />
                {categorySearch && (
                  <button
                    onClick={() => setCategorySearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded"
                  >
                    <CloseIcon className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories
                .filter((category) => {
                  const query = categorySearch.toLowerCase();
                  return (
                    category.title.toLowerCase().includes(query) ||
                    category.topics.some((topic) =>
                      topic.toLowerCase().includes(query),
                    )
                  );
                })
                .map((category) => (
                  <div
                    key={category.id}
                    className="group border border-border/40 rounded-lg p-6 hover:shadow-lg hover:border-primary/50 transition-all duration-200 cursor-pointer"
                  >
                    <div
                      className={`w-12 h-12 bg-gradient-to-br ${category.color} rounded-lg flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}
                    >
                      {category.icon}
                    </div>

                    <h3 className="text-lg font-semibold text-foreground mb-3">
                      {category.title}
                    </h3>

                    <ul className="space-y-2 mb-4">
                      {category.topics.map((topic, idx) => (
                        <li
                          key={idx}
                          className="text-sm text-muted-foreground flex items-start gap-2"
                        >
                          <ChevronRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>{topic}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-primary hover:text-primary hover:bg-primary/10"
                    >
                      Learn More
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    </Button>
                  </div>
                ))}
            </div>
          </div>
        </section>

        {/* Contact & Support Ticket Section */}
        <section className="border-b border-border/40 py-12 md:py-16">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Support Form */}
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-8">
                  Submit a Support Request
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label
                      htmlFor="fullName"
                      className="text-sm font-medium text-foreground"
                    >
                      Full Name <span className="text-destructive">*</span>
                    </label>
                    <Input
                      id="fullName"
                      name="fullName"
                      placeholder="Your full name"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="email"
                      className="text-sm font-medium text-foreground"
                    >
                      Email Address <span className="text-destructive">*</span>
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="companyName"
                      className="text-sm font-medium text-foreground"
                    >
                      Company Name / Number
                    </label>
                    <Input
                      id="companyName"
                      name="companyName"
                      placeholder="Your company name or number"
                      value={formData.companyName}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="inquiryType"
                      className="text-sm font-medium text-foreground"
                    >
                      Inquiry Type
                    </label>
                    <Select
                      value={formData.inquiryType}
                      onValueChange={handleSelectChange}
                    >
                      <SelectTrigger id="inquiryType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">
                          General Question
                        </SelectItem>
                        <SelectItem value="transfers">
                          Company Transfers
                        </SelectItem>
                        <SelectItem value="renewals">Renewals</SelectItem>
                        <SelectItem value="documents">Documents</SelectItem>
                        <SelectItem value="invoices">
                          Invoices & Orders
                        </SelectItem>
                        <SelectItem value="account">
                          Account & Security
                        </SelectItem>
                        <SelectItem value="technical">
                          Technical Issue
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="message"
                      className="text-sm font-medium text-foreground"
                    >
                      Message / Description{" "}
                      <span className="text-destructive">*</span>
                    </label>
                    <Textarea
                      id="message"
                      name="message"
                      placeholder="Please describe your issue or question in detail..."
                      value={formData.message}
                      onChange={handleInputChange}
                      rows={6}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary-600"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Submit Request
                      </>
                    )}
                  </Button>
                </form>
              </div>

              {/* Contact Options */}
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-8">
                  Other Contact Options
                </h2>

                <div className="space-y-6">
                  {/* Email Support */}
                  <div className="border border-border/40 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          Email Support
                        </h3>
                        <p className="text-muted-foreground mb-3">
                          Reach out to our support team directly
                        </p>
                        <a
                          href="mailto:support@sharekte.com"
                          className="text-primary hover:underline font-medium"
                        >
                          support@sharekte.com
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* WhatsApp Support */}
                  <div className="border border-border/40 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="w-6 h-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          WhatsApp Business Support
                        </h3>
                        <p className="text-muted-foreground mb-3">
                          Available 9AM–6PM UAE Time
                        </p>
                        <a
                          href="https://wa.me/971505051790"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline font-medium"
                        >
                          +971 50 505 1790
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Response Time Info */}
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Response Time
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      We typically respond to support requests within 24 hours
                      during business days. For urgent matters, please contact
                      us via WhatsApp or email.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Resources Section */}
        <section className="border-b border-border/40 py-12 md:py-16">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-12">
              <h2 className="text-3xl font-bold text-foreground">
                Helpful Resources
              </h2>
              <div className="flex-1 md:flex-initial md:w-64 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search resources..."
                  value={resourceSearch}
                  onChange={(e) => setResourceSearch(e.target.value)}
                  className="pl-10 pr-4"
                />
                {resourceSearch && (
                  <button
                    onClick={() => setResourceSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded"
                  >
                    <CloseIcon className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resources
                .filter((resource) => {
                  const query = resourceSearch.toLowerCase();
                  return (
                    resource.title.toLowerCase().includes(query) ||
                    resource.description.toLowerCase().includes(query) ||
                    resource.type.toLowerCase().includes(query)
                  );
                })
                .map((resource, idx) => (
                  <a
                    key={idx}
                    href="#"
                    className="border border-border/40 rounded-lg p-6 hover:shadow-lg hover:border-primary/50 transition-all duration-200 group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <FileText className="w-6 h-6 text-primary" />
                      <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
                        {resource.type}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {resource.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {resource.description}
                    </p>
                    <div className="flex items-center text-primary text-sm font-medium group-hover:gap-2 transition-all">
                      Download <ChevronRight className="w-4 h-4 ml-1" />
                    </div>
                  </a>
                ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
