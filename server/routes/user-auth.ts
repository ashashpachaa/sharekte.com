import { RequestHandler } from "express";
import * as fs from "fs";
import * as path from "path";

// In-memory user storage (replace with database in production)
interface User {
  id: string;
  email: string;
  name: string;
  password: string; // In production, this should be hashed
  createdAt: string;
}

const USERS_FILE = path.join(process.cwd(), "users.json");
const TOKENS_FILE = path.join(process.cwd(), "tokens.json");

let users: User[] = loadUsersFromFile();

// Initialize with demo user if no users exist
if (users.length === 0) {
  users = [
    {
      id: "demo_user_1",
      email: "company@domainostartup.com",
      name: "Company",
      password: "Ash@shpachaa2010",
      createdAt: new Date().toISOString(),
    },
  ];
  saveUsersToFile(users);
  console.log(
    "[init] ✓ Initialized with demo user: company@domainostartup.com",
  );
}

interface TokenEntry {
  [key: string]: { email: string; name: string; expiresAt: number };
}

let tokens: TokenEntry = loadTokensFromFile();

function loadUsersFromFile(): User[] {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, "utf-8");
      console.log("[loadUsersFromFile] ✓ Loaded users from file");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("[loadUsersFromFile] Error reading file:", error);
  }
  return [];
}

function saveUsersToFile(usersList: User[]): void {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(usersList, null, 2), "utf-8");
    console.log(`[saveUsersToFile] ✓ Saved ${usersList.length} users to file`);
  } catch (error) {
    console.error("[saveUsersToFile] Error writing file:", error);
  }
}

function loadTokensFromFile(): TokenEntry {
  try {
    if (fs.existsSync(TOKENS_FILE)) {
      const data = fs.readFileSync(TOKENS_FILE, "utf-8");
      const parsed = JSON.parse(data);
      // Clean up expired tokens
      const now = Date.now();
      Object.keys(parsed).forEach((key) => {
        if (parsed[key].expiresAt < now) {
          delete parsed[key];
        }
      });
      console.log(
        `[loadTokensFromFile] ✓ Loaded ${Object.keys(parsed).length} tokens from file`,
      );
      saveTokensToFile(parsed);
      return parsed;
    }
  } catch (error) {
    console.error("[loadTokensFromFile] Error reading file:", error);
  }
  console.log("[loadTokensFromFile] No tokens file found, starting with empty");
  return {};
}

function saveTokensToFile(tokensData: TokenEntry): void {
  try {
    fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokensData, null, 2), "utf-8");
  } catch (error) {
    console.error("[saveTokensToFile] Error writing file:", error);
  }
}

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
      return res
        .status(400)
        .json({ error: "Email, password, and name are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
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
    saveUsersToFile(users);

    // Generate token
    const token = generateToken();
    tokens[token] = {
      email: newUser.email,
      name: newUser.name,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    };
    saveTokensToFile(tokens);

    console.log(
      `[signupHandler] ✓ User ${newUser.email} created and saved to file`,
    );
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

    // Debug logging
    console.log(`[loginHandler] Attempting login for email: ${email}`);
    console.log(`[loginHandler] Total users in system: ${users.length}`);
    console.log(
      `[loginHandler] Available users: ${users.map((u) => u.email).join(", ")}`,
    );

    // Find user
    const user = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase(),
    );

    if (!user) {
      console.log(`[loginHandler] User not found for email: ${email}`);
      return res.status(401).json({
        error:
          "Your email is not registered. Please sign up to create an account.",
        code: "USER_NOT_FOUND",
      });
    }

    console.log(`[loginHandler] User found: ${user.email}`);
    console.log(`[loginHandler] Stored password: "${user.password}"`);
    console.log(`[loginHandler] Provided password: "${password}"`);
    console.log(`[loginHandler] Password match: ${user.password === password}`);

    if (user.password !== password) {
      console.log(`[loginHandler] Password mismatch for ${email}`);
      return res.status(401).json({
        error: "Incorrect password. Please try again.",
        code: "INVALID_PASSWORD",
      });
    }

    console.log(`[loginHandler] ✓ Login successful for ${email}`);

    // Generate token
    const token = generateToken();
    tokens[token] = {
      email: user.email,
      name: user.name,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    };
    saveTokensToFile(tokens);

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
      console.log("[verifyHandler] No token provided in authorization header");
      return res.status(401).json({ error: "No token provided" });
    }

    // First check in-memory tokens
    let tokenData = tokens[token];

    // If not found in memory, reload from file (in case another process updated it)
    if (!tokenData) {
      console.log(
        "[verifyHandler] Token not in memory, reloading from file...",
      );
      tokens = loadTokensFromFile();
      tokenData = tokens[token];
    }

    if (!tokenData) {
      console.log("[verifyHandler] Token not found in tokens storage");
      return res.status(401).json({ error: "Invalid token" });
    }

    if (tokenData.expiresAt < Date.now()) {
      console.log("[verifyHandler] Token expired");
      delete tokens[token];
      saveTokensToFile(tokens);
      return res.status(401).json({ error: "Token expired" });
    }

    console.log(
      `[verifyHandler] ✓ Token verified for ${tokenData.email}`,
    );
    res.json({
      valid: true,
      email: tokenData.email,
      name: tokenData.name,
    });
  } catch (error) {
    console.error("[verifyHandler] Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const logoutHandler: RequestHandler = (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace("Bearer ", "");

    if (token) {
      delete tokens[token];
      saveTokensToFile(tokens);
    }

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
