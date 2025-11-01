import { RequestHandler } from "express";
import {
  TransferFormData,
  FormStatus,
  createEmptyForm,
  type DirectorInfo,
  type ShareholderInfo,
} from "../../client/lib/transfer-form";

// Mock database - Ready for Airtable integration
let formsDb: TransferFormData[] = [];
let idCounter = 1;

function generateId(): string {
  return `form_${idCounter++}`;
}

function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

// Get all transfer forms (with Airtable status sync)
export const getTransferForms: RequestHandler = async (req, res) => {
  try {
    const { orderId } = req.query;

    // Fetch latest status from Airtable if available
    const airtableForms = await (async () => {
      try {
        const { fetchFormsFromAirtable } = await import(
          "../utils/airtable-sync"
        );
        const forms = await fetchFormsFromAirtable();
        console.log(
          "[getTransferForms] Fetched from Airtable:",
          forms.length,
          "forms",
        );
        return forms;
      } catch (error) {
        console.warn("Could not fetch from Airtable:", error);
        return [];
      }
    })();

    // If we have local forms, merge Airtable status with them
    // Otherwise, use Airtable forms directly (as source of truth)
    let result: TransferFormData[] = [];

    if (formsDb.length > 0) {
      result = formsDb.map((form) => {
        const airtableForm = airtableForms.find(
          (af) =>
            af.companyName &&
            af.companyName.toLowerCase() === form.companyName.toLowerCase(),
        );

        // If form exists in Airtable, update status from there
        if (airtableForm && airtableForm.status) {
          console.log(
            `[getTransferForms] Merging Airtable status for ${form.companyName}: ${form.status} → ${airtableForm.status}`,
          );
          return {
            ...form,
            status: airtableForm.status,
          };
        }
        return form;
      });
    } else {
      // Use Airtable forms directly when local DB is empty
      result = airtableForms;
      console.log(
        "[getTransferForms] Using Airtable forms directly (no local forms)",
      );
      console.log(
        "[getTransferForms] Forms data:",
        result.map((f) => ({
          id: f.id,
          companyName: f.companyName,
          status: f.status,
          orderId: f.orderId,
        })),
      );
    }

    if (orderId) {
      result = result.filter((f) => f.orderId === orderId);
    }

    console.log(`[getTransferForms] Returning ${result.length} forms`);
    res.json(result);
  } catch (error) {
    console.error("Error fetching forms:", error);
    res.status(500).json({ error: "Failed to fetch forms" });
  }
};

// Get single transfer form
export const getTransferForm: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const form = formsDb.find((f) => f.id === id);

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

    formsDb.push(newForm);

    // Sync to Airtable if configured
    (async () => {
      try {
        const { syncFormToAirtable, syncFormToTransferFormTable } =
          await import("../utils/airtable-sync");

        // Sync to comprehensive forms table
        await syncFormToAirtable(newForm);

        // Sync to simplified Transfer Forms table (with core fields only)
        await syncFormToTransferFormTable(newForm);
      } catch (error) {
        console.error("Error syncing form to Airtable:", error);
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
    const form = formsDb.find((f) => f.id === id);

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

    const index = formsDb.findIndex((f) => f.id === id);
    formsDb[index] = updated;

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

    const form = formsDb.find((f) => f.id === id);
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

    const index = formsDb.findIndex((f) => f.id === id);
    formsDb[index] = updated;

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
    const form = formsDb.find((f) => f.id === id);

    if (!form) {
      return res.status(404).json({ error: "Form not found" });
    }

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

    const form = formsDb.find((f) => f.id === id);
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

    const form = formsDb.find((f) => f.id === id);
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

    const form = formsDb.find((f) => f.id === id);
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

    const form = formsDb.find((f) => f.id === id);
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
    const { filename, filesize, filetype } = req.body;

    const form = formsDb.find((f) => f.id === id);
    if (!form) {
      return res.status(404).json({ error: "Form not found" });
    }

    // Check file size limit (50MB)
    const maxSize = 50 * 1024 * 1024;
    if (filesize > maxSize) {
      return res.status(400).json({ error: "File size exceeds 50MB limit" });
    }

    const attachment = {
      id: `attachment_${Date.now()}`,
      name: filename,
      type: filetype,
      size: filesize,
      url: `/uploads/${form.id}/${filename}`,
      uploadedDate: new Date().toISOString(),
      uploadedBy: "admin",
    };

    form.attachments.push(attachment);
    form.updatedAt = new Date().toISOString();

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

    const form = formsDb.find((f) => f.id === id);
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

    const form = formsDb.find((f) => f.id === id);
    if (!form) {
      return res.status(404).json({ error: "Form not found" });
    }

    // Generate HTML for PDF
    // Note: This returns HTML that can be converted to PDF using:
    // - Puppeteer (recommended)
    // - wkhtmltopdf
    // - node-html-pdf
    //
    // For production, you'll want to use a library like:
    // - npm install puppeteer
    // - npm install pdfkit
    // - npm install html-to-pdf

    const { getFormPDFHTML } = await import("../utils/pdf-generator");
    const htmlContent = getFormPDFHTML(form, {
      includeAttachments: true,
      includeComments: true,
      includeAdminNotes: true,
      compact: false,
    });

    // Return HTML in browser for viewing and printing to PDF
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(htmlContent);

    // TODO: When using Puppeteer or similar, implement:
    // const html2pdf = require('html2pdf.js');
    // const pdfBuffer = await html2pdf().set(options).from.string(htmlContent).output();
    // res.setHeader("Content-Type", "application/pdf");
    // res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ error: "Failed to generate PDF" });
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
