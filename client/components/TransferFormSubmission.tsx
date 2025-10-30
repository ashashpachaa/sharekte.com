import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  createTransferForm,
  updateTransferForm,
  uploadFormAttachment,
  type TransferFormData,
} from "@/lib/transfer-form";
import { Upload, Trash2, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface TransferFormSubmissionProps {
  orderId: string;
  companyName: string;
  companyNumber: string;
  onSuccess?: (form: TransferFormData) => void;
  initialForm?: TransferFormData;
  isEditing?: boolean;
}

interface FormErrors {
  [key: string]: string;
}

export function TransferFormSubmission({
  orderId,
  companyName,
  companyNumber,
  onSuccess,
  initialForm,
  isEditing = false,
}: TransferFormSubmissionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [submittedForm, setSubmittedForm] = useState<TransferFormData | null>(null);

  const [formData, setFormData] = useState<Partial<TransferFormData>>(
    initialForm || {
      orderId,
      companyId: `company_${Date.now()}`,
      companyName,
      companyNumber,
      sellerName: "",
      sellerEmail: "",
      sellerPhone: "",
      sellerAddress: "",
      sellerCity: "",
      sellerState: "",
      sellerPostalCode: "",
      sellerCountry: "",
      buyerName: "",
      buyerEmail: "",
      buyerPhone: "",
      buyerAddress: "",
      buyerCity: "",
      buyerState: "",
      buyerPostalCode: "",
      buyerCountry: "",
      companyType: "",
      incorporationDate: "",
      businessDescription: "",
      transferReason: "",
      transferDate: new Date().toISOString().split("T")[0],
      salePrice: undefined,
      currency: "USD",
      attachments: [],
      directors: [],
      shareholders: [],
    }
  );

  const validateStep = (step: number): boolean => {
    const newErrors: FormErrors = {};

    if (step === 1) {
      if (!formData.sellerName) newErrors.sellerName = "Seller name is required";
      if (!formData.sellerEmail) newErrors.sellerEmail = "Seller email is required";
      if (!formData.sellerAddress) newErrors.sellerAddress = "Seller address is required";
      if (!formData.sellerCity) newErrors.sellerCity = "Seller city is required";
      if (!formData.sellerCountry) newErrors.sellerCountry = "Seller country is required";
    } else if (step === 2) {
      if (!formData.buyerName) newErrors.buyerName = "Buyer name is required";
      if (!formData.buyerEmail) newErrors.buyerEmail = "Buyer email is required";
      if (!formData.buyerAddress) newErrors.buyerAddress = "Buyer address is required";
      if (!formData.buyerCity) newErrors.buyerCity = "Buyer city is required";
      if (!formData.buyerCountry) newErrors.buyerCountry = "Buyer country is required";
    } else if (step === 3) {
      if (!formData.companyType) newErrors.companyType = "Company type is required";
      if (!formData.incorporationDate)
        newErrors.incorporationDate = "Incorporation date is required";
      if (!formData.transferReason) newErrors.transferReason = "Transfer reason is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(Math.min(4, currentStep + 1));
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep(Math.max(1, currentStep - 1));
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      // Check file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`File ${file.name} exceeds 50MB limit`);
        continue;
      }

      setUploadingFile(true);
      try {
        // In production, upload to server and get back attachment data
        const attachment = {
          id: `attachment_${Date.now()}`,
          name: file.name,
          type: file.type,
          size: file.size,
          uploadedDate: new Date().toISOString(),
          uploadedBy: "customer",
        };

        setFormData({
          ...formData,
          attachments: [...(formData.attachments || []), attachment],
        });

        toast.success(`${file.name} uploaded successfully`);
      } catch (error) {
        console.error("Upload error:", error);
        toast.error(`Failed to upload ${file.name}`);
      } finally {
        setUploadingFile(false);
      }
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveAttachment = (attachmentId: string) => {
    setFormData({
      ...formData,
      attachments: formData.attachments?.filter((a) => a.id !== attachmentId) || [],
    });
    toast.success("Attachment removed");
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    setLoading(true);
    try {
      let result;
      if (isEditing && initialForm) {
        result = await updateTransferForm(initialForm.id, formData);
      } else {
        result = await createTransferForm(
          formData as Omit<TransferFormData, "id" | "createdAt" | "updatedAt">
        );
      }

      if (result) {
        setSubmittedForm(result);
        setShowSuccessDialog(true);
        toast.success("Form submitted successfully");
        onSuccess?.(result);
      } else {
        toast.error("Failed to submit form");
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Error submitting form");
    } finally {
      setLoading(false);
    }
  };

  const progressPercentage = (currentStep / 4) * 100;

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="space-y-2">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">
            Step {currentStep} of 4: {currentStep === 1 ? "Seller Information" : currentStep === 2 ? "Buyer Information" : currentStep === 3 ? "Transfer Details" : "Review & Submit"}
          </h2>
          <span className="text-sm text-gray-600">{Math.round(progressPercentage)}%</span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>

      {/* Form Content */}
      <Card>
        <CardContent className="pt-6">
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-base mb-4">Seller Information</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sellerName">Full Name *</Label>
                  <Input
                    id="sellerName"
                    value={formData.sellerName || ""}
                    onChange={(e) => handleInputChange("sellerName", e.target.value)}
                    placeholder="John Doe"
                  />
                  {errors.sellerName && (
                    <p className="text-red-600 text-sm mt-1">{errors.sellerName}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="sellerEmail">Email Address *</Label>
                  <Input
                    id="sellerEmail"
                    type="email"
                    value={formData.sellerEmail || ""}
                    onChange={(e) => handleInputChange("sellerEmail", e.target.value)}
                    placeholder="john@example.com"
                  />
                  {errors.sellerEmail && (
                    <p className="text-red-600 text-sm mt-1">{errors.sellerEmail}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="sellerPhone">Phone Number</Label>
                  <Input
                    id="sellerPhone"
                    value={formData.sellerPhone || ""}
                    onChange={(e) => handleInputChange("sellerPhone", e.target.value)}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>

                <div>
                  <Label htmlFor="sellerCountry">Country *</Label>
                  <Input
                    id="sellerCountry"
                    value={formData.sellerCountry || ""}
                    onChange={(e) => handleInputChange("sellerCountry", e.target.value)}
                    placeholder="United Kingdom"
                  />
                  {errors.sellerCountry && (
                    <p className="text-red-600 text-sm mt-1">{errors.sellerCountry}</p>
                  )}
                </div>

                <div className="col-span-2">
                  <Label htmlFor="sellerAddress">Street Address *</Label>
                  <Input
                    id="sellerAddress"
                    value={formData.sellerAddress || ""}
                    onChange={(e) => handleInputChange("sellerAddress", e.target.value)}
                    placeholder="123 Main Street"
                  />
                  {errors.sellerAddress && (
                    <p className="text-red-600 text-sm mt-1">{errors.sellerAddress}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="sellerCity">City *</Label>
                  <Input
                    id="sellerCity"
                    value={formData.sellerCity || ""}
                    onChange={(e) => handleInputChange("sellerCity", e.target.value)}
                    placeholder="London"
                  />
                  {errors.sellerCity && (
                    <p className="text-red-600 text-sm mt-1">{errors.sellerCity}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="sellerState">State/Province</Label>
                  <Input
                    id="sellerState"
                    value={formData.sellerState || ""}
                    onChange={(e) => handleInputChange("sellerState", e.target.value)}
                    placeholder="England"
                  />
                </div>

                <div>
                  <Label htmlFor="sellerPostalCode">Postal Code</Label>
                  <Input
                    id="sellerPostalCode"
                    value={formData.sellerPostalCode || ""}
                    onChange={(e) => handleInputChange("sellerPostalCode", e.target.value)}
                    placeholder="SW1A 1AA"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-base mb-4">Buyer Information</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="buyerName">Full Name *</Label>
                  <Input
                    id="buyerName"
                    value={formData.buyerName || ""}
                    onChange={(e) => handleInputChange("buyerName", e.target.value)}
                    placeholder="Jane Smith"
                  />
                  {errors.buyerName && (
                    <p className="text-red-600 text-sm mt-1">{errors.buyerName}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="buyerEmail">Email Address *</Label>
                  <Input
                    id="buyerEmail"
                    type="email"
                    value={formData.buyerEmail || ""}
                    onChange={(e) => handleInputChange("buyerEmail", e.target.value)}
                    placeholder="jane@example.com"
                  />
                  {errors.buyerEmail && (
                    <p className="text-red-600 text-sm mt-1">{errors.buyerEmail}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="buyerPhone">Phone Number</Label>
                  <Input
                    id="buyerPhone"
                    value={formData.buyerPhone || ""}
                    onChange={(e) => handleInputChange("buyerPhone", e.target.value)}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>

                <div>
                  <Label htmlFor="buyerCountry">Country *</Label>
                  <Input
                    id="buyerCountry"
                    value={formData.buyerCountry || ""}
                    onChange={(e) => handleInputChange("buyerCountry", e.target.value)}
                    placeholder="United States"
                  />
                  {errors.buyerCountry && (
                    <p className="text-red-600 text-sm mt-1">{errors.buyerCountry}</p>
                  )}
                </div>

                <div className="col-span-2">
                  <Label htmlFor="buyerAddress">Street Address *</Label>
                  <Input
                    id="buyerAddress"
                    value={formData.buyerAddress || ""}
                    onChange={(e) => handleInputChange("buyerAddress", e.target.value)}
                    placeholder="456 Oak Avenue"
                  />
                  {errors.buyerAddress && (
                    <p className="text-red-600 text-sm mt-1">{errors.buyerAddress}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="buyerCity">City *</Label>
                  <Input
                    id="buyerCity"
                    value={formData.buyerCity || ""}
                    onChange={(e) => handleInputChange("buyerCity", e.target.value)}
                    placeholder="New York"
                  />
                  {errors.buyerCity && (
                    <p className="text-red-600 text-sm mt-1">{errors.buyerCity}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="buyerState">State/Province</Label>
                  <Input
                    id="buyerState"
                    value={formData.buyerState || ""}
                    onChange={(e) => handleInputChange("buyerState", e.target.value)}
                    placeholder="New York"
                  />
                </div>

                <div>
                  <Label htmlFor="buyerPostalCode">Postal Code</Label>
                  <Input
                    id="buyerPostalCode"
                    value={formData.buyerPostalCode || ""}
                    onChange={(e) => handleInputChange("buyerPostalCode", e.target.value)}
                    placeholder="10001"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-base mb-4">Transfer Details</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyType">Company Type *</Label>
                  <Select value={formData.companyType || ""} onValueChange={(value) => handleInputChange("companyType", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LTD">Limited Company (Ltd)</SelectItem>
                      <SelectItem value="PLC">Public Company (PLC)</SelectItem>
                      <SelectItem value="AB">Swedish Company (AB)</SelectItem>
                      <SelectItem value="FZCO">Free Zone Company (FZCO)</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.companyType && (
                    <p className="text-red-600 text-sm mt-1">{errors.companyType}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="incorporationDate">Incorporation Date *</Label>
                  <Input
                    id="incorporationDate"
                    type="date"
                    value={formData.incorporationDate || ""}
                    onChange={(e) => handleInputChange("incorporationDate", e.target.value)}
                  />
                  {errors.incorporationDate && (
                    <p className="text-red-600 text-sm mt-1">{errors.incorporationDate}</p>
                  )}
                </div>

                <div className="col-span-2">
                  <Label htmlFor="transferReason">Reason for Transfer *</Label>
                  <Textarea
                    id="transferReason"
                    value={formData.transferReason || ""}
                    onChange={(e) => handleInputChange("transferReason", e.target.value)}
                    placeholder="Explain why you are transferring this company..."
                    rows={3}
                  />
                  {errors.transferReason && (
                    <p className="text-red-600 text-sm mt-1">{errors.transferReason}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="transferDate">Transfer Date</Label>
                  <Input
                    id="transferDate"
                    type="date"
                    value={formData.transferDate || ""}
                    onChange={(e) => handleInputChange("transferDate", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="salePrice">Sale Price (Optional)</Label>
                  <Input
                    id="salePrice"
                    type="number"
                    value={formData.salePrice || ""}
                    onChange={(e) => handleInputChange("salePrice", parseFloat(e.target.value) || undefined)}
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Attachments Section */}
              <div className="border-t pt-4 mt-6">
                <h4 className="font-semibold mb-3">Documents & Attachments</h4>
                <p className="text-sm text-gray-600 mb-3">Upload supporting documents (Max 50MB per file)</p>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFile}
                    className="gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    {uploadingFile ? "Uploading..." : "Click to Upload"}
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">or drag and drop files here</p>
                </div>

                {formData.attachments && formData.attachments.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {formData.attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <div>
                            <p className="text-sm font-medium">{attachment.name}</p>
                            <p className="text-xs text-gray-500">
                              {(attachment.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAttachment(attachment.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-base mb-4">Review & Submit</h3>

              <div className="bg-blue-50 p-4 rounded-lg flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-900">Please review your information</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Make sure all information is accurate before submitting.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Seller Name:</p>
                  <p className="font-medium">{formData.sellerName}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Buyer Name:</p>
                  <p className="font-medium">{formData.buyerName}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Company:</p>
                  <p className="font-medium">{formData.companyName} ({formData.companyNumber})</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Attachments:</p>
                  <p className="font-medium">{formData.attachments?.length || 0} files</p>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-900">Ready to submit</p>
                  <p className="text-sm text-green-700 mt-1">
                    Click submit below to send your transfer form for review.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between gap-4">
        <Button
          variant="outline"
          onClick={handlePreviousStep}
          disabled={currentStep === 1 || loading}
        >
          Previous
        </Button>

        {currentStep < 4 ? (
          <Button onClick={handleNextStep} disabled={loading}>
            Next Step
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={loading} className="bg-green-600 hover:bg-green-700">
            {loading ? "Submitting..." : "Submit Form"}
          </Button>
        )}
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
              Form Submitted Successfully
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p>Your transfer form has been submitted for review.</p>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm text-gray-600">Form ID:</p>
              <p className="font-mono font-semibold">{submittedForm?.formId}</p>
            </div>
            <p className="text-sm text-gray-600">
              You can track the status of your form from your dashboard. You'll receive email notifications as the form is reviewed.
            </p>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setShowSuccessDialog(false);
                // Optionally redirect or refresh page
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
