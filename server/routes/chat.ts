import { RequestHandler } from "express";
import fetch from "node-fetch";

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_MODEL = "mixtral-8x7b-32768";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

// System prompt for the sales agent
const SYSTEM_PROMPT = `You are Sharekte's AI Sales Agent. Your job is to help customers:
1. Browse and learn about available companies for sale
2. Answer questions about company details, pricing, and services
3. Help them create orders and complete the checkout process
4. Collect customer information (name, email, phone)
5. Provide order confirmations and next steps
6. Send them to the checkout page when ready

You should:
- Be friendly, professional, and concise
- Ask clarifying questions to understand customer needs
- Suggest relevant companies based on their interests
- Help them understand the ordering process
- Always ask for their contact information before processing orders
- Provide helpful next steps and links to proceed

When customers want to proceed with an order, say "I'll help you proceed to checkout. Please provide your information first using the form above."`;

interface GroqMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

async function callGroqAPI(messages: GroqMessage[]): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY not configured");
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 1024,
        top_p: 1,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[Groq API Error]", error);
      throw new Error(`Groq API error: ${response.statusText}`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    return data.choices[0].message.content;
  } catch (error) {
    console.error("[Groq API Error]", error);
    throw error;
  }
}

async function fetchCompaniesContext(): Promise<string> {
  try {
    const response = await fetch("http://localhost:8080/api/companies");
    const companies = (await response.json()) as Array<{
      companyName?: string;
      id?: string;
      country?: string;
      purchasePrice?: number;
    }>;

    if (!Array.isArray(companies) || companies.length === 0) {
      return "No companies currently available.";
    }

    const companySummary = companies
      .slice(0, 10)
      .map(
        (c) =>
          `- ${c.companyName || c.id}: Located in ${c.country}, Price: $${c.purchasePrice || "Contact for price"}`
      )
      .join("\n");

    return `Available companies:\n${companySummary}`;
  } catch (error) {
    console.error("[Companies fetch error]", error);
    return "Unable to fetch current company listings.";
  }
}

async function saveConversationToAirtable(
  sessionId: string,
  customerEmail: string,
  customerName: string,
  customerPhone: string,
  messages: ChatMessage[]
): Promise<void> {
  const AIRTABLE_API_TOKEN = process.env.AIRTABLE_API_TOKEN;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || "app0PK34gyJDizR3Q";

  if (!AIRTABLE_API_TOKEN) {
    console.warn("[Airtable] API token not configured");
    return;
  }

  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Chat Conversations`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          records: [
            {
              fields: {
                "Session ID": sessionId,
                "Customer Name": customerName,
                "Customer Email": customerEmail,
                "Customer Phone": customerPhone,
                "Conversation": messages
                  .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
                  .join("\n\n"),
                "Message Count": messages.length,
                "Created At": new Date().toISOString(),
              },
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("[Airtable error]", error);
    }
  } catch (error) {
    console.error("[Airtable save error]", error);
  }
}

export const handleChat: RequestHandler = async (req, res) => {
  try {
    const { sessionId, message, customerData } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Fetch recent conversation context (limit to last 10 messages)
    const conversationHistory: ChatMessage[] = req.body.history || [];

    // Add companies context
    const companiesContext = await fetchCompaniesContext();

    // Build messages for Groq
    const groqMessages: GroqMessage[] = [
      {
        role: "system",
        content: `${SYSTEM_PROMPT}\n\n${companiesContext}`,
      },
      ...conversationHistory.slice(-10).map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: "user",
        content: message,
      },
    ];

    // Call Groq API
    const aiResponse = await callGroqAPI(groqMessages);

    // Save to Airtable if customer data provided
    if (customerData?.email) {
      const allMessages: ChatMessage[] = [
        ...conversationHistory,
        { role: "user", content: message },
        { role: "assistant", content: aiResponse },
      ];

      await saveConversationToAirtable(
        sessionId,
        customerData.email,
        customerData.name || "Unknown",
        customerData.phone || "Not provided",
        allMessages
      );
    }

    res.json({
      reply: aiResponse,
      sessionId,
    });
  } catch (error) {
    console.error("[Chat handler error]", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({
      error: "Failed to process chat message",
      details: errorMessage,
    });
  }
};

export const handleSaveSession: RequestHandler = async (req, res) => {
  try {
    const { session } = req.body;

    if (!session) {
      return res.status(400).json({ error: "Session is required" });
    }

    await saveConversationToAirtable(
      session.id,
      session.customerEmail || "Unknown",
      session.customerName || "Unknown",
      session.customerPhone || "Not provided",
      session.messages
    );

    res.json({ success: true, sessionId: session.id });
  } catch (error) {
    console.error("[Save session error]", error);
    res.status(500).json({
      error: "Failed to save session",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
