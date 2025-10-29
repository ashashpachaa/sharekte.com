import { RequestHandler } from "express";

const AIRTABLE_API_TOKEN = process.env.AIRTABLE_API_TOKEN;
const AIRTABLE_BASE_ID = "app0PK34gyJDizR3Q";
const AIRTABLE_TABLE_ID = "tbljtdHPdHnTberDy";

export const updateCompanyStatus: RequestHandler = async (req, res) => {
  if (!AIRTABLE_API_TOKEN) {
    console.error("❌ Airtable API token not configured");
    return res.status(500).json({ error: "Airtable API token not configured" });
  }

  try {
    const { recordId, status } = req.body || {};
    const pathRecordId = req.params.recordId;
    const finalRecordId = recordId || pathRecordId;

    if (!finalRecordId || !status) {
      return res.status(400).json({ error: "recordId and status are required" });
    }

    console.log(`📝 Updating company ${finalRecordId} status to: ${status}`);

    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}/${finalRecordId}`;

    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          "Statues ": status,
        },
      }),
    });

    console.log("📊 Airtable response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `❌ Airtable API error [${response.status}]:`,
        errorText
      );
      return res.status(response.status).json({
        error: `Airtable API error: ${response.status} ${response.statusText}`,
        details: errorText,
      });
    }

    const data = await response.json();
    console.log("✅ Successfully updated company status");
    res.json(data);
  } catch (error) {
    console.error("❌ Failed to update company status:", error);
    res.status(500).json({ error: "Failed to update company status" });
  }
};
