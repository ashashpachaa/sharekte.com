import type { RequestHandler } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface WhatsAppNumber {
  id: string;
  number: string;
  label: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppSupportConfig {
  id: string;
  numbers: WhatsAppNumber[];
  initialMessage: string;
  createdAt: string;
  updatedAt: string;
}

const CONFIG_FILE = path.join(process.cwd(), "whatsapp-config.json");

function loadConfig(): WhatsAppSupportConfig {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("[WhatsApp] Error loading config:", error);
  }

  return {
    id: "default",
    numbers: [
      {
        id: "1",
        number: "+971501234567",
        label: "Sales Support",
        isActive: true,
        order: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    initialMessage: "Hello! How can we help you today?",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function saveConfig(config: WhatsAppSupportConfig): void {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
  } catch (error) {
    console.error("[WhatsApp] Error saving config:", error);
  }
}

export const getWhatsAppConfig: RequestHandler = (req, res) => {
  try {
    const config = loadConfig();
    const activeNumbers = config.numbers.filter((n) => n.isActive);
    res.json({
      ...config,
      numbers: activeNumbers.sort((a, b) => a.order - b.order),
    });
  } catch (error) {
    console.error("[WhatsApp] Error getting config:", error);
    res.status(500).json({ error: "Failed to get WhatsApp config" });
  }
};

export const getAllWhatsAppNumbers: RequestHandler = (req, res) => {
  try {
    const config = loadConfig();
    res.json(config.numbers.sort((a, b) => a.order - b.order));
  } catch (error) {
    console.error("[WhatsApp] Error getting numbers:", error);
    res.status(500).json({ error: "Failed to get WhatsApp numbers" });
  }
};

export const addWhatsAppNumber: RequestHandler = (req, res) => {
  try {
    const { number, label } = req.body;

    if (!number || !label) {
      return res.status(400).json({ error: "Number and label are required" });
    }

    const config = loadConfig();
    const newNumber: WhatsAppNumber = {
      id: Date.now().toString(),
      number,
      label,
      isActive: true,
      order: (config.numbers.length || 0) + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    config.numbers.push(newNumber);
    config.updatedAt = new Date().toISOString();
    saveConfig(config);

    res.json(newNumber);
  } catch (error) {
    console.error("[WhatsApp] Error adding number:", error);
    res.status(500).json({ error: "Failed to add WhatsApp number" });
  }
};

export const updateWhatsAppNumber: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const { number, label, isActive, order } = req.body;

    const config = loadConfig();
    const numberIndex = config.numbers.findIndex((n) => n.id === id);

    if (numberIndex === -1) {
      return res.status(404).json({ error: "WhatsApp number not found" });
    }

    const updated = {
      ...config.numbers[numberIndex],
      ...(number !== undefined && { number }),
      ...(label !== undefined && { label }),
      ...(isActive !== undefined && { isActive }),
      ...(order !== undefined && { order }),
      updatedAt: new Date().toISOString(),
    };

    config.numbers[numberIndex] = updated;
    config.updatedAt = new Date().toISOString();
    saveConfig(config);

    res.json(updated);
  } catch (error) {
    console.error("[WhatsApp] Error updating number:", error);
    res.status(500).json({ error: "Failed to update WhatsApp number" });
  }
};

export const deleteWhatsAppNumber: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;

    const config = loadConfig();
    const numberIndex = config.numbers.findIndex((n) => n.id === id);

    if (numberIndex === -1) {
      return res.status(404).json({ error: "WhatsApp number not found" });
    }

    config.numbers.splice(numberIndex, 1);
    config.updatedAt = new Date().toISOString();
    saveConfig(config);

    res.json({ success: true });
  } catch (error) {
    console.error("[WhatsApp] Error deleting number:", error);
    res.status(500).json({ error: "Failed to delete WhatsApp number" });
  }
};

export const updateWhatsAppMessage: RequestHandler = (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required" });
    }

    const config = loadConfig();
    config.initialMessage = message;
    config.updatedAt = new Date().toISOString();
    saveConfig(config);

    res.json(config);
  } catch (error) {
    console.error("[WhatsApp] Error updating message:", error);
    res.status(500).json({ error: "Failed to update WhatsApp message" });
  }
};
