import { getAPIBaseURL } from "./transfer-form";

export interface SocialMediaLink {
  id: string;
  platform: string; // Twitter, Facebook, Instagram, LinkedIn, YouTube, TikTok, etc.
  icon?: string; // icon name or URL
  url: string;
  displayText?: string; // optional custom display text
  isActive: boolean;
  order: number; // for sorting
  createdAt: string;
  updatedAt: string;
}

export interface SocialMediaSettings {
  id: string;
  links: SocialMediaLink[];
  createdAt: string;
  updatedAt: string;
}

// Platform icon mapping (using Unicode symbols and emojis for all major platforms)
export const SOCIAL_MEDIA_ICONS: Record<string, string> = {
  // Main Social Networks
  "Twitter (X)": "𝕏",
  X: "𝕏",
  Facebook: "f",
  Instagram: "📷",
  LinkedIn: "in",
  YouTube: "▶️",
  TikTok: "♪",
  Snapchat: "����",
  Pinterest: "P",
  Reddit: "🔥",
  Threads: "📝",
  Bluesky: "🌅",
  Mastodon: "🐘",
  BeReal: "🔵",
  Nextdoor: "🏘️",

  // Tech & Developer
  GitHub: "🐙",
  GitLab: "🦊",
  "Dev.to": "⚡",
  Medium: "📝",
  Hashnode: "#",
  "Stack Overflow": "🏗️",
  Substack: "📧",
  Blogspot: "📰",

  // Chat & Messaging
  Discord: "💬",
  "Discord Server": "💜",
  Telegram: "✈️",
  "Telegram Channel": "✈️",
  WhatsApp: "💬",
  "WhatsApp Business": "💬",
  Signal: "🔐",
  WeChat: "🐉",
  Viber: "📱",
  Slack: "💜",
  Skype: "💙",

  // Video & Streaming
  Twitch: "🎮",
  Mixer: "🎮",
  Vimeo: "▶️",
  Dailymotion: "▶️",
  Rumble: "🎬",
  Loom: "📹",
  "YouTube Live": "▶️",
  "Facebook Live": "📺",

  // Creative Platforms
  Behance: "🎨",
  Dribbble: "🎯",
  ArtStation: "🖌️",
  DeviantArt: "🎭",

  // Professional
  Fiverr: "💼",
  Upwork: "💼",
  Freelancer: "💼",

  // Contact Methods
  Email: "📧",
  Website: "🌐",
  Phone: "☎️",

  // Business
  Yelp: "⭐",
  "Google Business": "🔵",
  "Apple Maps": "🗺️",
  OpenSea: "🌊",

  // Podcasts
  Spotify: "🎵",
  "Apple Podcasts": "🎧",
  Podbean: "🎙️",
  Anchor: "🎙️",

  // Payment & Donations
  PayPal: "🅿️",
  "Ko-fi": "☕",
  Patreon: "🎁",
  Stripe: "💳",
  "Buy Me A Coffee": "☕",

  // Community
  Community: "👥",
  Forum: "💬",
};

// Fetch all social media links
export async function fetchSocialMediaLinks(): Promise<SocialMediaLink[]> {
  try {
    const apiBaseURL = getAPIBaseURL();
    const response = await fetch(`${apiBaseURL}/api/social-media`);
    if (!response.ok) throw new Error("Failed to fetch social media links");
    const data = await response.json();
    return data.links || [];
  } catch (error) {
    console.error("Error fetching social media links:", error);
    return [];
  }
}

// Create a new social media link
export async function createSocialMediaLink(
  link: Omit<SocialMediaLink, "id" | "createdAt" | "updatedAt">,
): Promise<SocialMediaLink | null> {
  try {
    const apiBaseURL = getAPIBaseURL();
    const response = await fetch(`${apiBaseURL}/api/social-media-links`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(link),
    });

    if (!response.ok) throw new Error("Failed to create social media link");
    return response.json();
  } catch (error) {
    console.error("Error creating social media link:", error);
    return null;
  }
}

// Update a social media link
export async function updateSocialMediaLink(
  id: string,
  updates: Partial<SocialMediaLink>,
): Promise<SocialMediaLink | null> {
  try {
    const apiBaseURL = getAPIBaseURL();
    const response = await fetch(`${apiBaseURL}/api/social-media-links/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });

    if (!response.ok) throw new Error("Failed to update social media link");
    return response.json();
  } catch (error) {
    console.error("Error updating social media link:", error);
    return null;
  }
}

// Delete a social media link
export async function deleteSocialMediaLink(id: string): Promise<boolean> {
  try {
    const apiBaseURL = getAPIBaseURL();
    const response = await fetch(`${apiBaseURL}/api/social-media-links/${id}`, {
      method: "DELETE",
    });

    return response.ok;
  } catch (error) {
    console.error("Error deleting social media link:", error);
    return false;
  }
}

// Reorder social media links
export async function reorderSocialMediaLinks(
  links: SocialMediaLink[],
): Promise<boolean> {
  try {
    const apiBaseURL = getAPIBaseURL();
    const response = await fetch(
      `${apiBaseURL}/api/social-media-links/reorder`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ links }),
      },
    );

    return response.ok;
  } catch (error) {
    console.error("Error reordering social media links:", error);
    return false;
  }
}
