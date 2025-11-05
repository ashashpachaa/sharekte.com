import { RequestHandler } from "express";

// In-memory user storage (replace with database in production)
interface User {
  id: string;
  email: string;
  name: string;
  password: string; // In production, this should be hashed
  createdAt: string;
}

let users: User[] = [];
const tokens = new Map<string, { email: string; name: string; expiresAt: number }>();

function generateToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function generateUserId(): string {
  return "user_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
}

export const signupHandler: RequestHandler = (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Email, password, and name are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    // Check if user already exists
    if (users.some((u) => u.email === email)) {
      return res.status(409).json({ error: "Email already registered" });
    }

    // Create new user
    const newUser: User = {
      id: generateUserId(),
      email: email.toLowerCase(),
      name,
      password, // In production, hash this
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);

    // Generate token
    const token = generateToken();
    tokens.set(token, {
      email: newUser.email,
      name: newUser.name,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      token,
      email: newUser.email,
      name: newUser.name,
      message: "Account created successfully",
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const loginHandler: RequestHandler = (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find user
    const user = users.find((u) => u.email === email.toLowerCase());

    if (!user || user.password !== password) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate token
    const token = generateToken();
    tokens.set(token, {
      email: user.email,
      name: user.name,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      token,
      email: user.email,
      name: user.name,
      message: "Login successful",
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const verifyHandler: RequestHandler = (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const tokenData = tokens.get(token);

    if (!tokenData) {
      return res.status(401).json({ error: "Invalid token" });
    }

    if (tokenData.expiresAt < Date.now()) {
      tokens.delete(token);
      return res.status(401).json({ error: "Token expired" });
    }

    res.json({
      valid: true,
      email: tokenData.email,
      name: tokenData.name,
    });
  } catch (error) {
    console.error("Verify error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const logoutHandler: RequestHandler = (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace("Bearer ", "");

    if (token) {
      tokens.delete(token);
    }

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
