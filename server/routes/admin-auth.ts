import { RequestHandler } from "express";

// Admin credentials from environment variables (MUST be set in production)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@sharekte.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Ash@shpachaa2010";

// Log warning if using default credentials
if (
  process.env.NODE_ENV === "production" &&
  (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD)
) {
  console.warn(
    "[WARNING] Using default admin credentials. Set ADMIN_EMAIL and ADMIN_PASSWORD environment variables in production.",
  );
}

// Simple JWT-like token generation (in production, use proper JWT)
function generateToken(email: string): string {
  return Buffer.from(`${email}:${Date.now()}:admin`).toString("base64");
}

function verifyToken(token: string): { email: string; isValid: boolean } {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const [email] = decoded.split(":");
    return { email, isValid: true };
  } catch {
    return { email: "", isValid: false };
  }
}

/**
 * Admin Login Handler
 * POST /api/admin/login
 * Body: { email, password }
 * Response: { token, email, message }
 */
export const adminLogin: RequestHandler = (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("[adminLogin] Login attempt for:", email);

    // Validate email and password
    if (email !== ADMIN_EMAIL) {
      console.log("[adminLogin] Invalid email");
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (password !== ADMIN_PASSWORD) {
      console.log("[adminLogin] Invalid password");
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate token
    const token = generateToken(email);

    console.log("[adminLogin] ✓ Login successful for:", email);

    res.json({
      success: true,
      token,
      email,
      message: "Admin login successful",
    });
  } catch (error) {
    console.error("[adminLogin] Error:", error);
    res.status(500).json({ error: "Login failed" });
  }
};

/**
 * Admin Logout Handler
 * POST /api/admin/logout
 * Response: { success, message }
 */
export const adminLogout: RequestHandler = (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(400).json({ error: "No token provided" });
    }

    console.log("[adminLogout] Admin logged out");

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("[adminLogout] Error:", error);
    res.status(500).json({ error: "Logout failed" });
  }
};

/**
 * Verify Admin Token Handler
 * GET /api/admin/verify
 * Headers: { Authorization: Bearer <token> }
 * Response: { isValid, email }
 */
export const verifyAdminToken: RequestHandler = (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ isValid: false, error: "No token" });
    }

    const { email, isValid } = verifyToken(token);

    if (!isValid || email !== ADMIN_EMAIL) {
      return res.status(401).json({ isValid: false, error: "Invalid token" });
    }

    console.log("[verifyAdminToken] ✓ Token valid for:", email);

    res.json({
      isValid: true,
      email,
    });
  } catch (error) {
    console.error("[verifyAdminToken] Error:", error);
    res
      .status(401)
      .json({ isValid: false, error: "Token verification failed" });
  }
};

/**
 * Middleware to protect admin routes
 */
export const requireAdminAuth: RequestHandler = (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "Admin authentication required" });
    }

    const { email, isValid } = verifyToken(token);

    if (!isValid || email !== ADMIN_EMAIL) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // Attach admin info to request
    (req as any).admin = { email };

    next();
  } catch (error) {
    console.error("[requireAdminAuth] Error:", error);
    res.status(500).json({ error: "Authentication error" });
  }
};
