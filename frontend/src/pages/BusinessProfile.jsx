import React, { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import Swal from "sweetalert2";
import { businessProfileStyles } from "../assets/dummyStyles";

// ======================== INJECT GLOBAL STYLES FOR SWEETALERT TOASTS ========================
const injectToastStyles = () => {
  if (document.getElementById("swal-toast-styles")) return;
  const style = document.createElement("style");
  style.id = "swal-toast-styles";
  style.innerHTML = `
    .swal-small-toast {
      width: 320px !important;
      padding: 0.75rem 1rem !important;
      font-size: 0.875rem !important;
      border-radius: 0.5rem !important;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
    }
    .swal-small-toast .swal2-title {
      font-size: 1rem !important;
      margin-bottom: 0.25rem !important;
    }
    .swal-small-toast .swal2-html-container {
      font-size: 0.8rem !important;
      margin: 0 !important;
    }
    .swal-small-toast.swal2-icon-success {
      border-left: 4px solid #22c55e !important;
    }
    .swal-small-toast.swal2-icon-error {
      border-left: 4px solid #ef4444 !important;
    }
  `;
  document.head.appendChild(style);
};

// ======================== IMAGE URL RESOLVER ========================
// Strips localhost origins so Vercel's /uploads rewrite proxy handles the request.
// Relative paths (e.g. /uploads/file.jpg) are returned as-is — correct for production.
function resolveImageUrl(url) {
  if (!url) return null;
  const s = String(url).trim();

  // Blob / data URLs are always local — return as-is
  if (s.startsWith("blob:") || s.startsWith("data:")) return s;

  // Strip any localhost origin and return just the pathname
  // e.g. "http://localhost:4000/uploads/foo.jpg" → "/uploads/foo.jpg"
  if (/^https?:\/\/localhost/i.test(s)) {
    try {
      return new URL(s).pathname;
    } catch {
      return s;
    }
  }

  // Any other absolute URL (e.g. a CDN) — return as-is
  if (/^https?:\/\//i.test(s)) {
    try {
      return new URL(s).href;
    } catch {
      return s;
    }
  }

  // Relative path — return as-is
  return s;
}

// ======================== TOAST HELPER ========================
function toast(icon, title, text, extra = {}) {
  const isSuccess = icon === "success";
  Swal.fire({
    icon,
    title,
    text,
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: isSuccess ? 2000 : 2500,
    background: isSuccess ? "#f0fdf4" : "#fef2f2",
    color: isSuccess ? "#166534" : "#991b1b",
    iconColor: isSuccess ? "#22c55e" : "#ef4444",
    customClass: { popup: "swal-small-toast" },
    ...extra,
  });
}

// ======================== ICON COMPONENTS ========================
const UploadIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const ImageIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

const DeleteIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const SaveIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

const ResetIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);

// ======================== UPLOAD SLOT COMPONENT ========================
// Reusable upload slot to eliminate copy-paste across logo / stamp / signature
function UploadSlot({ kind, preview, inputId, label, subtitle, icon, previewClass, onPick, onRemove }) {
  return (
    <div className={businessProfileStyles.uploadArea}>
      {preview ? (
        <div className={businessProfileStyles.imagePreviewContainer}>
          <div className={previewClass}>
            <img src={preview} alt={`${label} preview`} className="object-contain w-full h-full" />
          </div>
          <div className={businessProfileStyles.buttonGroup}>
            <label className={businessProfileStyles.changeButton}>
              <UploadIcon className="w-4 h-4" /> Change
              <input type="file" accept="image/*" onChange={(e) => onPick(e.target.files?.[0])} className="hidden" />
            </label>
            <button type="button" onClick={onRemove} className={businessProfileStyles.removeButton}>
              <DeleteIcon className="w-4 h-4" /> Remove
            </button>
          </div>
        </div>
      ) : (
        <div className="cursor-pointer block" onClick={() => document.getElementById(inputId).click()}>
          <div className={`${businessProfileStyles.imagePreviewContainer} ${businessProfileStyles.hoverScale}`}>
            <div className={businessProfileStyles.uploadSmallIconContainer}>
              {icon}
            </div>
            <div>
              <p className={businessProfileStyles.uploadTextTitle}>Upload {label}</p>
              <p className={businessProfileStyles.uploadTextSubtitle}>{subtitle}</p>
            </div>
          </div>
          <input
            id={inputId}
            type="file"
            accept="image/*"
            onChange={(e) => onPick(e.target.files?.[0])}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
}

// ======================== MAIN COMPONENT ========================
const EMPTY_FILES = { logo: null, stamp: null, signature: null };
const EMPTY_PREVIEWS = { logo: null, stamp: null, signature: null };

export default function BusinessProfile() {
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => { injectToastStyles(); }, []);

  const [meta, setMeta] = useState({});
  const [saving, setSaving] = useState(false);
  const [files, setFiles] = useState(EMPTY_FILES);
  const [previews, setPreviews] = useState(EMPTY_PREVIEWS);

  // ---- Auth helper ----
  async function getAuthToken() {
    if (typeof getToken !== "function") return null;
    try {
      return (
        (await getToken({ template: "default" }).catch(() => null)) ||
        (await getToken({ forceRefresh: true }).catch(() => null))
      );
    } catch {
      return null;
    }
  }

  // ---- Fetch existing profile ----
  useEffect(() => {
    let mounted = true;

    async function fetchProfile() {
      if (!isSignedIn) return;
      const token = await getAuthToken();
      if (!token) {
        console.warn("No auth token — cannot fetch BusinessProfile");
        return;
      }

      try {
        const res = await fetch("/api/businessProfile/me", {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        });

        if (res.status === 404) return;
        if (!res.ok) { console.error("Failed to fetch business profile:", res.status); return; }

        const json = await res.json().catch(() => null);
        const data = json?.data;
        if (!data || !mounted) return;

        const serverMeta = {
          businessName:        data.businessName        ?? "",
          email:               data.email               ?? "",
          address:             data.address             ?? "",
          phone:               data.phone               ?? "",
          location:            data.location            ?? "",
          website:             data.website             ?? "",
          terms:               data.terms               ?? "",
          footer:              data.footer              ?? "",
          paymentMethod:       data.paymentMethod       ?? "",
          paybill:             data.paybill             ?? "",
          accountNumber:       data.accountNumber       ?? "",
          accountName:         data.accountName         ?? "",
          logoUrl:             data.logoUrl             ?? null,
          stampUrl:            data.stampUrl            ?? null,
          signatureUrl:        data.signatureUrl        ?? null,
          signatureOwnerName:  data.signatureOwnerName  ?? "",
          signatureOwnerTitle: data.signatureOwnerTitle ?? "",
          defaultTaxPercent:   data.defaultTaxPercent   ?? 18,
        };

        setMeta(serverMeta);
        setPreviews((p) => ({
          ...p,
          logo:      resolveImageUrl(serverMeta.logoUrl),
          stamp:     resolveImageUrl(serverMeta.stampUrl),
          signature: resolveImageUrl(serverMeta.signatureUrl),
        }));
      } catch (err) {
        console.error("Error fetching business profile:", err);
      }
    }

    fetchProfile();

    return () => {
      mounted = false;
      // Revoke any blob URLs created during this mount
      Object.values(previews).forEach((u) => {
        if (u?.startsWith("blob:")) URL.revokeObjectURL(u);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, getToken]);

  // ---- State helpers ----
  function updateMeta(field, value) {
    setMeta((m) => ({ ...m, [field]: value }));
  }

  const urlFieldFor = (kind) =>
    kind === "logo" ? "logoUrl" : kind === "stamp" ? "stampUrl" : "signatureUrl";

  function handleLocalFilePick(kind, file) {
    if (!file) return;
    const prev = previews[kind];
    if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);

    const objUrl = URL.createObjectURL(file);
    setFiles((f) => ({ ...f, [kind]: file }));
    setPreviews((p) => ({ ...p, [kind]: objUrl }));
    updateMeta(urlFieldFor(kind), objUrl);
  }

  function removeLocalFile(kind) {
    const prev = previews[kind];
    if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
    setFiles((f) => ({ ...f, [kind]: null }));
    setPreviews((p) => ({ ...p, [kind]: null }));
    updateMeta(urlFieldFor(kind), null);
  }

  // ---- Save ----
  async function handleSave(e) {
    e?.preventDefault();
    setSaving(true);

    try {
      const token = await getAuthToken();
      if (!token) {
        toast("error", "Authentication Required", "You must be signed in to save your business profile.", { timer: 3000 });
        return;
      }

      const fd = new FormData();
      const textFields = [
        "businessName", "email", "address", "phone", "location",
        "website", "terms", "footer", "paymentMethod", "paybill",
        "accountNumber", "accountName", "signatureOwnerName", "signatureOwnerTitle",
      ];
      textFields.forEach((f) => fd.append(f, meta[f] || ""));
      fd.append("defaultTaxPercent", String(meta.defaultTaxPercent ?? 18));

      // For each image kind: send file if newly picked, else preserve existing server URL
      const fileFieldNames = { logo: "logoName", stamp: "stampName", signature: "signatureNameMeta" };
      const urlFieldNames  = { logo: "logoUrl",  stamp: "stampUrl",  signature: "signatureUrl" };

      ["logo", "stamp", "signature"].forEach((kind) => {
        const urlField = urlFieldFor(kind);
        if (files[kind]) {
          fd.append(fileFieldNames[kind], files[kind]);
        } else if (meta[urlField] && !meta[urlField].startsWith("blob:")) {
          fd.append(urlFieldNames[kind], meta[urlField]);
        }
      });

      const res = await fetch("/api/businessProfile/me", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message || `Save failed (${res.status})`);

      const saved = json?.data || json;

      // Merge server response back into meta
      setMeta((prev) => ({ ...prev, ...saved }));

      // Update previews with resolved server URLs (strips any localhost origins)
      setPreviews((p) => ({
        logo:      saved.logoUrl      ? resolveImageUrl(saved.logoUrl)      : p.logo,
        stamp:     saved.stampUrl     ? resolveImageUrl(saved.stampUrl)     : p.stamp,
        signature: saved.signatureUrl ? resolveImageUrl(saved.signatureUrl) : p.signature,
      }));

      // Clear pending file references now that they're uploaded
      setFiles(EMPTY_FILES);

      toast("success", "Saved!", "Business profile saved successfully.");
    } catch (err) {
      console.error("Failed to save profile:", err);
      toast("error", "Save Failed", err?.message || "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  }

  // ---- Clear / Reset ----
  async function handleClearProfile() {
    const result = await Swal.fire({
      title: "Clear Profile?",
      text: "This will remove all local changes and previews. This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#D0005E",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, clear it",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    Object.values(previews).forEach((u) => {
      if (u?.startsWith("blob:")) URL.revokeObjectURL(u);
    });
    setMeta({});
    setFiles(EMPTY_FILES);
    setPreviews(EMPTY_PREVIEWS);

    toast("success", "Cleared!", "Profile form has been reset.", { timer: 1500 });
  }

  // ======================== RENDER ========================
  return (
    <div className={businessProfileStyles.container}>
      <div className={businessProfileStyles.header}>
        <h1 className={businessProfileStyles.title}>Business Profile</h1>
        <p className={businessProfileStyles.subtitle}>
          Manage your company information, logo, stamp, and signature.
        </p>
      </div>

      <form onSubmit={handleSave}>
        {/* ── Business Information ── */}
        <div className={businessProfileStyles.cardContainer}>
          <div className={businessProfileStyles.cardHeaderContainer}>
            <div className={`${businessProfileStyles.cardIconContainer} ${businessProfileStyles.iconPrimary}`}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 8v-4m0 4h4" />
              </svg>
            </div>
            <h2 className={businessProfileStyles.cardTitle}>Business Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { label: "Business Name *", field: "businessName", type: "text", required: true },
              { label: "Email Address",   field: "email",        type: "email" },
              { label: "Phone Number",    field: "phone",        type: "tel" },
              { label: "Location",        field: "location",     type: "text", placeholder: "City, State, or Region" },
              { label: "Website",         field: "website",      type: "url",  placeholder: "https://example.com" },
            ].map(({ label, field, type, placeholder, required }) => (
              <div key={field}>
                <label className={businessProfileStyles.label}>{label}</label>
                <input
                  type={type}
                  value={meta[field] || ""}
                  onChange={(e) => updateMeta(field, e.target.value)}
                  className={businessProfileStyles.input}
                  placeholder={placeholder}
                  required={required}
                />
              </div>
            ))}

            <div>
              <label className={businessProfileStyles.label}>Default Tax (%)</label>
              <input
                type="number"
                step="0.1"
                value={meta.defaultTaxPercent ?? 18}
                onChange={(e) => updateMeta("defaultTaxPercent", parseFloat(e.target.value) || 0)}
                className={businessProfileStyles.input}
              />
            </div>

            <div className="md:col-span-2">
              <label className={businessProfileStyles.label}>Address</label>
              <textarea
                rows={2}
                value={meta.address || ""}
                onChange={(e) => updateMeta("address", e.target.value)}
                className={businessProfileStyles.textarea}
              />
            </div>
          </div>
        </div>

        {/* ── Legal & Footer ── */}
        <div className={businessProfileStyles.cardContainer}>
          <div className={businessProfileStyles.cardHeaderContainer}>
            <div className={`${businessProfileStyles.cardIconContainer} ${businessProfileStyles.iconSecondary}`}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <h2 className={businessProfileStyles.cardTitle}>Legal & Footer Information</h2>
          </div>

          <div className="space-y-6">
            <div>
              <label className={businessProfileStyles.label}>Terms & Conditions</label>
              <textarea
                rows={4}
                value={meta.terms || ""}
                onChange={(e) => updateMeta("terms", e.target.value)}
                className={businessProfileStyles.textarea}
                placeholder="Payment terms, refund policy, delivery terms, etc."
              />
            </div>
            <div>
              <label className={businessProfileStyles.label}>Footer Text</label>
              <textarea
                rows={2}
                value={meta.footer || ""}
                onChange={(e) => updateMeta("footer", e.target.value)}
                className={businessProfileStyles.textarea}
                placeholder="Additional note or footer message displayed on invoices"
              />
            </div>
          </div>
        </div>

        {/* ── Payment Settings ── */}
        <div className={businessProfileStyles.cardContainer}>
          <div className={businessProfileStyles.cardHeaderContainer}>
            <div className={`${businessProfileStyles.cardIconContainer} ${businessProfileStyles.iconSecondary}`}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.66 0 3-4 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4-3-9s1.34-9 3-9" />
                <line x1="12" y1="3" x2="12" y2="21" />
              </svg>
            </div>
            <h2 className={businessProfileStyles.cardTitle}>Payment Settings</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { label: "Payment Method Name", field: "paymentMethod",  placeholder: "e.g., M-PESA, Bank Transfer, PayPal" },
              { label: "Paybill / Till Number", field: "paybill",      placeholder: "e.g., 247247" },
              { label: "Account Number",        field: "accountNumber", placeholder: "e.g., 0799501465" },
              { label: "Account Name",          field: "accountName",  placeholder: "e.g., NEX101" },
            ].map(({ label, field, placeholder }) => (
              <div key={field}>
                <label className={businessProfileStyles.label}>{label}</label>
                <input
                  type="text"
                  value={meta[field] || ""}
                  onChange={(e) => updateMeta(field, e.target.value)}
                  className={businessProfileStyles.input}
                  placeholder={placeholder}
                />
              </div>
            ))}
          </div>
        </div>

        {/* ── Company Logo ── */}
        <div className={businessProfileStyles.cardContainer}>
          <div className={businessProfileStyles.cardHeaderContainer}>
            <div className={`${businessProfileStyles.cardIconContainer} ${businessProfileStyles.iconSecondary}`}>
              <UploadIcon className="w-5 h-5" />
            </div>
            <h2 className={businessProfileStyles.cardTitle}>Company Logo</h2>
          </div>

          <UploadSlot
            kind="logo"
            preview={previews.logo}
            inputId="logo-file-input"
            label="Logo"
            subtitle="PNG, JPG up to 5MB"
            previewClass={businessProfileStyles.logoPreview}
            icon={<UploadIcon className="w-6 h-6" />}
            onPick={(f) => handleLocalFilePick("logo", f)}
            onRemove={() => removeLocalFile("logo")}
          />
        </div>

        {/* ── Digital Assets (Stamp + Signature) ── */}
        <div className={businessProfileStyles.cardContainer}>
          <div className={businessProfileStyles.cardHeaderContainer}>
            <div className={`${businessProfileStyles.cardIconContainer} ${businessProfileStyles.iconTertiary}`}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 19l7-7 3 3-7 7-3-3z" />
                <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                <path d="M2 2l7.586 7.586" />
              </svg>
            </div>
            <h2 className={businessProfileStyles.cardTitle}>Digital Assets</h2>
          </div>

          <div className={businessProfileStyles.gridCols2Lg}>
            {/* Stamp */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Digital Stamp</h3>
              <UploadSlot
                kind="stamp"
                preview={previews.stamp}
                inputId="stamp-file-input"
                label="Stamp"
                subtitle="PNG with transparent background"
                previewClass={businessProfileStyles.stampPreview}
                icon={<ImageIcon className="w-5 h-5" />}
                onPick={(f) => handleLocalFilePick("stamp", f)}
                onRemove={() => removeLocalFile("stamp")}
              />
            </div>

            {/* Signature */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Digital Signature</h3>
              <UploadSlot
                kind="signature"
                preview={previews.signature}
                inputId="signature-file-input"
                label="Signature"
                subtitle="PNG with transparent background"
                previewClass={businessProfileStyles.signaturePreview}
                icon={
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                }
                onPick={(f) => handleLocalFilePick("signature", f)}
                onRemove={() => removeLocalFile("signature")}
              />

              <div className="mt-6 space-y-4">
                <div>
                  <label className={businessProfileStyles.label}>Signature Owner Name</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={meta.signatureOwnerName || ""}
                    onChange={(e) => updateMeta("signatureOwnerName", e.target.value)}
                    className={businessProfileStyles.input}
                  />
                </div>
                <div>
                  <label className={businessProfileStyles.label}>Signature Title / Designation</label>
                  <input
                    type="text"
                    placeholder="Director / CEO"
                    value={meta.signatureOwnerTitle || ""}
                    onChange={(e) => updateMeta("signatureOwnerTitle", e.target.value)}
                    className={businessProfileStyles.input}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Form Actions ── */}
        <div className={businessProfileStyles.actionsContainer}>
          <button type="button" onClick={handleClearProfile} className={businessProfileStyles.resetButton}>
            <ResetIcon className="w-4 h-4" /> Reset
          </button>
          <button type="submit" disabled={saving} className={businessProfileStyles.saveButton}>
            <SaveIcon className="w-4 h-4" /> {saving ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </form>
    </div>
  );
}