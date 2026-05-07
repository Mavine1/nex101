import { getAuth } from '@clerk/express';
import BusinessProfile from '../models/businessProfileModel.js';

function getBaseUrl(req) {
    const protocol = req.protocol;
    const host = req.get('host');
    return `${protocol}://${host}`;
}

function uploadedFilesToUrls(req) {
    const urls = {};
    if (!req.files) return urls;
    const baseUrl = getBaseUrl(req);
    const logoArr = req.files.logoName || req.files.logo || [];
    const stampArr = req.files.stampName || req.files.stamp || [];
    const sigArr = req.files.signatureNameMeta || req.files.signature || [];
    if (logoArr[0]) urls.logoUrl = `${baseUrl}/uploads/${logoArr[0].filename}`;
    if (stampArr[0]) urls.stampUrl = `${baseUrl}/uploads/${stampArr[0].filename}`;
    if (sigArr[0]) urls.signatureUrl = `${baseUrl}/uploads/${sigArr[0].filename}`;
    return urls;
}

// UPSERT (create or update)
export async function createBusinessProfile(req, res) {
    try {
        const { userId } = getAuth(req);
        if (!userId) {
            return res.status(401).json({ success: false, message: "Authentication required." });
        }

        const body = req.body || {};
        const fileUrls = uploadedFilesToUrls(req);

        const updateData = {
            businessName: body.businessName || "ABC Solutions",
            email: body.email || "",
            address: body.address || "",
            phone: body.phone || "",
            location: body.location || "",          // only location, no gst
            website: body.website || "",
            terms: body.terms || "",
            footer: body.footer || "",
            logoUrl: fileUrls.logoUrl || body.logoUrl || null,
            stampUrl: fileUrls.stampUrl || body.stampUrl || null,
            signatureUrl: fileUrls.signatureUrl || body.signatureUrl || null,
            signatureOwnerName: body.signatureOwnerName || "",
            signatureOwnerTitle: body.signatureOwnerTitle || "",
            defaultTaxPercent: body.defaultTaxPercent !== undefined ? Number(body.defaultTaxPercent) : 18,
        };

        const updated = await BusinessProfile.findOneAndUpdate(
            { owner: userId },
            { $set: updateData },
            { upsert: true, new: true, runValidators: true }
        );

        return res.status(200).json({
            success: true,
            data: updated,
            message: "Business profile saved successfully."
        });
    } catch (error) {
        console.error("createBusinessProfile error:", error);
        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: error.message
        });
    }
}

export async function getMyBusinessProfile(req, res) {
    try {
        const { userId } = getAuth(req);
        if (!userId) {
            return res.status(401).json({ success: false, message: "Authentication required." });
        }
        const profile = await BusinessProfile.findOne({ owner: userId }).lean();
        if (!profile) {
            return res.status(200).json({ success: true, message: "No profile found", data: null });
        }
        return res.status(200).json({ success: true, data: profile });
    } catch (error) {
        console.error("getMyBusinessProfile error:", error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
}

// Update by ID (optional)
export async function updateBusinessProfile(req, res) {
    try {
        const { userId } = getAuth(req);
        if (!userId) return res.status(401).json({ success: false, message: "Authentication required." });
        const { id } = req.params;
        const body = req.body || {};
        const fileUrls = uploadedFilesToUrls(req);
        const existing = await BusinessProfile.findOne({ _id: id, owner: userId });
        if (!existing) return res.status(404).json({ success: false, message: "Business profile not found." });

        const update = {
            businessName: body.businessName,
            email: body.email,
            address: body.address,
            phone: body.phone,
            location: body.location,
            website: body.website,
            terms: body.terms,
            footer: body.footer,
            signatureOwnerName: body.signatureOwnerName,
            signatureOwnerTitle: body.signatureOwnerTitle,
            defaultTaxPercent: body.defaultTaxPercent !== undefined ? Number(body.defaultTaxPercent) : undefined,
        };
        if (fileUrls.logoUrl) update.logoUrl = fileUrls.logoUrl;
        else if (body.logoUrl !== undefined) update.logoUrl = body.logoUrl;
        if (fileUrls.stampUrl) update.stampUrl = fileUrls.stampUrl;
        else if (body.stampUrl !== undefined) update.stampUrl = body.stampUrl;
        if (fileUrls.signatureUrl) update.signatureUrl = fileUrls.signatureUrl;
        else if (body.signatureUrl !== undefined) update.signatureUrl = body.signatureUrl;

        Object.keys(update).forEach(k => update[k] === undefined && delete update[k]);

        const updated = await BusinessProfile.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true });
        return res.status(200).json({ success: true, data: updated, message: "Business Profile Updated." });
    } catch (error) {
        console.error("updateBusinessProfile error:", error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
}