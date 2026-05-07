import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { invoicePreviewStyles } from "../assets/dummyStyles";

// ----- helper functions -----
function resolveImageUrl(url) {
  if (!url) return null;
  const s = String(url).trim();
  if (s.startsWith("data:")) return s;
  if (/^https?:\/\//i.test(s)) {
    try {
      return new URL(s).href;
    } catch {
      return s;
    }
  }
  return s.startsWith("/") ? s : `/${s}`;
}

function readJSON(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
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
  return readJSON("invoices_v1", []) || [];
}

const defaultProfile = {
  businessName: "",
  email: "",
  address: "",
  phone: "",
  location: "",
  website: "",
  terms: "",
  footer: "",
  paymentMethod: "M-PESA",
  paybill: "247247",
  accountNumber: "0799501465",
  accountName: "NEX101",
  stampDataUrl: null,
  signatureDataUrl: null,
  logoDataUrl: null,
  defaultTaxPercent: 18,
  signatureName: "",
  signatureTitle: "",
};

function currencyFmt(amount = 0, currency = "KES") {
  try {
    if (currency === "KES") {
      return new Intl.NumberFormat("en-KE", {
        style: "currency",
        currency: "KES",
        minimumFractionDigits: 2,
      }).format(amount);
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  } catch {
    return `${currency} ${Number(amount || 0).toFixed(2)}`;
  }
}

function formatDate(dateInput) {
  if (!dateInput) return "—";
  const d = dateInput instanceof Date ? dateInput : new Date(String(dateInput));
  if (Number.isNaN(d.getTime())) return "—";
  const day = d.getDate();
  const month = d.toLocaleString("default", { month: "long" });
  const year = d.getFullYear();
  return `${day}${getOrdinal(day)} ${month} ${year}`;
}

function getOrdinal(n) {
  if (n > 3 && n < 21) return "th";
  switch (n % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}

function normalizeClient(raw) {
  if (!raw) return { name: "", email: "", address: "", phone: "" };
  if (typeof raw === "string") return { name: raw, email: "", address: "", phone: "" };
  if (typeof raw === "object") {
    return {
      name: raw.name ?? raw.company ?? raw.client ?? "",
      email: raw.email ?? "",
      address: raw.address ?? "",
      phone: raw.phone ?? "",
    };
  }
  return { name: "", email: "", address: "", phone: "" };
}

// ----- icons -----
const PrintIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <path d="M6 14h12v8H6z" />
  </svg>
);
const EditIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const ArrowLeftIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

// ----- main component -----
export default function InvoicePreview() {
  const { id } = useParams();
  const loc = useLocation();
  const navigate = useNavigate();
  const { getToken, isSignedIn } = useAuth();

  const invoiceFromState = loc?.state?.invoice ?? null;
  const [invoice, setInvoice] = useState(() => invoiceFromState ? invoiceFromState : null);
  const [loadingInvoice, setLoadingInvoice] = useState(!invoiceFromState && Boolean(id));
  const [invoiceError, setInvoiceError] = useState(null);

  const [profile, setProfile] = useState(() => readJSON("business_profile", defaultProfile) || defaultProfile);
  const [profileLoading, setProfileLoading] = useState(false);

  const prevTitleRef = useRef(document.title);

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

  // fetch invoice
  useEffect(() => {
    let mounted = true;
    async function fetchInvoice() {
      if (!id || invoiceFromState) return;
      setLoadingInvoice(true);
      setInvoiceError(null);
      try {
        const token = await obtainToken();
        const headers = { Accept: "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch(`/api/invoice/${id}`, { method: "GET", headers });
        if (res.ok) {
          const json = await res.json().catch(() => null);
          const data = json?.data ?? json ?? null;
          if (mounted && data) {
            const normalized = {
              ...data,
              id: data._id ?? data.id ?? id,
              items: Array.isArray(data.items) ? data.items : [],
              invoiceNumber: data.invoiceNumber ?? "",
              currency: data.currency || "KES",
              issueDate: data.issueDate,
              dueDate: data.dueDate,
              client: data.client,
            };
            setInvoice(normalized);
            return;
          }
        } else {
          console.warn("Failed to fetch invoice from server:", res.status);
        }
      } catch (err) {
        console.warn("Error fetching invoice:", err);
      } finally {
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

  // fetch business profile (and update when changed)
  useEffect(() => {
    let mounted = true;
    async function fetchProfile() {
      setProfileLoading(true);
      try {
        const token = await obtainToken();
        const headers = { Accept: "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch("/api/businessProfile/me", { method: "GET", headers });
        if (!res.ok) {
          console.warn("Profile fetch returned non-ok:", res.status);
          setProfileLoading(false);
          return;
        }
        const json = await res.json().catch(() => null);
        const data = json?.data ?? json ?? null;
        if (mounted && data && typeof data === "object") {
          const normalized = {
            businessName: data.businessName ?? "",
            email: data.email ?? "",
            address: data.address ?? "",
            phone: data.phone ?? "",
            location: data.location ?? "",
            website: data.website ?? "",
            terms: data.terms ?? "",
            footer: data.footer ?? "",
            paymentMethod: data.paymentMethod ?? "M-PESA",
            paybill: data.paybill ?? "247247",
            accountNumber: data.accountNumber ?? "0799501465",
            accountName: data.accountName ?? "NEX101",
            stampDataUrl: data.stampUrl ?? data.stampDataUrl ?? null,
            signatureDataUrl: data.signatureUrl ?? data.signatureDataUrl ?? null,
            logoDataUrl: data.logoUrl ?? data.logoDataUrl ?? null,
            defaultTaxPercent: Number.isFinite(Number(data.defaultTaxPercent)) ? Number(data.defaultTaxPercent) : 18,
            signatureName: data.signatureOwnerName ?? data.signatureName ?? "",
            signatureTitle: data.signatureOwnerTitle ?? data.signatureTitle ?? "",
          };
          setProfile(normalized);
          writeJSON("business_profile", normalized);
        }
      } catch (err) {
        console.warn("Error fetching profile:", err);
      } finally {
        if (mounted) setProfileLoading(false);
      }
    }

    const stored = readJSON("business_profile", null);
    if (!stored) fetchProfile();
    return () => { mounted = false; };
  }, [obtainToken]);

  useEffect(() => {
    if (!invoice) return;
    const invoiceNumber = invoice.invoiceNumber || invoice.id || `invoice-${Date.now()}`;
    const safe = `Invoice-${String(invoiceNumber).replace(/[^\w\-_.() ]/g, "_")}`;
    const prev = prevTitleRef.current ?? document.title;
    if (document.title !== safe) document.title = safe;
    return () => { try { document.title = prev; } catch {} };
  }, [invoice]);

  const handlePrint = useCallback(() => {
    const invoiceNumber = (invoice && (invoice.invoiceNumber || invoice.id)) || `invoice-${Date.now()}`;
    const safe = `Invoice-${String(invoiceNumber).replace(/[^\w\-_.() ]/g, "_")}`;
    const prevTitle = document.title;
    document.title = safe;
    window.print();
    setTimeout(() => { document.title = prevTitle; }, 500);
  }, [invoice]);

  if (!invoice && (loadingInvoice || profileLoading)) {
    return <div className="p-6">Loading…</div>;
  }
  if (!invoice) {
    return (
      <div className={invoicePreviewStyles.pageContainer}>
        <div className={invoicePreviewStyles.emptyStateContainer}>
          <div className={invoicePreviewStyles.emptyStateCard}>
            <div className={invoicePreviewStyles.emptyStateIconContainer}>
              <svg className={invoicePreviewStyles.emptyStateIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <h3 className={invoicePreviewStyles.emptyStateTitle}>Invoice Not Found</h3>
            <p className={invoicePreviewStyles.emptyStateMessage}>The invoice you're looking for doesn't exist or may have been deleted.</p>
            <div className="mt-6">
              <button onClick={() => navigate(-1)} className={invoicePreviewStyles.emptyStateButton}>
                <ArrowLeftIcon className="w-4 h-4" /> Back to Invoices
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const items = (invoice.items && Array.isArray(invoice.items) ? invoice.items : []).filter(Boolean);
  let subtotal = 0;
  items.forEach(it => { subtotal += Number(it.qty || 0) * Number(it.unitPrice || 0); });
  const taxPercent = Number(invoice.taxPercent ?? profile.defaultTaxPercent ?? 18);
  const tax = (subtotal * taxPercent) / 100;
  const total = subtotal + tax;

  const logo = resolveImageUrl(invoice.logoDataUrl ?? profile.logoDataUrl ?? null);
  const stamp = resolveImageUrl(invoice.stampDataUrl ?? profile.stampDataUrl ?? null);
  const signature = resolveImageUrl(invoice.signatureDataUrl ?? profile.signatureDataUrl ?? null);
  const signatureName = invoice.signatureName ?? profile.signatureName ?? "";
  const signatureTitle = invoice.signatureTitle ?? profile.signatureTitle ?? "";
  const client = normalizeClient(invoice.client);
  const invoiceCurrency = invoice.currency || "KES";

  const sellerAddress = invoice.fromAddress || profile.address || "";
  const sellerEmail = invoice.fromEmail || profile.email || "";
  const sellerPhone = invoice.fromPhone || profile.phone || "";
  const sellerLocation = invoice.fromLocation || profile.location || "";

  // payment details from profile
  const paybill = profile.paybill || "247247";
  const accountNumber = profile.accountNumber || "0799501465";
  const accountName = profile.accountName || "NEX101";

  // terms and footer
  const terms = invoice.terms || profile.terms || "";
  const footerText = invoice.footer || profile.footer || "";

  return (
    <div className={invoicePreviewStyles.pageContainer}>
      <div className={invoicePreviewStyles.container}>
        {/* Header Actions (no-print) */}
        <div className={`${invoicePreviewStyles.headerContainer} ${invoicePreviewStyles.noPrint}`}>
          <div>
            <h1 className={invoicePreviewStyles.headerTitle}>Invoice Preview</h1>
            <p className={invoicePreviewStyles.headerSubtitle}>
              Review invoice <span className={invoicePreviewStyles.headerInvoiceNumber}>#{invoice.invoiceNumber || invoice.id}</span>
            </p>
          </div>
          <div className={invoicePreviewStyles.headerActions}>
            <button onClick={() => navigate(`/app/invoices/${invoice.id}/edit`, { state: { invoice } })} className={invoicePreviewStyles.editInvoiceButton}>
              <EditIcon className="w-4 h-4" /> Edit Invoice
            </button>
            <button onClick={handlePrint} className={invoicePreviewStyles.printButton}>
              <PrintIcon className="w-4 h-4" /> Print / Save as PDF
            </button>
          </div>
        </div>

        {/* Printable invoice area - design matches the image */}
        <div id="print-area" className={invoicePreviewStyles.printArea} style={{ fontFamily: "sans-serif", maxWidth: "1000px", margin: "0 auto", background: "white", padding: "2rem", boxShadow: "0 0 10px rgba(0,0,0,0.05)" }}>
          {/* Header with logo and company details */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", borderBottom: "2px solid #eee", paddingBottom: "1rem" }}>
            <div>
              {logo && <img src={logo} alt="Company Logo" style={{ maxHeight: "70px", maxWidth: "200px", objectFit: "contain" }} />}
            </div>
            <div style={{ textAlign: "right" }}>
              <div><strong>INVOICE</strong></div>
              <div>#{invoice.invoiceNumber || invoice.id}</div>
            </div>
          </div>

          {/* Seller & Client Row */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2rem" }}>
            <div>
              <div><strong>{invoice.fromBusinessName || profile.businessName || "Company Name"}</strong></div>
              <div>{sellerAddress}</div>
              <div>{sellerLocation}</div>
              <div>Email: {sellerEmail}</div>
              <div>Phone: {sellerPhone}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div><strong>Invoice to:</strong></div>
              <div>{client.name || "CLIENT'S NAME"}</div>
              <div>{client.company || ""}</div>
              <div>Tel: {client.phone || "071234567890"}</div>
            </div>
          </div>

          {/* Invoice details row (number, date, due date) */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem", background: "#f9f9f9", padding: "0.75rem", borderRadius: "6px" }}>
            <div><strong>INVOICE NO.:</strong> {invoice.invoiceNumber || invoice.id}</div>
            <div><strong>Invoice Date:</strong> {invoice.issueDate ? formatDate(invoice.issueDate) : "—"}</div>
            <div><strong>Due Date:</strong> {invoice.dueDate ? formatDate(invoice.dueDate) : "—"}</div>
          </div>

          {/* Items Table with stripes */}
          <div style={{ overflowX: "auto", marginBottom: "1.5rem" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f0f0f0", borderBottom: "2px solid #ddd" }}>
                  <th style={{ padding: "0.75rem", textAlign: "left" }}>NO</th>
                  <th style={{ padding: "0.75rem", textAlign: "left" }}>PRODUCT/SERVICE DESCRIPTION</th>
                  <th style={{ padding: "0.75rem", textAlign: "right" }}>QTY</th>
                  <th style={{ padding: "0.75rem", textAlign: "right" }}>UNIT PRICE ({invoiceCurrency})</th>
                  <th style={{ padding: "0.75rem", textAlign: "right" }}>TOTAL PRICE ({invoiceCurrency})</th>
                </tr>
              </thead>
              <tbody>
                {items.length ? (
                  items.map((it, idx) => (
                    <tr key={it.id || idx} style={{ borderBottom: "1px solid #eee", background: idx % 2 === 0 ? "white" : "#fafafa" }}>
                      <td style={{ padding: "0.75rem" }}>{idx + 1}</td>
                      <td style={{ padding: "0.75rem" }}>{it.description || "—"}</td>
                      <td style={{ padding: "0.75rem", textAlign: "right" }}>{it.qty || 0}</td>
                      <td style={{ padding: "0.75rem", textAlign: "right" }}>{currencyFmt(it.unitPrice || 0, invoiceCurrency)}</td>
                      <td style={{ padding: "0.75rem", textAlign: "right", fontWeight: "500" }}>{currencyFmt(Number(it.qty || 0) * Number(it.unitPrice || 0), invoiceCurrency)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ padding: "1rem", textAlign: "center", color: "#6b7280" }}>No items in this invoice</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals and Payment Method section */}
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1.5rem", marginBottom: "1.5rem" }}>
            <div style={{ flex: 1 }}>
              <div><strong>PAYMENT METHOD</strong></div>
              <div>PAYBILL: {paybill}</div>
              <div>ACC. NO.: {accountNumber}</div>
              <div>ACC. NAME: {accountName}</div>
            </div>
            <div style={{ flex: 1, textAlign: "right" }}>
              <div><strong>Subtotal</strong> {currencyFmt(subtotal, invoiceCurrency)}</div>
              <div><strong>Tax ({taxPercent}%)</strong> {currencyFmt(tax, invoiceCurrency)}</div>
              <div style={{ fontSize: "1.25rem", fontWeight: "bold", marginTop: "0.5rem", borderTop: "2px solid #ddd", paddingTop: "0.5rem" }}>
                <strong>Total</strong> {currencyFmt(total, invoiceCurrency)}
              </div>
            </div>
          </div>

          {/* Terms & Conditions */}
          {terms && (
            <div style={{ marginBottom: "1rem", padding: "0.75rem", background: "#f9f9f9", borderRadius: "6px" }}>
              <strong>TERMS & CONDITIONS</strong>
              <div style={{ marginTop: "0.25rem", whiteSpace: "pre-wrap" }}>{terms}</div>
            </div>
          )}

          {/* Signature and Stamp (only if they exist, placed side by side at the bottom) */}
          {(signature || stamp) && (
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "2rem", marginTop: "1rem", marginBottom: "1rem", borderTop: "1px solid #eee", paddingTop: "1rem" }}>
              {signature && (
                <div style={{ textAlign: "center" }}>
                  <div><strong>Authorized Signature</strong></div>
                  <img src={signature} alt="Signature" style={{ maxHeight: "50px", maxWidth: "150px", objectFit: "contain" }} />
                  {signatureName && <div style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>{signatureName}</div>}
                  {signatureTitle && <div style={{ fontSize: "0.75rem", color: "#555" }}>{signatureTitle}</div>}
                </div>
              )}
              {stamp && (
                <div style={{ textAlign: "center" }}>
                  <div><strong>Company Stamp</strong></div>
                  <img src={stamp} alt="Stamp" style={{ maxHeight: "50px", maxWidth: "150px", objectFit: "contain" }} />
                </div>
              )}
            </div>
          )}

          {/* Footer (contact, website, address) */}
          <div style={{ marginTop: "1rem", borderTop: "1px solid #eee", paddingTop: "1rem", textAlign: "center", fontSize: "0.875rem", color: "#555" }}>
            <div>{sellerPhone} &nbsp;|&nbsp; {sellerEmail} &nbsp;|&nbsp; {profile.website || ""}</div>
            <div>{sellerAddress} {sellerLocation ? `, ${sellerLocation}` : ""}</div>
            {footerText && <div style={{ marginTop: "0.5rem" }}>{footerText}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}