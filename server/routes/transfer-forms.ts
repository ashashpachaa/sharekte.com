import { RequestHandler } from "express";
import {
  TransferFormData,
  FormStatus,
  createEmptyForm,
  type DirectorInfo,
  type ShareholderInfo,
} from "../../client/lib/transfer-form";
import * as fs from "fs";
import * as path from "path";

// Persistent storage directory for forms
// Use environment variable or fallback (note: /tmp is ephemeral on Fly.io, use Airtable for true persistence)
const FORMS_STORAGE_DIR = process.env.FORMS_STORAGE_DIR || "/tmp/shareket-forms";

// Try to ensure storage directory exists (may fail on ephemeral Fly.io /tmp)
try {
  if (!fs.existsSync(FORMS_STORAGE_DIR)) {
    fs.mkdirSync(FORMS_STORAGE_DIR, { recursive: true });
    console.log("[transferForms] Created storage directory:", FORMS_STORAGE_DIR);
  }
} catch (error) {
  console.warn("[transferForms] Storage directory not available (expected on Fly.io /tmp):", error);
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
    console.error(`[transferForms] Error loading form ${formId} from file:`, error);
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
function findForm(searchId: string, inMem: TransferFormData[], db: TransferFormData[]): TransferFormData | undefined {
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
function findFormIndexInMem(searchId: string, inMem: TransferFormData[]): number {
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
        shareholders: [],
        numberOfShareholders: 0,
        pscList: [],
        numberOfPSCs: 0,
        changeCompanyName: false,
        changeCompanyActivities: false,
        status: "amend-required",
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        amendmentsRequiredCount: 1,
        attachments: [],
        comments: [],
        statusHistory: [],
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
    const { orderId } = req.query;

    // Return local forms (demo + in-memory)
    // In-memory forms have the most up-to-date status since they're updated immediately when status changes
    let result: TransferFormData[] = [...formsDb, ...inMemoryForms];

    console.log(
      `[getTransferForms] Returning ${result.length} forms (${formsDb.length} demo + ${inMemoryForms.length} in-memory)`,
    );

    // Filter by orderId if provided
    if (orderId) {
      result = result.filter((f) => f.orderId === orderId);
      console.log(`[getTransferForms] Filtered to ${result.length} forms by orderId: ${orderId}`);
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
      { formId: newForm.formId, id: newForm.id, totalForms: inMemoryForms.length }
    );
    console.log("[createTransferForm] Current inMemoryForms:", inMemoryForms.map(f => ({ id: f.id, formId: f.formId, company: f.companyName })));

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
    let form =
      findForm(id, inMemoryForms, formsDb);

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
    let form =
      findForm(id, inMemoryForms, formsDb);
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

    const updated: TransferFormData = {
      ...form,
      status: status as FormStatus,
      amendmentsRequiredCount: amendmentCount,
      lastAmendmentDate:
        status === "amend-required"
          ? new Date().toISOString()
          : form.lastAmendmentDate,
      updatedAt: new Date().toISOString(),
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
    console.log(`[updateFormStatus] Status changed: ${previousStatus} → ${status}`);

    // Send status notification email (async - don't wait for response)
    (async () => {
      try {
        const { sendFormStatusNotification } = await import(
          "../utils/form-notifications"
        );
        await sendFormStatusNotification(
          updated,
          status as FormStatus,
          notes,
          reason,
        );
      } catch (error) {
        console.error("Error sending notification:", error);
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
    let form =
      findForm(id, inMemoryForms, formsDb);

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
    let form =
      findForm(id, inMemoryForms, formsDb);
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
    let form =
      findForm(id, inMemoryForms, formsDb);

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
    const form =
      inMemoryForms.find((f) => f.id === targetFormId) ||
      formsDb.find((f) => f.id === targetFormId);

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

    const attachment = {
      id: `attachment_${Date.now()}`,
      name: filename,
      type: filetype || "application/octet-stream",
      size: filesize || 0,
      data: data || "",
      uploadedDate: new Date().toISOString(),
      uploadedBy: "user",
    };

    if (!form.attachments) {
      form.attachments = [];
    }

    form.attachments.push(attachment);
    form.updatedAt = new Date().toISOString();

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
    let form =
      findForm(id, inMemoryForms, formsDb);

    if (!form) {
      return res.status(404).json({ error: "Form not found" });
    }

    form.attachments = form.attachments.filter((a) => a.id !== attachmentId);
    form.updatedAt = new Date().toISOString();

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
    console.log("[generatePDF] Request body constructor:", req.body?.constructor?.name);

    // Try to get form from request body - be very lenient
    if (req.body && typeof req.body === 'object') {
      const bodyKeys = Object.keys(req.body);
      console.log("[generatePDF] Request body keys:", bodyKeys.slice(0, 10)); // Log first 10 keys

      // Check if any key indicates this is a form
      const isFormLike = bodyKeys.some(key =>
        key.includes('form') || key.includes('Form') ||
        key.includes('buyer') || key.includes('Buyer') ||
        key.includes('seller') || key.includes('Seller') ||
        key.includes('company') || key.includes('Company')
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
      console.log("[generatePDF] Searching local storage for form with id:", id);
      form = inMemoryForms.find((f) => f.formId === id || f.id === id) ||
             formsDb.find((f) => f.formId === id || f.id === id);
      if (form) {
        console.log("[generatePDF] ✓ Found form in local storage:", form.formId);
      } else {
        console.log("[generatePDF] Form not found in local storage");
      }
    }

    // If form not found locally, try fetching from Airtable (handles multi-instance/load-balanced scenarios)
    if (!form && process.env.AIRTABLE_API_TOKEN) {
      console.log("[generatePDF] Form not found locally, checking Airtable...");
      try {
        const { fetchFormsFromAirtable } = await import("../utils/airtable-sync");
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
      console.error("[generatePDF] Available in-memory forms:", inMemoryForms.map(f => f.formId).join(", ") || "none");
      console.error("[generatePDF] Available db forms:", formsDb.map(f => f.formId).join(", ") || "none");

      return res.status(404).json({
        error: "Form not found",
        detail: "The requested form could not be found. The form data may not have been saved properly or the server instance may have restarted.",
        searchedFor: id,
        hint: "Please refresh the page and try downloading the PDF again. If the problem persists, try submitting the form again."
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

      console.log("[generatePDF] ✓ HTML generated successfully, size:", htmlContent.length, "bytes");

      // Return HTML for viewing and printing to PDF
      // User will print to PDF using browser print dialog (Ctrl+P or Cmd+P)
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Content-Length", Buffer.byteLength(htmlContent));
      res.send(htmlContent);
      console.log("[generatePDF] ✓ HTML sent successfully to client");
    } catch (htmlError) {
      console.error("[generatePDF] HTML generation error:", htmlError);
      res.status(500).json({ error: "HTML generation failed", details: String(htmlError) });
    }
  } catch (error) {
    console.error("[generatePDF] Unexpected error:", error);
    res.status(500).json({ error: "Failed to generate PDF", details: String(error) });
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
