# Fees Management System Implementation

## Overview

A comprehensive, flexible fees management system that allows admins to create, manage, and apply unlimited custom fees (taxes, service fees, processing fees, etc.) to all orders globally.

## Features

### 1. **Admin Fees Management Dashboard** (`/admin/fees`)
- **Create Fees**: Add unlimited custom fees
- **Fee Types**: 
  - Fixed Amount (e.g., "$50" or "د.إ 200")
  - Percentage (e.g., "10%")
- **Enable/Disable**: Toggle fees on/off without deleting
- **Edit**: Modify existing fees
- **Delete**: Remove fees entirely
- **Summary Statistics**: View total, enabled, and disabled fees
- **Description**: Optional notes for each fee

### 2. **Checkout Integration**
- **Dynamic Fee Display**: All enabled fees show in the Order Summary
- **Fee Breakdown**: Customers see each fee individually calculated
- **Real-time Calculation**: 
  - Fixed fees: Applied as-is
  - Percentage fees: Calculated as % of subtotal
- **Final Total**: Automatically updated with all fees

### 3. **Order Tracking**
- **Applied Fees**: Each order stores which fees were applied and calculated amounts
- **Total Fees**: Total fee amount recorded for each order
- **Airtable Sync**: Fee information synced with order records

## File Structure

```
client/
├── lib/
│   └── fees.ts                    # Fee types, utilities, and localStorage management
├── pages/
│   ├── AdminFees.tsx              # Admin Fees Management page
│   └── Checkout.tsx               # Updated with fee calculations
├── App.tsx                         # Added /admin/fees route
└── pages/AdminDashboard.tsx        # Added link to Fees Management

server/
└── routes/orders.ts               # Order creation includes fees
```

## API & Data Structure

### Fee Interface

```typescript
interface Fee {
  id: string;                       // Unique identifier
  name: string;                     // "Tax", "Service Fee", etc.
  description?: string;             // Optional description
  type: "fixed" | "percentage";     // Fee calculation method
  amount: number;                   // Dollar amount or percentage
  currency?: string;                // For fixed: USD, AED, GBP, EUR, SAR
  enabled: boolean;                 // Apply to orders?
  order: number;                    // Display order
  createdAt: string;                // ISO timestamp
  updatedAt: string;                // ISO timestamp
}
```

### Order Integration

```typescript
interface Order {
  // ... existing fields
  appliedFees?: Array<{
    id: string;
    name: string;
    type: "fixed" | "percentage";
    amount: number;
    calculatedAmount: number;       // What was actually charged
  }>;
  totalFees?: number;               // Sum of all calculated fees
}
```

## How It Works

### 1. Admin Creates a Fee

```typescript
// Fixed Fee Example
{
  name: "VAT",
  type: "fixed",
  amount: 100,
  currency: "AED",
  enabled: true,
  description: "Value Added Tax"
}

// Percentage Fee Example
{
  name: "Service Fee",
  type: "percentage",
  amount: 10,
  enabled: true,
  description: "10% service processing charge"
}
```

### 2. Customer Checkout

1. Customer adds items to cart
2. Customer proceeds to checkout
3. **Subtotal calculated** from item prices
4. **Enabled fees retrieved** from localStorage
5. **Each fee calculated**:
   - Fixed: Applied directly
   - Percentage: `(subtotal * percentage) / 100`
6. **Final total**: `subtotal + total_fees`
7. **Fees displayed** in order summary (breakdown shown)
8. **Order created** with applied fees recorded

### 3. Fee Calculation Examples

**Scenario: Purchase $3670 with VAT (100 AED) + Service Fee (10%)**

```
Subtotal:           $3,670
VAT (fixed):        د.إ 100
Service Fee (10%):  د.إ 367
─────────────────────────
Total:              د.إ 4,137
```

## Usage

### Access Admin Fees Page
1. Navigate to Admin Dashboard
2. Click "Manage Fees" card (DollarSign icon)
3. Or visit: `/admin/fees`

### Create a Fee
1. Click "Add New Fee"
2. Fill in:
   - **Fee Name** (required)
   - **Type** (fixed or percentage)
   - **Amount** (required)
   - **Currency** (for fixed fees)
   - **Description** (optional)
   - **Enable Immediately** (checkbox)
3. Click "Add Fee"

### Edit a Fee
1. Click Edit icon (pencil) on fee row
2. Modify any fields
3. Click "Update Fee"

### Toggle Fee On/Off
1. Click the status badge on fee row, OR
2. Click Eye/Eye-off icon

### Delete a Fee
1. Click Delete icon (trash)
2. Confirm deletion

## Admin Dashboard Link

**Location**: `/admin/fees`

The "Manage Fees" card appears in the admin dashboard alongside:
- Users Management
- Orders Management
- Email Templates
- System Settings

### Navigation Path
```
Admin Dashboard
  ↓
  [DollarSign] Fees Management
  ↓
  /admin/fees
```

## Examples

### Example 1: Global Tax Rate
```
Name:        "Tax"
Type:        Percentage
Amount:      20 (20%)
Description: "20% tax on all orders"
Enabled:     ✓
```

**Result**: Every purchase adds 20% to subtotal

### Example 2: Processing Fee
```
Name:        "Processing Fee"
Type:        Fixed
Amount:      50
Currency:    AED
Description: "Credit card processing fee"
Enabled:     ✓
```

**Result**: Every purchase adds د.إ 50

### Example 3: Shipping (Conditional)
```
Name:        "International Shipping"
Type:        Fixed
Amount:      100
Currency:    USD
Description: "For orders outside USA"
Enabled:     ✓
```

**Result**: Every purchase adds $100 (can be toggled off for domestic orders)

## Data Storage

All fees are stored in **localStorage** under key: `feesConfig`

```json
{
  "fees": [
    {
      "id": "fee-1762193345263",
      "name": "Tax",
      "type": "percentage",
      "amount": 20,
      "enabled": true,
      ...
    }
  ],
  "lastUpdated": "2025-01-03T12:34:56.789Z"
}
```

### Utilities (client/lib/fees.ts)

```typescript
// Get all enabled fees
getEnabledFees(): Fee[]

// Calculate individual fee
calculateFeeAmount(fee, subtotal): number

// Calculate total fees
calculateTotalFees(subtotal): number

// Format fee display
formatFeeDisplay(fee): string

// CRUD Operations
addFee(fee): Fee
updateFee(id, updates): Fee
deleteFee(id): boolean
toggleFeeEnabled(id): Fee
getAllFees(): Fee[]
saveFeesConfig(fees): void
```

## Integration with Existing Features

### Checkout Page (`client/pages/Checkout.tsx`)
- Imports: `getEnabledFees`, `calculateFeeAmount`
- Displays each enabled fee in Order Summary
- Includes fees in final order amount
- Records `appliedFees` in order object

### Orders Management (`client/lib/orders.ts`)
- Extended `Order` interface with `appliedFees` and `totalFees`
- Orders maintain fee history

### Admin Dashboard (`client/pages/AdminDashboard.tsx`)
- Added Fees Management card
- Links to `/admin/fees`

## Future Enhancements

### Possible Additions
1. **Conditional Fees**: 
   - Apply fees only for specific countries
   - Apply based on order amount (e.g., only if > $1000)
   
2. **Seasonal Fees**:
   - Enable/disable by date range
   - Holiday surcharges

3. **Per-Company Fees**:
   - Different fees for different companies
   - Volume discounts

4. **Fee Analytics**:
   - Report on total fees collected
   - Fee breakdown by type
   - Revenue attribution

5. **Webhook Notifications**:
   - Alert when fees changed
   - Email notifications to customers

## Troubleshooting

### Fees Not Showing in Checkout
- Check if fees are enabled (toggle status)
- Verify `localStorage` isn't cleared
- Check browser console for errors

### Incorrect Fee Calculation
- Verify fee type (fixed vs percentage)
- For percentages: ensure amount is decimal (e.g., 10 for 10%)
- For fixed: confirm currency matches order currency

### Fee Changes Not Taking Effect
- Refresh the page
- Clear localStorage and reload
- Check admin dashboard - fee should show as enabled

## Support

For issues or questions:
1. Check Admin Fees page for configured fees
2. Review order details to see applied fees
3. Check browser console for JavaScript errors
4. Verify fee type and amount are correct
