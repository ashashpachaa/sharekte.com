import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  type ShareholderInfo,
  type PSCInfo,
} from "@/lib/transfer-form";
import { Upload, Trash2, FileText, AlertCircle, CheckCircle2, Plus, X } from "lucide-react";
import { toast } from "sonner";

interface CompanyTransferFormProps {
  orderId: string;
  companyId: string;
  companyName: string;
  companyNumber: string;
  incorporationDate: string;
  incorporationYear: number;
  onSuccess?: (form: TransferFormData) => void;
  initialForm?: TransferFormData;
  isEditing?: boolean;
}

interface FormErrors {
  [key: string]: string;
}

const LEVEL_OF_CONTROL_OPTIONS = [
  "More than 25% but not more than 50%",
  "More than 50% but not more than 75%",
  "More than 75%",
];

const COMPANY_ACTIVITIES = [
  { code: "01110", label: "Growing of cereals and other crops not elsewhere classified" },
  { code: "01120", label: "Growing of rice" },
  { code: "01130", label: "Growing of vegetables and melons, roots and tubers" },
  { code: "01140", label: "Growing of sugar cane" },
  { code: "01150", label: "Growing of tobacco" },
  { code: "01160", label: "Growing of fibre crops" },
  { code: "01190", label: "Growing of other non-perennial crops" },
  { code: "01210", label: "Growing of grapes" },
  { code: "01220", label: "Growing of tropical and subtropical fruits" },
  { code: "01230", label: "Growing of citrus fruits" },
  { code: "01240", label: "Growing of pome fruits and stone fruits" },
  { code: "01250", label: "Growing of other tree and shrub fruits and nuts" },
  { code: "01260", label: "Growing of oleaginous fruits" },
  { code: "01270", label: "Growing of beverage crops" },
  { code: "01280", label: "Growing of spices, aromatic, drug and dye plants" },
  { code: "01290", label: "Growing of other perennial crops" },
];

export function CompanyTransferForm({
  orderId,
  companyId,
  companyName,
  companyNumber,
  incorporationDate,
  incorporationYear,
  onSuccess,
  initialForm,
  isEditing = false,
}: CompanyTransferFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [submittedForm, setSubmittedForm] = useState<TransferFormData | null>(null);

  const [formData, setFormData] = useState<Partial<TransferFormData>>(
    initialForm || {
      orderId,
      companyId,
      companyName,
      companyNumber,
      incorporationDate,
      incorporationYear,
      
      totalShares: 0,
      totalShareCapital: 0,
      pricePerShare: 0,
      
      shareholders: [],
      numberOfShareholders: 0,
      
      pscList: [],
      numberOfPSCs: 0,
      
      changeCompanyName: false,
      suggestedNames: ["", "", ""],
      changeCompanyActivities: false,
      companyActivities: [],
      
      status: "under-review",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      
      amendmentsRequiredCount: 0,
      attachments: [],
      comments: [],
      statusHistory: [],
    }
  );

  const validateStep = (step: number): boolean => {
    const newErrors: FormErrors = {};

    // Step 1 (Company Info) - Auto-filled, no validation needed
    if (step === 1) {
      // Company info is auto-filled and non-editable, so no validation
    }

    // Step 2 (Shares Info)
    if (step === 2) {
      if (!formData.totalShares || formData.totalShares <= 0) {
        newErrors.totalShares = "Total shares must be greater than 0";
      }
      if (!formData.totalShareCapital || formData.totalShareCapital <= 0) {
        newErrors.totalShareCapital = "Total share capital must be greater than 0";
      }
    }

    // Step 3 (Shareholders)
    if (step === 3) {
      if (!formData.numberOfShareholders || formData.numberOfShareholders <= 0) {
        newErrors.numberOfShareholders = "Number of shareholders must be greater than 0";
      }
      if (formData.shareholders && formData.shareholders.length > 0) {
        const totalPercentage = formData.shareholders.reduce((sum, s) => sum + (s.shareholderPercentage || 0), 0);
        if (Math.abs(totalPercentage - 100) > 0.01) {
          newErrors.shareholders = `Shareholder percentages must equal 100% (current: ${totalPercentage.toFixed(2)}%)`;
        }
        formData.shareholders.forEach((s, i) => {
          if (!s.name) newErrors[`shareholder_${i}_name`] = "Name is required";
          if (!s.nationality) newErrors[`shareholder_${i}_nationality`] = "Nationality is required";
          if (!s.address) newErrors[`shareholder_${i}_address`] = "Address is required";
          if (!s.city) newErrors[`shareholder_${i}_city`] = "City is required";
          if (!s.country) newErrors[`shareholder_${i}_country`] = "Country is required";
          if (!s.shareholderPercentage || s.shareholderPercentage <= 0) {
            newErrors[`shareholder_${i}_percentage`] = "Percentage must be greater than 0";
          }
        });
      }
    }

    // Step 4 (PSC)
    if (step === 4) {
      if (formData.numberOfPSCs && formData.numberOfPSCs > 0) {
        if (!formData.numberOfShareholders || formData.numberOfPSCs > formData.numberOfShareholders) {
          newErrors.numberOfPSCs = "Number of PSCs cannot exceed number of shareholders";
        }
        formData.pscList?.forEach((p, i) => {
          if (!p.shareholderId) newErrors[`psc_${i}_shareholder`] = "Shareholder selection is required";
          if (!p.levelOfControl || p.levelOfControl.length === 0) {
            newErrors[`psc_${i}_control`] = "Level of control is required";
          }
        });
      }
    }

    // Step 5 (Updates)
    if (step === 5) {
      if (formData.changeCompanyName) {
        const names = formData.suggestedNames?.filter(n => n && n.trim());
        if (!names || names.length === 0) {
          newErrors.suggestedNames = "At least one suggested name is required";
        }
      }
      if (formData.changeCompanyActivities) {
        if (!formData.companyActivities || formData.companyActivities.length === 0) {
          newErrors.companyActivities = "Select at least one company activity";
        }
        if (formData.companyActivities && formData.companyActivities.length > 4) {
          newErrors.companyActivities = "Maximum 4 activities allowed";
        }
      }
    }

    // Step 6 (Documents)
    if (step === 6) {
      if (!formData.attachments || formData.attachments.length === 0) {
        newErrors.attachments = "At least one document is required";
      }
    }

    // Step 7 (Review) - No validation, just confirmation

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    } else {
      // Provide specific error feedback
      const errorMessages = Object.values(errors);
      if (errorMessages.length > 0) {
        toast.error(errorMessages[0]);
      } else {
        toast.error("Please fix the errors before proceeding");
      }
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return;

    setUploadingFile(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        reader.onload = () => {
          const newAttachment = {
            id: `att_${Date.now()}_${i}`,
            name: file.name,
            type: file.type,
            size: file.size,
            uploadedDate: new Date().toISOString(),
            uploadedBy: "user",
          };
          setFormData((prev) => ({
            ...prev,
            attachments: [...(prev.attachments || []), newAttachment],
          }));
        };
        reader.readAsDataURL(file);
      }
      toast.success("Files uploaded successfully");
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error("Failed to upload files");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleRemoveAttachment = (attachmentId: string) => {
    setFormData((prev) => ({
      ...prev,
      attachments: (prev.attachments || []).filter((a) => a.id !== attachmentId),
    }));
  };

  const updateShareholder = (index: number, field: keyof ShareholderInfo, value: any) => {
    const shareholders = [...(formData.shareholders || [])];
    shareholders[index] = { ...shareholders[index], [field]: value };

    if (field === "shareholderPercentage" && formData.totalShares && formData.totalShareCapital) {
      const percentage = shareholders[index].shareholderPercentage || 0;
      shareholders[index].shares = Math.round((formData.totalShares * percentage) / 100);
      shareholders[index].amount = (formData.totalShareCapital * percentage) / 100;
    }

    setFormData((prev) => ({
      ...prev,
      shareholders,
    }));
  };

  const addShareholder = () => {
    const newShareholder: ShareholderInfo = {
      id: `shareholder_${Date.now()}`,
      name: "",
      nationality: "",
      address: "",
      city: "",
      country: "",
      shareholderPercentage: 0,
      shares: 0,
      amount: 0,
    };
    setFormData((prev) => ({
      ...prev,
      shareholders: [...(prev.shareholders || []), newShareholder],
    }));
  };

  const removeShareholder = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      shareholders: (prev.shareholders || []).filter((_, i) => i !== index),
    }));
  };

  const updatePSC = (index: number, field: keyof PSCInfo, value: any) => {
    const pscList = [...(formData.pscList || [])];
    pscList[index] = { ...pscList[index], [field]: value };
    setFormData((prev) => ({
      ...prev,
      pscList,
    }));
  };

  const addPSC = () => {
    const newPSC: PSCInfo = {
      id: `psc_${Date.now()}`,
      shareholderId: "",
      shareholderName: "",
      nationality: "",
      address: "",
      city: "",
      country: "",
      levelOfControl: [],
    };
    setFormData((prev) => ({
      ...prev,
      pscList: [...(prev.pscList || []), newPSC],
    }));
  };

  const removePSC = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      pscList: (prev.pscList || []).filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    if (!validateStep(5)) {
      toast.error("Please fix all errors before submitting");
      return;
    }

    setLoading(true);
    try {
      const result = isEditing && initialForm?.id
        ? await updateTransferForm(initialForm.id, formData)
        : await createTransferForm(formData as Omit<TransferFormData, "id" | "createdAt" | "updatedAt">);

      if (result) {
        setSubmittedForm(result);
        setShowSuccessDialog(true);
        if (onSuccess) onSuccess(result);
        toast.success(isEditing ? "Form updated successfully" : "Form submitted successfully");
      } else {
        toast.error("Failed to submit form");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Failed to submit form");
    } finally {
      setLoading(false);
    }
  };

  const renderCompanyInfo = () => (
    <Card>
      <CardHeader>
        <CardTitle>Company Information</CardTitle>
        <CardDescription>Auto-filled from company details (non-editable)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Company Name</Label>
            <Input value={companyName} disabled />
          </div>
          <div>
            <Label>Company Number</Label>
            <Input value={companyNumber} disabled />
          </div>
          <div>
            <Label>Incorporation Date</Label>
            <Input value={incorporationDate} disabled />
          </div>
          <div>
            <Label>Incorporation Year</Label>
            <Input value={incorporationYear} disabled />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderSharesInfo = () => (
    <Card>
      <CardHeader>
        <CardTitle>Company Shares Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Total Shares *</Label>
            <Input
              type="number"
              min="1"
              value={formData.totalShares || ""}
              onChange={(e) => setFormData({ ...formData, totalShares: parseFloat(e.target.value) || 0 })}
            />
            {errors.totalShares && <p className="text-red-600 text-sm mt-1">{errors.totalShares}</p>}
          </div>
          <div>
            <Label>Total Share Capital (£) *</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={formData.totalShareCapital || ""}
              onChange={(e) => setFormData({ ...formData, totalShareCapital: parseFloat(e.target.value) || 0 })}
            />
            {errors.totalShareCapital && <p className="text-red-600 text-sm mt-1">{errors.totalShareCapital}</p>}
          </div>
        </div>
        <div>
          <Label>Price per Share (Auto-calculated) *</Label>
          <Input
            type="number"
            value={
              formData.totalShares && formData.totalShareCapital && formData.totalShares > 0
                ? (formData.totalShareCapital / formData.totalShares).toFixed(2)
                : "0.00"
            }
            disabled
          />
        </div>
      </CardContent>
    </Card>
  );

  const renderShareholders = () => (
    <Card>
      <CardHeader>
        <CardTitle>Shareholders</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>How many shareholders? *</Label>
          <Input
            type="number"
            min="1"
            value={formData.numberOfShareholders || ""}
            onChange={(e) => {
              const num = parseInt(e.target.value) || 0;
              setFormData({ ...formData, numberOfShareholders: num });
              const currentCount = (formData.shareholders || []).length;
              if (num > currentCount) {
                const newShareholders = [...(formData.shareholders || [])];
                for (let i = currentCount; i < num; i++) {
                  newShareholders.push({
                    id: `shareholder_${Date.now()}_${i}`,
                    name: "",
                    nationality: "",
                    address: "",
                    city: "",
                    country: "",
                    shareholderPercentage: 0,
                    shares: 0,
                    amount: 0,
                  });
                }
                setFormData({ ...formData, numberOfShareholders: num, shareholders: newShareholders });
              } else if (num < currentCount) {
                const newShareholders = (formData.shareholders || []).slice(0, num);
                setFormData({ ...formData, numberOfShareholders: num, shareholders: newShareholders });
              }
            }}
          />
          {errors.numberOfShareholders && <p className="text-red-600 text-sm mt-1">{errors.numberOfShareholders}</p>}
        </div>

        {errors.shareholders && (
          <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
            <p className="text-red-600 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {errors.shareholders}
            </p>
          </div>
        )}

        {/* Shareholder Percentage Summary */}
        {(formData.shareholders || []).length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-blue-700 font-semibold">Total Shareholder %</p>
                <p className={`text-2xl font-bold ${
                  Math.abs((formData.shareholders || []).reduce((sum, s) => sum + (s.shareholderPercentage || 0), 0) - 100) < 0.01
                    ? "text-green-600"
                    : "text-red-600"
                }`}>
                  {((formData.shareholders || []).reduce((sum, s) => sum + (s.shareholderPercentage || 0), 0)).toFixed(2)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-blue-700 font-semibold">Target</p>
                <p className="text-2xl font-bold text-blue-600">100%</p>
              </div>
            </div>
            {Math.abs((formData.shareholders || []).reduce((sum, s) => sum + (s.shareholderPercentage || 0), 0) - 100) > 0.01 && (
              <p className="text-sm text-red-600 mt-2">⚠️ Percentages must add up to exactly 100%</p>
            )}
          </div>
        )}

        {(formData.shareholders || []).map((shareholder, index) => (
          <Card key={shareholder.id} className="p-4 bg-gray-50">
            <div className="flex justify-between items-start mb-4">
              <h4 className="font-semibold">Shareholder {index + 1}</h4>
              {(formData.shareholders || []).length > 1 && (
                <Button variant="ghost" size="sm" onClick={() => removeShareholder(index)}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label>Full Name *</Label>
                <Input
                  value={shareholder.name}
                  onChange={(e) => updateShareholder(index, "name", e.target.value)}
                />
                {errors[`shareholder_${index}_name`] && (
                  <p className="text-red-600 text-sm mt-1">{errors[`shareholder_${index}_name`]}</p>
                )}
              </div>
              <div>
                <Label>Nationality *</Label>
                <Input
                  value={shareholder.nationality}
                  onChange={(e) => updateShareholder(index, "nationality", e.target.value)}
                />
                {errors[`shareholder_${index}_nationality`] && (
                  <p className="text-red-600 text-sm mt-1">{errors[`shareholder_${index}_nationality`]}</p>
                )}
              </div>
              <div className="col-span-2">
                <Label>Address *</Label>
                <Input
                  value={shareholder.address}
                  onChange={(e) => updateShareholder(index, "address", e.target.value)}
                />
                {errors[`shareholder_${index}_address`] && (
                  <p className="text-red-600 text-sm mt-1">{errors[`shareholder_${index}_address`]}</p>
                )}
              </div>
              <div>
                <Label>City *</Label>
                <Input
                  value={shareholder.city}
                  onChange={(e) => updateShareholder(index, "city", e.target.value)}
                />
                {errors[`shareholder_${index}_city`] && (
                  <p className="text-red-600 text-sm mt-1">{errors[`shareholder_${index}_city`]}</p>
                )}
              </div>
              <div>
                <Label>Country *</Label>
                <Input
                  value={shareholder.country}
                  onChange={(e) => updateShareholder(index, "country", e.target.value)}
                />
                {errors[`shareholder_${index}_country`] && (
                  <p className="text-red-600 text-sm mt-1">{errors[`shareholder_${index}_country`]}</p>
                )}
              </div>
              <div>
                <Label>Shareholder Percentage (%) *</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={shareholder.shareholderPercentage}
                  onChange={(e) => updateShareholder(index, "shareholderPercentage", parseFloat(e.target.value) || 0)}
                />
                {errors[`shareholder_${index}_percentage`] && (
                  <p className="text-red-600 text-sm mt-1">{errors[`shareholder_${index}_percentage`]}</p>
                )}
              </div>
              <div>
                <Label>Shares (Auto-calculated)</Label>
                <Input
                  type="number"
                  value={Math.round(shareholder.shares)}
                  disabled
                />
              </div>
              <div>
                <Label>Amount £ (Auto-calculated)</Label>
                <Input
                  type="number"
                  value={shareholder.amount.toFixed(2)}
                  disabled
                />
              </div>
            </div>
          </Card>
        ))}
      </CardContent>
    </Card>
  );

  const renderPSC = () => (
    <Card>
      <CardHeader>
        <CardTitle>Persons with Significant Control (PSC)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>How many PSCs? *</Label>
          <Input
            type="number"
            min="0"
            max={formData.numberOfShareholders || 0}
            value={formData.numberOfPSCs || ""}
            onChange={(e) => {
              const num = parseInt(e.target.value) || 0;
              setFormData({ ...formData, numberOfPSCs: num });
              const currentCount = (formData.pscList || []).length;
              if (num > currentCount) {
                const newPSCs = [...(formData.pscList || [])];
                for (let i = currentCount; i < num; i++) {
                  newPSCs.push({
                    id: `psc_${Date.now()}_${i}`,
                    shareholderId: "",
                    shareholderName: "",
                    nationality: "",
                    address: "",
                    city: "",
                    country: "",
                    levelOfControl: [],
                  });
                }
                setFormData({ ...formData, numberOfPSCs: num, pscList: newPSCs });
              } else if (num < currentCount) {
                const newPSCs = (formData.pscList || []).slice(0, num);
                setFormData({ ...formData, numberOfPSCs: num, pscList: newPSCs });
              }
            }}
          />
          {errors.numberOfPSCs && <p className="text-red-600 text-sm mt-1">{errors.numberOfPSCs}</p>}
        </div>

        {(formData.pscList || []).map((psc, index) => (
          <Card key={psc.id} className="p-4 bg-gray-50">
            <div className="flex justify-between items-start mb-4">
              <h4 className="font-semibold">PSC {index + 1}</h4>
              {(formData.pscList || []).length > 1 && (
                <Button variant="ghost" size="sm" onClick={() => removePSC(index)}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Select Shareholder *</Label>
                <Select value={psc.shareholderId || ""} onValueChange={(value) => {
                  const selected = (formData.shareholders || []).find(s => s.id === value);
                  const pscList = [...(formData.pscList || [])];
                  pscList[index] = {
                    ...pscList[index],
                    shareholderId: value,
                    shareholderName: selected?.name || "",
                    nationality: selected?.nationality || "",
                    address: selected?.address || "",
                    city: selected?.city || "",
                    country: selected?.country || "",
                  };
                  setFormData((prev) => ({
                    ...prev,
                    pscList,
                  }));
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a shareholder" />
                  </SelectTrigger>
                  <SelectContent>
                    {(formData.shareholders || []).map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors[`psc_${index}_shareholder`] && (
                  <p className="text-red-600 text-sm mt-1">{errors[`psc_${index}_shareholder`]}</p>
                )}
              </div>
              <div>
                <Label>Level of Control (Multi-select) *</Label>
                <div className="space-y-2">
                  {LEVEL_OF_CONTROL_OPTIONS.map((option) => (
                    <label key={option} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={psc.levelOfControl?.includes(option) || false}
                        onChange={(e) => {
                          const updated = e.target.checked
                            ? [...(psc.levelOfControl || []), option]
                            : (psc.levelOfControl || []).filter(l => l !== option);
                          updatePSC(index, "levelOfControl", updated);
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">{option}</span>
                    </label>
                  ))}
                </div>
                {errors[`psc_${index}_control`] && (
                  <p className="text-red-600 text-sm mt-1">{errors[`psc_${index}_control`]}</p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </CardContent>
    </Card>
  );

  const renderCompanyUpdates = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Company Name Change</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                checked={!formData.changeCompanyName}
                onChange={() => setFormData({ ...formData, changeCompanyName: false })}
                className="mr-2"
              />
              <span>No</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                checked={formData.changeCompanyName}
                onChange={() => setFormData({ ...formData, changeCompanyName: true })}
                className="mr-2"
              />
              <span>Yes</span>
            </label>
          </div>
          {formData.changeCompanyName && (
            <div className="space-y-2">
              <Label>Suggested Names (3 required) *</Label>
              {[0, 1, 2].map((i) => (
                <Input
                  key={i}
                  placeholder={`Suggested name ${i + 1}`}
                  value={formData.suggestedNames?.[i] || ""}
                  onChange={(e) => {
                    const names = [...(formData.suggestedNames || ["", "", ""])];
                    names[i] = e.target.value;
                    setFormData({ ...formData, suggestedNames: names });
                  }}
                />
              ))}
              {errors.suggestedNames && <p className="text-red-600 text-sm">{errors.suggestedNames}</p>}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Company Activities Change</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                checked={!formData.changeCompanyActivities}
                onChange={() => setFormData({ ...formData, changeCompanyActivities: false })}
                className="mr-2"
              />
              <span>No</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                checked={formData.changeCompanyActivities}
                onChange={() => setFormData({ ...formData, changeCompanyActivities: true })}
                className="mr-2"
              />
              <span>Yes</span>
            </label>
          </div>
          {formData.changeCompanyActivities && (
            <div className="space-y-2">
              <Label>Select Activities (Max 4) *</Label>
              <Select multiple value={formData.companyActivities} onValueChange={(value) => {
                if ((formData.companyActivities || []).length < 4 || (formData.companyActivities || []).includes(value)) {
                  const activities = (formData.companyActivities || []).includes(value)
                    ? (formData.companyActivities || []).filter(a => a !== value)
                    : [...(formData.companyActivities || []), value];
                  setFormData({ ...formData, companyActivities: activities });
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select activities" />
                </SelectTrigger>
                <SelectContent>
                  {COMPANY_ACTIVITIES.slice(0, 10).map((activity) => (
                    <SelectItem key={activity.code} value={activity.code}>
                      {activity.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.companyActivities && <p className="text-red-600 text-sm">{errors.companyActivities}</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderDocuments = () => (
    <Card>
      <CardHeader>
        <CardTitle>Shareholder Documents</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            type="file"
            multiple
            onChange={(e) => handleFileUpload(e.target.files)}
            disabled={uploadingFile}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-600">Drag and drop files or click to select</p>
          </label>
        </div>

        {(formData.attachments || []).length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold">Uploaded Files:</h4>
            {(formData.attachments || []).map((attachment) => (
              <div key={attachment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span className="text-sm">{attachment.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveAttachment(attachment.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {errors.attachments && <p className="text-red-600 text-sm">{errors.attachments}</p>}
      </CardContent>
    </Card>
  );

  const renderReview = () => (
    <Card>
      <CardHeader>
        <CardTitle>Review & Confirm</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded p-4">
          <p className="text-sm text-blue-800">
            Please review all the information you've provided. You won't be able to edit after submission.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-semibold">Total Shares:</span>
            <p>{formData.totalShares}</p>
          </div>
          <div>
            <span className="font-semibold">Share Capital:</span>
            <p>£{formData.totalShareCapital?.toFixed(2)}</p>
          </div>
          <div>
            <span className="font-semibold">Number of Shareholders:</span>
            <p>{formData.numberOfShareholders}</p>
          </div>
          <div>
            <span className="font-semibold">Number of PSCs:</span>
            <p>{formData.numberOfPSCs}</p>
          </div>
          <div>
            <span className="font-semibold">Documents:</span>
            <p>{(formData.attachments || []).length} file(s)</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const steps = [
    { title: "Company Info", content: renderCompanyInfo },
    { title: "Shares Info", content: renderSharesInfo },
    { title: "Shareholders", content: renderShareholders },
    { title: "PSC", content: renderPSC },
    { title: "Updates", content: renderCompanyUpdates },
    { title: "Documents", content: renderDocuments },
    { title: "Review", content: renderReview },
  ];

  return (
    <>
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Company Transfer Form</h2>
          <Progress value={(currentStep / steps.length) * 100} className="h-2" />
          <div className="flex justify-between mt-4">
            {steps.map((step, index) => (
              <div key={index} className="text-center text-sm">
                <div
                  className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${
                    index < currentStep ? "bg-green-500 text-white" : index === currentStep - 1 ? "bg-blue-500 text-white" : "bg-gray-200"
                  }`}
                >
                  {index < currentStep - 1 ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
                </div>
                <p>{step.title}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-8">
          {steps[currentStep - 1]?.content()}
        </div>

        <div className="flex justify-between gap-4">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
          >
            Previous
          </Button>
          {currentStep < steps.length ? (
            <Button onClick={handleNextStep}>
              Next
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Submitting..." : "Submit"}
            </Button>
          )}
        </div>
      </div>

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Form Submitted Successfully
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Your transfer form has been submitted successfully. Form ID: {submittedForm?.formId}
          </p>
          <DialogFooter>
            <Button onClick={() => setShowSuccessDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
