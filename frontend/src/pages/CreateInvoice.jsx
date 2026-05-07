import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import StatusBadge from "../components/StatusBadge";
import {
  createInvoiceStyles,
  createInvoiceIconColors,
  createInvoiceCustomStyles,
} from "../assets/dummyStyles";

/* ---------- API BASE from environment ---------- */
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

/* ---------- Helper: normalize image URLs (relative/localhost → API_BASE) ---------- */
function resolveImageUrl(url) {
  if (!url) return null;
  const s = String(url).trim();
  if (s.startsWith("data:") || s.startsWith("blob:")) return s;
  if (/^https?:\/\//i.test(s)) {
    try {
      const parsed = new URL(s);
      if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
        const path = parsed.pathname + (parsed.search || "") + (parsed.hash || "");
        return `${API_BASE.replace(/\/+$/, "")}${path}`;
      }
      return parsed.href;
    } catch {
      // fall through
    }
  }
  return `${API_BASE.replace(/\/+$/, "")}/${s.replace(/^\/+/, "")}`;
}

/* ---------- Local storage helpers (fallback) ---------- */
function readJSON(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function writeJSON(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {}
}
function getStoredInvoices() {
  return readJSON("invoices_v1", []);
}
function saveStoredInvoices(arr) {
  writeJSON("invoices_v1", arr);
}
function uid() {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  } catch {}
  return Math.random().toString(36).slice(2, 9);
}

/* ---------- Currency formatter (supports KES, USD, INR fallback) ---------- */
function currencyFmt(amount = 0, currency = "KES") {
  try {
    const n = Number(amount || 0);
    if (currency === "KES") {
      return new Intl.NumberFormat("en-KE", {
        style: "currency",
        currency: "KES",
        minimumFractionDigits: 2,
      }).format(n);
    }
    if (currency === "INR") {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
      }).format(n);
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(n);
  } catch {
    return `${currency} ${amount}`;
  }
}

function computeTotals(items = [], taxPercent = 0) {
  const safe = Array.isArray(items) ? items.filter(Boolean) : [];
  const subtotal = safe.reduce(
    (s, it) => s + Number(it.qty || 0) * Number(it.unitPrice || 0),
    0
  );
  const tax = (subtotal * Number(taxPercent || 0)) / 100;
  const total = subtotal + tax;
  return { subtotal, tax, total };
}

/* ---------- Icons (unchanged) ---------- */
const PreviewIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const SaveIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);
const UploadIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);
const DeleteIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);
const AddIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 5v14m-7-7h14" />
  </svg>
);

/* ---------- Main Component ---------- */
export default function CreateInvoice() {
  const navigate = useNavigate();
  const { id } = useParams();
  const loc = useLocation();
  const invoiceFromState = loc.state?.invoice || null;
  const isEditing = Boolean(id && id !== "new");

  const { getToken, isSignedIn, userId } = useAuth();

  const obtainToken = useCallback(async () => {
    if (typeof getToken !== "function") return null;
    try {
      let token = await getToken({ template: "default" }).catch(() => null);
      if (!token) token = await getToken({ forceRefresh: true }).catch(() => null);
      return token;
    } catch {
      return null;
    }
  }, [getToken]);

  function buildDefaultInvoice() {
    return {
      id: uid(),
      invoiceNumber: "",
      issueDate: new Date().toISOString().slice(0, 10),
      dueDate: "",
      fromBusinessName: "",
      fromEmail: "",
      fromAddress: "",
      fromPhone: "",
      fromGst: "",
      client: { name: "", email: "", address: "", phone: "" },
      items: [{ id: uid(), description: "Service / Item", qty: 1, unitPrice: 0 }],
      currency: "KES",      // changed to Kenyan Shilling
      status: "draft",
      stampDataUrl: null,
      signatureDataUrl: null,
      logoDataUrl: null,
      signatureName: "",
      signatureTitle: "",
      taxPercent: undefined,
      notes: "",
    };
  }

  const [invoice, setInvoice] = useState(() => buildDefaultInvoice());
  const [items, setItems] = useState(invoice.items);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);

  function updateInvoiceField(field, value) {
    setInvoice((inv) => (inv ? { ...inv, [field]: value } : inv));
  }
  function updateClient(field, value) {
    setInvoice((inv) =>
      inv ? { ...inv, client: { ...(inv.client || {}), [field]: value } } : inv
    );
  }
  function updateItem(idx, key, value) {
    setItems((arr) => {
      const copy = [...arr];
      const it = { ...copy[idx] };
      if (key === "description") it.description = value;
      else it[key] = Number(value) || 0;
      copy[idx] = it;
      setInvoice((inv) => (inv ? { ...inv, items: copy } : inv));
      return copy;
    });
  }
  function addItem() {
    const newItem = { id: uid(), description: "", qty: 1, unitPrice: 0 };
    setItems((arr) => {
      const next = [...arr, newItem];
      setInvoice((inv) => (inv ? { ...inv, items: next } : inv));
      return next;
    });
  }
  function removeItem(idx) {
    setItems((arr) => {
      const next = arr.filter((_, i) => i !== idx);
      setInvoice((inv) => (inv ? { ...inv, items: next } : inv));
      return next;
    });
  }
  function handleStatusChange(newStatus) {
    setInvoice((inv) => (inv ? { ...inv, status: newStatus } : inv));
  }
  function handleCurrencyChange(newCurrency) {
    setInvoice((inv) => (inv ? { ...inv, currency: newCurrency } : inv));
  }
  function handleImageUpload(file, kind = "logo") {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      setInvoice((inv) =>
        inv ? { ...inv, [`${kind}DataUrl`]: dataUrl } : inv
      );
    };
    reader.readAsDataURL(file);
  }
  function removeImage(kind = "logo") {
    setInvoice((inv) => (inv ? { ...inv, [`${kind}DataUrl`]: null } : inv));
  }

  const checkInvoiceExists = useCallback(async (candidate) => {
    const local = getStoredInvoices();
    if (local.some((x) => x?.invoiceNumber === candidate)) return true;
    try {
      const token = await obtainToken();
      const headers = { Accept: "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(
        `${API_BASE}/api/invoice?invoiceNumber=${encodeURIComponent(candidate)}`,
        { method: "GET", headers }
      );
      if (!res.ok) return false;
      const json = await res.json().catch(() => null);
      const data = json?.data || json || [];
      return Array.isArray(data) && data.length > 0;
    } catch {
      return false;
    }
  }, [obtainToken]);

  const generateUniqueInvoiceNumber = useCallback(async (attempts = 10) => {
    for (let i = 0; i < attempts; i++) {
      const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const rand = Math.floor(Math.random() * 9000) + 1000;
      const candidate = `INV-${datePart}-${rand}`;
      const exists = await checkInvoiceExists(candidate);
      if (!exists) return candidate;
    }
    return `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${uid().slice(0, 4)}`;
  }, [checkInvoiceExists]);

  // Fetch business profile using userId (not /me)
  useEffect(() => {
    let mounted = true;
    async function fetchBusinessProfile() {
      if (!isSignedIn || !userId) return;
      try {
        const token = await obtainToken();
        if (!token) return;
        const res = await fetch(`${API_BASE}/api/businessProfile/${userId}`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        });
        if (!res.ok) return;
        const json = await res.json().catch(() => null);
        const data = json?.data || json || null;
        if (!data || !mounted) return;

        const serverProfile = {
          businessName: data.businessName ?? "",
          email: data.email ?? "",
          address: data.address ?? "",
          phone: data.phone ?? "",
          gst: data.gst ?? "",
          defaultTaxPercent: data.defaultTaxPercent ?? 16, // Kenyan VAT is 16%
          signatureOwnerName: data.signatureOwnerName ?? "",
          signatureOwnerTitle: data.signatureOwnerTitle ?? "",
          logoUrl: data.logoUrl ?? null,
          stampUrl: data.stampUrl ?? null,
          signatureUrl: data.signatureUrl ?? null,
        };
        setProfile(serverProfile);

        setInvoice((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            fromBusinessName: prev.fromBusinessName?.trim() ? prev.fromBusinessName : serverProfile.businessName,
            fromEmail: prev.fromEmail?.trim() ? prev.fromEmail : serverProfile.email,
            fromAddress: prev.fromAddress?.trim() ? prev.fromAddress : serverProfile.address,
            fromPhone: prev.fromPhone?.trim() ? prev.fromPhone : serverProfile.phone,
            fromGst: prev.fromGst?.trim() ? prev.fromGst : serverProfile.gst,
            logoDataUrl: prev.logoDataUrl || resolveImageUrl(serverProfile.logoUrl) || null,
            stampDataUrl: prev.stampDataUrl || resolveImageUrl(serverProfile.stampUrl) || null,
            signatureDataUrl: prev.signatureDataUrl || resolveImageUrl(serverProfile.signatureUrl) || null,
            signatureName: prev.signatureName || serverProfile.signatureOwnerName,
            signatureTitle: prev.signatureTitle || serverProfile.signatureOwnerTitle,
            taxPercent: prev.taxPercent !== undefined && prev.taxPercent !== null ? prev.taxPercent : serverProfile.defaultTaxPercent,
          };
        });
      } catch (err) {
        console.warn("Failed to fetch business profile:", err);
      }
    }
    fetchBusinessProfile();
    return () => { mounted = false; };
  }, [isSignedIn, userId, obtainToken]);

  // Load invoice when editing
  useEffect(() => {
    let mounted = true;
    async function prepare() {
      if (invoiceFromState) {
        const base = { ...buildDefaultInvoice(), ...invoiceFromState };
        base.logoDataUrl = resolveImageUrl(base.logoDataUrl ?? base.logoUrl ?? base.logo) || null;
        base.stampDataUrl = resolveImageUrl(base.stampDataUrl ?? base.stampUrl ?? base.stamp) || null;
        base.signatureDataUrl = resolveImageUrl(base.signatureDataUrl ?? base.signatureUrl ?? base.signature) || null;
        setInvoice(base);
        setItems(Array.isArray(invoiceFromState.items) ? invoiceFromState.items.slice() : base.items);
        return;
      }
      if (isEditing && !invoiceFromState) {
        setLoading(true);
        try {
          const token = await obtainToken();
          const headers = { Accept: "application/json" };
          if (token) headers["Authorization"] = `Bearer ${token}`;
          const res = await fetch(`${API_BASE}/api/invoice/${id}`, { method: "GET", headers });
          if (res.ok) {
            const json = await res.json().catch(() => null);
            const data = json?.data || json || null;
            if (data && mounted) {
              const merged = { ...buildDefaultInvoice(), ...data };
              merged.id = data._id ?? data.id ?? merged.id;
              merged.invoiceNumber = data.invoiceNumber ?? merged.invoiceNumber;
              merged.logoDataUrl = resolveImageUrl(data.logoDataUrl ?? data.logoUrl ?? data.logo) || null;
              merged.stampDataUrl = resolveImageUrl(data.stampDataUrl ?? data.stampUrl ?? data.stamp) || null;
              merged.signatureDataUrl = resolveImageUrl(data.signatureDataUrl ?? data.signatureUrl ?? data.signature) || null;
              setInvoice(merged);
              setItems(Array.isArray(data.items) ? data.items.slice() : merged.items);
              setLoading(false);
              return;
            }
          }
        } catch (err) {
          console.warn("Server fetch failed, fallback to local", err);
        } finally {
          setLoading(false);
        }
        // fallback to local storage
        const all = getStoredInvoices();
        const found = all.find(x => x && (x.id === id || x._id === id || x.invoiceNumber === id));
        if (found && mounted) {
          const fixed = { ...buildDefaultInvoice(), ...found };
          fixed.logoDataUrl = resolveImageUrl(found.logoDataUrl ?? found.logoUrl ?? found.logo) || null;
          fixed.stampDataUrl = resolveImageUrl(found.stampDataUrl ?? found.stampUrl ?? found.stamp) || null;
          fixed.signatureDataUrl = resolveImageUrl(found.signatureDataUrl ?? found.signatureUrl ?? found.signature) || null;
          setInvoice(fixed);
          setItems(Array.isArray(found.items) ? found.items.slice() : fixed.items);
        }
        return;
      }
      // New invoice
      setInvoice((prev) => ({ ...buildDefaultInvoice(), ...prev }));
      setItems(buildDefaultInvoice().items);
      if (!isEditing) {
        try {
          const candidate = await generateUniqueInvoiceNumber(10);
          if (mounted) setInvoice((inv) => (inv ? { ...inv, invoiceNumber: candidate } : inv));
        } catch (err) {
          console.warn("Invoice number generation failed:", err);
        }
      }
    }
    prepare();
    return () => { mounted = false; };
  }, [id, invoiceFromState, isEditing, obtainToken, generateUniqueInvoiceNumber]);

  async function handleSave() {
    if (!invoice) return;
    setLoading(true);
    try {
      const prepared = {
        issueDate: invoice.issueDate || "",
        dueDate: invoice.dueDate || "",
        fromBusinessName: invoice.fromBusinessName || "",
        fromEmail: invoice.fromEmail || "",
        fromAddress: invoice.fromAddress || "",
        fromPhone: invoice.fromPhone || "",
        fromGst: invoice.fromGst || "",
        client: invoice.client || {},
        items: items || [],
        currency: invoice.currency || "KES",
        status: invoice.status || "draft",
        taxPercent: Number(invoice.taxPercent ?? 16),
        subtotal: computeTotals(items, invoice.taxPercent).subtotal,
        tax: computeTotals(items, invoice.taxPercent).tax,
        total: computeTotals(items, invoice.taxPercent).total,
        logoDataUrl: invoice.logoDataUrl || null,
        stampDataUrl: invoice.stampDataUrl || null,
        signatureDataUrl: invoice.signatureDataUrl || null,
        signatureName: invoice.signatureName || "",
        signatureTitle: invoice.signatureTitle || "",
        notes: invoice.notes || "",
        localId: invoice.id,
      };
      if (invoice.invoiceNumber?.trim()) {
        prepared.invoiceNumber = invoice.invoiceNumber.trim();
      }

      const endpoint = isEditing && invoice.id ? `${API_BASE}/api/invoice/${invoice.id}` : `${API_BASE}/api/invoice`;
      const method = isEditing && invoice.id ? "PUT" : "POST";
      const token = await obtainToken();
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(endpoint, { method, headers, body: JSON.stringify(prepared) });
      if (res.status === 409) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.message || "Invoice number already exists.");
      }
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message || `Save failed (${res.status})`);

      const saved = json?.data || json || null;
      const savedId = saved?._id ?? saved?.id ?? invoice.id;
      const merged = {
        ...prepared,
        id: savedId,
        invoiceNumber: saved?.invoiceNumber ?? prepared.invoiceNumber ?? invoice.invoiceNumber,
        subtotal: saved?.subtotal ?? prepared.subtotal,
        tax: saved?.tax ?? prepared.tax,
        total: saved?.total ?? prepared.total,
      };
      setInvoice((inv) => ({ ...inv, ...merged }));
      setItems(Array.isArray(saved?.items) ? saved.items : items);

      const all = getStoredInvoices();
      if (isEditing) {
        const idx = all.findIndex(x => x && (x.id === invoice.id || x._id === invoice.id || x.invoiceNumber === invoice.invoiceNumber));
        if (idx >= 0) all[idx] = merged;
        else all.unshift(merged);
      } else {
        all.unshift(merged);
      }
      saveStoredInvoices(all);

      alert(`Invoice ${isEditing ? "updated" : "created"} successfully.`);
      navigate("/app/invoices");
    } catch (err) {
      console.error("Save failed:", err);
      if (err.message?.toLowerCase().includes("invoice number")) {
        alert(err.message);
        setLoading(false);
        return;
      }
      // fallback localStorage
      try {
        const all = getStoredInvoices();
        const localCopy = { ...invoice, items, subtotal: computeTotals(items, invoice.taxPercent).subtotal, tax: computeTotals(items, invoice.taxPercent).tax, total: computeTotals(items, invoice.taxPercent).total };
        if (isEditing) {
          const idx = all.findIndex(x => x && (x.id === invoice.id || x._id === invoice.id || x.invoiceNumber === invoice.invoiceNumber));
          if (idx >= 0) all[idx] = localCopy;
          else all.unshift(localCopy);
        } else {
          all.unshift(localCopy);
        }
        saveStoredInvoices(all);
        alert("Saved locally as fallback (server error).");
        navigate("/app/invoices");
      } catch (localErr) {
        console.error(localErr);
        alert(err?.message || "Save failed.");
      }
    } finally {
      setLoading(false);
    }
  }

  function handlePreview() {
    const prepared = {
      ...invoice,
      items,
      subtotal: computeTotals(items, invoice.taxPercent).subtotal,
      tax: computeTotals(items, invoice.taxPercent).tax,
      total: computeTotals(items, invoice.taxPercent).total,
    };
    navigate(`/app/invoices/${invoice.id}/preview`, { state: { invoice: prepared } });
  }

  const totals = computeTotals(items, invoice?.taxPercent ?? 16);

  // JSX (simplified – same structure as original, only currency options changed to KES/USD)
  return (
    <div className={createInvoiceStyles.pageContainer}>
      {/* Header */}
      <div className={createInvoiceStyles.headerContainer}>
        <div>
          <h1 className={createInvoiceStyles.headerTitle}>{isEditing ? "Edit Invoice" : "Create New Invoice"}</h1>
          <p className={createInvoiceStyles.headerSubtitle}>{isEditing ? "Update invoice details" : "Fill in invoice details"}</p>
        </div>
        <div className={createInvoiceStyles.headerButtonContainer}>
          <button onClick={handlePreview} className={createInvoiceStyles.previewButton}><PreviewIcon className="w-4 h-4" /> Preview</button>
          <button onClick={handleSave} disabled={loading} className={createInvoiceStyles.saveButton}><SaveIcon className="w-4 h-4" /> {loading ? "Saving..." : (isEditing ? "Update Invoice" : "Create Invoice")}</button>
        </div>
      </div>

      {/* Invoice Details */}
      <div className={createInvoiceStyles.cardContainer}>
        <div className={createInvoiceStyles.cardHeaderContainer}>
          <div className={`${createInvoiceStyles.cardIconContainer} ${createInvoiceIconColors.invoice}`}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
          </div>
          <h2 className={createInvoiceStyles.cardTitle}>Invoice Details</h2>
        </div>
        <div className={createInvoiceStyles.gridCols3}>
          <div><label className={createInvoiceStyles.label}>Invoice Number</label><input value={invoice?.invoiceNumber || ""} onChange={(e) => updateInvoiceField("invoiceNumber", e.target.value)} className={createInvoiceStyles.inputMedium} /></div>
          <div><label className={createInvoiceStyles.label}>Invoice Date</label><input type="date" value={invoice?.issueDate || ""} onChange={(e) => updateInvoiceField("issueDate", e.target.value)} className={createInvoiceStyles.input} /></div>
          <div><label className={createInvoiceStyles.label}>Due Date</label><input type="date" value={invoice?.dueDate || ""} onChange={(e) => updateInvoiceField("dueDate", e.target.value)} className={createInvoiceStyles.input} /></div>
        </div>
        <div className={createInvoiceStyles.currencyStatusGrid}>
          <div>
            <label className={createInvoiceStyles.labelWithMargin}>Currency</label>
            <div className={createInvoiceStyles.currencyContainer}>
              <button onClick={() => handleCurrencyChange("KES")} className={`${createInvoiceStyles.currencyButton} ${invoice.currency === "KES" ? createInvoiceStyles.currencyButtonActive1 : createInvoiceStyles.currencyButtonInactive}`}>
                <span className={createInvoiceCustomStyles.currencySymbol}>KSh</span>
                <div className="text-left"><div className="font-medium">Kenyan Shilling</div><div className="text-xs opacity-70">KES</div></div>
              </button>
              <button onClick={() => handleCurrencyChange("USD")} className={`${createInvoiceStyles.currencyButton} ${invoice.currency === "USD" ? createInvoiceStyles.currencyButtonActive2 : createInvoiceStyles.currencyButtonInactive}`}>
                <span className={createInvoiceCustomStyles.currencySymbol}>$</span>
                <div className="text-left"><div className="font-medium">US Dollar</div><div className="text-xs opacity-70">USD</div></div>
              </button>
            </div>
          </div>
          <div>
            <label className={createInvoiceStyles.labelWithMargin}>Status</label>
            <div className={createInvoiceStyles.statusContainer}>
              {["draft", "unpaid", "paid", "overdue"].map((s) => (
                <button key={s} onClick={() => handleStatusChange(s)} className={`${createInvoiceStyles.statusButton} ${invoice.status === s ? createInvoiceStyles.statusButtonActive : createInvoiceStyles.statusButtonInactive}`}>
                  <StatusBadge status={s.charAt(0).toUpperCase() + s.slice(1)} size="default" showIcon />
                </button>
              ))}
            </div>
            <div className={createInvoiceStyles.statusDropdown}>
              <select value={invoice.status} onChange={(e) => handleStatusChange(e.target.value)} className="w-full">
                <option value="draft">Draft</option><option value="unpaid">Unpaid</option><option value="paid">Paid</option><option value="overdue">Overdue</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid (Bill From, Bill To, Items, Right Panel) – same as original, only currency display uses new formatter */}
      <div className={createInvoiceStyles.mainGrid}>
        <div className={createInvoiceStyles.leftColumn}>
          {/* Bill From */}
          <div className={createInvoiceStyles.cardContainer}>
            <div className={createInvoiceStyles.cardHeaderWithButton}>
              <div className={createInvoiceStyles.cardHeaderLeft}>
                <div className={`${createInvoiceStyles.cardIconContainer} ${createInvoiceIconColors.billFrom}`}>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                </div>
                <h3 className={createInvoiceStyles.cardTitle}>Bill From</h3>
              </div>
            </div>
            <div className={createInvoiceStyles.gridCols2}>
              <div><label className={createInvoiceStyles.label}>Business Name</label><input value={invoice?.fromBusinessName ?? ""} onChange={(e) => updateInvoiceField("fromBusinessName", e.target.value)} placeholder="Your Business Name" className={createInvoiceStyles.input} /></div>
              <div><label className={createInvoiceStyles.label}>Email</label><input value={invoice?.fromEmail ?? ""} onChange={(e) => updateInvoiceField("fromEmail", e.target.value)} placeholder="business@email.com" className={createInvoiceStyles.input} /></div>
              <div className={createInvoiceStyles.gridColSpan2}><label className={createInvoiceStyles.label}>Address</label><textarea value={invoice?.fromAddress ?? ""} onChange={(e) => updateInvoiceField("fromAddress", e.target.value)} placeholder="Business Address" rows={3} className={createInvoiceStyles.textarea} /></div>
              <div><label className={createInvoiceStyles.label}>Phone</label><input value={invoice?.fromPhone ?? ""} onChange={(e) => updateInvoiceField("fromPhone", e.target.value)} placeholder="+254 700 123456" className={createInvoiceStyles.input} /></div>
              <div><label className={createInvoiceStyles.label}>Tax ID / PIN</label><input value={invoice?.fromGst ?? ""} onChange={(e) => updateInvoiceField("fromGst", e.target.value)} placeholder="KRA PIN" className={createInvoiceStyles.input} /></div>
            </div>
          </div>

          {/* Bill To – unchanged */}
          <div className={createInvoiceStyles.cardContainer}>
            <div className={createInvoiceStyles.cardHeaderContainer}>
              <div className={`${createInvoiceStyles.cardIconContainer} ${createInvoiceIconColors.billTo}`}>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
              </div>
              <h3 className={createInvoiceStyles.cardTitle}>Bill To</h3>
            </div>
            <div className={createInvoiceStyles.gridCols2}>
              <div><label className={createInvoiceStyles.label}>Client Name</label><input value={invoice?.client?.name || ""} onChange={(e) => updateClient("name", e.target.value)} placeholder="Client Name" className={createInvoiceStyles.input} /></div>
              <div><label className={createInvoiceStyles.label}>Client Email</label><input value={invoice?.client?.email || ""} onChange={(e) => updateClient("email", e.target.value)} placeholder="client@email.com" className={createInvoiceStyles.input} /></div>
              <div className={createInvoiceStyles.gridColSpan2}><label className={createInvoiceStyles.label}>Client Address</label><textarea value={invoice?.client?.address || ""} onChange={(e) => updateClient("address", e.target.value)} placeholder="Client Address" rows={3} className={createInvoiceStyles.textarea} /></div>
              <div><label className={createInvoiceStyles.label}>Client Phone</label><input value={invoice?.client?.phone || ""} onChange={(e) => updateClient("phone", e.target.value)} placeholder="+254 700 123456" className={createInvoiceStyles.input} /></div>
            </div>
          </div>

          {/* Items – unchanged but uses currencyFmt with KES */}
          <div className={createInvoiceStyles.cardContainer}>
            <div className={createInvoiceStyles.cardHeaderWithButton}>
              <div className={createInvoiceStyles.cardHeaderLeft}>
                <div className={createInvoiceStyles.cardIconContainer}>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="12" y1="8" x2="12" y2="16" /></svg>
                </div>
                <h3 className={createInvoiceStyles.cardTitle}>Items & Services</h3>
              </div>
              <div className={createInvoiceStyles.currencyBadge}>All amounts in {invoice.currency}</div>
            </div>

            <div className={createInvoiceStyles.itemsListWrapper}>
              {items.map((it, idx) => {
                const totalValue = Number(it?.qty || 0) * Number(it?.unitPrice || 0);
                return (
                  <div key={it?.id ?? idx} className={`${createInvoiceStyles.itemsTableRow} ${createInvoiceStyles.itemRow}`}>
                    <div className={createInvoiceStyles.itemColDescription}>
                      <label className={createInvoiceStyles.itemsFieldLabel} htmlFor={`desc-${idx}`}>Description</label>
                      <input id={`desc-${idx}`} className={createInvoiceStyles.itemsInput} value={it?.description ?? ""} onChange={(e) => updateItem(idx, "description", e.target.value)} placeholder="Item description" />
                    </div>
                    <div className={createInvoiceStyles.itemColQuantity}>
                      <label className={createInvoiceStyles.itemsFieldLabel} htmlFor={`qty-${idx}`}>Quantity</label>
                      <input id={`qty-${idx}`} type="text" inputMode="numeric" className={createInvoiceStyles.itemsNumberInput} value={String(it?.qty ?? "")} onChange={(e) => updateItem(idx, "qty", e.target.value)} />
                    </div>
                    <div className={createInvoiceStyles.itemColUnitPrice}>
                      <label className={createInvoiceStyles.itemsFieldLabel} htmlFor={`price-${idx}`}>Unit Price</label>
                      <input id={`price-${idx}`} type="text" inputMode="decimal" className={createInvoiceStyles.itemsNumberInput} value={String(it?.unitPrice ?? "")} onChange={(e) => updateItem(idx, "unitPrice", e.target.value)} />
                    </div>
                    <div className={createInvoiceStyles.itemColTotal}>
                      <label className={createInvoiceStyles.itemsFieldLabel}>Total</label>
                      <div className={createInvoiceStyles.itemsTotal}>{currencyFmt(totalValue, invoice.currency)}</div>
                    </div>
                    <div className={createInvoiceStyles.itemColRemove}>
                      <button type="button" onClick={() => removeItem(idx)} className={createInvoiceStyles.itemsRemoveButton}><DeleteIcon className="w-4 h-4" /></button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6"><button onClick={addItem} className={createInvoiceStyles.addItemButton}><AddIcon className="w-4 h-4" /> Add Item</button></div>
          </div>
        </div>

        <div className={createInvoiceStyles.rightColumn}>
          {/* Branding */}
          <div className={createInvoiceStyles.cardSmallContainer}>
            <h3 className={createInvoiceStyles.cardSubtitle}>Branding</h3>
            <div className="space-y-4">
              <div>
                <label className={createInvoiceStyles.label}>Company Logo</label>
                <div className={createInvoiceStyles.uploadSmallArea}>
                  {invoice?.logoDataUrl ? (
                    <div className={createInvoiceStyles.imagePreviewContainer}>
                      <div className={createInvoiceStyles.logoPreview}><img src={invoice.logoDataUrl} alt="logo" className="object-contain w-full h-full" onError={(e) => e.currentTarget.style.display = "none"} /></div>
                      <div className={createInvoiceStyles.buttonGroup}>
                        <label className={createInvoiceStyles.changeButton}><UploadIcon className="w-4 h-4" /> Change<input type="file" accept="image/*" onChange={(e) => handleImageUpload(e.target.files?.[0], "logo")} className="hidden" /></label>
                        <button onClick={() => removeImage("logo")} className={createInvoiceStyles.removeButton}><DeleteIcon className="w-4 h-4" /> Remove</button>
                      </div>
                    </div>
                  ) : (
                    <label className="cursor-pointer block">
                      <div className={`${createInvoiceStyles.imagePreviewContainer} ${createInvoiceStyles.hoverScale}`}>
                        <div className={createInvoiceStyles.uploadIconContainer}><UploadIcon className="w-5 h-5" /></div>
                        <div><p className={createInvoiceStyles.uploadTextTitle}>Upload Logo</p><p className={createInvoiceStyles.uploadTextSubtitle}>PNG, JPG up to 5MB</p></div>
                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e.target.files?.[0], "logo")} className="hidden" />
                      </div>
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Summary & Tax */}
          <div className={createInvoiceStyles.cardSmallContainer}>
            <h3 className={createInvoiceStyles.cardSubtitle}>Summary & Tax</h3>
            <div className="space-y-4">
              <div className={createInvoiceStyles.summaryRow}><div className={createInvoiceStyles.summaryLabel}>Subtotal</div><div className={createInvoiceStyles.summaryValue}>{currencyFmt(totals.subtotal, invoice.currency)}</div></div>
              <div className="space-y-3">
                <div><label className={createInvoiceStyles.label}>Tax Percentage (VAT)</label><input type="number" value={invoice.taxPercent ?? 16} onChange={(e) => updateInvoiceField("taxPercent", Number(e.target.value || 0))} className={createInvoiceStyles.inputCenter} min="0" max="100" step="0.1" /></div>
                <div className={createInvoiceStyles.taxRow}><div className="text-sm text-gray-600">Tax Amount</div><div className="font-medium text-gray-900">{currencyFmt(totals.tax, invoice.currency)}</div></div>
              </div>
              <div className={createInvoiceStyles.totalRow}><div className={createInvoiceStyles.totalLabel}>Total</div><div className={createInvoiceStyles.totalValue}>{currencyFmt(totals.total, invoice.currency)}</div></div>
            </div>
          </div>

          {/* Stamp & Signature – unchanged */}
          <div className={createInvoiceStyles.cardSmallContainer}>
            <h3 className={createInvoiceStyles.cardSubtitle}>Stamp & Signature</h3>
            <div className="space-y-6">
              <div>
                <label className={createInvoiceStyles.label}>Digital Stamp</label>
                <div className={createInvoiceStyles.uploadSmallArea}>
                  {invoice.stampDataUrl ? (
                    <div className={createInvoiceStyles.imagePreviewContainer}>
                      <div className={createInvoiceStyles.stampPreview}><img src={invoice.stampDataUrl} alt="stamp" className="object-contain w-full h-full" onError={(e) => e.currentTarget.style.display = "none"} /></div>
                      <div className={createInvoiceStyles.buttonGroup}>
                        <label className={createInvoiceStyles.changeButton}><UploadIcon className="w-4 h-4" /> Change<input type="file" accept="image/*" onChange={(e) => handleImageUpload(e.target.files?.[0], "stamp")} className="hidden" /></label>
                        <button onClick={() => removeImage("stamp")} className={createInvoiceStyles.removeButton}><DeleteIcon className="w-4 h-4" /> Remove</button>
                      </div>
                    </div>
                  ) : (
                    <label className="cursor-pointer block">
                      <div className={`${createInvoiceStyles.imagePreviewContainer} ${createInvoiceStyles.hoverScale}`}>
                        <div className={createInvoiceStyles.uploadSmallIconContainer}><UploadIcon className="w-4 h-4" /></div>
                        <div><p className={createInvoiceStyles.uploadTextTitle}>Upload Stamp</p><p className={createInvoiceStyles.uploadTextSubtitle}>PNG with transparency</p></div>
                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e.target.files?.[0], "stamp")} className="hidden" />
                      </div>
                    </label>
                  )}
                </div>
              </div>
              <div>
                <label className={createInvoiceStyles.label}>Digital Signature</label>
                <div className={createInvoiceStyles.uploadSmallArea}>
                  {invoice.signatureDataUrl ? (
                    <div className={createInvoiceStyles.imagePreviewContainer}>
                      <div className={createInvoiceStyles.signaturePreview}><img src={invoice.signatureDataUrl} alt="signature" className="object-contain w-full h-full" onError={(e) => e.currentTarget.style.display = "none"} /></div>
                      <div className={createInvoiceStyles.buttonGroup}>
                        <label className={createInvoiceStyles.changeButton}><UploadIcon className="w-4 h-4" /> Change<input type="file" accept="image/*" onChange={(e) => handleImageUpload(e.target.files?.[0], "signature")} className="hidden" /></label>
                        <button onClick={() => removeImage("signature")} className={createInvoiceStyles.removeButton}><DeleteIcon className="w-4 h-4" /> Remove</button>
                      </div>
                    </div>
                  ) : (
                    <label className="cursor-pointer block">
                      <div className={`${createInvoiceStyles.imagePreviewContainer} ${createInvoiceStyles.hoverScale}`}>
                        <div className={createInvoiceStyles.uploadSmallIconContainer}><UploadIcon className="w-4 h-4" /></div>
                        <div><p className={createInvoiceStyles.uploadTextTitle}>Upload Signature</p><p className={createInvoiceStyles.uploadTextSubtitle}>PNG with transparency</p></div>
                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e.target.files?.[0], "signature")} className="hidden" />
                      </div>
                    </label>
                  )}
                </div>
                <div className="mt-4 space-y-3">
                  <div><label className={createInvoiceStyles.label}>Signature Owner Name</label><input placeholder="John Doe" value={invoice.signatureName || ""} onChange={(e) => updateInvoiceField("signatureName", e.target.value)} className={`${createInvoiceStyles.inputSmall} ${createInvoiceCustomStyles.inputPlaceholder}`} /></div>
                  <div><label className={createInvoiceStyles.label}>Signature Title</label><input placeholder="Director / CEO" value={invoice.signatureTitle || ""} onChange={(e) => updateInvoiceField("signatureTitle", e.target.value)} className={`${createInvoiceStyles.inputSmall} ${createInvoiceCustomStyles.inputPlaceholder}`} /></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}