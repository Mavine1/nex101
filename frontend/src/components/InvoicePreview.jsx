import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";

const API_BASE = "http://localhost:4000";
const PROFILE_ENDPOINT = `${API_BASE}/api/businessProfile/me`;
const INVOICE_ENDPOINT = (id) => `${API_BASE}/api/invoice/${id}`;

function resolveImageUrl(url) {
  if (!url) return null;
  const s = String(url).trim();
  if (s.startsWith("data:")) return s;
  if (/localhost|127\.0\.0\.1/.test(s)) {
    try {
      const parsed = new URL(s);
      const path = parsed.pathname + (parsed.search || "") + (parsed.hash || "");
      return `${API_BASE.replace(/\/+$/, "")}${path}`;
    } catch {
      const path = s.replace(/^https?:\/\/[^/]+/, "");
      return `${API_BASE.replace(/\/+$/, "")}${path}`;
    }
  }
  if (/^https?:\/\//i.test(s)) return s;
  return `${API_BASE.replace(/\/+$/, "")}/${s.replace(/^\/+/, "")}`;
}

function readJSON(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch { return fallback; }
}
function writeJSON(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}
function getStoredInvoices() {
  return readJSON("invoices_v1", []) || [];
}

const defaultProfile = {
  businessName: "",
  email: "",
  address: "",
  phone: "",
  gst: "",
  stampDataUrl: null,
  signatureDataUrl: null,
  logoDataUrl: null,
  defaultTaxPercent: 18,
  signatureName: "",
  signatureTitle: "",
  paybill: "",
  accountNumber: "",
  accountName: "",
  website: "",
};

function currencyFmt(amount = 0, currency = "KES") {
  try {
    return new Intl.NumberFormat("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return Number(amount || 0).toFixed(2);
  }
}

function formatDate(dateInput) {
  if (!dateInput) return "—";
  const d = dateInput instanceof Date ? dateInput : new Date(String(dateInput));
  if (Number.isNaN(d.getTime())) return "—";
  const day = d.getDate();
  const suffix = ["th","st","nd","rd"][(day % 10 < 4 && (day < 11 || day > 13)) ? day % 10 : 0] || "th";
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  return `${day}${suffix} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function normalizeClient(raw) {
  if (!raw) return { name: "", company: "", phone: "" };
  if (typeof raw === "string") return { name: raw, company: "", phone: "" };
  return {
    name: raw.name ?? raw.client ?? "",
    company: raw.company ?? raw.companyName ?? "",
    phone: raw.phone ?? raw.contact ?? raw.mobile ?? "",
    email: raw.email ?? "",
    address: raw.address ?? "",
  };
}

const PrintIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
    <path d="M6 14h12v8H6z"/>
  </svg>
);
const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const ArrowLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
);

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800&family=Barlow+Condensed:wght@700;800&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  .inv-page {
    min-height: 100vh;
    background: #f0f0f0;
    font-family: 'Barlow', sans-serif;
    padding: 24px;
  }

  .inv-actions {
    max-width: 860px;
    margin: 0 auto 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .inv-actions h1 {
    font-size: 20px;
    font-weight: 700;
    color: #2d0020;
  }

  .inv-actions-btns {
    display: flex;
    gap: 10px;
  }

  .inv-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition: opacity 0.15s;
  }
  .inv-btn:hover { opacity: 0.85; }
  .inv-btn-edit { background: #fff; color: #2d0020; border: 2px solid #2d0020; }
  .inv-btn-print { background: #c8005a; color: #fff; }

  /* The printable document */
  .inv-doc {
    max-width: 860px;
    margin: 0 auto;
    background: #fff;
    position: relative;
    overflow: hidden;
    box-shadow: 0 4px 40px rgba(0,0,0,0.18);
  }

  /* TOP HEADER */
  .inv-header {
    display: flex;
    align-items: stretch;
    background: #fff;
    position: relative;
  }

  .inv-header-left {
    padding: 24px 28px;
    flex: 1;
    display: flex;
    align-items: center;
  }

  .inv-logo {
    max-height: 64px;
    max-width: 180px;
    object-fit: contain;
  }

  .inv-logo-placeholder {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 28px;
    font-weight: 800;
    color: #2d0020;
    letter-spacing: 1px;
  }

  .inv-header-right {
    background: #2d0020;
    color: #fff;
    padding: 20px 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 260px;
    position: relative;
    clip-path: polygon(20px 0, 100% 0, 100% 100%, 0 100%);
  }

  .inv-header-right::before {
    content: '';
    position: absolute;
    top: -20px;
    right: -20px;
    width: 120px;
    height: 120px;
    background: #c8005a;
    transform: rotate(45deg);
    opacity: 0.4;
  }

  .inv-title-text {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 52px;
    font-weight: 800;
    letter-spacing: 4px;
    color: #fff;
    position: relative;
    z-index: 1;
  }

  /* Bottom decorative strip */
  .inv-header-strip {
    height: 5px;
    background: linear-gradient(90deg, #c8005a 60%, #2d0020 100%);
  }

  /* Client + invoice meta */
  .inv-meta {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 24px 28px;
    gap: 20px;
  }

  .inv-bill-to-label {
    font-size: 11px;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 6px;
  }

  .inv-client-name {
    font-size: 15px;
    font-weight: 700;
    color: #c8005a;
    text-transform: uppercase;
  }

  .inv-client-sub {
    font-size: 13px;
    color: #333;
    margin-top: 2px;
    line-height: 1.5;
  }

  .inv-meta-right {
    text-align: right;
    min-width: 230px;
  }

  .inv-num-badge {
    background: #2d0020;
    color: #fff;
    padding: 8px 18px;
    font-weight: 700;
    font-size: 13px;
    display: inline-block;
    margin-bottom: 10px;
    letter-spacing: 0.5px;
  }

  .inv-date-row {
    font-size: 13px;
    color: #333;
  }

  .inv-date-val {
    font-weight: 700;
    color: #c8005a;
  }

  /* ITEMS TABLE */
  .inv-table-wrap {
    padding: 0 28px 20px;
  }

  .inv-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }

  .inv-table thead tr {
    background: #2d0020;
    color: #fff;
  }

  .inv-table thead th {
    padding: 11px 14px;
    text-align: left;
    font-weight: 700;
    text-transform: uppercase;
    font-size: 11px;
    letter-spacing: 0.5px;
  }

  .inv-table thead th.right { text-align: right; }
  .inv-table thead th.center { text-align: center; }

  .inv-table thead th:first-child { width: 48px; }

  .inv-table tbody tr:nth-child(even) { background: #faf0f5; }
  .inv-table tbody tr:nth-child(odd) { background: #fff; }

  .inv-table tbody td {
    padding: 13px 14px;
    color: #333;
    border-bottom: 1px solid #eee;
    vertical-align: middle;
  }

  .inv-table tbody td.right { text-align: right; font-weight: 600; }
  .inv-table tbody td.center { text-align: center; }

  /* BOTTOM SECTION */
  .inv-bottom {
    display: flex;
    gap: 20px;
    padding: 20px 28px;
    align-items: flex-start;
  }

  .inv-payment {
    flex: 1;
  }

  .inv-payment-badge {
    background: #c8005a;
    color: #fff;
    font-weight: 700;
    font-size: 12px;
    letter-spacing: 0.5px;
    padding: 6px 14px;
    display: inline-block;
    margin-bottom: 12px;
    text-transform: uppercase;
  }

  .inv-payment-row {
    font-size: 13px;
    color: #333;
    margin-bottom: 5px;
    display: flex;
    gap: 8px;
  }

  .inv-payment-key {
    color: #888;
    min-width: 80px;
  }

  .inv-payment-val {
    font-weight: 700;
    color: #2d0020;
  }

  /* TOTALS */
  .inv-totals {
    min-width: 220px;
  }

  .inv-totals-row {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    padding: 5px 0;
    color: #555;
  }

  .inv-totals-row.grand {
    background: #c8005a;
    color: #fff;
    padding: 9px 12px;
    font-weight: 700;
    font-size: 15px;
    margin-top: 6px;
  }

  .inv-totals-row.subtotal {
    padding: 5px 12px;
    font-weight: 600;
    color: #333;
  }

  .inv-totals-row.discount {
    padding: 5px 12px;
    color: #333;
    border-bottom: 1px solid #eee;
  }

  /* TERMS + SIGNATURE */
  .inv-terms-sig {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    padding: 10px 28px 20px;
    gap: 20px;
  }

  .inv-terms h4 {
    font-size: 13px;
    font-weight: 800;
    color: #2d0020;
    text-transform: uppercase;
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .inv-terms h4::after {
    content: '';
    display: inline-block;
    height: 1.5px;
    width: 100px;
    background: #ccc;
  }

  .inv-terms p {
    font-size: 11.5px;
    color: #555;
    line-height: 1.6;
    max-width: 320px;
  }

  .inv-thankyou {
    font-size: 14px;
    font-weight: 700;
    color: #c8005a;
    margin-top: 12px;
  }

  .inv-sig {
    text-align: right;
    min-width: 180px;
  }

  .inv-sig-line {
    width: 180px;
    height: 1px;
    background: #2d0020;
    margin: 0 0 6px auto;
  }

  .inv-sig img {
    max-height: 50px;
    max-width: 180px;
    object-fit: contain;
    margin-bottom: 4px;
    display: block;
    margin-left: auto;
  }

  .inv-sig-name {
    font-size: 13px;
    font-weight: 700;
    color: #2d0020;
    text-transform: uppercase;
  }

  .inv-sig-title {
    font-size: 11px;
    color: #888;
  }

  /* FOOTER */
  .inv-footer-strip {
    height: 5px;
    background: linear-gradient(90deg, #2d0020 0%, #c8005a 100%);
    margin-top: 8px;
  }

  .inv-footer {
    background: #f9f9f9;
    padding: 14px 28px;
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: center;
    font-size: 12px;
    color: #444;
    border-top: 1px solid #eee;
  }

  .inv-footer-item {
    display: flex;
    align-items: center;
    gap: 7px;
  }

  .inv-footer-icon {
    width: 26px;
    height: 26px;
    background: #c8005a;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .inv-footer-address {
    flex-basis: 100%;
    padding-top: 8px;
    border-top: 1px solid #eee;
  }

  .inv-status-paid { color: #16a34a; font-weight: 700; }
  .inv-status-unpaid { color: #dc2626; font-weight: 700; }
  .inv-status-overdue { color: #ea580c; font-weight: 700; }
  .inv-status-draft { color: #6b7280; font-weight: 700; }

  @media print {
    .no-print { display: none !important; }
    .inv-page { background: #fff; padding: 0; }
    .inv-doc { box-shadow: none; max-width: 100%; }
  }
`;

export default function InvoicePreview() {
  const { id } = useParams();
  const loc = useLocation();
  const navigate = useNavigate();

  const { getToken } = useAuth ? useAuth() : { getToken: null };

  const invoiceFromState = loc?.state?.invoice ?? null;
  const [invoice, setInvoice] = useState(() => invoiceFromState || null);
  const [loadingInvoice, setLoadingInvoice] = useState(!invoiceFromState && Boolean(id));
  const [invoiceError, setInvoiceError] = useState(null);
  const [profile, setProfile] = useState(() => readJSON("business_profile", defaultProfile) || defaultProfile);
  const [profileLoading, setProfileLoading] = useState(false);
  const prevTitleRef = useRef(document.title);

  const obtainToken = useCallback(async () => {
    if (typeof getToken !== "function") return null;
    try {
      return await getToken({ template: "default" }).catch(() => null);
    } catch { return null; }
  }, [getToken]);

  useEffect(() => {
    let mounted = true;
    async function fetchInvoice() {
      if (!id || invoiceFromState) return;
      setLoadingInvoice(true);
      try {
        const token = await obtainToken();
        const headers = { Accept: "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const res = await fetch(INVOICE_ENDPOINT(id), { method: "GET", headers });
        if (res.ok) {
          const json = await res.json().catch(() => null);
          const data = json?.data ?? json ?? null;
          if (mounted && data) {
            setInvoice({ ...data, id: data._id ?? data.id ?? id, items: Array.isArray(data.items) ? data.items : [], currency: data.currency || "KES" });
            return;
          }
        }
      } catch {}
      finally {
        if (!mounted) return;
        const all = getStoredInvoices();
        const found = all.find(x => x && (x.id === id || x._id === id || x.invoiceNumber === id));
        if (found) setInvoice(found);
        else setInvoiceError("Invoice not found");
        setLoadingInvoice(false);
      }
    }
    fetchInvoice();
    return () => { mounted = false; };
  }, [id, invoiceFromState, obtainToken]);

  useEffect(() => {
    let mounted = true;
    async function fetchProfile() {
      const stored = readJSON("business_profile", null);
      if (stored) return;
      setProfileLoading(true);
      try {
        const token = await obtainToken();
        const headers = { Accept: "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const res = await fetch(PROFILE_ENDPOINT, { method: "GET", headers });
        if (!res.ok) return;
        const json = await res.json().catch(() => null);
        const data = json?.data ?? json ?? null;
        if (mounted && data) {
          const normalized = {
            businessName: data.businessName ?? data.name ?? "",
            email: data.email ?? "",
            address: data.address ?? "",
            phone: data.phone ?? "",
            gst: data.gst ?? "",
            stampDataUrl: data.stampUrl ?? data.stampDataUrl ?? null,
            signatureDataUrl: data.signatureUrl ?? data.signatureDataUrl ?? null,
            logoDataUrl: data.logoUrl ?? data.logoDataUrl ?? null,
            defaultTaxPercent: Number.isFinite(Number(data.defaultTaxPercent)) ? Number(data.defaultTaxPercent) : 0,
            signatureName: data.signatureOwnerName ?? data.signatureName ?? "",
            signatureTitle: data.signatureOwnerTitle ?? data.signatureTitle ?? "",
            paybill: data.paybill ?? "",
            accountNumber: data.accountNumber ?? "",
            accountName: data.accountName ?? "",
            website: data.website ?? "",
          };
          setProfile(normalized);
          writeJSON("business_profile", normalized);
        }
      } catch {}
      finally { if (mounted) setProfileLoading(false); }
    }
    fetchProfile();
    return () => { mounted = false; };
  }, [obtainToken]);

  useEffect(() => {
    if (!invoice) return;
    const num = invoice.invoiceNumber || invoice.id || `invoice-${Date.now()}`;
    const safe = `Invoice-${String(num).replace(/[^\w\-_.() ]/g, "_")}`;
    const prev = prevTitleRef.current;
    document.title = safe;
    return () => { try { document.title = prev; } catch {} };
  }, [invoice]);

  const handlePrint = useCallback(() => {
    const num = (invoice && (invoice.invoiceNumber || invoice.id)) || `invoice-${Date.now()}`;
    const safe = `Invoice-${String(num).replace(/[^\w\-_.() ]/g, "_")}`;
    const prev = document.title;
    document.title = safe;
    window.print();
    setTimeout(() => { document.title = prev; }, 500);
  }, [invoice]);

  if (!invoice && (loadingInvoice || profileLoading)) {
    return <div style={{ padding: 40, textAlign: "center", fontFamily: "Barlow, sans-serif" }}>Loading invoice…</div>;
  }

  if (!invoice) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f0f0" }}>
        <div style={{ background: "#fff", padding: 40, borderRadius: 8, textAlign: "center", maxWidth: 400 }}>
          <h3 style={{ marginBottom: 12, color: "#2d0020" }}>Invoice Not Found</h3>
          <p style={{ color: "#666", marginBottom: 20, fontSize: 14 }}>{invoiceError || "This invoice doesn't exist or was deleted."}</p>
          <button onClick={() => navigate(-1)} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#2d0020", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>
            <ArrowLeftIcon /> Back to Invoices
          </button>
        </div>
      </div>
    );
  }

  const items = (Array.isArray(invoice.items) ? invoice.items : []).filter(Boolean);
  const subtotal = items.reduce((s, it) => s + Number(it.qty || 0) * Number(it.unitPrice || 0), 0);
  const discount = Number(invoice.discount || 0);
  const taxPercent = Number(invoice.taxPercent ?? profile.defaultTaxPercent ?? 0);
  const taxable = subtotal - discount;
  const tax = taxPercent > 0 ? (taxable * taxPercent) / 100 : 0;
  const grandTotal = taxable + tax;

  const logo = resolveImageUrl(invoice.logoDataUrl ?? profile.logoDataUrl ?? null);
  const stamp = resolveImageUrl(invoice.stampDataUrl ?? profile.stampDataUrl ?? null);
  const signature = resolveImageUrl(invoice.signatureDataUrl ?? profile.signatureDataUrl ?? null);
  const signatureName = invoice.signatureName ?? profile.signatureName ?? "";
  const signatureTitle = invoice.signatureTitle ?? profile.signatureTitle ?? "";
  const client = normalizeClient(invoice.client);
  const currency = invoice.currency || "KES";

  const paybill = invoice.paybill ?? profile.paybill ?? "";
  const accountNumber = invoice.accountNumber ?? profile.accountNumber ?? "";
  const accountName = invoice.accountName ?? profile.accountName ?? "";
  const phone = invoice.fromPhone ?? profile.phone ?? "";
  const email = invoice.fromEmail ?? profile.email ?? "";
  const website = invoice.website ?? profile.website ?? "";
  const address = invoice.fromAddress ?? profile.address ?? "";

  const statusClass = {
    paid: "inv-status-paid",
    unpaid: "inv-status-unpaid",
    overdue: "inv-status-overdue",
    draft: "inv-status-draft",
  }[invoice.status] || "inv-status-draft";

  return (
    <>
      <style>{styles}</style>
      <div className="inv-page">
        {/* Action bar — hidden on print */}
        <div className="inv-actions no-print">
          <div>
            <h1>Invoice Preview</h1>
            <p style={{ fontSize: 13, color: "#666", marginTop: 2 }}>
              #{invoice.invoiceNumber || invoice.id} •{" "}
              <span className={statusClass}>
                {invoice.status ? invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1) : "Draft"}
              </span>
            </p>
          </div>
          <div className="inv-actions-btns">
            <button className="inv-btn inv-btn-edit" onClick={() => navigate(`/app/invoices/${invoice.id}/edit`, { state: { invoice } })}>
              <EditIcon /> Edit Invoice
            </button>
            <button className="inv-btn inv-btn-print" onClick={handlePrint}>
              <PrintIcon /> Print / Save PDF
            </button>
          </div>
        </div>

        {/* Document */}
        <div className="inv-doc" id="print-area">

          {/* Header */}
          <div className="inv-header">
            <div className="inv-header-left">
              {logo
                ? <img src={logo} alt="Logo" className="inv-logo" onError={e => e.currentTarget.style.display = "none"} />
                : <div className="inv-logo-placeholder">{invoice.fromBusinessName || profile.businessName || "YOUR COMPANY"}</div>
              }
            </div>
            <div className="inv-header-right">
              <span className="inv-title-text">INVOICE</span>
            </div>
          </div>
          <div className="inv-header-strip" />

          {/* Client + Meta */}
          <div className="inv-meta">
            <div>
              <div className="inv-bill-to-label">Invoice to:</div>
              <div className="inv-client-name">{client.name || "CLIENT'S NAME"}</div>
              <div className="inv-client-sub">
                {client.company && <div>{client.company}</div>}
                {client.phone && <div>Tel: {client.phone}</div>}
                {client.address && <div>{client.address}</div>}
                {client.email && <div>{client.email}</div>}
              </div>
            </div>

            <div className="inv-meta-right">
              <div className="inv-num-badge">INVOICE NO.: {invoice.invoiceNumber || invoice.id || "—"}</div>
              <div className="inv-date-row">
                Invoice Date: <span className="inv-date-val">
                  {invoice.issueDate ? formatDate(invoice.issueDate) : formatDate(new Date())}
                </span>
              </div>
              {invoice.dueDate && (
                <div className="inv-date-row" style={{ marginTop: 4 }}>
                  Due Date: <span className="inv-date-val">{formatDate(invoice.dueDate)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Items table */}
          <div className="inv-table-wrap">
            <table className="inv-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Product/Service Description</th>
                  <th className="center">QTY</th>
                  <th className="right">Unit Price ({currency})</th>
                  <th className="right">Total Price ({currency})</th>
                </tr>
              </thead>
              <tbody>
                {items.length > 0 ? items.map((it, idx) => (
                  <tr key={it.id || idx}>
                    <td className="center" style={{ color: "#888", fontSize: 12 }}>{idx + 1}</td>
                    <td>{it.description || "Item Description"}</td>
                    <td className="center">{it.qty || 0}</td>
                    <td className="right">{currencyFmt(it.unitPrice, currency)}</td>
                    <td className="right">{currencyFmt(Number(it.qty || 0) * Number(it.unitPrice || 0), currency)}</td>
                  </tr>
                )) : (
                  // Empty rows to maintain structure like the design
                  Array.from({ length: 7 }).map((_, i) => (
                    <tr key={i}>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Payment + Totals */}
          <div className="inv-bottom">
            <div className="inv-payment">
              <div className="inv-payment-badge">Payment Method</div>
              {paybill && (
                <div className="inv-payment-row">
                  <span className="inv-payment-key">PAYBILL:</span>
                  <span className="inv-payment-val">{paybill}</span>
                </div>
              )}
              {accountNumber && (
                <div className="inv-payment-row">
                  <span className="inv-payment-key">ACC. NO.:</span>
                  <span className="inv-payment-val">{accountNumber}</span>
                </div>
              )}
              {accountName && (
                <div className="inv-payment-row">
                  <span className="inv-payment-key">ACC. NAME:</span>
                  <span className="inv-payment-val">{accountName}</span>
                </div>
              )}
              {!paybill && !accountNumber && !accountName && (
                <div style={{ fontSize: 12, color: "#aaa" }}>No payment details configured.</div>
              )}
            </div>

            <div className="inv-totals">
              <div className="inv-totals-row subtotal">
                <span>SUB TOTAL</span>
                <span style={{ fontWeight: 700 }}>{currencyFmt(subtotal, currency)}</span>
              </div>
              <div className="inv-totals-row discount">
                <span>DISCOUNT</span>
                <span>{currencyFmt(discount, currency)}</span>
              </div>
              {taxPercent > 0 && (
                <div className="inv-totals-row discount">
                  <span>TAX ({taxPercent}%)</span>
                  <span>{currencyFmt(tax, currency)}</span>
                </div>
              )}
              <div className="inv-totals-row grand">
                <span>GRAND TOTAL</span>
                <span>{currencyFmt(grandTotal, currency)}</span>
              </div>
            </div>
          </div>

          {/* Terms + Signature */}
          <div className="inv-terms-sig">
            <div className="inv-terms">
              <h4>Terms &amp; Conditions</h4>
              <p>
                {invoice.terms || "Payment is due within the agreed timeframe. All payments must be cleared after completion and approval of the project."}
              </p>
              <div className="inv-thankyou">
                {invoice.footnote || "Thank you for your business!"}
              </div>
            </div>

            <div className="inv-sig">
              {signature && (
                <img src={signature} alt="Authorized Signature" onError={e => e.currentTarget.style.display = "none"} />
              )}
              <div className="inv-sig-line" />
              <div className="inv-sig-name">{signatureName || "AUTHORIZED SIGNATORY"}</div>
              {signatureTitle && <div className="inv-sig-title">{signatureTitle}</div>}
            </div>
          </div>

          {/* Footer */}
          <div className="inv-footer-strip" />
          <div className="inv-footer">
            {phone && (
              <div className="inv-footer-item">
                <div className="inv-footer-icon">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.56 2 2 0 0 1 3.6 1.36h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6.09 6.09l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                </div>
                <span>{phone}</span>
              </div>
            )}
            {email && (
              <div className="inv-footer-item">
                <div className="inv-footer-icon">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                <span>{email}</span>
              </div>
            )}
            {website && (
              <div className="inv-footer-item">
                <div className="inv-footer-icon">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="2" y1="12" x2="22" y2="12"/>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                  </svg>
                </div>
                <span>{website}</span>
              </div>
            )}
            {address && (
              <div className="inv-footer-item inv-footer-address">
                <div className="inv-footer-icon">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                </div>
                <span>{address}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}