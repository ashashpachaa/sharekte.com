import { UserAccount } from "./admin-context";

/**
 * Get all user accounts
 */
export function getAllUsers(): UserAccount[] {
  try {
    const saved = localStorage.getItem("all_users");
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

/**
 * Save user account
 */
export function saveUser(user: UserAccount): void {
  const users = getAllUsers();
  const existingIndex = users.findIndex((u) => u.id === user.id);

  if (existingIndex >= 0) {
    users[existingIndex] = user;
  } else {
    users.push(user);
  }

  localStorage.setItem("all_users", JSON.stringify(users));
}

/**
 * Get user by ID
 */
export function getUser(userId: string): UserAccount | null {
  const users = getAllUsers();
  return users.find((u) => u.id === userId) || null;
}

/**
 * Delete user account
 */
export function deleteUser(userId: string): void {
  const users = getAllUsers();
  const filtered = users.filter((u) => u.id !== userId);
  localStorage.setItem("all_users", JSON.stringify(filtered));
}

/**
 * Update user status (suspend, reactivate, etc.)
 */
export function updateUserStatus(
  userId: string,
  status: "active" | "suspended" | "inactive"
): void {
  const user = getUser(userId);
  if (user) {
    user.accountStatus = status;
    user.updatedAt = new Date().toISOString();
    saveUser(user);
  }
}

/**
 * Add internal notes to user account
 */
export function addUserNote(userId: string, note: string): void {
  const user = getUser(userId);
  if (user) {
    user.notes = (user.notes ? user.notes + "\n" : "") + `[${new Date().toLocaleString()}] ${note}`;
    user.updatedAt = new Date().toISOString();
    saveUser(user);
  }
}

/**
 * Update user details
 */
export function updateUserDetails(
  userId: string,
  updates: Partial<UserAccount>
): void {
  const user = getUser(userId);
  if (user) {
    Object.assign(user, updates);
    user.updatedAt = new Date().toISOString();
    saveUser(user);
  }
}

/**
 * Search users by name, email, company, or status
 */
export function searchUsers(query: string, filters?: {
  status?: "active" | "suspended" | "inactive";
  registrationDateStart?: string;
  registrationDateEnd?: string;
}): UserAccount[] {
  let users = getAllUsers();
  const lowercaseQuery = query.toLowerCase();

  users = users.filter((user) => {
    const matchesQuery =
      user.name.toLowerCase().includes(lowercaseQuery) ||
      user.email.toLowerCase().includes(lowercaseQuery) ||
      (user.company && user.company.toLowerCase().includes(lowercaseQuery));

    if (!matchesQuery) return false;

    if (filters?.status && user.accountStatus !== filters.status) {
      return false;
    }

    if (filters?.registrationDateStart) {
      const userDate = new Date(user.registrationDate);
      const filterDate = new Date(filters.registrationDateStart);
      if (userDate < filterDate) return false;
    }

    if (filters?.registrationDateEnd) {
      const userDate = new Date(user.registrationDate);
      const filterDate = new Date(filters.registrationDateEnd);
      if (userDate > filterDate) return false;
    }

    return true;
  });

  return users;
}

/**
 * Create a new user account (for testing or manual creation)
 */
export function createUser(userData: Partial<UserAccount>): UserAccount {
  const now = new Date().toISOString();
  const user: UserAccount = {
    id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    email: userData.email || "",
    name: userData.name || "",
    phone: userData.phone,
    company: userData.company,
    companyLinks: userData.companyLinks || [],
    accountStatus: "active",
    registrationDate: userData.registrationDate || now,
    notes: userData.notes,
    invoices: userData.invoices || [],
    orders: userData.orders || [],
    createdAt: now,
    updatedAt: now,
  };

  saveUser(user);
  return user;
}
