import type { RequestHandler } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface SocialMediaLink {
  id: string;
  platform: string;
  icon?: string;
  url: string;
  displayText?: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface SocialMediaSettings {
  id: string;
  links: SocialMediaLink[];
  createdAt: string;
  updatedAt: string;
}

// Platform icons map
const PLATFORM_ICONS: Record<string, string> = {
  "Twitter (X)": "𝕏",
  "Facebook": "f",
  "Instagram": "📷",
  "LinkedIn": "in",
  "YouTube": "▶️",
  "TikTok": "♪",
  "GitHub": "🐙",
  "Discord": "💬",
  "Telegram": "✈️",
  "WhatsApp": "💬",
  "Pinterest": "P",
  "Snapchat": "👻",
  "Reddit": "🔥",
  "Twitch": "🎮",
  "Medium": "📝",
  "Email": "📧",
  "Website": "🌐",
  "Phone": "☎️",
};

// In-memory storage with comprehensive demo data
let socialMediaSettings: SocialMediaSettings = {
  id: "global-settings",
  links: [
    {
      id: "1",
      platform: "Twitter (X)",
      icon: "𝕏",
      url: "https://twitter.com/sharekte",
      displayText: "Follow us on Twitter",
      isActive: true,
      order: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "2",
      platform: "LinkedIn",
      icon: "in",
      url: "https://linkedin.com/company/sharekte",
      displayText: "Connect on LinkedIn",
      isActive: true,
      order: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "3",
      platform: "Facebook",
      icon: "f",
      url: "https://facebook.com/sharekte",
      displayText: "Like us on Facebook",
      isActive: true,
      order: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "4",
      platform: "Instagram",
      icon: "📷",
      url: "https://instagram.com/sharekte",
      displayText: "Follow on Instagram",
      isActive: true,
      order: 4,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "5",
      platform: "YouTube",
      icon: "▶️",
      url: "https://youtube.com/@sharekte",
      displayText: "Subscribe on YouTube",
      isActive: true,
      order: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "6",
      platform: "Email",
      icon: "📧",
      url: "mailto:hello@sharekte.com",
      displayText: "Contact us by email",
      isActive: true,
      order: 6,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// File-based persistence
const socialMediaFile = path.join(process.cwd(), "social-media-settings.json");

function loadSettingsFromFile(): void {
  try {
    if (fs.existsSync(socialMediaFile)) {
      const data = fs.readFileSync(socialMediaFile, "utf-8");
      const loaded = JSON.parse(data);
      if (loaded && loaded.links) {
        socialMediaSettings = loaded;
      }
    }
  } catch (error) {
    console.error("[loadSettingsFromFile] Error:", error);
  }
}

function saveSettingsToFile(): void {
  try {
    fs.writeFileSync(socialMediaFile, JSON.stringify(socialMediaSettings, null, 2));
  } catch (error) {
    console.error("[saveSettingsToFile] Error:", error);
  }
}

// Load settings on startup
loadSettingsFromFile();

// Get all social media links
export const getSocialMediaLinksHandler: RequestHandler = (req, res) => {
  try {
    console.log("[getSocialMediaLinksHandler] ✓ Returning social media links");
    res.json(socialMediaSettings);
  } catch (error) {
    console.error("[getSocialMediaLinksHandler] Error:", error);
    res.status(500).json({ error: "Failed to fetch social media links" });
  }
};

// Create a new social media link
export const createSocialMediaLinkHandler: RequestHandler = (req, res) => {
  try {
    const { platform, icon, url, displayText, isActive = true } = req.body;

    if (!platform || !url) {
      return res.status(400).json({ error: "Platform and URL are required" });
    }

    const newLink: SocialMediaLink = {
      id: "link_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
      platform,
      icon,
      url,
      displayText,
      isActive,
      order: socialMediaSettings.links.length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    socialMediaSettings.links.push(newLink);
    socialMediaSettings.updatedAt = new Date().toISOString();
    saveSettingsToFile();

    console.log(`[createSocialMediaLinkHandler] ✓ Created link: ${platform}`);
    res.status(201).json(newLink);
  } catch (error) {
    console.error("[createSocialMediaLinkHandler] Error:", error);
    res.status(500).json({ error: "Failed to create social media link" });
  }
};

// Update a social media link
export const updateSocialMediaLinkHandler: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const linkIndex = socialMediaSettings.links.findIndex((l) => l.id === id);
    if (linkIndex === -1) {
      return res.status(404).json({ error: "Social media link not found" });
    }

    const updatedLink = {
      ...socialMediaSettings.links[linkIndex],
      ...updates,
      id: socialMediaSettings.links[linkIndex].id, // Keep original ID
      createdAt: socialMediaSettings.links[linkIndex].createdAt, // Keep original creation date
      updatedAt: new Date().toISOString(),
    };

    socialMediaSettings.links[linkIndex] = updatedLink;
    socialMediaSettings.updatedAt = new Date().toISOString();
    saveSettingsToFile();

    console.log(`[updateSocialMediaLinkHandler] ✓ Updated link: ${id}`);
    res.json(updatedLink);
  } catch (error) {
    console.error("[updateSocialMediaLinkHandler] Error:", error);
    res.status(500).json({ error: "Failed to update social media link" });
  }
};

// Delete a social media link
export const deleteSocialMediaLinkHandler: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;

    const linkIndex = socialMediaSettings.links.findIndex((l) => l.id === id);
    if (linkIndex === -1) {
      return res.status(404).json({ error: "Social media link not found" });
    }

    socialMediaSettings.links.splice(linkIndex, 1);
    socialMediaSettings.updatedAt = new Date().toISOString();
    saveSettingsToFile();

    console.log(`[deleteSocialMediaLinkHandler] ✓ Deleted link: ${id}`);
    res.json({ success: true });
  } catch (error) {
    console.error("[deleteSocialMediaLinkHandler] Error:", error);
    res.status(500).json({ error: "Failed to delete social media link" });
  }
};

// Reorder social media links
export const reorderSocialMediaLinksHandler: RequestHandler = (req, res) => {
  try {
    const { links } = req.body;

    if (!Array.isArray(links)) {
      return res.status(400).json({ error: "Links array is required" });
    }

    socialMediaSettings.links = links.map((link, index) => ({
      ...link,
      order: index + 1,
      updatedAt: new Date().toISOString(),
    }));

    socialMediaSettings.updatedAt = new Date().toISOString();
    saveSettingsToFile();

    console.log("[reorderSocialMediaLinksHandler] ✓ Reordered links");
    res.json(socialMediaSettings);
  } catch (error) {
    console.error("[reorderSocialMediaLinksHandler] Error:", error);
    res.status(500).json({ error: "Failed to reorder social media links" });
  }
};
