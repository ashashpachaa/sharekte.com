import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Edit2,
  Trash2,
  Plus,
  Search,
  Check,
  X,
  AlertCircle,
} from "lucide-react";
import {
  ServiceData,
  ServiceFormField,
  SERVICE_CATEGORIES,
  fetchServices,
  createService,
  updateService,
  deleteService,
  STATUS_COLORS,
} from "@/lib/services";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FormFieldEditor } from "@/components/FormFieldEditor";

export function ServiceTable() {
  const [services, setServices] = useState<ServiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceData | null>(
    null
  );
  const [formData, setFormData] = useState<Partial<ServiceData>>({
    name: "",
    description: "",
    longDescription: "",
    price: 0,
    currency: "USD",
    category: "Documents",
    turnaroundDays: undefined,
    includes: [],
    applicationFormFields: [],
    status: "active",
  });
  const [newInclude, setNewInclude] = useState("");
  const [newFieldName, setNewFieldName] = useState("");
  const [showFieldEditor, setShowFieldEditor] = useState(false);
  const [selectedField, setSelectedField] = useState<ServiceFormField | undefined>();

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      const data = await fetchServices();
      setServices(data);
    } catch (error) {
      console.error("Error loading services:", error);
      toast.error("Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  const handleAddService = () => {
    setSelectedService(null);
    setFormData({
      name: "",
      description: "",
      longDescription: "",
      price: 0,
      currency: "USD",
      category: "Documents",
      turnaroundDays: undefined,
      includes: [],
      applicationFormFields: [],
      status: "active",
    });
    setShowFormDialog(true);
  };

  const handleEditService = (service: ServiceData) => {
    setSelectedService(service);
    setFormData(service);
    setShowFormDialog(true);
  };

  const handleSaveService = async () => {
    try {
      if (!formData.name || !formData.description) {
        toast.error("Please fill in all required fields");
        return;
      }

      if (selectedService) {
        // Update existing service
        const updated = await updateService(selectedService.id, formData);
        if (updated) {
          toast.success("Service updated successfully");
          loadServices();
        } else {
          toast.error("Failed to update service");
        }
      } else {
        // Create new service
        const created = await createService(
          formData as Omit<
            ServiceData,
            "id" | "createdAt" | "updatedAt"
          >
        );
        if (created) {
          toast.success("Service created successfully");
          loadServices();
        } else {
          toast.error("Failed to create service");
        }
      }

      setShowFormDialog(false);
    } catch (error) {
      console.error("Error saving service:", error);
      toast.error("Failed to save service");
    }
  };

  const handleDeleteService = async (id: string) => {
    try {
      const success = await deleteService(id);
      if (success) {
        toast.success("Service deleted successfully");
        loadServices();
      } else {
        toast.error("Failed to delete service");
      }
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting service:", error);
      toast.error("Failed to delete service");
    }
  };

  const addInclude = () => {
    if (newInclude.trim()) {
      setFormData((prev) => ({
        ...prev,
        includes: [...(prev.includes || []), newInclude],
      }));
      setNewInclude("");
    }
  };

  const removeInclude = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      includes: prev.includes?.filter((_, i) => i !== index) || [],
    }));
  };

  const addFormField = () => {
    if (newFieldName.trim()) {
      const newField: ServiceFormField = {
        id: `field_${Date.now()}`,
        name: newFieldName,
        label: newFieldName,
        type: "text",
        required: false,
      };
      setFormData((prev) => ({
        ...prev,
        applicationFormFields: [...(prev.applicationFormFields || []), newField],
      }));
      setNewFieldName("");
    }
  };

  const removeFormField = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      applicationFormFields:
        prev.applicationFormFields?.filter((f) => f.id !== id) || [],
    }));
  };

  const filteredServices = services.filter(
    (service) =>
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p>Loading services...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={handleAddService} className="ml-4">
          <Plus className="w-4 h-4 mr-2" />
          Add Service
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Turnaround</TableHead>
              <TableHead>Form Fields</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredServices.length > 0 ? (
              filteredServices.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">{service.name}</TableCell>
                  <TableCell>{service.category}</TableCell>
                  <TableCell>
                    {service.price} {service.currency}
                  </TableCell>
                  <TableCell>
                    {service.turnaroundDays
                      ? `${service.turnaroundDays} days`
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {service.applicationFormFields.length} fields
                  </TableCell>
                  <TableCell>
                    <Badge className={STATUS_COLORS[service.status]}>
                      {service.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditService(service)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedService(service);
                          setShowDeleteDialog(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  No services found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Service Form Dialog */}
      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedService ? "Edit Service" : "Create New Service"}
            </DialogTitle>
            <DialogDescription>
              {selectedService
                ? "Update service details and application form"
                : "Add a new service to the marketplace"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Basic Info */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Service Name *</label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g., Apostille"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Short Description *</label>
              <Input
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Brief description of the service"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Long Description</label>
              <Textarea
                value={formData.longDescription || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    longDescription: e.target.value,
                  }))
                }
                placeholder="Detailed description"
                rows={3}
              />
            </div>

            {/* Pricing & Category */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Price</label>
                <Input
                  type="number"
                  value={formData.price || 0}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      price: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Currency</label>
                <Select value={formData.currency} onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, currency: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="AED">AED</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="SAR">SAR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select value={formData.category} onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, category: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Turnaround (days)</label>
              <Input
                type="number"
                value={formData.turnaroundDays || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    turnaroundDays: e.target.value
                      ? parseInt(e.target.value)
                      : undefined,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={formData.status} onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  status: value as "active" | "inactive" | "archived",
                }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Includes */}
            <div className="space-y-2">
              <label className="text-sm font-medium">What's Included</label>
              <div className="flex gap-2">
                <Input
                  value={newInclude}
                  onChange={(e) => setNewInclude(e.target.value)}
                  placeholder="Add item"
                  onKeyPress={(e) => e.key === "Enter" && addInclude()}
                />
                <Button onClick={addInclude} variant="outline">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.includes?.map((item, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {item}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => removeInclude(idx)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            {/* Application Form Fields */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Application Form Fields</label>
              <div className="flex gap-2">
                <Input
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  placeholder="Field name"
                  onKeyPress={(e) => e.key === "Enter" && addFormField()}
                />
                <Button onClick={addFormField} variant="outline">
                  Add Field
                </Button>
              </div>
              <div className="space-y-2 mt-2">
                {formData.applicationFormFields?.map((field) => (
                  <div key={field.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{field.label}</p>
                      <p className="text-xs text-gray-600">{field.type}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFormField(field.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowFormDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveService}>
              {selectedService ? "Update Service" : "Create Service"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Service</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "
              {selectedService?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                selectedService && handleDeleteService(selectedService.id)
              }
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
