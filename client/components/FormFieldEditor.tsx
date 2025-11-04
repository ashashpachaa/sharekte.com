import { useState, useEffect } from "react";
import { ServiceFormField } from "@/lib/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";

const FIELD_TYPES = [
  { value: "text", label: "Text Input" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone Number" },
  { value: "number", label: "Number" },
  { value: "currency", label: "Currency" },
  { value: "url", label: "URL" },
  { value: "textarea", label: "Text Area" },
  { value: "date", label: "Date" },
  { value: "time", label: "Time" },
  { value: "datetime", label: "Date & Time" },
  { value: "select", label: "Dropdown (Single)" },
  { value: "multiselect", label: "Dropdown (Multiple)" },
  { value: "radio", label: "Radio Buttons" },
  { value: "checkbox", label: "Checkbox" },
  { value: "boolean", label: "Yes/No Toggle" },
  { value: "rating", label: "Rating (1-5)" },
  { value: "file", label: "File Upload" },
  { value: "attachment", label: "Attachment Upload" },
];

const FILE_TYPES = [
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "txt",
  "csv",
  "jpg",
  "jpeg",
  "png",
  "gif",
  "zip",
];

interface FormFieldEditorProps {
  field?: ServiceFormField;
  isOpen: boolean;
  onClose: () => void;
  onSave: (field: ServiceFormField) => void;
}

export function FormFieldEditor({
  field,
  isOpen,
  onClose,
  onSave,
}: FormFieldEditorProps) {
  const [formData, setFormData] = useState<ServiceFormField>(
    field || {
      id: `field_${Date.now()}`,
      name: "",
      label: "",
      type: "text",
      required: false,
    }
  );
  const [options, setOptions] = useState<{ value: string; label: string }[]>(
    field?.options || []
  );
  const [newOption, setNewOption] = useState({ value: "", label: "" });
  const [selectedFileTypes, setSelectedFileTypes] = useState<string[]>(
    field?.acceptedFileTypes || []
  );

  useEffect(() => {
    if (field) {
      setFormData(field);
      setOptions(field.options || []);
      setSelectedFileTypes(field.acceptedFileTypes || []);
    }
  }, [field, isOpen]);

  const handleSave = () => {
    if (!formData.name || !formData.label) {
      alert("Please fill in field name and label");
      return;
    }

    const updatedField: ServiceFormField = {
      ...formData,
      options: options.length > 0 ? options : undefined,
      acceptedFileTypes: selectedFileTypes.length > 0 ? selectedFileTypes : undefined,
    };

    onSave(updatedField);
    onClose();
  };

  const addOption = () => {
    if (newOption.value && newOption.label) {
      setOptions([...options, newOption]);
      setNewOption({ value: "", label: "" });
    }
  };

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const toggleFileType = (type: string) => {
    setSelectedFileTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const needsOptions = ["select", "multiselect", "radio"].includes(formData.type);
  const needsFileTypes = ["file", "attachment"].includes(formData.type);
  const needsNumberOptions = ["number", "currency", "rating"].includes(formData.type);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {field ? "Edit Form Field" : "Create New Form Field"}
          </DialogTitle>
          <DialogDescription>
            Configure all aspects of this form field
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic Information */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-sm mb-3">Basic Information</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Field Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g., company_name"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Display Label *</label>
                <Input
                  value={formData.label}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, label: e.target.value }))
                  }
                  placeholder="e.g., Company Name"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Field Type *</label>
                <Select value={formData.type} onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    type: value as ServiceFormField["type"],
                  }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Placeholder Text</label>
                <Input
                  value={formData.placeholder || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      placeholder: e.target.value,
                    }))
                  }
                  placeholder="e.g., Enter company name"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Help Text</label>
                <Input
                  value={formData.helpText || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      helpText: e.target.value,
                    }))
                  }
                  placeholder="Optional help text shown below the field"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="required"
                  checked={formData.required}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      required: e.target.checked,
                    }))
                  }
                />
                <label htmlFor="required" className="text-sm font-medium">
                  Required Field
                </label>
              </div>
            </div>
          </div>

          {/* Text Validation */}
          {["text", "textarea", "email", "phone", "url"].includes(formData.type) && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-sm mb-3">Text Validation</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Min Length</label>
                  <Input
                    type="number"
                    value={formData.minLength || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        minLength: e.target.value ? parseInt(e.target.value) : undefined,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Max Length</label>
                  <Input
                    type="number"
                    value={formData.maxLength || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        maxLength: e.target.value ? parseInt(e.target.value) : undefined,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="mt-3">
                <label className="text-sm font-medium">Regex Pattern (Optional)</label>
                <Input
                  value={formData.pattern || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      pattern: e.target.value,
                    }))
                  }
                  placeholder="e.g., ^[A-Z]+$ for uppercase only"
                />
              </div>
            </div>
          )}

          {/* Number Validation */}
          {needsNumberOptions && (
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-sm mb-3">Numeric Options</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Min Value</label>
                  <Input
                    type="number"
                    value={formData.minValue || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        minValue: e.target.value ? parseInt(e.target.value) : undefined,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Max Value</label>
                  <Input
                    type="number"
                    value={formData.maxValue || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        maxValue: e.target.value ? parseInt(e.target.value) : undefined,
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* Options for Select/Radio */}
          {needsOptions && (
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-semibold text-sm mb-3">
                {formData.type === "radio" ? "Radio Options" : "Dropdown Options"}
              </h3>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Option value"
                    value={newOption.value}
                    onChange={(e) =>
                      setNewOption((prev) => ({
                        ...prev,
                        value: e.target.value,
                      }))
                    }
                  />
                  <Input
                    placeholder="Display label"
                    value={newOption.label}
                    onChange={(e) =>
                      setNewOption((prev) => ({
                        ...prev,
                        label: e.target.value,
                      }))
                    }
                  />
                  <Button onClick={addOption} size="sm" variant="outline">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {options.map((opt, idx) => (
                    <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                      {opt.label} ({opt.value})
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => removeOption(idx)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* File Types */}
          {needsFileTypes && (
            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="font-semibold text-sm mb-3">File Upload Settings</h3>
              <div className="mb-3">
                <label className="text-sm font-medium">Max File Size (MB)</label>
                <Input
                  type="number"
                  value={formData.maxFileSize || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      maxFileSize: e.target.value ? parseInt(e.target.value) : undefined,
                    }))
                  }
                  placeholder="e.g., 10"
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">Accepted File Types</label>
                <div className="grid grid-cols-3 gap-2">
                  {FILE_TYPES.map((type) => (
                    <div key={type} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`file_${type}`}
                        checked={selectedFileTypes.includes(type)}
                        onChange={() => toggleFileType(type)}
                      />
                      <label htmlFor={`file_${type}`} className="text-sm cursor-pointer">
                        {type.toUpperCase()}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Default Value */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-sm mb-3">Default Value (Optional)</h3>
            {formData.type === "boolean" ? (
              <div className="flex gap-3">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="default"
                    value="true"
                    checked={formData.defaultValue === true || formData.defaultValue === "true"}
                    onChange={() => setFormData((prev) => ({ ...prev, defaultValue: true }))}
                  />
                  Yes
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="default"
                    value="false"
                    checked={formData.defaultValue === false || formData.defaultValue === "false"}
                    onChange={() => setFormData((prev) => ({ ...prev, defaultValue: false }))}
                  />
                  No
                </label>
              </div>
            ) : (
              <Input
                value={formData.defaultValue || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    defaultValue: e.target.value,
                  }))
                }
                placeholder="Leave empty for no default"
              />
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Field</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
