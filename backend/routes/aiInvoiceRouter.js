import express from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();
const aiInvoiceRouter = express.Router();

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
    console.warn("No Gemini Key found in the .env");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const MODEL_CANDIDATES = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.0",
];

// Template matching the actual Invoice schema (computed fields omitted)
function buildInvoicePrompt(promptText) {
    const invoiceTemplate = {
        invoiceNumber: `INV-${Math.floor(Math.random() * 9000) + 1000}`,
        issueDate: new Date().toISOString().slice(0, 10),
        dueDate: "",
        fromBusinessName: "",
        fromEmail: "",
        fromAddress: "",
        fromPhone: "",
        fromLocation: "",          // replaces GST field
        client: { 
            name: "", 
            email: "", 
            address: "", 
            phone: "" 
        },
        items: [{ id: "1", description: "", qty: 1, unitPrice: 0 }],
        taxPercent: 18,
        currency: "KSH",
        status: "draft",
        signatureName: "",
        signatureTitle: ""
        // logoDataUrl, stampDataUrl, signatureDataUrl are optional – AI won't generate them
    };

    return `
You are an invoice generation assistant.

Task:
  - Analyze the user's input text and produce a valid JSON object only (no explanatory text, no markdown code fences).
  - The JSON MUST match the schema below (include all fields even if empty).
  - All dates must be in ISO 'YYYY-MM-DD' format.
  - Numeric fields (qty, unitPrice, taxPercent) must be numbers.
  - The invoiceNumber should be a short alphanumeric string (can keep the placeholder or generate a simple one).
  - Ensure the client object contains at least the name if provided; others optional.
  - Do NOT include computed fields like subtotal, tax, total – they will be calculated by the server.

Schema:
${JSON.stringify(invoiceTemplate, null, 2)}

User input:
${promptText}

Output: valid JSON only (no surrounding text, no backticks).
`;
}

async function tryGenerateWithModel(modelName, prompt) {
    const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
    });

    let text = null;

    // Extract text from various response formats
    if (response && typeof response.text === "string") {
        text = response.text;
    } else if (response && response.output && Array.isArray(response.output)) {
        const content = response.output[0]?.content;
        if (content && Array.isArray(content) && content[0]?.text) {
            text = content[0].text;
        }
    } else if (response && response.outputs && Array.isArray(response.outputs)) {
        const joined = response.outputs
            .map((o) => {
                if (!o) return "";
                if (typeof o === "string") return o;
                if (typeof o.text === "string") return o.text;
                if (Array.isArray(o.content)) {
                    return o.content.map((c) => c?.text || "").join("\n");
                }
                return JSON.stringify(o);
            })
            .filter(Boolean)
            .join("\n\n");
        if (joined) text = joined;
    }

    if (!text && response) {
        try {
            text = JSON.stringify(response);
        } catch {
            text = String(response);
        }
    }

    if (!text || !String(text).trim()) {
        throw new Error("Empty text returned from model");
    }

    return { text: String(text).trim(), modelName };
}

// Route to generate invoice from text prompt
aiInvoiceRouter.post("/generate", async (req, res) => {
    try {
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
                if (text && text.trim()) break;
            } catch (err) {
                console.warn(`Model ${model} failed:`, err?.message || err);
                lastErr = err;
                continue;
            }
        }

        if (!lastText) {
            const errMsg = lastErr?.message || "All candidate models failed. Check API key, network, or model availability.";
            console.error("AI generation failed (no text):", errMsg);
            return res.status(502).json({
                success: false,
                message: "AI generation failed",
                detail: errMsg
            });
        }

        const text = lastText.trim();
        // Remove possible markdown code fences
        let cleanText = text;
        if (cleanText.startsWith("```json") || cleanText.startsWith("```")) {
            cleanText = cleanText.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
        }
        
        const firstBrace = cleanText.indexOf("{");
        const lastBrace = cleanText.lastIndexOf("}");

        if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
            console.error("AI response did not contain JSON object:", {
                usedModel,
                text: cleanText
            });
            return res.status(502).json({
                success: false,
                message: "AI returned malformed response (no JSON found)",
                raw: cleanText,
                model: usedModel
            });
        }

        const jsonString = cleanText.substring(firstBrace, lastBrace + 1);
        let invoiceData;

        try {
            invoiceData = JSON.parse(jsonString);
        } catch (parseError) {
            console.error("Failed to parse AI response as JSON:", parseError.message);
            return res.status(502).json({
                success: false,
                message: "AI returned invalid JSON",
                raw: jsonString,
                model: usedModel
            });
        }

        // Ensure required fields exist (fallback to defaults)
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
            items: Array.isArray(invoiceData.items) && invoiceData.items.length ? invoiceData.items : [{ id: "1", description: "Item", qty: 1, unitPrice: 0 }],
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