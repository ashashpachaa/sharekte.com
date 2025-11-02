/**
 * Role-Based Access Control (RBAC) System
 * Allows admins to create custom roles with specific permissions
 */

export type UserRole = "client" | "super-admin" | "admin" | "administrations" | "operations" | "accounting";

export interface Permission {
  id: string;
  name: string;
  description: string;
  module: "users" | "orders" | "companies" | "reports" | "settings" | "invoices" | "transfer-forms";
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[]; // Array of permission IDs
  isCustom: boolean; // true = user-created, false = system role
  createdAt: string;
  updatedAt: string;
}

// Default permissions available in the system
export const DEFAULT_PERMISSIONS: Permission[] = [
  // User Management
  { id: "users.view", name: "View Users", description: "View all users and their details", module: "users" },
  { id: "users.create", name: "Create Users", description: "Create new user accounts", module: "users" },
  { id: "users.edit", name: "Edit Users", description: "Edit user details and information", module: "users" },
  { id: "users.delete", name: "Delete Users", description: "Delete user accounts", module: "users" },
  { id: "users.suspend", name: "Suspend Users", description: "Suspend or reactivate users", module: "users" },
  
  // Orders
  { id: "orders.view", name: "View Orders", description: "View all orders", module: "orders" },
  { id: "orders.create", name: "Create Orders", description: "Create new orders", module: "orders" },
  { id: "orders.edit", name: "Edit Orders", description: "Edit order details", module: "orders" },
  { id: "orders.delete", name: "Delete Orders", description: "Delete orders", module: "orders" },
  { id: "orders.approve", name: "Approve Orders", description: "Approve pending orders", module: "orders" },
  
  // Companies
  { id: "companies.view", name: "View Companies", description: "View all companies", module: "companies" },
  { id: "companies.create", name: "Create Companies", description: "Add new companies", module: "companies" },
  { id: "companies.edit", name: "Edit Companies", description: "Edit company information", module: "companies" },
  { id: "companies.delete", name: "Delete Companies", description: "Delete companies", module: "companies" },
  
  // Reports
  { id: "reports.view", name: "View Reports", description: "Access analytics and reports", module: "reports" },
  { id: "reports.export", name: "Export Reports", description: "Export report data", module: "reports" },
  
  // Settings
  { id: "settings.view", name: "View Settings", description: "View system settings", module: "settings" },
  { id: "settings.manage", name: "Manage Settings", description: "Modify system settings", module: "settings" },
  
  // Invoices
  { id: "invoices.view", name: "View Invoices", description: "View all invoices", module: "invoices" },
  { id: "invoices.create", name: "Create Invoices", description: "Create new invoices", module: "invoices" },
  { id: "invoices.edit", name: "Edit Invoices", description: "Edit invoice details", module: "invoices" },
  { id: "invoices.delete", name: "Delete Invoices", description: "Delete invoices", module: "invoices" },
  
  // Transfer Forms
  { id: "transfer-forms.view", name: "View Transfer Forms", description: "View all transfer forms", module: "transfer-forms" },
  { id: "transfer-forms.manage", name: "Manage Transfer Forms", description: "Manage transfer form status and details", module: "transfer-forms" },
];

// Default system roles
export const DEFAULT_ROLES: Role[] = [
  {
    id: "role-client",
    name: "Client",
    description: "Regular customer with basic access",
    permissions: ["orders.view", "invoices.view", "transfer-forms.view"],
    isCustom: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "role-admin",
    name: "Admin",
    description: "Standard administrator with management capabilities",
    permissions: [
      "users.view", "users.create", "users.edit", "users.suspend",
      "orders.view", "orders.create", "orders.edit", "orders.approve",
      "companies.view", "companies.create", "companies.edit",
      "invoices.view", "invoices.create", "invoices.edit",
      "transfer-forms.view", "transfer-forms.manage",
      "reports.view",
    ],
    isCustom: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "role-super-admin",
    name: "Super Admin",
    description: "Full system access with all permissions",
    permissions: DEFAULT_PERMISSIONS.map(p => p.id),
    isCustom: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "role-administrations",
    name: "Administrations",
    description: "Administrative staff with user and settings management",
    permissions: [
      "users.view", "users.create", "users.edit", "users.suspend", "users.delete",
      "settings.view", "settings.manage",
      "reports.view",
    ],
    isCustom: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "role-operations",
    name: "Operations",
    description: "Operations team managing orders and companies",
    permissions: [
      "orders.view", "orders.create", "orders.edit", "orders.approve",
      "companies.view", "companies.create", "companies.edit",
      "reports.view", "transfer-forms.view", "transfer-forms.manage",
    ],
    isCustom: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "role-accounting",
    name: "Accounting",
    description: "Accounting department managing invoices and reports",
    permissions: [
      "invoices.view", "invoices.create", "invoices.edit", "invoices.delete",
      "orders.view",
      "reports.view", "reports.export",
    ],
    isCustom: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/**
 * Get all available roles
 */
export function getAllRoles(): Role[] {
  try {
    const saved = localStorage.getItem("roles");
    const roles = saved ? JSON.parse(saved) : DEFAULT_ROLES;
    // Ensure default roles are always present
    return mergeDefaultRoles(roles);
  } catch {
    return DEFAULT_ROLES;
  }
}

/**
 * Merge saved roles with defaults to ensure system roles are always available
 */
function mergeDefaultRoles(saved: Role[]): Role[] {
  const defaultIds = new Set(DEFAULT_ROLES.map(r => r.id));
  const result = [...saved];
  
  for (const defaultRole of DEFAULT_ROLES) {
    if (!result.find(r => r.id === defaultRole.id)) {
      result.push(defaultRole);
    }
  }
  
  return result;
}

/**
 * Save all roles
 */
export function saveRoles(roles: Role[]): void {
  localStorage.setItem("roles", JSON.stringify(roles));
}

/**
 * Get a role by ID
 */
export function getRole(roleId: string): Role | null {
  const roles = getAllRoles();
  return roles.find(r => r.id === roleId) || null;
}

/**
 * Create a new custom role
 */
export function createRole(data: {
  name: string;
  description: string;
  permissions: string[];
}): Role {
  const role: Role = {
    id: `role-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: data.name,
    description: data.description,
    permissions: data.permissions,
    isCustom: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const roles = getAllRoles();
  roles.push(role);
  saveRoles(roles);
  return role;
}

/**
 * Update a role
 */
export function updateRole(roleId: string, updates: Partial<Role>): void {
  const roles = getAllRoles();
  const role = roles.find(r => r.id === roleId);
  if (role && role.isCustom) {
    Object.assign(role, updates, { updatedAt: new Date().toISOString() });
    saveRoles(roles);
  }
}

/**
 * Delete a custom role
 */
export function deleteRole(roleId: string): void {
  const roles = getAllRoles();
  const role = roles.find(r => r.id === roleId);
  if (role && role.isCustom) {
    const filtered = roles.filter(r => r.id !== roleId);
    saveRoles(filtered);
  }
}

/**
 * Get all available permissions
 */
export function getAllPermissions(): Permission[] {
  return DEFAULT_PERMISSIONS;
}

/**
 * Get permissions for a specific role
 */
export function getRolePermissions(roleId: string): Permission[] {
  const role = getRole(roleId);
  if (!role) return [];
  
  return DEFAULT_PERMISSIONS.filter(p => role.permissions.includes(p.id));
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(roleId: string, permissionId: string): boolean {
  const role = getRole(roleId);
  return role ? role.permissions.includes(permissionId) : false;
}

/**
 * Get role by name (for predefined roles)
 */
export function getRoleByName(name: string): Role | null {
  const roles = getAllRoles();
  return roles.find(r => r.name === name) || null;
}
