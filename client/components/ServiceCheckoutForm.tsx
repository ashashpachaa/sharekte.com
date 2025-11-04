import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ServiceData } from "@/lib/services";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ServiceCheckoutFormProps {
  open: boolean;
  service: ServiceData | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (formData: Record<string, any>) => void;
  isLoading?: boolean;
}

export function ServiceCheckoutForm({
  open,
  service,
  onOpenChange,
  onSubmit,
  isLoading = false,
}: ServiceCheckoutFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!service) return null;

  const handleInputChange = (fieldId: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
    // Clear error for this field
    if (errors[fieldId]) {
      setErrors((prev) => ({
        ...prev,
        [fieldId]: "",
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    service.applicationFormFields.forEach((field) => {
      if (field.required && !formData[field.id]) {
        newErrors[field.id] = `${field.label} is required`;
      } else if (field.type === "email" && formData[field.id]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData[field.id])) {
          newErrors[field.id] = "Please enter a valid email address";
        }
      } else if (field.type === "phone" && formData[field.id]) {
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        if (!phoneRegex.test(formData[field.id])) {
          newErrors[field.id] = "Please enter a valid phone number";
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      // Reset form when opening
      setFormData({});
      setErrors({});
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Complete Your Application</DialogTitle>
          <DialogDescription>
            Please fill out the application form for {service.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Service Summary */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-sm mb-2">{service.name}</h3>
            <p className="text-sm text-gray-600">{service.description}</p>
          </div>

          {/* Application Form Fields */}
          {service.applicationFormFields.length > 0 ? (
            <div className="space-y-4">
              {service.applicationFormFields.map((field) => (
                <div key={field.id} className="space-y-1">
                  <label className="block text-sm font-medium">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>

                  {field.type === "text" && (
                    <Input
                      placeholder={field.placeholder}
                      value={formData[field.id] || ""}
                      onChange={(e) =>
                        handleInputChange(field.id, e.target.value)
                      }
                      disabled={isLoading}
                    />
                  )}

                  {field.type === "email" && (
                    <Input
                      type="email"
                      placeholder={field.placeholder}
                      value={formData[field.id] || ""}
                      onChange={(e) =>
                        handleInputChange(field.id, e.target.value)
                      }
                      disabled={isLoading}
                    />
                  )}

                  {field.type === "phone" && (
                    <Input
                      type="tel"
                      placeholder={field.placeholder}
                      value={formData[field.id] || ""}
                      onChange={(e) =>
                        handleInputChange(field.id, e.target.value)
                      }
                      disabled={isLoading}
                    />
                  )}

                  {field.type === "date" && (
                    <Input
                      type="date"
                      value={formData[field.id] || ""}
                      onChange={(e) =>
                        handleInputChange(field.id, e.target.value)
                      }
                      disabled={isLoading}
                    />
                  )}

                  {field.type === "textarea" && (
                    <Textarea
                      placeholder={field.placeholder}
                      value={formData[field.id] || ""}
                      onChange={(e) =>
                        handleInputChange(field.id, e.target.value)
                      }
                      disabled={isLoading}
                      rows={4}
                    />
                  )}

                  {field.type === "select" && (
                    <Select
                      value={formData[field.id] || ""}
                      onValueChange={(value) =>
                        handleInputChange(field.id, value)
                      }
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={field.placeholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options?.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {field.type === "checkbox" && (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={field.id}
                        checked={formData[field.id] || false}
                        onChange={(e) =>
                          handleInputChange(field.id, e.target.checked)
                        }
                        disabled={isLoading}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor={field.id} className="text-sm">
                        {field.label}
                      </label>
                    </div>
                  )}

                  {errors[field.id] && (
                    <Alert variant="destructive" className="py-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        {errors[field.id]}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600">
              No additional information required for this service.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Processing..." : "Continue to Checkout"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
