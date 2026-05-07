import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    qty: {
        type: Number,
        required: true,
        default: 1
    },
    unitPrice: {
        type: Number,
        required: true,
        default: 0
    }
});

const invoiceSchema = new mongoose.Schema({
    owner: {
        type: String,
        required: true,
        index: true
    },
    invoiceNumber: {
        type: String,
        required: true,
        unique: true,           // prevent duplicate numbers
        index: true
    },
    issueDate: {
        type: String,
        required: true
    },
    dueDate: {
        type: String,
        required: true
    },
    items: [itemSchema],

    // Seller / Business info (aligned with business profile)
    fromBusinessName: { type: String, default: "" },
    fromEmail: { type: String, default: "" },
    fromAddress: { type: String, default: "" },
    fromPhone: { type: String, default: "" },
    fromLocation: { type: String, default: "" },     // replaces fromGst

    // Client info
    client: {
        name: { type: String, default: "" },
        email: { type: String, default: "" },
        address: { type: String, default: "" },
        phone: { type: String, default: "" }
    },

    currency: { type: String, default: "KSH" },
    status: {
        type: String,
        enum: ["draft", "unpaid", "paid", "overdue"],
        default: "draft"
    },

    logoDataUrl: { type: String, default: null },
    stampDataUrl: { type: String, default: null },
    signatureDataUrl: { type: String, default: null },

    signatureName: { type: String, default: "" },
    signatureTitle: { type: String, default: "" },

    taxPercent: { type: Number, default: 18 },

    subtotal: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
}, {
    timestamps: true
});

const Invoice = mongoose.models.Invoice || mongoose.model("Invoice", invoiceSchema);
export default Invoice;