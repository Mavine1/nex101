import React, { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import Swal from "sweetalert2";
import { businessProfileStyles } from "../assets/dummyStyles";

// ======================== IMAGE URL RESOLVER ========================
function resolveImageUrl(url) {
  if (!url) return null;
  const s = String(url).trim();
  if (s.startsWith("blob:") || s.startsWith("data:")) return s;
  if (/^https?:\/\//i.test(s)) {
    try {
      return new URL(s).href;
    } catch {
      // fall through
    }
  }
  return s;
}

// ======================== ICON COMPONENTS (unchanged) ========================
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

// ======================== MAIN COMPONENT ========================
export default function BusinessProfile() {
  const { getToken, isSignedIn } = useAuth();

  const [meta, setMeta] = useState({});
  const [saving, setSaving] = useState(false);

  const [files, setFiles] = useState({
    logo: null,
    stamp: null,
    signature: null,
  });
  const [previews, setPreviews] = useState({
    logo: null,
    stamp: null,
    signature: null,
  });

  async function getAuthToken() {
    if (typeof getToken !== "function") return null;
    try {
      let t = await getToken({ template: "default" }).catch(() => null);
      if (!t) t = await getToken({ forceRefresh: true }).catch(() => null);
      return t;
    } catch {
      return null;
    }
  }

  // Fetch existing profile
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
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (res.status === 404) return;

        if (!res.ok) {
          console.error("Failed to fetch business profile:", res.status);
          return;
        }

        const json = await res.json().catch(() => null);
        const data = json?.data;
        if (!data || !mounted) return;

        const serverMeta = {
          businessName: data.businessName ?? "",
          email: data.email ?? "",
          address: data.address ?? "",
          phone: data.phone ?? "",
          location: data.location ?? "",
          website: data.website ?? "",
          terms: data.terms ?? "",
          footer: data.footer ?? "",
          logoUrl: data.logoUrl ?? null,
          stampUrl: data.stampUrl ?? null,
          signatureUrl: data.signatureUrl ?? null,
          signatureOwnerName: data.signatureOwnerName ?? "",
          signatureOwnerTitle: data.signatureOwnerTitle ?? "",
          defaultTaxPercent: data.defaultTaxPercent ?? 18,
        };

        setMeta(serverMeta);
        setPreviews((p) => ({
          ...p,
          logo: resolveImageUrl(serverMeta.logoUrl),
          stamp: resolveImageUrl(serverMeta.stampUrl),
          signature: resolveImageUrl(serverMeta.signatureUrl),
        }));
      } catch (err) {
        console.error("Error fetching business profile:", err);
      }
    }

    fetchProfile();

    return () => {
      mounted = false;
      Object.values(previews).forEach((u) => {
        if (u && typeof u === "string" && u.startsWith("blob:")) {
          URL.revokeObjectURL(u);
        }
      });
    };
  }, [isSignedIn, getToken]);

  function updateMeta(field, value) {
    setMeta((m) => ({ ...m, [field]: value }));
  }

  function handleLocalFilePick(kind, file) {
    if (!file) return;
    const prev = previews[kind];
    if (prev && typeof prev === "string" && prev.startsWith("blob:")) {
      URL.revokeObjectURL(prev);
    }

    const objUrl = URL.createObjectURL(file);
    setFiles((f) => ({ ...f, [kind]: file }));
    setPreviews((p) => ({ ...p, [kind]: objUrl }));
    updateMeta(
      kind === "logo" ? "logoUrl" : kind === "stamp" ? "stampUrl" : "signatureUrl",
      objUrl
    );
  }

  function removeLocalFile(kind) {
    const prev = previews[kind];
    if (prev && typeof prev === "string" && prev.startsWith("blob:")) {
      URL.revokeObjectURL(prev);
    }
    setFiles((f) => ({ ...f, [kind]: null }));
    setPreviews((p) => ({ ...p, [kind]: null }));
    updateMeta(
      kind === "logo" ? "logoUrl" : kind === "stamp" ? "stampUrl" : "signatureUrl",
      null
    );
  }

  async function handleSave(e) {
    e?.preventDefault();
    setSaving(true);

    try {
      const token = await getAuthToken();
      if (!token) {
        Swal.fire({
          icon: "error",
          title: "Authentication Required",
          text: "You must be signed in to save your business profile.",
          confirmButtonColor: "#D0005E",
        });
        return;
      }

      const fd = new FormData();
      fd.append("businessName", meta.businessName || "");
      fd.append("email", meta.email || "");
      fd.append("address", meta.address || "");
      fd.append("phone", meta.phone || "");
      fd.append("location", meta.location || "");
      fd.append("website", meta.website || "");
      fd.append("terms", meta.terms || "");
      fd.append("footer", meta.footer || "");
      fd.append("defaultTaxPercent", String(meta.defaultTaxPercent ?? 18));
      fd.append("signatureOwnerName", meta.signatureOwnerName || "");
      fd.append("signatureOwnerTitle", meta.signatureOwnerTitle || "");

      if (files.logo) fd.append("logoName", files.logo);
      else if (meta.logoUrl && !meta.logoUrl.startsWith("blob:")) fd.append("logoUrl", meta.logoUrl);

      if (files.stamp) fd.append("stampName", files.stamp);
      else if (meta.stampUrl && !meta.stampUrl.startsWith("blob:")) fd.append("stampUrl", meta.stampUrl);

      if (files.signature) fd.append("signatureNameMeta", files.signature);
      else if (meta.signatureUrl && !meta.signatureUrl.startsWith("blob:")) fd.append("signatureUrl", meta.signatureUrl);

      const res = await fetch("/api/businessProfile/me", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = json?.message || `Save failed (${res.status})`;
        throw new Error(msg);
      }

      const saved = json?.data || json;
      const merged = {
        ...meta,
        businessName: saved.businessName ?? meta.businessName,
        email: saved.email ?? meta.email,
        address: saved.address ?? meta.address,
        phone: saved.phone ?? meta.phone,
        location: saved.location ?? meta.location,
        website: saved.website ?? meta.website,
        terms: saved.terms ?? meta.terms,
        footer: saved.footer ?? meta.footer,
        logoUrl: saved.logoUrl ?? meta.logoUrl,
        stampUrl: saved.stampUrl ?? meta.stampUrl,
        signatureUrl: saved.signatureUrl ?? meta.signatureUrl,
        signatureOwnerName: saved.signatureOwnerName ?? meta.signatureOwnerName,
        signatureOwnerTitle: saved.signatureOwnerTitle ?? meta.signatureOwnerTitle,
        defaultTaxPercent: saved.defaultTaxPercent ?? meta.defaultTaxPercent,
      };

      setMeta(merged);

      if (saved.logoUrl) setPreviews((p) => ({ ...p, logo: resolveImageUrl(saved.logoUrl) }));
      if (saved.stampUrl) setPreviews((p) => ({ ...p, stamp: resolveImageUrl(saved.stampUrl) }));
      if (saved.signatureUrl) setPreviews((p) => ({ ...p, signature: resolveImageUrl(saved.signatureUrl) }));

      Swal.fire({
        icon: "success",
        title: "Saved!",
        text: "Business profile saved successfully.",
        timer: 2000,
        showConfirmButton: false,
        position: "top-end",
        toast: true,
      });
    } catch (err) {
      console.error("Failed to save profile:", err);
      Swal.fire({
        icon: "error",
        title: "Save Failed",
        text: err?.message || "Failed to save profile. See console for details.",
        confirmButtonColor: "#D0005E",
      });
    } finally {
      setSaving(false);
    }
  }

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
      if (u && typeof u === "string" && u.startsWith("blob:")) {
        URL.revokeObjectURL(u);
      }
    });
    setMeta({});
    setFiles({ logo: null, stamp: null, signature: null });
    setPreviews({ logo: null, stamp: null, signature: null });

    Swal.fire({
      icon: "success",
      title: "Cleared!",
      text: "Profile form has been reset.",
      timer: 1500,
      showConfirmButton: false,
      position: "top-end",
      toast: true,
    });
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
        {/* Basic Information Card */}
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
            <div>
              <label className={businessProfileStyles.label}>Business Name *</label>
              <input
                type="text"
                value={meta.businessName || ""}
                onChange={(e) => updateMeta("businessName", e.target.value)}
                className={businessProfileStyles.input}
                required
              />
            </div>
            <div>
              <label className={businessProfileStyles.label}>Email Address</label>
              <input
                type="email"
                value={meta.email || ""}
                onChange={(e) => updateMeta("email", e.target.value)}
                className={businessProfileStyles.input}
              />
            </div>
            <div>
              <label className={businessProfileStyles.label}>Phone Number</label>
              <input
                type="tel"
                value={meta.phone || ""}
                onChange={(e) => updateMeta("phone", e.target.value)}
                className={businessProfileStyles.input}
              />
            </div>
            <div>
              <label className={businessProfileStyles.label}>Location</label>
              <input
                type="text"
                value={meta.location || ""}
                onChange={(e) => updateMeta("location", e.target.value)}
                className={businessProfileStyles.input}
                placeholder="City, State, or Region"
              />
            </div>
            <div>
              <label className={businessProfileStyles.label}>Website</label>
              <input
                type="url"
                value={meta.website || ""}
                onChange={(e) => updateMeta("website", e.target.value)}
                className={businessProfileStyles.input}
                placeholder="https://example.com"
              />
            </div>
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

        {/* Legal & Footer Card */}
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

        {/* Logo Upload Card – fixed nested elements */}
        <div className={businessProfileStyles.cardContainer}>
          <div className={businessProfileStyles.cardHeaderContainer}>
            <div className={`${businessProfileStyles.cardIconContainer} ${businessProfileStyles.iconSecondary}`}>
              <UploadIcon className="w-5 h-5" />
            </div>
            <h2 className={businessProfileStyles.cardTitle}>Company Logo</h2>
          </div>
          <div className={businessProfileStyles.uploadArea}>
            {previews.logo ? (
              <div className={businessProfileStyles.imagePreviewContainer}>
                <div className={businessProfileStyles.logoPreview}>
                  <img src={previews.logo} alt="Logo preview" className="object-contain w-full h-full" />
                </div>
                <div className={businessProfileStyles.buttonGroup}>
                  <label className={businessProfileStyles.changeButton}>
                    <UploadIcon className="w-4 h-4" /> Change
                    <input type="file" accept="image/*" onChange={(e) => handleLocalFilePick("logo", e.target.files?.[0])} className="hidden" />
                  </label>
                  <button type="button" onClick={() => removeLocalFile("logo")} className={businessProfileStyles.removeButton}>
                    <DeleteIcon className="w-4 h-4" /> Remove
                  </button>
                </div>
              </div>
            ) : (
              <div className="cursor-pointer block" onClick={() => document.getElementById("logo-file-input").click()}>
                <div className={`${businessProfileStyles.imagePreviewContainer} ${businessProfileStyles.hoverScale}`}>
                  <div className={businessProfileStyles.uploadIconContainer}>
                    <UploadIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className={businessProfileStyles.uploadTextTitle}>Upload Logo</p>
                    <p className={businessProfileStyles.uploadTextSubtitle}>PNG, JPG up to 5MB</p>
                  </div>
                </div>
                <input
                  id="logo-file-input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleLocalFilePick("logo", e.target.files?.[0])}
                  className="hidden"
                />
              </div>
            )}
          </div>
        </div>

        {/* Stamp & Signature Card */}
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
              <div className={businessProfileStyles.uploadArea}>
                {previews.stamp ? (
                  <div className={businessProfileStyles.imagePreviewContainer}>
                    <div className={businessProfileStyles.stampPreview}>
                      <img src={previews.stamp} alt="Stamp preview" className="object-contain w-full h-full" />
                    </div>
                    <div className={businessProfileStyles.buttonGroup}>
                      <label className={businessProfileStyles.changeButton}>
                        <UploadIcon className="w-4 h-4" /> Change
                        <input type="file" accept="image/*" onChange={(e) => handleLocalFilePick("stamp", e.target.files?.[0])} className="hidden" />
                      </label>
                      <button type="button" onClick={() => removeLocalFile("stamp")} className={businessProfileStyles.removeButton}>
                        <DeleteIcon className="w-4 h-4" /> Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="cursor-pointer block" onClick={() => document.getElementById("stamp-file-input").click()}>
                    <div className={`${businessProfileStyles.imagePreviewContainer} ${businessProfileStyles.hoverScale}`}>
                      <div className={businessProfileStyles.uploadSmallIconContainer}>
                        <ImageIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className={businessProfileStyles.uploadTextTitle}>Upload Stamp</p>
                        <p className={businessProfileStyles.uploadTextSubtitle}>PNG with transparent background</p>
                      </div>
                    </div>
                    <input
                      id="stamp-file-input"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleLocalFilePick("stamp", e.target.files?.[0])}
                      className="hidden"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Signature */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Digital Signature</h3>
              <div className={businessProfileStyles.uploadArea}>
                {previews.signature ? (
                  <div className={businessProfileStyles.imagePreviewContainer}>
                    <div className={businessProfileStyles.signaturePreview}>
                      <img src={previews.signature} alt="Signature preview" className="object-contain w-full h-full" />
                    </div>
                    <div className={businessProfileStyles.buttonGroup}>
                      <label className={businessProfileStyles.changeButton}>
                        <UploadIcon className="w-4 h-4" /> Change
                        <input type="file" accept="image/*" onChange={(e) => handleLocalFilePick("signature", e.target.files?.[0])} className="hidden" />
                      </label>
                      <button type="button" onClick={() => removeLocalFile("signature")} className={businessProfileStyles.removeButton}>
                        <DeleteIcon className="w-4 h-4" /> Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="cursor-pointer block" onClick={() => document.getElementById("signature-file-input").click()}>
                    <div className={`${businessProfileStyles.imagePreviewContainer} ${businessProfileStyles.hoverScale}`}>
                      <div className={businessProfileStyles.uploadSmallIconContainer}>
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      </div>
                      <div>
                        <p className={businessProfileStyles.uploadTextTitle}>Upload Signature</p>
                        <p className={businessProfileStyles.uploadTextSubtitle}>PNG with transparent background</p>
                      </div>
                    </div>
                    <input
                      id="signature-file-input"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleLocalFilePick("signature", e.target.files?.[0])}
                      className="hidden"
                    />
                  </div>
                )}
              </div>

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

        {/* Form Actions */}
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