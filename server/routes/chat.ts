import { RequestHandler } from "express";

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_MODEL = "mixtral-8x7b-32768";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

// System prompt for the sales agent
const SYSTEM_PROMPT = `You are Sharekte's AI Sales Agent. Your job is to help customers:
1. Browse and learn about available companies for sale
2. Answer specific questions about company availability by country, industry, and price
3. Help them create orders and complete the checkout process
4. Collect customer information (name, email, phone)
5. Provide order confirmations and next steps

IMPORTANT BEHAVIORS:
- When asked about companies in a specific country (e.g., "UK", "United Kingdom", "Sweden", "UAE"), check the available companies list and provide SPECIFIC company names and prices
- If the country is available, list the companies with details
- If the country is not available, tell them what countries ARE available
- Be direct and factual about what we have in stock
- When user asks "do you have companies in [country]?", answer YES/NO with the specific list
- Use the company context provided to you to give accurate, current answers

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
    console.warn("[Groq] API key not configured, using demo mode");
    return await getDemoResponse(messages);
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
      console.warn("[Groq] Falling back to demo mode due to API error");
      return await getDemoResponse(messages);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    return data.choices[0].message.content;
  } catch (error) {
    console.error("[Groq API Error]", error);
    console.warn("[Groq] Falling back to demo mode due to error");
    return await getDemoResponse(messages);
  }
}

async function getDemoResponse(messages: GroqMessage[]): Promise<string> {
  const userMessage = messages[messages.length - 1]?.content.toLowerCase() || "";

  // Check if user is talking about an EXISTING order
  if ((userMessage.includes("i have") && userMessage.includes("order")) ||
      (userMessage.includes("i got") && userMessage.includes("order")) ||
      userMessage.includes("my order") ||
      userMessage.includes("order status") ||
      userMessage.includes("check my order") ||
      (userMessage.includes("where is") && userMessage.includes("order")) ||
      userMessage.includes("track order") ||
      (userMessage.includes("already have") && userMessage.includes("order"))) {

    // Check if we already have order number and email in conversation
    const hasOrderNumber = messages.some(m => /order.*number|order.*id|order.*#|#\d{6,}|\d{6,}/i.test(m.content));
    const hasEmail = messages.some(m => /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(m.content));

    if (!hasOrderNumber) {
      return "Great! I can help you with your order. 📦\n\nFirst, could you please provide your **order number**? (It usually looks like: ORD-123456)";
    } else if (!hasEmail) {
      return "Thank you! Now, could you please provide the **email address** associated with your order? This will help me look up the details.";
    } else {
      return "Perfect! I have your order number and email. Let me look that up for you...\n\nWhat would you like to know about your order?\n• Order status\n• Delivery/Timeline\n• Order details\n• Make changes\n• Or anything else?";
    }
  }

  // Fetch real company data for intelligent responses
  let companyContext = "";
  try {
    const response = await fetch("http://localhost:8080/api/companies");
    const companies = (await response.json()) as Array<{
      companyName?: string;
      id?: string;
      country?: string;
      purchasePrice?: number;
      type?: string;
    }>;

    if (Array.isArray(companies) && companies.length > 0) {
      const countries = [...new Set(companies.map(c => c.country).filter(Boolean))];
      const activeCompanies = companies.filter((c) => c.country);

      companyContext = `Available countries: ${countries.join(", ")}. Total companies: ${companies.length}`;

      // Check for country-specific queries
      if (userMessage.includes("united kingdom") || userMessage.includes(" uk") || userMessage.includes("england") || userMessage.includes("britain")) {
        const ukCompanies = companies.filter(c =>
          c.country?.toLowerCase().includes("united kingdom") ||
          c.country?.toLowerCase().includes("uk") ||
          c.country?.toLowerCase().includes("england")
        );

        if (ukCompanies.length > 0) {
          // Check if user already specified incorporation year
          const yearMatch = userMessage.match(/\b(19|20)\d{2}\b/);

          if (yearMatch) {
            // Filter by year and show one company
            const targetYear = parseInt(yearMatch[0]);
            const yearCompanies = ukCompanies.filter(c => c.incorporationYear === targetYear);

            if (yearCompanies.length > 0) {
              const company = yearCompanies[Math.floor(Math.random() * yearCompanies.length)];
              return `Perfect! Here's an available company from ${targetYear} in the UK:\n\n💼 **${company.companyName}**\n📌 Company Number: ${company.companyNumber}\n💰 Price: £${company.purchasePrice || "Contact for quote"}\n\n⚡ **Do you want to buy it now?** It will take only **1 minute** to start the transfer and take ownership of this company!`;
            }
          }

          // Get available years in UK companies
          const availableYears = [...new Set(ukCompanies.map(c => c.incorporationYear).filter(Boolean))].sort((a, b) => b - a);

          return `Yes, we have! 🎯\n\nWhich **incorporation year** are you looking for?\n\nAvailable years: ${availableYears.join(", ")}`;
        } else {
          return `I don't currently have companies in the United Kingdom in our inventory. However, we have companies in: ${countries.join(", ")}. Which country interests you?`;
        }
      }

      // Check for other country queries
      for (const country of countries) {
        if (userMessage.includes(country.toLowerCase())) {
          const countryCompanies = companies.filter(c => c.country?.toLowerCase() === country.toLowerCase());
          if (countryCompanies.length > 0) {
            // Check if user already specified incorporation year
            const yearMatch = userMessage.match(/\b(19|20)\d{2}\b/);

            if (yearMatch) {
              // Filter by year and show one company
              const targetYear = parseInt(yearMatch[0]);
              const yearCompanies = countryCompanies.filter(c => c.incorporationYear === targetYear);

              if (yearCompanies.length > 0) {
                const company = yearCompanies[Math.floor(Math.random() * yearCompanies.length)];
                return `Perfect! Here's an available company from ${targetYear} in ${country}:\n\n💼 **${company.companyName}**\n📌 Company Number: ${company.companyNumber}\n💰 Price: $${company.purchasePrice || "Contact for quote"}\n\n⚡ **Do you want to buy it now?** It will take only **1 minute** to start the transfer and take ownership of this company!`;
              }
            }

            // Get available years
            const availableYears = [...new Set(countryCompanies.map(c => c.incorporationYear).filter(Boolean))].sort((a, b) => b - a);

            return `Yes, we have! 🎯\n\nWhich **incorporation year** are you looking for?\n\nAvailable years: ${availableYears.join(", ")}`;
          }
        }
      }
    }
  } catch (error) {
    console.warn("[Demo Mode] Could not fetch company data", error);
  }

  // Fallback responses if no specific country match
  const demoResponses: Record<string, string> = {
    "hello": "Hello! 👋 Welcome to Sharekte. I'm an AI sales assistant here to help you explore our company marketplace. What are you looking for today?",
    "company": `We have a great selection of ready-made companies for sale. ${companyContext ? `Currently available in: ${companyContext}. ` : ""}Which country interests you?`,
    "price": "Our companies range from $500 to $100,000+ depending on the company type and jurisdiction. Would you like to see some options in a specific country?",
    "yes": "Excellent! 🎉 Let me help you get started.\n\nPlease provide your contact information using the form above (name, email, phone), and I'll guide you through the quick 1-minute transfer process.\n\nOnce you confirm, we'll begin the ownership transfer immediately!",
    "buy": "Great choice! 🚀 This is an excellent opportunity.\n\nClick the **'Add to Cart'** button or tell me your email, and I'll prepare everything for your transfer. The entire process takes just 1 minute!",
    "order": "I can help you place a new order! Which country are you interested in?",
    "checkout": "To proceed with checkout, I'll need your contact information first. Please fill out the form above with your name, email, and phone number.",
    "how": "Our process is simple: 1) Choose a country, 2) Pick incorporation year, 3) Select company, 4) Add to cart, 5) Provide info, 6) Complete payment (1 min transfer!). Ready to start?",
    "help": "I'm here to help! Ask me about: companies by country, incorporation years, pricing, how buying works, or anything else. What interests you?",
  };

  for (const [keyword, response] of Object.entries(demoResponses)) {
    if (userMessage.includes(keyword)) {
      return response;
    }
  }

  return `Thanks for your question! 😊\n\n${companyContext ? `We currently have companies in: ${companyContext}.\n\n` : ""}Which country interests you? I can show you available companies with incorporation years and pricing. It only takes 1 minute to transfer ownership!`;
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
