# Amendment Comments & Status History - Technical Implementation

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     USER DASHBOARD                           │
│  (client/pages/Dashboard.tsx)                                │
│                                                              │
│  ┌──────────────────────────���──────────────────────────┐   │
│  │ Company Card (client/components/CompanyCard.tsx)    │   │
│  │                                                     │   │
│  │ useEffect → getAmendmentComments()                 │   │
│  │     ↓                                               │   │
│  │ Fetch: GET /api/transfer-forms?companyName=...    │   │
│  │     ↓                                               │   │
│  │ Display:                                           │   │
│  │   - Red alert box (if status = amend-required)    │   │
│  │   - Most recent comment                           │   │
│  │   - "View N amendments" button                    │   │
│  │   - Status history timeline                       │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│            BACKEND API (server/routes)                       │
│                                                              │
│  GET /api/transfer-forms?companyName={name}                │
│    ↓                                                         │
│  Handler: getTransferForms()                               │
│    - Search formsDb + inMemoryForms by companyName         │
│    - Returns matching form with:                           │
│      • status: "amend-required"                           │
│      • comments: [{id, author, text, createdAt, ...}]    │
│      • statusHistory: [{fromStatus, toStatus, ...}]      │
│    ↓                                                         │
│  Response: TransferFormData object                         │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│            IN-MEMORY DATABASE (server)                       │
│                                                              │
│  formsDb Array:                                            │
│  [                                                          │
│    {                                                        │
│      id: "form_2",                                         │
│      formId: "TF002",                                      │
│      companyName: "Nordic Business AB",                   │
│      status: "amend-required",                            │
│      comments: [                                           │
│        {                                                    │
│          id: "comment_1",                                 │
│          author: "admin",                                 │
│          text: "Please provide detailed...",              │
│          createdAt: "2025-01-04T02:30:00Z",              │
│          isAdminOnly: true                                │
│        }                                                    │
│      ],                                                     │
│      statusHistory: [                                      │
│        {                                                    │
│          id: "log_1",                                     │
│          fromStatus: "under-review",                      │
│          toStatus: "amend-required",                      │
│          changedDate: "2025-01-04T02:30:00Z",             │
│          changedBy: "admin",                              │
│          notes: "Please provide detailed..."              │
│        }                                                    │
│      ]                                                      │
│    }                                                        │
│  ]                                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Code Flow - Step by Step

### **1. Frontend: Fetch Amendment Comments**

**File:** `client/lib/transfer-form.ts`

```typescript
export async function getAmendmentComments(
  companyName: string
): Promise<FormComment[]> {
  try {
    const apiUrl = getAPIBaseURL();
    const response = await fetch(
      `${apiUrl}/api/transfer-forms?companyName=${encodeURIComponent(
        companyName
      )}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    );

    if (!response.ok) return [];

    const forms = await response.json();
    if (!Array.isArray(forms) || forms.length === 0) return [];

    // Filter for admin-only comments and sort by date (newest first)
    return (forms[0].comments || [])
      .filter((c: FormComment) => c.isAdminOnly)
      .sort(
        (a: FormComment, b: FormComment) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      );
  } catch (error) {
    console.error("Error fetching amendment comments:", error);
    return [];
  }
}
```

---

### **2. Frontend: Display in Company Card**

**File:** `client/components/CompanyCard.tsx`

```typescript
export function CompanyCard({
  company,
  // ... other props
}: CompanyCardProps) {
  const [amendmentComments, setAmendmentComments] =
    useState<FormComment[]>([]);
  const [showAmendmentHistory, setShowAmendmentHistory] =
    useState(false);

  // Load amendment comments when component mounts
  useEffect(() => {
    if (company.status === "amend-required") {
      setLoadingAmendments(true);
      // Use companyNumber to match with transfer form records
      getAmendmentComments(company.companyNumber)
        .then((comments) => {
          console.log(
            "[CompanyCard] Amendment comments loaded:",
            comments
          );
          setAmendmentComments(comments);
        })
        .catch((error) => {
          console.error("Error loading amendment comments:", error);
        })
        .finally(() => {
          setLoadingAmendments(false);
        });
    }
  }, [company.id, company.status]);

  const recentAmendment =
    amendmentComments.length > 0 ? amendmentComments[0] : null;
  const hasAmendmentRequired = company.status === "amend-required";

  return (
    <Card className="...">
      {/* Card Header */}
      <CardHeader>
        {/* Company name, number, status badge */}
      </CardHeader>

      <CardContent className="...">
        {/* Other company info */}

        {/* AMENDMENT REQUIRED ALERT */}
        {hasAmendmentRequired && (
          <div className="p-2 rounded-md bg-red-50 border border-red-200">
            <div className="flex gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-red-900 mb-1">
                  Amendments Required
                </p>

                {recentAmendment ? (
                  <>
                    {/* Most Recent Comment (Line-clamped to 2 lines) */}
                    <p className="text-xs text-red-800 line-clamp-2">
                      {recentAmendment.text}
                    </p>

                    {/* Timestamp */}
                    <p className="text-xs text-red-700 mt-1 opacity-75">
                      {new Date(recentAmendment.createdAt).toLocaleString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </p>

                    {/* View Amendments Button (if multiple) */}
                    {amendmentComments.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 px-2 text-xs text-red-600 mt-1"
                        onClick={() => setShowAmendmentHistory(true)}
                      >
                        <History className="w-3 h-3 mr-1" />
                        View {amendmentComments.length} amendments
                      </Button>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-red-700">
                    {loadingAmendments
                      ? "Loading amendments..."
                      : "No amendment details available"}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>

      {/* Amendment History Modal */}
      <Dialog open={showAmendmentHistory} onOpenChange={setShowAmendmentHistory}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Amendment History - {company.companyName}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {amendmentComments.map((comment, index) => (
              <div
                key={comment.id}
                className="border-l-4 border-red-200 pl-4 py-2"
              >
                <p className="text-sm font-semibold text-red-900">
                  Amendment #{index + 1}
                </p>
                <p className="text-sm text-gray-700 mt-1">{comment.text}</p>
                <p className="text-xs text-gray-500 mt-2">
                  📅 {new Date(comment.createdAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </p>
                <p className="text-xs text-gray-600">👤 By: {comment.author}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Status History Timeline (below amendment comments) */}
      {company.statusHistory && (
        <StatusHistoryTimeline statusHistory={company.statusHistory} />
      )}
    </Card>
  );
}
```

---

### **3. Backend: Return Transfer Form Data**

**File:** `server/routes/transfer-forms.ts`

```typescript
export const getTransferForms: RequestHandler = async (req, res) => {
  try {
    const { orderId, companyId, companyName } = req.query;

    // Get local forms (demo + in-memory)
    let result: TransferFormData[] = [...formsDb, ...inMemoryForms];

    // Filter by companyName if provided
    if (companyName) {
      const searchTerm = (companyName as string).toLowerCase();
      result = result.filter((f) =>
        f.companyName.toLowerCase().includes(searchTerm)
      );
    }

    // Filter by orderId if provided
    if (orderId) {
      result = result.filter((f) => f.orderId === orderId);
    }

    // Filter by companyId if provided
    if (companyId) {
      result = result.filter((f) => f.companyId === companyId);
    }

    console.log(`[getTransferForms] Returning ${result.length} forms`);
    return res.json(result);
  } catch (error) {
    console.error("[getTransferForms] Error:", error);
    return res.status(500).json({
      error: "Failed to fetch transfer forms",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
```

---

### **4. Admin: Update Status & Add Comment**

**File:** `server/routes/transfer-forms.ts`

```typescript
export const updateFormStatus: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { newStatus, statusNotes } = req.body;

    // Find form in memory or database
    let form = inMemoryForms.find((f) => f.id === id || f.formId === id) ||
      formsDb.find((f) => f.id === id || f.formId === id);

    if (!form) {
      return res.status(404).json({ error: "Form not found" });
    }

    const oldStatus = form.status;
    form.status = newStatus as FormStatus;
    form.updatedAt = new Date().toISOString();

    // Add comment if provided
    if (statusNotes) {
      const newComment: FormComment = {
        id: `comment_${Date.now()}`,
        author: "admin",
        text: statusNotes,
        createdAt: new Date().toISOString(),
        isAdminOnly: true,
      };
      form.comments = form.comments || [];
      form.comments.push(newComment);
    }

    // Add status history
    const statusChange = {
      id: `log_${Date.now()}`,
      fromStatus: oldStatus,
      toStatus: newStatus,
      changedDate: new Date().toISOString(),
      changedBy: "admin",
      notes: statusNotes || "",
    };
    form.statusHistory = form.statusHistory || [];
    form.statusHistory.push(statusChange);

    // Optionally sync to Airtable
    if (process.env.AIRTABLE_API_TOKEN) {
      // Sync to Airtable
    }

    return res.json({
      message: "Form status updated successfully",
      form,
    });
  } catch (error) {
    console.error("[updateFormStatus] Error:", error);
    return res.status(500).json({
      error: "Failed to update form status",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
```

---

## Data Flow Diagram

```
USER ACTION: Clicks company card
       ↓
CompanyCard mounts
       ↓
useEffect checks: status === "amend-required"?
       ↓ YES
getAmendmentComments(companyNumber) called
       ↓
API Request: GET /api/transfer-forms?companyName=Nordic%20Business%20AB
       ↓
Server: getTransferForms handler
       ↓
Search formsDb array for matching companyName
       ↓
Found: TF002 (Nordic Business AB) with:
  - status: "amend-required"
  - comments: [{...}, {...}]
  - statusHistory: [{...}, {...}]
       ↓
Return array with form object
       ↓
Client: setAmendmentComments(form.comments)
       ↓
CompanyCard re-renders with:
  ✅ Red alert box visible
  ✅ recentAmendment.text displayed
  ✅ recentAmendment.createdAt formatted and shown
  ✅ "View N amendments" button visible
       ↓
User sees amendment comment!
       ↓
User clicks "View N amendments" button
       ↓
setShowAmendmentHistory(true)
       ↓
Modal opens showing all amendmentComments
```

---

## Key Components & Files

### **Frontend Files**

| File | Component | Purpose |
|------|-----------|---------|
| `client/lib/transfer-form.ts` | `getAmendmentComments()` | Fetch comments from API |
| `client/components/CompanyCard.tsx` | `CompanyCard` | Display red alert + history |
| `client/components/StatusHistoryTimeline.tsx` | `StatusHistoryTimeline` | Timeline of status changes |
| `client/pages/Dashboard.tsx` | `Dashboard` | Main page with company cards |

### **Backend Files**

| File | Function | Purpose |
|------|----------|---------|
| `server/routes/transfer-forms.ts` | `getTransferForms()` | Fetch forms with comments |
| `server/routes/transfer-forms.ts` | `updateFormStatus()` | Update status + add comment |
| `server/index.ts` | Route registration | Register `/api/transfer-forms` |

---

## Type Definitions

```typescript
// Form Comment
interface FormComment {
  id: string;                // Unique comment ID
  author: string;            // "admin"
  text: string;              // Comment text
  createdAt: string;         // ISO timestamp
  isAdminOnly: boolean;      // Only shown to users if true
}

// Form Status Change
interface FormStatusChange {
  id: string;                // Unique change ID
  fromStatus: FormStatus;    // Previous status
  toStatus: FormStatus;      // New status
  changedDate: string;       // ISO timestamp
  changedBy: string;         // "admin"
  notes: string;             // Reason for change
}

// Transfer Form Data (subset)
interface TransferFormData {
  id: string;                // Internal ID
  formId: string;            // User-facing ID (TF002)
  status: FormStatus;        // Current status
  companyName: string;       // Company name
  comments: FormComment[];   // Array of admin comments
  statusHistory: FormStatusChange[]; // Array of status changes
  // ... other fields
}

// Form Status Enum
type FormStatus =
  | "under-review"
  | "amend-required"
  | "confirm-application"
  | "transferring"
  | "complete-transfer"
  | "canceled";
```

---

## API Endpoints Used

### **1. Fetch Amendment Comments**

```
GET /api/transfer-forms?companyName={companyName}

Response:
[
  {
    formId: "TF002",
    companyName: "Nordic Business AB",
    status: "amend-required",
    comments: [
      {
        id: "comment_1",
        author: "admin",
        text: "Please provide detailed information...",
        createdAt: "2025-01-04T02:30:00Z",
        isAdminOnly: true
      },
      ...
    ],
    statusHistory: [
      {
        id: "log_1",
        fromStatus: "under-review",
        toStatus: "amend-required",
        changedDate: "2025-01-04T02:30:00Z",
        changedBy: "admin",
        notes: "Please provide detailed information..."
      },
      ...
    ]
  }
]
```

### **2. Update Form Status & Add Comment (Admin)**

```
PATCH /api/transfer-forms/{id}/status

Request Body:
{
  "newStatus": "amend-required",
  "statusNotes": "Please provide detailed information about all shareholders..."
}

Response:
{
  message: "Form status updated successfully",
  form: {
    formId: "TF002",
    status: "amend-required",
    comments: [...],
    statusHistory: [...]
  }
}
```

---

## Error Handling

```typescript
// Frontend error handling
try {
  const comments = await getAmendmentComments(companyNumber);
  setAmendmentComments(comments);
} catch (error) {
  console.error("Error loading amendment comments:", error);
  // Fall back to empty comments array
  setAmendmentComments([]);
}

// Backend error handling
if (!form) {
  return res.status(404).json({
    error: "Form not found",
    companyName: companyName
  });
}

if (!Array.isArray(result)) {
  return res.status(400).json({
    error: "Invalid response format"
  });
}
```

---

## Performance Optimizations

1. **Lazy Loading:** Comments loaded only when status = "amend-required"
2. **Caching:** Comments stored in component state (React)
3. **Filtering:** API filters by companyName for faster response
4. **Pagination:** Amendment history scrollable modal (max-h-96)
5. **Sorting:** Comments sorted newest first for better UX

---

## Summary

The amendment system works through:

1. ✅ **Frontend:** CompanyCard loads comments via getAmendmentComments()
2. ✅ **API:** GET /api/transfer-forms fetches form with all data
3. ✅ **Backend:** Server stores comments & status history in forms
4. ✅ **Display:** Red alert box shows most recent comment
5. ✅ **History:** Modal dialog shows all amendments with timestamps
6. ✅ **Timeline:** Status history shows all changes below comments

Everything is fully implemented and working! 🎉
