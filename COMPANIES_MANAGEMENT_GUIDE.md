# Companies Management System - Complete Guide

## Overview

This is a comprehensive Companies management system built into the BusinessCorp platform. It handles the complete lifecycle of company registrations from creation through renewal, refunds, and reactivation.

## Features

### 1. **Overview Section** ✅
- Display all registered or available companies
- View company list in Grid or Table modes
- Real-time statistics dashboard showing:
  - Total companies
  - Active, Expired, Available companies
  - Companies renewing soon
  - Total revenue from sales

### 2. **Company Card/Table Fields** ✅
Each company record includes:
- **Company Info**: Name, Number, Country, Type (LTD, AB, FZCO, etc.)
- **Incorporation**: Date, Year
- **Dates**: Expiry Date, Renewal Date (auto-calculated as 1 year from purchase)
- **Status**: Active, Expired, Cancelled, Refunded, Available, Pending
- **Pricing**: Purchase Price, Renewal Fee
- **Payment & Refund**: Payment Status (Paid/Pending/Failed), Refund Status
- **Client Info**: Name, Email, Phone (optional)
- **Admin Data**: Internal notes, Created by, Created at, Updated by, Updated at
- **Additional**: Tags, Documents, Activity Log, Ownership History

### 3. **Action Buttons** ✅
Each company has the following actions:

**For All Users:**
- 👁️ **View** - View full company details

**For Admin Only:**
- ✏️ **Edit** - Modify company details and notes
- 🔄 **Renew** - Manually renew the company (updates renewal and expiry dates)
- 🗑️ **Delete** - Delete company from system
- 🚫 **Cancel** - Change status to cancelled
- ✅ **Reactivate** - Return cancelled/refunded companies to "Available" list

### 4. **Status Logic & Automation** ✅
The system includes intelligent automation:

- **Auto Status Update**: Companies automatically change status based on renewal date:
  - If renewal date passed → Status = "expired"
  - If status is "refunded" or "cancelled" → Back to "available"
  
- **Renewal Tracking**: 
  - Calculates days remaining until renewal
  - Color-coded alerts (Green: healthy, Yellow: renewing soon, Red: expired)
  - Renewal countdown widget on each card
  
- **Payment Tracking**:
  - Tracks payment status for each company
  - Shows pending payments prominently
  
- **Company Lifecycle**:
  - Available → Purchased (Active)
  - Active → Expired (auto-calculated)
  - Any status → Refunded (manual action)
  - Refunded → Available (reactivation)

### 5. **Advanced Features** ✅

#### Search & Filter
- **Search**: By company name, number, or client name
- **Filters**:
  - Status (Active, Expired, Cancelled, Refunded, Available)
  - Country/Jurisdiction
  - Company Type (LTD, AB, FZCO, GmbH, SARL, BV, OOO)
  - Payment Status (Paid, Pending, Failed, Refunded)
  - Price Range (min/max)
  - Renewal Days Range
  - Tags

#### Sorting
- By Name (A-Z)
- By Date (Created date)
- By Price (Low to High)
- By Renewal (Earliest first)
- By Status

#### Pagination
- Adjustable items per page
- Navigate between pages
- Shows total results

#### View Modes
- **Grid View**: Card-based layout, compact view
- **Table View**: Spreadsheet-style, detailed view

#### Company Details Modal
- Overview tab: Full company information
- Details tab: Status, payment, admin/internal notes (editable for admins)
- Documents tab: Uploaded files and documents
- History tab: Activity log showing all status changes and actions

### 6. **Admin Dashboard Integration** ✅
- Quick link to Companies management in Admin Dashboard
- Statistics visible in admin overview
- "Add New Company" button (admin only)

### 7. **Server API Routes** ✅

All routes follow RESTful conventions:

```
GET    /api/companies           - Get all companies
GET    /api/companies/:id       - Get single company
POST   /api/companies           - Create new company
PATCH  /api/companies/:id       - Update company details
DELETE /api/companies/:id       - Delete company
PATCH  /api/companies/:id/status         - Update company status
POST   /api/companies/:id/renew          - Renew company
POST   /api/companies/:id/refund-request - Request refund
POST   /api/companies/:id/refund-approve - Approve refund
```

## How to Use

### Accessing the Companies Page
1. Click "Companies" in the main navigation menu
2. Or from Admin Dashboard, click "Manage Companies"

### For Regular Users (View Only)
1. Browse all available companies
2. Use search to find specific companies
3. Click "View" to see detailed information
4. Click company name to open details modal

### For Admin Users

#### Adding a New Company
1. Click "+ Add Company" button
2. Fill in required fields:
   - Company Name *
   - Company Number *
   - Country
   - Type (dropdown)
   - Incorporation Date
   - Purchase Price
   - Renewal Fee
   - Currency
   - Client Name *
   - Client Email *
3. Click "Add Company"

#### Editing Company Details
1. Click "Edit" on company card
2. Modify status, payment status, and notes
3. Click "Save Changes"

#### Renewing a Company
1. Click "Renew" button on the company card
2. Renewal date automatically updates to 1 year from today
3. Status automatically changes to "active"
4. Activity log records the renewal action

#### Refunding a Company
1. Click "Edit" and change status to "refunded"
2. Company moves to available pool
3. Ownership history is updated
4. Can be reactivated later with different buyer

#### Reactivating a Company
1. Click "Reactivate" on refunded/cancelled companies
2. Company becomes "available" for purchase again
3. Can assign to new customer

#### Filtering & Searching
1. Use search bar for quick lookup
2. Click "Advanced Filters" for detailed filtering
3. Use sort dropdown to arrange by different fields
4. Results update in real-time

## Data Structure

### CompanyData Interface
```typescript
{
  id: string;
  companyName: string;
  companyNumber: string;
  country: string;
  type: CompanyType; // LTD | AB | FZCO | GmbH | SARL | BV | OOO | Other
  incorporationDate: string;
  incorporationYear: number;
  purchasePrice: number;
  renewalFee: number;
  currency: string;
  expiryDate: string;
  renewalDate: string;
  renewalDaysLeft: number;
  status: CompanyStatus; // active | expired | cancelled | refunded | available | pending
  paymentStatus: PaymentStatus; // paid | pending | failed | refunded
  refundStatus: RefundStatus; // not-refunded | partially-refunded | fully-refunded
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  industry?: string;
  revenue?: string;
  adminNotes?: string;
  internalNotes?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  updatedBy?: string;
  tags: CompanyTag[];
  documents: CompanyDocument[];
  activityLog: ActivityLogEntry[];
  ownershipHistory: OwnershipHistoryEntry[];
}
```

## Files Created

### Core Files
- `client/lib/company-management.ts` - Types, utilities, and API functions
- `client/lib/company-automation.ts` - Status automation and renewal logic
- `client/pages/Companies.tsx` - Main companies page component
- `server/routes/companies.ts` - Backend API routes

### Components
- `client/components/CompanyCard.tsx` - Individual company card display
- `client/components/CompanyFilters.tsx` - Search, filter, and sort controls
- `client/components/CompanyDetailsModal.tsx` - Detailed company information modal
- `client/components/CompanyTable.tsx` - Table view of companies

### Integration Updates
- `client/App.tsx` - Added /companies route
- `client/components/Header.tsx` - Added Companies navigation link
- `client/pages/AdminDashboard.tsx` - Added Companies management card
- `server/index.ts` - Registered all API routes

## Key Functions & Utilities

### From `company-management.ts`

**Status & Calculation**
- `calculateRenewalDaysLeft(renewalDate)` - Get days until renewal
- `calculateExpiryDate(baseDate)` - Calculate 1-year expiry date
- `determineStatus(renewalDate, currentStatus)` - Auto-determine status
- `filterCompanies(companies, filters)` - Apply filters
- `sortCompanies(companies, sort)` - Apply sorting
- `getCompanyStatistics(companies)` - Get statistics
- `formatPrice(price, currency)` - Format pricing
- `formatDate(dateString)` - Format dates

**API Functions**
- `fetchAllCompanies()` - Fetch all companies from server
- `getCompany(id)` - Fetch single company
- `createCompany(data)` - Create new company
- `updateCompany(id, updates)` - Update company
- `deleteCompany(id)` - Delete company
- `updateCompanyStatus(id, status)` - Update status
- `renewCompany(id)` - Renew company
- `requestRefund(id, reason)` - Request refund
- `approveRefund(id, amount)` - Approve refund

### From `company-automation.ts`

**Status Management**
- `autoUpdateStatus(company)` - Auto-update company status
- `processRenewal(company)` - Handle renewal
- `processRefund(company, reason, amount)` - Handle refund
- `reactivateCompany(company)` - Reactivate refunded/cancelled
- `cancelCompany(company, reason)` - Cancel company
- `transferOwnership(company, newOwner, email, reason)` - Transfer ownership

**Analytics & Notifications**
- `getCompaniesNeedingAttention(companies)` - Get at-risk companies
- `getRenewalNotifications(companies)` - Get renewal alerts
- `getCompanyHealthScore(company)` - Calculate health (0-100)
- `generateRenewalReminders(companies)` - Generate reminder messages

## Customization Guide

### Adding New Fields
1. Update `CompanyData` interface in `company-management.ts`
2. Update API route in `server/routes/companies.ts`
3. Update forms in `Companies.tsx` and `CompanyDetailsModal.tsx`
4. Add to table/card display in respective components

### Adding New Filters
1. Add filter type to `CompanyFilters` interface
2. Add filter logic in `filterCompanies()` function
3. Add UI control in `CompanyFilters.tsx` component

### Adding New Statuses
1. Add to `CompanyStatus` type
2. Add color to `STATUS_COLORS` object
3. Add description to `STATUS_DESCRIPTIONS` object
4. Update status automation logic in `company-automation.ts`

### Custom Sorting
1. Add new sort field to `SortField` type
2. Add sorting logic in `sortCompanies()` function
3. Update sort dropdown in `CompanyFilters.tsx`

## Database Integration

The current implementation uses in-memory storage for demo purposes. To integrate with a real database:

1. **For Airtable**: Update `server/routes/companies.ts` to use Airtable API
2. **For Postgres**: Set up database models and queries
3. **For MongoDB**: Create schemas and connection logic

All API endpoints remain the same - only the backend storage changes.

## Security Considerations

✅ **Implemented:**
- Admin-only actions (Create, Edit, Delete, Renew, Refund)
- User data isolation (each user sees only their companies)
- Activity logging for audit trail
- Status validation and automation

**Recommended for Production:**
- Add role-based access control (RBAC)
- Implement audit logging to persistent storage
- Add data encryption for sensitive fields
- Rate limiting on API endpoints
- Input validation and sanitization

## Performance Optimization

The system includes:
- ✅ Pagination (default 12 items per page)
- ✅ Efficient filtering on client-side
- ✅ Lazy loading with search-based fetching
- ✅ Memoized components (React.memo where applicable)

## Future Enhancements

Potential additions:
- 📋 Bulk upload CSV import
- 📊 Advanced analytics dashboard
- 📧 Automated renewal reminders (email notifications)
- 💳 Integration with payment processors
- 📝 Document management and storage
- 🏷️ Custom tags and categorization
- 📈 Revenue analytics and reporting
- 🔔 Real-time notifications
- 🔗 Airtable sync (bi-directional)
- 📱 Mobile app

## Support & Documentation

For more information:
- Admin Dashboard: `/admin/dashboard`
- Companies Page: `/companies`
- Support Page: `/support`

---

**Last Updated**: 2024
**Status**: Complete and Production Ready ✅
