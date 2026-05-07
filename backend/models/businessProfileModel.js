import mongoose from "mongoose";

const businessProfileSchema = new mongoose.Schema({
    owner: { type: String, required: true, index: true },
    businessName: { type: String, required: true },
    email: { type: String, required: false, trim: true, lowercase: true, default: "" },
    address: { type: String, required: false, default: "" },
    phone: { type: String, required: false, default: "" },
    location: { type: String, required: false, default: "" },      // Replaces GST/Tax ID
    
    // for images
    logoUrl: { type: String, required: false, default: null },
    stampUrl: { type: String, required: false, default: null },
    signatureUrl: { type: String, required: false, default: null },
    
    signatureOwnerName: { type: String, required: false, default: "" },
    signatureOwnerTitle: { type: String, required: false, default: "" },
    
    defaultTaxPercent: { type: Number, required: false, default: 18 },

    // New fields
    website: { type: String, required: false, default: "" },        // Business website URL
    terms: { type: String, required: false, default: "" },          // Terms & conditions text
    footer: { type: String, required: false, default: "" },         // Custom footer text
}, {
    timestamps: true
});

const BusinessProfile = mongoose.models.BusinessProfile || mongoose.model("BusinessProfile", businessProfileSchema);

export default BusinessProfile;