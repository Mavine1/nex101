import express from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();
const aiInvoiceRouter = express.Router();

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
    console.error("❌ GEMINI_API_KEY is missing in .env – AI features will fail.");
}

// Use only models that are known to work with free tier (gemini-1.5-flash is safest)
const MODEL_CANDIDATES = [
    Gemini 2.5 Flash,   // Latest and best, but may have stricter quota
    Gemini 2.5,         // Very capable, may be more available
    Gemini 1.5 Flash,   // Known to work with free tier, good fallback
    Gemini 1.5          // Older, less capable, but may still work as a last resort
    // fallback (may be restricted)
];

let ai = null;
if (API_KEY) {
    ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
    console.warn("⚠️ GoogleGenAI client not initialised – AI generation will fail.");
}

function buildInvoicePrompt(promptText) {
    const invoiceTemplate = {
        invoiceNumber: `INV-${Math.floor(Math.random() * 9000) + 1000}`,
        issueDate: new Date().toISOString().slice(0, 10),
        dueDate: "",
        fromBusinessName: "",
        fromEmail: "",
        fromAddress: "",
        fromPhone: "",
        fromLocation: "",
        client: { name: "", email: "", address: "", phone: "" },
        items: [{ id: "1", description: "", qty: 1, unitPrice: 0 }],
        taxPercent: 18,
        currency: "KSH",
        status: "draft",
        signatureName: "",
        signatureTitle: ""
    };
    return `
You are an invoice generation assistant.

Task:
  - Analyze the user's input text and produce a valid JSON object only (no explanatory text, no markdown).
  - The JSON MUST match the schema below (include all fields even if empty).
  - All dates must be ISO 'YYYY-MM-DD'.
  - Numeric fields must be numbers.
  - Do NOT include computed fields (subtotal, tax, total).

Schema:
${JSON.stringify(invoiceTemplate, null, 2)}

User input:
${promptText}

Output: valid JSON only.
`;
}

async function tryGenerateWithModel(modelName, prompt) {
    if (!ai) throw new Error("AI client not initialised (missing API key).");
    
    console.log(`🔄 Trying model: ${modelName}`);
    const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
    });

    let text = null;
    if (response && typeof response.text === "string") {
        text = response.text;
    } else if (response?.output?.[0]?.content?.[0]?.text) {
        text = response.output[0].content[0].text;
    } else if (response?.candidates?.[0]?.content?.parts?.[0]?.text) {
        text = response.candidates[0].content.parts[0].text;
    }
    if (!text?.trim()) throw new Error("Empty response from model");
    
    return { text: text.trim(), modelName };
}

aiInvoiceRouter.post("/generate", async (req, res) => {
    try {
        if (!API_KEY || !ai) {
            return res.status(503).json({
                success: false,
                message: "AI service unavailable: missing or invalid API key."
            });
        }

        const { prompt } = req.body;
        if (!prompt?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Prompt is required and must be non-empty"
            });
        }

        const fullPrompt = buildInvoicePrompt(prompt);
        let lastError = null;
        let result = null;

        for (const model of MODEL_CANDIDATES) {
            try {
                result = await tryGenerateWithModel(model, fullPrompt);
                if (result.text) break;
            } catch (err) {
                console.error(`Model ${model} failed:`, err.message);
                lastError = err;
                // Try to extract more details from the error
                if (err.message.includes('quota') || err.message.includes('billing')) {
                    break; // no point continuing
                }
            }
        }

        if (!result || !result.text) {
            const errMsg = lastError?.message || "All models failed. Check API key, quota, or billing.";
            console.error("AI generation failed:", errMsg);
            return res.status(502).json({
                success: false,
                message: "AI generation failed",
                detail: errMsg,
                suggestion: "Ensure your GEMINI_API_KEY is valid and billing is enabled (or use a fallback)."
            });
        }

        let cleanText = result.text.trim()
            .replace(/^```(?:json)?\s*/, '')
            .replace(/\s*```$/, '');

        const firstBrace = cleanText.indexOf('{');
        const lastBrace = cleanText.lastIndexOf('}');
        if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
            return res.status(502).json({
                success: false,
                message: "AI returned malformed response (no JSON)",
                raw: cleanText
            });
        }

        const jsonString = cleanText.substring(firstBrace, lastBrace + 1);
        let invoiceData;
        try {
            invoiceData = JSON.parse(jsonString);
        } catch (parseErr) {
            return res.status(502).json({
                success: false,
                message: "AI returned invalid JSON",
                raw: jsonString
            });
        }

        const safeInvoice = {
            invoiceNumber: invoiceData.invoiceNumber || `INV-${Date.now()}`,
            issueDate: invoiceData.issueDate || new Date().toISOString().slice(0, 10),
            dueDate: invoiceData.dueDate || "",
            fromBusinessName: invoiceData.fromBusinessName || "",
            fromEmail: invoiceData.fromEmail || "",
            fromAddress: invoiceData.fromAddress || "",
            fromPhone: invoiceData.fromPhone || "",
            fromLocation: invoiceData.fromLocation || "",
            client: {
                name: invoiceData.client?.name || "",
                email: invoiceData.client?.email || "",
                address: invoiceData.client?.address || "",
                phone: invoiceData.client?.phone || ""
            },
            items: (Array.isArray(invoiceData.items) && invoiceData.items.length)
                ? invoiceData.items
                : [{ id: "1", description: "Item", qty: 1, unitPrice: 0 }],
            taxPercent: Number(invoiceData.taxPercent) || 18,
            currency: invoiceData.currency || "KSH",
            status: "draft",
            signatureName: invoiceData.signatureName || "",
            signatureTitle: invoiceData.signatureTitle || ""
        };

        return res.status(200).json({
            success: true,
            data: safeInvoice,
            model: result.modelName,
            message: "Invoice generated successfully"
        });
    } catch (error) {
        console.error("AI generation route error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error during AI invoice generation",
            error: error.message
        });
    }
});

export default aiInvoiceRouter;