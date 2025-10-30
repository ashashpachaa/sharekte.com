import { LoginHistoryEntry } from "./admin-context";

/**
 * Track user login with device, IP, and browser info
 */
export async function trackLogin(userId: string): Promise<LoginHistoryEntry> {
  const userAgent = navigator.userAgent;
  const timestamp = new Date().toISOString();

  // Extract device info
  let device = "Unknown";
  if (userAgent.includes("Mobile")) {
    device = "Mobile";
  } else if (userAgent.includes("Tablet")) {
    device = "Tablet";
  } else {
    device = "Desktop";
  }

  // Extract browser
  let browser = "Unknown";
  if (userAgent.includes("Chrome")) {
    browser = "Chrome";
  } else if (userAgent.includes("Safari")) {
    browser = "Safari";
  } else if (userAgent.includes("Firefox")) {
    browser = "Firefox";
  } else if (userAgent.includes("Edge")) {
    browser = "Edge";
  }

  // Try to get IP address (Note: In production, this should come from the server)
  let ipAddress = "Unknown";
  try {
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();
    ipAddress = data.ip;
  } catch (error) {
    console.warn("Could not fetch IP address:", error);
  }

  const loginEntry: LoginHistoryEntry = {
    id: `login-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    timestamp,
    ipAddress,
    device: `${device} - ${browser}`,
    userAgent,
  };

  // Save to localStorage
  const key = `login_history_${userId}`;
  const existing = localStorage.getItem(key);
  const history: LoginHistoryEntry[] = existing ? JSON.parse(existing) : [];
  history.push(loginEntry);

  // Keep only last 50 logins
  if (history.length > 50) {
    history.shift();
  }

  localStorage.setItem(key, JSON.stringify(history));

  return loginEntry;
}

/**
 * Get login history for a user
 */
export function getLoginHistory(userId: string): LoginHistoryEntry[] {
  try {
    const key = `login_history_${userId}`;
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

/**
 * Clear login history for a user
 */
export function clearLoginHistory(userId: string): void {
  const key = `login_history_${userId}`;
  localStorage.removeItem(key);
}
