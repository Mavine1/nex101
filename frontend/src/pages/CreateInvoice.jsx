import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import Swal from "sweetalert2";
import StatusBadge from "../components/StatusBadge";
import GeminiIcon from "../components/GeminiIcon"; // <-- import GeminiIcon
import {
  createInvoiceStyles,
  createInvoiceIconColors,
} from "../assets/dummyStyles";
import { invoicesStyles } from "../assets/dummyStyles"; // <-- for AI button style

// Injected inline CSS for the AI modal (tiny)
const injectAIModalStyles = () => {
  if (document.getElementById("ai-modal-styles")) return;
  const style = document.createElement("style");
  style.id = "ai-modal-styles";
  style.innerHTML = `
    .ai-modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .ai-modal-content {
      background: white;
      border-radius: 1rem;
      padding: 1.5rem;
      max-width: 500px;
      width: 90%;
      box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
    }
  `;
  document.head.appendChild(style);
};

function resolveImageUrl(url) {
  if (!url) return null;
  const s = String(url).trim();
  if (s.startsWith("data:") || s.startsWith("blob:")) return s;
  if (/^https?:\/\//i.test(s)) {
    try {
      const parsed = new URL(s);
      return parsed.href;
    } catch {
      // fall through
    }
  }
  return s.startsWith("/") ? s : `/${s}`;
}

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

export default function CreateInvoice() {
  injectAIModalStyles();

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
      fromLocation: "",
      client: { name: "", email: "", address: "", phone: "" },
      items: [{ id: uid(), description: "Service / Item", qty: 1, unitPrice: 0 }],
      currency: "KES",
      status: "draft",
      taxPercent: 16,
      notes: "",
    };
  }

  const [invoice, setInvoice] = useState(() => buildDefaultInvoice());
  const [items, setItems] = useState(invoice.items);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);

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

  const checkInvoiceExists = useCallback(async (candidate) => {
    const local = getStoredInvoices();
    if (local.some((x) => x?.invoiceNumber === candidate)) return true;
    try {
      const token = await obtainToken();
      const headers = { Accept: "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`/api/invoice?invoiceNumber=${encodeURIComponent(candidate)}`, {
        method: "GET",
        headers,
      });
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

  // Fetch business profile
  useEffect(() => {
    let mounted = true;
    async function fetchBusinessProfile() {
      if (!isSignedIn || !userId) return;
      try {
        const token = await obtainToken();
        if (!token) return;
        const res = await fetch("/api/businessProfile/me", {
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
          location: data.location ?? "",
          defaultTaxPercent: data.defaultTaxPercent ?? 16,
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
            fromBusinessName: serverProfile.businessName,
            fromEmail: serverProfile.email,
            fromAddress: serverProfile.address,
            fromPhone: serverProfile.phone,
            fromLocation: serverProfile.location,
            taxPercent: serverProfile.defaultTaxPercent,
            signatureName: serverProfile.signatureOwnerName,
            signatureTitle: serverProfile.signatureOwnerTitle,
            logoDataUrl: prev.logoDataUrl || resolveImageUrl(serverProfile.logoUrl) || null,
            stampDataUrl: prev.stampDataUrl || resolveImageUrl(serverProfile.stampUrl) || null,
            signatureDataUrl: prev.signatureDataUrl || resolveImageUrl(serverProfile.signatureUrl) || null,
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
          const res = await fetch(`/api/invoice/${id}`, { method: "GET", headers });
          if (res.ok) {
            const json = await res.json().catch(() => null);
            const data = json?.data || json || null;
            if (data && mounted) {
              const merged = { ...buildDefaultInvoice(), ...data };
              merged.id = data._id ?? data.id ?? merged.id;
              merged.invoiceNumber = data.invoiceNumber ?? merged.invoiceNumber;
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
        const all = getStoredInvoices();
        const found = all.find(x => x && (x.id === id || x._id === id || x.invoiceNumber === id));
        if (found && mounted) {
          const fixed = { ...buildDefaultInvoice(), ...found };
          setInvoice(fixed);
          setItems(Array.isArray(found.items) ? found.items.slice() : fixed.items);
        }
        return;
      }
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
        invoiceNumber: invoice.invoiceNumber,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        fromBusinessName: invoice.fromBusinessName,
        fromEmail: invoice.fromEmail,
        fromAddress: invoice.fromAddress,
        fromPhone: invoice.fromPhone,
        fromLocation: invoice.fromLocation,
        client: invoice.client,
        items: items,
        currency: invoice.currency || "KES",
        status: invoice.status,
        taxPercent: invoice.taxPercent,
        subtotal: computeTotals(items, invoice.taxPercent).subtotal,
        tax: computeTotals(items, invoice.taxPercent).tax,
        total: computeTotals(items, invoice.taxPercent).total,
        signatureName: invoice.signatureName,
        signatureTitle: invoice.signatureTitle,
        logoDataUrl: invoice.logoDataUrl || null,
        stampDataUrl: invoice.stampDataUrl || null,
        signatureDataUrl: invoice.signatureDataUrl || null,
      };

      const endpoint = isEditing && invoice.id ? `/api/invoice/${invoice.id}` : "/api/invoice";
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

      Swal.fire({
        icon: "success",
        title: "Saved!",
        text: `Invoice ${isEditing ? "updated" : "created"} successfully.`,
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
      });

      navigate("/app/invoices");
    } catch (err) {
      console.error("Save failed:", err);
      Swal.fire({
        icon: "error",
        title: "Save Failed",
        text: err.message || "An error occurred while saving.",
        confirmButtonColor: "#D0005E",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateWithAI() {
    if (!aiPrompt.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Empty prompt",
        text: "Please describe the invoice you want to create.",
        toast: true,
        position: "top-end",
      });
      return;
    }
    setAiGenerating(true);
    try {
      const token = await obtainToken();
      const res = await fetch("/api/ai-invoice/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ prompt: aiPrompt }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "AI generation failed");
      const aiData = json.data;
      setInvoice(prev => ({
        ...prev,
        invoiceNumber: aiData.invoiceNumber || prev.invoiceNumber,
        issueDate: aiData.issueDate || prev.issueDate,
        dueDate: aiData.dueDate || prev.dueDate,
        client: { ...prev.client, ...aiData.client },
        items: aiData.items && aiData.items.length ? aiData.items : prev.items,
        taxPercent: aiData.taxPercent || prev.taxPercent,
        currency: aiData.currency || prev.currency,
        status: aiData.status || prev.status,
      }));
      setItems(aiData.items && aiData.items.length ? aiData.items : items);
      Swal.fire({
        icon: "success",
        title: "AI Generated!",
        text: "Invoice details have been filled.",
        toast: true,
        position: "top-end",
        timer: 2000,
      });
      setAiModalOpen(false);
      setAiPrompt("");
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "AI Failed",
        text: err.message,
        confirmButtonColor: "#D0005E",
      });
    } finally {
      setAiGenerating(false);
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

  if (loading && isEditing) {
    return <div className="p-6">Loading invoice...</div>;
  }

  return (
    <div className={createInvoiceStyles.pageContainer}>
      {/* Header with AI button (same style as Invoices page) */}
      <div className={createInvoiceStyles.headerContainer}>
        <div>
          <h1 className={createInvoiceStyles.headerTitle}>{isEditing ? "Edit Invoice" : "Create New Invoice"}</h1>
          <p className={createInvoiceStyles.headerSubtitle}>{isEditing ? "Update invoice details" : "Fill in invoice details"}</p>
        </div>
        <div className={createInvoiceStyles.headerButtonContainer}>
          <button
            type="button"
            onClick={() => setAiModalOpen(true)}
            className={invoicesStyles.aiButton}   // <-- using invoicesStyles for consistency
          >
            <GeminiIcon className="w-6 h-6 group-hover:scale-110 transition-transform flex-none" />
            Create with AI
          </button>
          <button onClick={handlePreview} className={createInvoiceStyles.previewButton}>
            <PreviewIcon className="w-4 h-4" /> Preview
          </button>
        </div>
      </div>

      {/* Invoice Details Card */}
      <div className={createInvoiceStyles.cardContainer}>
        <div className={createInvoiceStyles.cardHeaderContainer}>
          <div className={`${createInvoiceStyles.cardIconContainer} ${createInvoiceIconColors.invoice}`}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <h2 className={createInvoiceStyles.cardTitle}>Invoice Details</h2>
        </div>
        <div className={createInvoiceStyles.gridCols3}>
          <div>
            <label className={createInvoiceStyles.label}>Invoice Number</label>
            <input
              value={invoice?.invoiceNumber || ""}
              onChange={(e) => updateInvoiceField("invoiceNumber", e.target.value)}
              className={createInvoiceStyles.inputMedium}
            />
          </div>
          <div>
            <label className={createInvoiceStyles.label}>Invoice Date</label>
            <input
              type="date"
              value={invoice?.issueDate || ""}
              onChange={(e) => updateInvoiceField("issueDate", e.target.value)}
              className={createInvoiceStyles.input}
            />
          </div>
          <div>
            <label className={createInvoiceStyles.label}>Due Date</label>
            <input
              type="date"
              value={invoice?.dueDate || ""}
              onChange={(e) => updateInvoiceField("dueDate", e.target.value)}
              className={createInvoiceStyles.input}
            />
          </div>
        </div>
        <div className="mt-4">
          <label className={createInvoiceStyles.labelWithMargin}>Status</label>
          <div className={createInvoiceStyles.statusContainer}>
            {["draft", "unpaid", "paid", "overdue"].map((s) => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                className={`${createInvoiceStyles.statusButton} ${
                  invoice.status === s ? createInvoiceStyles.statusButtonActive : createInvoiceStyles.statusButtonInactive
                }`}
              >
                <StatusBadge status={s.charAt(0).toUpperCase() + s.slice(1)} size="default" showIcon />
              </button>
            ))}
          </div>
          <div className={createInvoiceStyles.statusDropdown}>
            <select value={invoice.status} onChange={(e) => handleStatusChange(e.target.value)} className="w-full">
              <option value="draft">Draft</option>
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>
      </div>

      {/* Single Column – Bill To + Items (full width, no right column summary) */}
      <div className={createInvoiceStyles.mainGrid}>
        <div className={createInvoiceStyles.leftColumn}>
          {/* Bill To */}
          <div className={createInvoiceStyles.cardContainer}>
            <div className={createInvoiceStyles.cardHeaderContainer}>
              <div className={`${createInvoiceStyles.cardIconContainer} ${createInvoiceIconColors.billTo}`}>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <h3 className={createInvoiceStyles.cardTitle}>Bill To</h3>
            </div>
            <div className={createInvoiceStyles.gridCols2}>
              <div>
                <label className={createInvoiceStyles.label}>Client Name</label>
                <input
                  value={invoice?.client?.name || ""}
                  onChange={(e) => updateClient("name", e.target.value)}
                  placeholder="Client Name"
                  className={createInvoiceStyles.input}
                />
              </div>
              <div>
                <label className={createInvoiceStyles.label}>Client Email</label>
                <input
                  value={invoice?.client?.email || ""}
                  onChange={(e) => updateClient("email", e.target.value)}
                  placeholder="client@email.com"
                  className={createInvoiceStyles.input}
                />
              </div>
              <div className={createInvoiceStyles.gridColSpan2}>
                <label className={createInvoiceStyles.label}>Client Address</label>
                <textarea
                  value={invoice?.client?.address || ""}
                  onChange={(e) => updateClient("address", e.target.value)}
                  placeholder="Client Address"
                  rows={3}
                  className={createInvoiceStyles.textarea}
                />
              </div>
              <div>
                <label className={createInvoiceStyles.label}>Client Phone</label>
                <input
                  value={invoice?.client?.phone || ""}
                  onChange={(e) => updateClient("phone", e.target.value)}
                  placeholder="+254 700 123456"
                  className={createInvoiceStyles.input}
                />
              </div>
            </div>
          </div>

          {/* Items */}
          <div className={createInvoiceStyles.cardContainer}>
            <div className={createInvoiceStyles.cardHeaderWithButton}>
              <div className={createInvoiceStyles.cardHeaderLeft}>
                <div className={createInvoiceStyles.cardIconContainer}>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                  </svg>
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
                      <input
                        id={`desc-${idx}`}
                        className={createInvoiceStyles.itemsInput}
                        value={it?.description ?? ""}
                        onChange={(e) => updateItem(idx, "description", e.target.value)}
                        placeholder="Item description"
                      />
                    </div>
                    <div className={createInvoiceStyles.itemColQuantity}>
                      <label className={createInvoiceStyles.itemsFieldLabel} htmlFor={`qty-${idx}`}>Quantity</label>
                      <input
                        id={`qty-${idx}`}
                        type="text"
                        inputMode="numeric"
                        className={createInvoiceStyles.itemsNumberInput}
                        value={String(it?.qty ?? "")}
                        onChange={(e) => updateItem(idx, "qty", e.target.value)}
                      />
                    </div>
                    <div className={createInvoiceStyles.itemColUnitPrice}>
                      <label className={createInvoiceStyles.itemsFieldLabel} htmlFor={`price-${idx}`}>Unit Price</label>
                      <input
                        id={`price-${idx}`}
                        type="text"
                        inputMode="decimal"
                        className={createInvoiceStyles.itemsNumberInput}
                        value={String(it?.unitPrice ?? "")}
                        onChange={(e) => updateItem(idx, "unitPrice", e.target.value)}
                      />
                    </div>
                    <div className={createInvoiceStyles.itemColTotal}>
                      <label className={createInvoiceStyles.itemsFieldLabel}>Total</label>
                      <div className={createInvoiceStyles.itemsTotal}>{currencyFmt(totalValue, invoice.currency)}</div>
                    </div>
                    <div className={createInvoiceStyles.itemColRemove}>
                      <button type="button" onClick={() => removeItem(idx)} className={createInvoiceStyles.itemsRemoveButton}>
                        <DeleteIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6">
              <button onClick={addItem} className={createInvoiceStyles.addItemButton}>
                <AddIcon className="w-4 h-4" /> Add Item
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Save button at the bottom */}
      <div className="flex justify-end mt-6">
        <button onClick={handleSave} disabled={loading} className={createInvoiceStyles.saveButton}>
          <SaveIcon className="w-4 h-4" /> {loading ? "Saving..." : (isEditing ? "Update Invoice" : "Create Invoice")}
        </button>
      </div>

      {/* AI Modal */}
      {aiModalOpen && (
        <div className="ai-modal-overlay" onClick={() => setAiModalOpen(false)}>
          <div className="ai-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-semibold mb-4">Create Invoice with AI</h3>
            <p className="text-sm text-gray-600 mb-3">
              Describe the invoice you want (e.g., "Invoice for web design services, client John Doe, amount $500, due next month").
            </p>
            <textarea
              className="w-full border border-gray-300 rounded-lg p-3 mb-4"
              rows="4"
              placeholder="E.g., Invoice for consulting services, client ABC Ltd, KES 50,000, due 30 days..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setAiModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateWithAI}
                disabled={aiGenerating}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium hover:from-purple-700 hover:to-pink-700 disabled:opacity-50"
              >
                {aiGenerating ? "Generating..." : "Generate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}