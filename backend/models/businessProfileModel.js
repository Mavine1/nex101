import mongoose from "mongoose";

const businessProfileSchema = new mongoose.Schema({
    owner: { type: String, required: true, index: true },
    businessName: { type: String, required: true },
    email: { type: String, default: "", trim: true, lowercase: true },
    address: { type: String, default: "" },
    phone: { type: String, default: "" },
    location: { type: String, default: "" },      // Replaces GST/Tax ID
    
    // images
    logoUrl: { type: String, default: null },
    stampUrl: { type: String, default: null },
    signatureUrl: { type: String, default: null },
    
    signatureOwnerName: { type: String, default: "" },
    signatureOwnerTitle: { type: String, default: "" },
    
    defaultTaxPercent: { type: Number, default: 18 },

    // New fields
    website: { type: String, default: "" },
    terms: { type: String, default: "" },
    footer: { type: String, default: "" }
}, {
    timestamps: true
});

const BusinessProfile = mongoose.models.BusinessProfile || mongoose.model("BusinessProfile", businessProfileSchema);
export default BusinessProfile;