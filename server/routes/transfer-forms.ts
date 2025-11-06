import { RequestHandler } from "express";
import { sendTransferFormEmail } from "./notifications";

// Type definitions - copied locally to avoid importing from client code
type FormStatus =
  | "under-review"
  | "amend-required"
  | "confirm-application"
  | "transferring"
  | "complete-transfer"
  | "canceled";

interface DirectorInfo {
  name: string;
  nationality: string;
  address: string;
  city: string;
  country: string;
  phone?: string;
}

interface ShareholderInfo {
  name: string;
  nationality: string;
  address: string;
  city: string;
  country: string;
  shares: number;
  amount: number;
  percentage: number;
}

interface FormAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedDate: string;
  uploadedBy: string;
  url?: string;
  data?: string;
}

interface FormComment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
  isAdminOnly?: boolean;
}

interface TransferFormData {
  id: string;
  formId: string;
  orderId: string;
  companyName: string;
  companyNumber: string;
  country: string;
  status: FormStatus;
  createdAt: string;
  updatedAt: string;
  sellerName?: string;
  sellerEmail?: string;
  sellerPhone?: string;
  sellerCountry?: string;
  sellerAddress?: string;
  sellerCity?: string;
  sellerState?: string;
  sellerPostalCode?: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  buyerCountry?: string;
  buyerAddress?: string;
  buyerCity?: string;
  buyerState?: string;
  buyerPostalCode?: string;
  directors: DirectorInfo[];
  shareholders: ShareholderInfo[];
  pscDeclaration: { hasPSC: boolean; details: string };
  amendments: string[];
  comments: FormComment[];
  attachments: FormAttachment[];
  activities: string[];
}

// Import runtime function separately with proper bundling
const createEmptyForm = (): TransferFormData => ({
  id: `form_${Date.now()}`,
  formId: `FORM-${Date.now()}`,
  orderId: "",
  companyName: "",
  companyNumber: "",
  country: "",
  status: "under-review",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  sellerName: "",
  sellerEmail: "",
  sellerPhone: "",
  sellerCountry: "",
  sellerAddress: "",
  sellerCity: "",
  sellerState: "",
  sellerPostalCode: "",
  buyerName: "",
  buyerEmail: "",
  buyerPhone: "",
  buyerCountry: "",
  buyerAddress: "",
  buyerCity: "",
  buyerState: "",
  buyerPostalCode: "",
  directors: [],
  shareholders: [],
  pscDeclaration: { hasPSC: false, details: "" },
  amendments: [],
  comments: [],
  attachments: [],
  activities: [],
});
import * as fs from "fs";
import * as path from "path";

// Persistent storage directory for forms
// Use environment variable or fallback (note: /tmp is ephemeral on Fly.io, use Airtable for true persistence)
const FORMS_STORAGE_DIR =
  process.env.FORMS_STORAGE_DIR || "/tmp/shareket-forms";

// Try to ensure storage directory exists (may fail on ephemeral Fly.io /tmp)
try {
  if (!fs.existsSync(FORMS_STORAGE_DIR)) {
    fs.mkdirSync(FORMS_STORAGE_DIR, { recursive: true });
    console.log(
      "[transferForms] Created storage directory:",
      FORMS_STORAGE_DIR,
    );
  }
} catch (error) {
  console.warn(
    "[transferForms] Storage directory not available (expected on Fly.io /tmp):",
    error,
  );
}

// Helper: Load form from persistent storage
function loadFormFromFile(formId: string): TransferFormData | null {
  try {
    const filePath = path.join(FORMS_STORAGE_DIR, `${formId}.json`);
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error(
      `[transferForms] Error loading form ${formId} from file:`,
      error,
    );
  }
  return null;
}

// Helper: Save form to persistent storage
function saveFormToFile(form: TransferFormData): void {
  try {
    const filePath = path.join(FORMS_STORAGE_DIR, `${form.formId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(form, null, 2));
    console.log(`[transferForms] Saved form ${form.formId} to file storage`);
  } catch (error) {
    console.error(`[transferForms] Error saving form to file:`, error);
  }
}

// In-memory storage - persists newly created forms across requests
let inMemoryForms: TransferFormData[] = [];

// Demo data storage
let formsDb: TransferFormData[] = [];
let idCounter = 1;

function generateId(): string {
  return `form_${idCounter++}`;
}

// Helper function to find forms by either internal id or user-facing formId
// Checks memory first, then file storage, then db
function findForm(
  searchId: string,
  inMem: TransferFormData[],
  db: TransferFormData[],
): TransferFormData | undefined {
  // Check in-memory first
  const memForm = inMem.find((f) => f.formId === searchId || f.id === searchId);
  if (memForm) return memForm;

  // Check file storage (handles multi-instance deployments)
  const fileForm = loadFormFromFile(searchId);
  if (fileForm) return fileForm;

  // Check database
  return db.find((f) => f.formId === searchId || f.id === searchId);
}

// Helper function to find form index in memory
function findFormIndexInMem(
  searchId: string,
  inMem: TransferFormData[],
): number {
  return inMem.findIndex((f) => f.formId === searchId || f.id === searchId);
}

// Helper function to find form index in db
function findFormIndexInDb(searchId: string, db: TransferFormData[]): number {
  return db.findIndex((f) => f.formId === searchId || f.id === searchId);
}

// Initialize with demo transfer forms
function initializeDemoForms() {
  if (formsDb.length === 0) {
    formsDb = [
      {
        id: generateId(),
        formId: "TF001",
        orderId: "order_1",
        companyId: "comp_1",
        companyName: "Tech Solutions Ltd",
        companyNumber: "12345678",
        country: "UK",
        incorporationDate: "2020-01-15",
        incorporationYear: 2020,
        totalShares: 1000,
        totalShareCapital: 100000,
        pricePerShare: 100,
        sellerName: "Sarah Johnson",
        sellerEmail: "sarah.johnson@example.com",
        sellerPhone: "+44 20 7946 0958",
        sellerCountry: "UK",
        sellerAddress: "456 Business Park",
        sellerCity: "Manchester",
        sellerState: "England",
        sellerPostalCode: "M3 4RB",
        buyerName: "Ahmed Al-Rashid",
        buyerEmail: "ahmed.rashid@example.ae",
        buyerPhone: "+971 4 123 4567",
        buyerCountry: "UAE",
        buyerAddress: "Office 101, Business Bay",
        buyerCity: "Dubai",
        buyerState: "Dubai",
        buyerPostalCode: "P.O. Box 12345",
        shareholders: [
          {
            id: "sh_1",
            name: "John Smith",
            nationality: "British",
            address: "123 Main St",
            city: "London",
            state: "England",
            postalCode: "SW1A 1AA",
            country: "UK",
            sharePercentage: 50,
          },
        ],
        numberOfShareholders: 1,
        pscList: [],
        numberOfPSCs: 0,
        changeCompanyName: false,
        changeCompanyActivities: false,
        status: "under-review",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        amendmentsRequiredCount: 0,
        attachments: [],
        comments: [],
        statusHistory: [],
      },
      {
        id: generateId(),
        formId: "TF002",
        orderId: "order_2",
        companyId: "comp_2",
        companyName: "Nordic Business AB",
        companyNumber: "87654321",
        country: "Sweden",
        incorporationDate: "2019-06-20",
        incorporationYear: 2019,
        totalShares: 500,
        totalShareCapital: 50000,
        pricePerShare: 100,
        sellerName: "Erik Andersson",
        sellerEmail: "erik.andersson@example.se",
        sellerPhone: "+46 8 123 4567",
        sellerCountry: "Sweden",
        sellerAddress: "Strandvägen 5",
        sellerCity: "Stockholm",
        sellerState: "Stockholms Län",
        sellerPostalCode: "114 51",
        buyerName: "Maria Garcia",
        buyerEmail: "maria.garcia@example.es",
        buyerPhone: "+34 91 123 4567",
        buyerCountry: "Spain",
        buyerAddress: "Paseo de la Castellana 150",
        buyerCity: "Madrid",
        buyerState: "Madrid",
        buyerPostalCode: "28046",
        shareholders: [],
        numberOfShareholders: 0,
        pscList: [],
        numberOfPSCs: 0,
        changeCompanyName: false,
        changeCompanyActivities: false,
        status: "amend-required",
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        amendmentsRequiredCount: 2,
        attachments: [],
        comments: [
          {
            id: "comment_1",
            author: "admin",
            text: "Please provide detailed information about all shareholders. We need names, nationalities, and ownership percentages for each shareholder.",
            createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
            isAdminOnly: true,
          },
          {
            id: "comment_2",
            author: "admin",
            text: "Also, please update the company activities list. The current description is too vague. We need specific NACE codes and detailed business operations.",
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            isAdminOnly: true,
          },
        ],
        statusHistory: [
          {
            id: "log_1",
            fromStatus: "under-review",
            toStatus: "amend-required",
            changedDate: new Date(
              Date.now() - 3 * 60 * 60 * 1000,
            ).toISOString(),
            changedBy: "admin",
            notes:
              "Please provide detailed information about all shareholders. We need names, nationalities, and ownership percentages for each shareholder.",
          },
          {
            id: "log_2",
            fromStatus: "amend-required",
            toStatus: "amend-required",
            changedDate: new Date(
              Date.now() - 2 * 60 * 60 * 1000,
            ).toISOString(),
            changedBy: "admin",
            notes:
              "Also, please update the company activities list. The current description is too vague. We need specific NACE codes and detailed business operations.",
          },
        ],
      },
      {
        id: generateId(),
        formId: "TF003",
        orderId: "order_3",
        companyId: "comp_3",
        companyName: "Dubai Trade FZCO",
        companyNumber: "FZCO123",
        country: "UAE",
        incorporationDate: "2021-03-10",
        incorporationYear: 2021,
        totalShares: 2000,
        totalShareCapital: 200000,
        pricePerShare: 100,
        sellerName: "Fatima Al-Mansouri",
        sellerEmail: "fatima.almansouri@example.ae",
        sellerPhone: "+971 4 456 7890",
        sellerCountry: "UAE",
        sellerAddress: "Sheikh Zayed Road 123",
        sellerCity: "Dubai",
        sellerState: "Dubai",
        sellerPostalCode: "P.O. Box 456",
        buyerName: "James Wilson",
        buyerEmail: "james.wilson@example.com",
        buyerPhone: "+1 212 555 1234",
        buyerCountry: "USA",
        buyerAddress: "350 Fifth Avenue",
        buyerCity: "New York",
        buyerState: "NY",
        buyerPostalCode: "10118",
        shareholders: [],
        numberOfShareholders: 0,
        pscList: [],
        numberOfPSCs: 0,
        changeCompanyName: false,
        changeCompanyActivities: false,
        status: "complete-transfer",
        createdAt: new Date(
          Date.now() - 30 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        completedAt: new Date(
          Date.now() - 2 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        amendmentsRequiredCount: 0,
        attachments: [],
        comments: [],
        statusHistory: [],
      },
    ];
    console.log("[Transfer Forms] Initialized with 3 demo forms");
  }
}

// Call initialization on module load
initializeDemoForms();

function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

// Get all transfer forms
export const getTransferForms: RequestHandler = async (req, res) => {
  try {
    const { orderId, companyId, companyName } = req.query;

    // Return local forms (demo + in-memory)
    // In-memory forms have the most up-to-date status since they're updated immediately when status changes
    let result: TransferFormData[] = [...formsDb, ...inMemoryForms];

    console.log(
      `[getTransferForms] Returning ${result.length} forms (${formsDb.length} demo + ${inMemoryForms.length} in-memory)`,
    );

    // Filter by orderId if provided
    if (orderId) {
      result = result.filter((f) => f.orderId === orderId);
      console.log(
        `[getTransferForms] Filtered to ${result.length} forms by orderId: ${orderId}`,
      );
    }

    // Filter by companyId if provided
    if (companyId && !orderId) {
      result = result.filter((f) => f.companyNumber === companyId);
      console.log(
        `[getTransferForms] Filtered to ${result.length} forms by companyId: ${companyId}`,
      );
    }

    // Filter by companyName if provided (case-insensitive)
    if (companyName && !orderId && !companyId) {
      const searchName = String(companyName).toLowerCase();
      result = result.filter((f) =>
        f.companyName.toLowerCase().includes(searchName),
      );
      console.log(
        `[getTransferForms] Filtered to ${result.length} forms by companyName: ${companyName}`,
      );
    }

    res.json(result);
  } catch (error) {
    console.error("[getTransferForms] Error:", error);
    res.status(500).json({ error: "Failed to fetch forms" });
  }
};

// Get single transfer form
export const getTransferForm: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const form = findForm(id, inMemoryForms, formsDb);

    if (!form) {
      return res.status(404).json({ error: "Form not found" });
    }

    res.json(form);
  } catch (error) {
    console.error("Error fetching form:", error);
    res.status(500).json({ error: "Failed to fetch form" });
  }
};

// Create transfer form
export const createTransferForm: RequestHandler = async (req, res) => {
  try {
    const {
      orderId,
      companyId,
      companyName,
      companyNumber,
      country,
      incorporationDate,
      incorporationYear,
      totalShares,
      totalShareCapital,
      shareholders,
      numberOfShareholders,
      pscList,
      numberOfPSCs,
      changeCompanyName,
      suggestedNames,
      changeCompanyActivities,
      companyActivities,
      attachments,
      // Seller Information
      sellerName,
      sellerEmail,
      sellerPhone,
      sellerAddress,
      sellerCity,
      sellerState,
      sellerPostalCode,
      sellerCountry,
      // Buyer Information
      buyerName,
      buyerEmail,
      buyerPhone,
      buyerAddress,
      buyerCity,
      buyerState,
      buyerPostalCode,
      buyerCountry,
    } = req.body;

    if (
      !orderId ||
      !companyId ||
      !companyName ||
      !totalShares ||
      !totalShareCapital
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const pricePerShare = totalShareCapital / totalShares;

    const newForm: TransferFormData = {
      id: generateId(),
      formId: `FORM-${Date.now()}`,
      orderId,
      companyId,
      companyName,
      companyNumber: companyNumber || "",
      country: country || "",
      incorporationDate: incorporationDate || "",
      incorporationYear: incorporationYear || new Date().getFullYear(),

      // Seller Information
      sellerName: sellerName || "",
      sellerEmail: sellerEmail || "",
      sellerPhone: sellerPhone || "",
      sellerAddress: sellerAddress || "",
      sellerCity: sellerCity || "",
      sellerState: sellerState || "",
      sellerPostalCode: sellerPostalCode || "",
      sellerCountry: sellerCountry || "",

      // Buyer Information
      buyerName: buyerName || "",
      buyerEmail: buyerEmail || "",
      buyerPhone: buyerPhone || "",
      buyerAddress: buyerAddress || "",
      buyerCity: buyerCity || "",
      buyerState: buyerState || "",
      buyerPostalCode: buyerPostalCode || "",
      buyerCountry: buyerCountry || "",

      totalShares,
      totalShareCapital,
      pricePerShare,

      shareholders: shareholders || [],
      numberOfShareholders: numberOfShareholders || 0,

      pscList: pscList || [],
      numberOfPSCs: numberOfPSCs || 0,

      changeCompanyName: changeCompanyName || false,
      suggestedNames: suggestedNames || [],
      changeCompanyActivities: changeCompanyActivities || false,
      companyActivities: companyActivities || [],

      status: "under-review",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),

      amendmentsRequiredCount: 0,
      attachments: attachments || [],
      comments: [],
      statusHistory: [
        {
          id: `log_${Date.now()}`,
          fromStatus: "under-review" as FormStatus,
          toStatus: "under-review",
          changedDate: new Date().toISOString(),
          changedBy: "system",
          notes: "Form created",
        },
      ],
    };

    // Store in persistent in-memory storage
    inMemoryForms.push(newForm);

    // Also save to file storage for multi-instance deployments (Fly.io load balancing)
    saveFormToFile(newForm);

    console.log(
      "[createTransferForm] ✓ Form stored in memory and file storage",
      {
        formId: newForm.formId,
        id: newForm.id,
        totalForms: inMemoryForms.length,
      },
    );
    console.log(
      "[createTransferForm] Current inMemoryForms:",
      inMemoryForms.map((f) => ({
        id: f.id,
        formId: f.formId,
        company: f.companyName,
      })),
    );

    // Sync to Airtable if configured (wait for completion)
    if (process.env.AIRTABLE_API_TOKEN) {
      try {
        const { syncFormToAirtable, syncFormToTransferFormTable } =
          await import("../utils/airtable-sync");

        // Sync to comprehensive forms table
        await syncFormToAirtable(newForm);
        console.log(
          "[createTransferForm] ✓ Form synced to Airtable comprehensive table",
        );

        // Sync to simplified Transfer Forms table (with core fields only)
        await syncFormToTransferFormTable(newForm);
        console.log(
          "[createTransferForm] ✓ Form synced to Airtable Transfer Forms table",
        );
      } catch (error) {
        console.error(
          "[createTransferForm] Warning - Airtable sync failed:",
          error,
        );
        // Don't fail the request, form is safe in in-memory storage
      }
    } else {
      console.log(
        "[createTransferForm] Note: AIRTABLE_API_TOKEN not set, form stored in-memory only",
      );
    }

    // Send transfer form submission email (async - don't wait for response)
    (async () => {
      try {
        if (newForm.buyerEmail) {
          await sendTransferFormEmail({
            to: newForm.buyerEmail,
            eventType: "submitted",
            formId: newForm.formId || newForm.id || "unknown",
            companyName: newForm.companyName || "Unknown Company",
            status: "submitted",
          });
        }
      } catch (error) {
        console.error("Error sending transfer form submission email:", error);
        // Don't fail the request if notification fails
      }
    })();

    res.status(201).json(newForm);
  } catch (error) {
    console.error("Error creating form:", error);
    res.status(500).json({ error: "Failed to create form" });
  }
};

// Update transfer form
export const updateTransferForm: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    // Search in both in-memory and demo forms
    let form = findForm(id, inMemoryForms, formsDb);

    if (!form) {
      return res.status(404).json({ error: "Form not found" });
    }

    const updated: TransferFormData = {
      ...form,
      ...req.body,
      id: form.id,
      createdAt: form.createdAt,
      updatedAt: new Date().toISOString(),
    };

    // Update in the appropriate storage (in-memory takes priority)
    let memIndex = findFormIndexInMem(id, inMemoryForms);
    if (memIndex !== -1) {
      inMemoryForms[memIndex] = updated;
      console.log("[updateTransferForm] ✓ Updated form in in-memory storage");
    } else {
      let dbIndex = findFormIndexInDb(id, formsDb);
      if (dbIndex !== -1) {
        formsDb[dbIndex] = updated;
        console.log("[updateTransferForm] ✓ Updated form in demo storage");
      }
    }

    // Save updated form to file storage for multi-instance consistency
    saveFormToFile(updated);

    res.json(updated);
  } catch (error) {
    console.error("Error updating form:", error);
    res.status(500).json({ error: "Failed to update form" });
  }
};

// Update form status
export const updateFormStatus: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, reason } = req.body;

    // Search in both in-memory and demo forms
    let form = findForm(id, inMemoryForms, formsDb);
    if (!form) {
      return res.status(404).json({ error: "Form not found" });
    }

    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    const previousStatus = form.status;
    const amendmentCount =
      status === "amend-required"
        ? form.amendmentsRequiredCount + 1
        : form.amendmentsRequiredCount;

    const newComments = [...form.comments];

    // Add comment to comments array if status is "amend-required" and notes provided
    if (status === "amend-required" && notes) {
      newComments.push({
        id: `comment_${Date.now()}`,
        author: "admin",
        text: notes,
        createdAt: new Date().toISOString(),
        isAdminOnly: true,
      });
    }

    const updated: TransferFormData = {
      ...form,
      status: status as FormStatus,
      amendmentsRequiredCount: amendmentCount,
      lastAmendmentDate:
        status === "amend-required"
          ? new Date().toISOString()
          : form.lastAmendmentDate,
      updatedAt: new Date().toISOString(),
      comments: newComments,
      statusHistory: [
        ...form.statusHistory,
        {
          id: `log_${Date.now()}`,
          fromStatus: previousStatus,
          toStatus: status,
          changedDate: new Date().toISOString(),
          changedBy: "admin",
          reason: reason || undefined,
          notes: notes || undefined,
        },
      ],
    };

    // Update in the appropriate storage (in-memory takes priority)
    let memIndex = findFormIndexInMem(id, inMemoryForms);
    if (memIndex !== -1) {
      inMemoryForms[memIndex] = updated;
      console.log("[updateFormStatus] ✓ Updated form in in-memory storage");
    } else {
      let dbIndex = findFormIndexInDb(id, formsDb);
      if (dbIndex !== -1) {
        formsDb[dbIndex] = updated;
        console.log("[updateFormStatus] ✓ Updated form in demo storage");
      }
    }

    // Save updated form to file storage for multi-instance consistency
    saveFormToFile(updated);

    // Note: Airtable sync is handled separately - status updates persist in local storage
    console.log("[updateFormStatus] ✓ Form status updated in local storage");
    console.log(
      `[updateFormStatus] Status changed: ${previousStatus} → ${status}`,
    );

    // Send status notification email (async - don't wait for response)
    (async () => {
      try {
        // Find the customer email (could be buyerName email or from orderId relationship)
        let customerEmail = updated.buyerEmail || updated.buyerName;

        // Try to extract email if it contains one
        if (customerEmail && !customerEmail.includes("@")) {
          // If it's just a name, use admin email for now
          customerEmail = process.env.ADMIN_EMAIL || "sales@sharekte.com";
        }

        if (customerEmail) {
          await sendTransferFormEmail({
            to: customerEmail,
            eventType: status as any,
            formId: updated.id || updated.formId || "unknown",
            companyName: updated.companyName || "Unknown Company",
            status: status,
            adminNotes: notes || reason || undefined,
          });
        }
      } catch (error) {
        console.error("Error sending transfer form email:", error);
        // Don't fail the request if notification fails
      }
    })();

    res.json(updated);
  } catch (error) {
    console.error("Error updating form status:", error);
    res.status(500).json({ error: "Failed to update form status" });
  }
};

// Delete transfer form
export const deleteTransferForm: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    // Search in both in-memory and demo forms
    let form = findForm(id, inMemoryForms, formsDb);

    if (!form) {
      return res.status(404).json({ error: "Form not found" });
    }

    // Delete from both arrays
    inMemoryForms = inMemoryForms.filter((f) => f.id !== id);
    formsDb = formsDb.filter((f) => f.id !== id);
    res.json({ message: "Form deleted" });
  } catch (error) {
    console.error("Error deleting form:", error);
    res.status(500).json({ error: "Failed to delete form" });
  }
};

// Add director
export const addDirector: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const directorData = req.body;

    // Search in both in-memory and demo forms
    let form = findForm(id, inMemoryForms, formsDb);
    if (!form) {
      return res.status(404).json({ error: "Form not found" });
    }

    const director: DirectorInfo = {
      id: `director_${Date.now()}`,
      ...directorData,
    };

    form.directors.push(director);
    form.updatedAt = new Date().toISOString();

    res.json(director);
  } catch (error) {
    console.error("Error adding director:", error);
    res.status(500).json({ error: "Failed to add director" });
  }
};

// Remove director
export const removeDirector: RequestHandler = async (req, res) => {
  try {
    const { id, directorId } = req.params;

    // Search in both in-memory and demo forms
    let form = findForm(id, inMemoryForms, formsDb);

    if (!form) {
      return res.status(404).json({ error: "Form not found" });
    }

    form.directors = form.directors.filter((d) => d.id !== directorId);
    form.updatedAt = new Date().toISOString();

    res.json({ message: "Director removed" });
  } catch (error) {
    console.error("Error removing director:", error);
    res.status(500).json({ error: "Failed to remove director" });
  }
};

// Add shareholder
export const addShareholder: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const shareholderData = req.body;

    const form = findForm(id, inMemoryForms, formsDb);
    if (!form) {
      return res.status(404).json({ error: "Form not found" });
    }

    const shareholder: ShareholderInfo = {
      id: `shareholder_${Date.now()}`,
      ...shareholderData,
    };

    form.shareholders.push(shareholder);
    form.updatedAt = new Date().toISOString();

    res.json(shareholder);
  } catch (error) {
    console.error("Error adding shareholder:", error);
    res.status(500).json({ error: "Failed to add shareholder" });
  }
};

// Add comment
export const addComment: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, isAdminOnly } = req.body;

    const form = findForm(id, inMemoryForms, formsDb);
    if (!form) {
      return res.status(404).json({ error: "Form not found" });
    }

    if (!text) {
      return res.status(400).json({ error: "Comment text is required" });
    }

    const comment = {
      id: `comment_${Date.now()}`,
      author: "admin",
      text,
      createdAt: new Date().toISOString(),
      isAdminOnly: isAdminOnly || false,
    };

    form.comments.push(comment);
    form.updatedAt = new Date().toISOString();

    // Send comment notification email (if not admin-only)
    if (!isAdminOnly) {
      (async () => {
        try {
          const { sendCommentNotification } = await import(
            "../utils/form-notifications"
          );
          await sendCommentNotification(form, text, isAdminOnly);
        } catch (error) {
          console.error("Error sending comment notification:", error);
        }
      })();
    }

    res.json(comment);
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ error: "Failed to add comment" });
  }
};

// Upload attachment
export const uploadAttachment: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { formId, filename, filesize, filetype, data } = req.body;

    // Support both URL param id and formId from body
    const targetFormId = id || formId;
    const form = findForm(targetFormId, inMemoryForms, formsDb);

    if (!form) {
      return res.status(404).json({ error: "Form not found" });
    }

    if (!filename) {
      return res.status(400).json({ error: "No filename provided" });
    }

    // Check file size limit (50MB)
    const maxSize = 50 * 1024 * 1024;
    if (filesize && filesize > maxSize) {
      return res.status(400).json({ error: "File size exceeds 50MB limit" });
    }

    // Validate base64 data if provided
    let validatedData = data || "";
    if (validatedData) {
      try {
        // Clean up data URL prefix if present
        if (validatedData.includes(",")) {
          validatedData = validatedData.split(",")[1];
        }

        // Validate it's proper base64 by attempting to decode
        const trimmedData = validatedData.trim();
        if (trimmedData.length > 0) {
          // Test decode to validate format using Buffer
          try {
            const buffer = Buffer.from(trimmedData, "base64");
            if (buffer.length === 0) {
              console.warn(
                "[uploadAttachment] ⚠ Empty decoded data for:",
                filename,
              );
            }
          } catch (bufferError) {
            console.error(
              "[uploadAttachment] ⚠ Invalid base64 data:",
              bufferError,
            );
            return res.status(400).json({
              error:
                "Invalid file data format. Please ensure the file is properly encoded.",
            });
          }
        }
        validatedData = trimmedData;
      } catch (validateError) {
        console.error(
          "[uploadAttachment] ⚠ Error validating base64 data:",
          validateError,
        );
        return res.status(400).json({
          error:
            "Invalid file data format. Please ensure the file is properly encoded.",
        });
      }
    }

    const attachment = {
      id: `attachment_${Date.now()}`,
      name: filename,
      type: filetype || "application/octet-stream",
      size: filesize || 0,
      data: validatedData,
      uploadedDate: new Date().toISOString(),
      uploadedBy: "user",
    };

    if (!form.attachments) {
      form.attachments = [];
    }

    form.attachments.push(attachment);
    form.updatedAt = new Date().toISOString();

    // Save form to persistent storage
    saveFormToFile(form);
    console.log(
      `[uploadAttachment] ✓ Attachment saved to form ${targetFormId} (${validatedData.length} bytes)`,
    );

    // Return attachment (including data so client can download immediately)
    res.json(attachment);
  } catch (error) {
    console.error("Error uploading attachment:", error);
    res.status(500).json({ error: "Failed to upload attachment" });
  }
};

// Delete attachment
export const deleteAttachment: RequestHandler = async (req, res) => {
  try {
    const { id, attachmentId } = req.params;

    // Search in both in-memory and demo forms
    let form = findForm(id, inMemoryForms, formsDb);

    if (!form) {
      return res.status(404).json({ error: "Form not found" });
    }

    form.attachments = form.attachments.filter((a) => a.id !== attachmentId);
    form.updatedAt = new Date().toISOString();

    // Save form to persistent storage
    saveFormToFile(form);
    console.log(`[deleteAttachment] ✓ Attachment deleted and form saved`);

    res.json({ message: "Attachment deleted" });
  } catch (error) {
    console.error("Error deleting attachment:", error);
    res.status(500).json({ error: "Failed to delete attachment" });
  }
};

// Generate PDF
export const generatePDF: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("[generatePDF] Generating PDF for form:", id);

    // First, check if form data is included in request body (client sends complete form via POST)
    let form: TransferFormData | undefined = undefined;

    console.log("[generatePDF] Request method:", req.method);
    console.log("[generatePDF] Request body exists:", !!req.body);
    console.log("[generatePDF] Request body type:", typeof req.body);
    console.log(
      "[generatePDF] Request body constructor:",
      req.body?.constructor?.name,
    );

    // Try to get form from request body - be very lenient
    if (req.body && typeof req.body === "object") {
      const bodyKeys = Object.keys(req.body);
      console.log("[generatePDF] Request body keys:", bodyKeys.slice(0, 10)); // Log first 10 keys

      // Check if any key indicates this is a form
      const isFormLike = bodyKeys.some(
        (key) =>
          key.includes("form") ||
          key.includes("Form") ||
          key.includes("buyer") ||
          key.includes("Buyer") ||
          key.includes("seller") ||
          key.includes("Seller") ||
          key.includes("company") ||
          key.includes("Company"),
      );

      if (isFormLike || bodyKeys.length > 5) {
        // This looks like a form object
        form = req.body as TransferFormData;
        console.log("[generatePDF] ✓ Using form data from POST body");
        console.log("[generatePDF] Form has formId:", !!form.formId);
        console.log("[generatePDF] Form has companyName:", !!form.companyName);
        console.log("[generatePDF] Form has buyerName:", !!form.buyerName);
      }
    }

    // If no form data in body, try to find it in local storage
    if (!form) {
      console.log(
        "[generatePDF] Searching local storage for form with id:",
        id,
      );
      form =
        inMemoryForms.find((f) => f.formId === id || f.id === id) ||
        formsDb.find((f) => f.formId === id || f.id === id);
      if (form) {
        console.log(
          "[generatePDF] ✓ Found form in local storage:",
          form.formId,
        );
      } else {
        console.log("[generatePDF] Form not found in local storage");
      }
    }

    // If form not found locally, try fetching from Airtable (handles multi-instance/load-balanced scenarios)
    if (!form && process.env.AIRTABLE_API_TOKEN) {
      console.log("[generatePDF] Form not found locally, checking Airtable...");
      try {
        const { fetchFormsFromAirtable } = await import(
          "../utils/airtable-sync"
        );
        const airtableForms = await fetchFormsFromAirtable();
        form = airtableForms.find((f) => f.formId === id || f.id === id);
        if (form) {
          console.log("[generatePDF] ✓ Found form in Airtable:", form.formId);
          // Add to local memory for future requests
          inMemoryForms.push(form);
        } else {
          console.log("[generatePDF] Form not found in Airtable either");
        }
      } catch (error) {
        console.error("[generatePDF] Error fetching from Airtable:", error);
      }
    }

    // If still not found, return detailed error
    if (!form) {
      console.error("[generatePDF] ❌ Form not found with ID:", id);
      console.error(
        "[generatePDF] Available in-memory forms:",
        inMemoryForms.map((f) => f.formId).join(", ") || "none",
      );
      console.error(
        "[generatePDF] Available db forms:",
        formsDb.map((f) => f.formId).join(", ") || "none",
      );

      return res.status(404).json({
        error: "Form not found",
        detail:
          "The requested form could not be found. The form data may not have been saved properly or the server instance may have restarted.",
        searchedFor: id,
        hint: "Please refresh the page and try downloading the PDF again. If the problem persists, try submitting the form again.",
      });
    }

    console.log("[generatePDF] ✓ Form found, generating HTML...");

    try {
      const { getFormPDFHTML } = await import("../utils/pdf-generator");
      const htmlContent = getFormPDFHTML(form, {
        includeAttachments: true,
        includeComments: true,
        includeAdminNotes: true,
        compact: false,
      });

      console.log(
        "[generatePDF] ✓ HTML generated successfully, size:",
        htmlContent.length,
        "bytes",
      );

      // Convert HTML to binary PDF
      try {
        const { generatePdf } = await import("html-pdf-node");

        console.log("[generatePDF] Converting HTML to binary PDF...");

        const options = {
          format: "A4",
          margin: {
            top: "10mm",
            right: "10mm",
            bottom: "10mm",
            left: "10mm",
          },
          printBackground: true,
          waitUntil: "networkidle2",
        };

        const pdfBuffer = await generatePdf({ content: htmlContent }, options);

        console.log(
          "[generatePDF] ✓ PDF generated successfully, size:",
          pdfBuffer.length,
          "bytes",
        );

        // Send as binary PDF file
        const filename = `transfer-form-${form.formId}.pdf`;
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${filename}"`,
        );
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
        res.setHeader("Content-Length", pdfBuffer.length);
        res.send(pdfBuffer);
        console.log("[generatePDF] ✓ Binary PDF sent successfully to client");
      } catch (pdfConvertError) {
        console.warn(
          "[generatePDF] PDF conversion failed, falling back to HTML:",
          pdfConvertError,
        );
        // Fallback: send HTML for manual printing
        const filename = `transfer-form-${form.formId}.html`;
        res.setHeader("Content-Type", "text/html");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${filename}"`,
        );
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.send(htmlContent);
        console.log(
          "[generatePDF] ⚠ HTML sent as fallback (PDF conversion unavailable)",
        );
      }
    } catch (htmlError) {
      console.error("[generatePDF] HTML generation error:", htmlError);
      res
        .status(500)
        .json({ error: "HTML generation failed", details: String(htmlError) });
    }
  } catch (error) {
    console.error("[generatePDF] Unexpected error:", error);
    res
      .status(500)
      .json({ error: "Failed to generate PDF", details: String(error) });
  }
};

// Get form analytics
export const getFormAnalytics: RequestHandler = async (req, res) => {
  try {
    const analytics = {
      total: formsDb.length,
      underReview: formsDb.filter((f) => f.status === "under-review").length,
      amendRequired: formsDb.filter((f) => f.status === "amend-required")
        .length,
      confirmApplication: formsDb.filter(
        (f) => f.status === "confirm-application",
      ).length,
      transferring: formsDb.filter((f) => f.status === "transferring").length,
      completed: formsDb.filter((f) => f.status === "complete-transfer").length,
      canceled: formsDb.filter((f) => f.status === "canceled").length,
      averageProcessingTime: calculateAverageProcessingTime(),
      pendingAmendments: formsDb.filter((f) => f.status === "amend-required")
        .length,
    };

    res.json(analytics);
  } catch (error) {
    console.error("Error getting analytics:", error);
    res.status(500).json({ error: "Failed to get analytics" });
  }
};

function calculateAverageProcessingTime(): number {
  if (formsDb.length === 0) return 0;

  const completedForms = formsDb.filter(
    (f) => f.status === "complete-transfer" && f.completedAt,
  );
  if (completedForms.length === 0) return 0;

  const totalTime = completedForms.reduce((sum, form) => {
    const created = new Date(form.createdAt).getTime();
    const completed = new Date(form.completedAt || "").getTime();
    return sum + (completed - created);
  }, 0);

  return Math.round(totalTime / completedForms.length / (1000 * 60 * 60 * 24)); // in days
}
