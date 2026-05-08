import express from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();
const aiInvoiceRouter = express.Router();

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
    console.error("❌ GEMINI_API_KEY is missing in .env – AI features will fail.");
}

// Use confirmed working models (as of May 2026)
const MODEL_CANDIDATES = [
    "gemini-2.0-flash",
    "gemini-1.5-flash",
];

let ai = null;
if (API_KEY) {
    try {
        ai = new GoogleGenAI({ apiKey: API_KEY });
        console.log("✅ GoogleGenAI client initialised");
    } catch (err) {
        console.error("❌ Failed to initialise GoogleGenAI client:", err.message);
    }
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

// Fallback function using direct fetch (in case SDK fails)
async function generateWithFetch(model, prompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
        })
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('No text in response');
    return text;
}

async function tryGenerateWithModel(modelName, prompt, useFetchFallback = false) {
    if (!useFetchFallback && ai) {
        try {
            const response = await ai.models.generateContent({
                model: modelName,
                contents: prompt,
            });
            let text = null;
            if (response && typeof response.text === 'string') text = response.text;
            else if (response?.output?.[0]?.content?.[0]?.text) text = response.output[0].content[0].text;
            else if (response?.candidates?.[0]?.content?.parts?.[0]?.text) text = response.candidates[0].content.parts[0].text;
            if (!text?.trim()) throw new Error('Empty response');
            return { text: text.trim(), modelName };
        } catch (err) {
            console.warn(`SDK failed for ${modelName}:`, err.message);
            // Fallback to fetch on next attempt
            return tryGenerateWithModel(modelName, prompt, true);
        }
    } else {
        const text = await generateWithFetch(modelName, prompt);
        return { text: text.trim(), modelName };
    }
}

aiInvoiceRouter.post("/generate", async (req, res) => {
    try {
        if (!API_KEY) {
            return res.status(503).json({
                success: false,
                message: "AI service unavailable: missing API key."
            });
        }

        const { prompt } = req.body;
        if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: "Prompt is required and must be a non-empty string"
            });
        }

        const fullPrompt = buildInvoicePrompt(prompt);
        let lastErr = null;
        let lastText = null;
        let usedModel = null;

        for (const model of MODEL_CANDIDATES) {
            try {
                const { text, modelName } = await tryGenerateWithModel(model, fullPrompt);
                lastText = text;
                usedModel = modelName;
                if (text?.trim()) break;
            } catch (err) {
                console.error(`Model ${model} failed:`, err.message);
                lastErr = err;
                continue;
            }
        }

        if (!lastText) {
            const errMsg = lastErr?.message || "All models failed";
            console.error("AI generation failed:", errMsg);
            return res.status(502).json({
                success: false,
                message: "AI generation failed",
                detail: errMsg
            });
        }

        // Clean markdown
        let cleanText = lastText.trim();
        cleanText = cleanText.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');

        const firstBrace = cleanText.indexOf('{');
        const lastBrace = cleanText.lastIndexOf('}');
        if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
            console.error("No JSON found in AI response:", cleanText);
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
            console.error("JSON parse error:", parseErr.message);
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
            items: Array.isArray(invoiceData.items) && invoiceData.items.length
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
            model: usedModel,
            message: "Invoice generated successfully"
        });
    } catch (error) {
        console.error("AI Invoice generation error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error during AI invoice generation",
            error: error.message
        });
    }
});

export default aiInvoiceRouter;