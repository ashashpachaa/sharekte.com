import { getAPIBaseURL } from "@/lib/transfer-form";

export interface ServiceFormField {
  id: string;
  name: string;
  label: string;
  type: "text" | "email" | "phone" | "textarea" | "select" | "checkbox" | "date";
  required: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
}

export interface ServiceData {
  id: string;
  name: string;
  description: string;
  longDescription?: string;
  price: number;
  currency: string;
  icon?: string;
  imageUrl?: string;
  category: string;
  turnaroundDays?: number;
  includes: string[];
  applicationFormFields: ServiceFormField[];
  status: "active" | "inactive" | "archived";
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface ServiceOrder {
  id: string;
  serviceId: string;
  serviceName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  amount: number;
  currency: string;
  status: "pending" | "processing" | "completed" | "cancelled";
  applicationData: Record<string, any>;
  purchaseDate: string;
  completionDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const SERVICE_CATEGORIES = [
  "Documents",
  "Legal",
  "Compliance",
  "Setup",
  "Certificates",
  "Other",
];

export const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-800",
  archived: "bg-red-100 text-red-800",
};

export function formatServicePrice(
  amount: number,
  currency: string = "USD"
): string {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  });
  return formatter.format(amount);
}

export async function fetchServices(): Promise<ServiceData[]> {
  const baseURL = getAPIBaseURL();
  try {
    const response = await fetch(`${baseURL}/api/services`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch services");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching services:", error);
    return [];
  }
}

export async function getService(id: string): Promise<ServiceData | null> {
  const baseURL = getAPIBaseURL();
  try {
    const response = await fetch(`${baseURL}/api/services/${id}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch service");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching service:", error);
    return null;
  }
}

export async function createService(service: Omit<ServiceData, "id" | "createdAt" | "updatedAt">): Promise<ServiceData | null> {
  const baseURL = getAPIBaseURL();
  try {
    const response = await fetch(`${baseURL}/api/services`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(service),
    });

    if (!response.ok) {
      throw new Error("Failed to create service");
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating service:", error);
    return null;
  }
}

export async function updateService(
  id: string,
  updates: Partial<ServiceData>
): Promise<ServiceData | null> {
  const baseURL = getAPIBaseURL();
  try {
    const response = await fetch(`${baseURL}/api/services/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error("Failed to update service");
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating service:", error);
    return null;
  }
}

export async function deleteService(id: string): Promise<boolean> {
  const baseURL = getAPIBaseURL();
  try {
    const response = await fetch(`${baseURL}/api/services/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });

    return response.ok;
  } catch (error) {
    console.error("Error deleting service:", error);
    return false;
  }
}

export async function createServiceOrder(
  order: Omit<ServiceOrder, "id" | "createdAt" | "updatedAt">
): Promise<ServiceOrder | null> {
  const baseURL = getAPIBaseURL();
  try {
    const response = await fetch(`${baseURL}/api/service-orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order),
    });

    if (!response.ok) {
      throw new Error("Failed to create service order");
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating service order:", error);
    return null;
  }
}

export async function fetchServiceOrders(
  filters?: {
    status?: string;
    serviceId?: string;
    customerEmail?: string;
  }
): Promise<ServiceOrder[]> {
  const baseURL = getAPIBaseURL();
  try {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.serviceId) params.append("serviceId", filters.serviceId);
    if (filters?.customerEmail) params.append("customerEmail", filters.customerEmail);

    const response = await fetch(
      `${baseURL}/api/service-orders${params.toString() ? "?" + params.toString() : ""}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch service orders");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching service orders:", error);
    return [];
  }
}
