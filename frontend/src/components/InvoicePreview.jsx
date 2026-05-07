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
      company: raw.company ?? "",
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

// Phone icon for footer
const PhoneCircleIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c0005a" strokeWidth="2" style={{ verticalAlign: "middle" }}>
    <circle cx="12" cy="12" r="10" />
    <path d="M8.5 3.5s-1 2-1 4c0 5.5 4.5 10 10 10 2 0 4-1 4-1" />
    <path d="M8.91 10.45a10.18 10.18 0 0 0 4.64 4.64l1.55-1.55a1 1 0 0 1 1.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C9.61 21 3 14.39 3 6.27a1 1 0 0 1 1-1H7.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1.02z" />
  </svg>
);
const EmailCircleIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c0005a" strokeWidth="2" style={{ verticalAlign: "middle" }}>
    <circle cx="12" cy="12" r="10" />
    <path d="M4 8l8 5 8-5" />
    <rect x="4" y="8" width="16" height="10" rx="1" />
  </svg>
);
const WebCircleIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c0005a" strokeWidth="2" style={{ verticalAlign: "middle" }}>
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10A15.3 15.3 0 0 1 8 12a15.3 15.3 0 0 1 4-10z" />
  </svg>
);
const LocationCircleIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c0005a" strokeWidth="2" style={{ verticalAlign: "middle" }}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 7a3 3 0 1 1 0 6 3 3 0 0 1 0-6z" />
    <path d="M12 17s-5-4.686-5-8a5 5 0 0 1 10 0c0 3.314-5 8-5 8z" />
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

  useEffect(() => {
    let mounted = true;
    async function fetchProfile() {
      setProfileLoading(true);
      try {
        const token = await obtainToken();
        const headers = { Accept: "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const res = await fetch("/api/businessProfile/me", { method: "GET", headers });
        if (!res.ok) { setProfileLoading(false); return; }
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
  const sellerWebsite = profile.website || "";

  const paybill = profile.paybill || "247247";
  const accountNumber = profile.accountNumber || "0799501465";
  const accountName = profile.accountName || "NEX101";
  const terms = invoice.terms || profile.terms || "";
  const footerText = invoice.footer || profile.footer || "";

  // Colors
  const DARK = "#3b0030";
  const PINK = "#c0005a";
  const LIGHT_PINK = "#f5e6ee";

  // Inline styles object for the invoice
  const s = {
    page: {
      fontFamily: "'Segoe UI', Arial, sans-serif",
      maxWidth: "860px",
      margin: "0 auto",
      background: "white",
      boxShadow: "0 2px 24px rgba(0,0,0,0.10)",
      overflow: "hidden",
    },
    // Top white space above header
    topWhiteSpace: {
      height: "18px",
      background: "white",
    },
    // Top header bar: logo left, layered diagonal banner right
    topBar: {
      display: "flex",
      alignItems: "stretch",
      minHeight: "80px",
      position: "relative",
      overflow: "hidden",
    },
    topBarLeft: {
      flex: 1,
      display: "flex",
      alignItems: "center",
      padding: "14px 28px",
      background: "white",
      zIndex: 2,
    },
    // The right side is rendered as an SVG overlay for precise layered shapes
    topBarRight: {
      position: "relative",
      minWidth: "300px",
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-end",
      paddingRight: "28px",
      zIndex: 2,
    },
    invoiceTitle: {
      color: "white",
      fontSize: "2.2rem",
      fontWeight: "900",
      letterSpacing: "0.14em",
      textTransform: "uppercase",
      lineHeight: 1,
      position: "relative",
      zIndex: 3,
    },
    // Thin pink line under header
    pinkDivider: {
      height: "3px",
      background: PINK,
      width: "100%",
    },
    // Body padding
    body: {
      padding: "24px 32px 0 32px",
    },
    // Client & invoice info row
    infoRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: "22px",
      gap: "16px",
    },
    clientBlock: {
      flex: 1,
    },
    invoiceTo: {
      fontSize: "0.85rem",
      color: "#555",
      marginBottom: "2px",
    },
    clientName: {
      color: PINK,
      fontWeight: "700",
      fontSize: "1.05rem",
      textTransform: "uppercase",
      letterSpacing: "0.02em",
    },
    clientCompany: {
      color: "#222",
      fontSize: "0.92rem",
    },
    clientPhone: {
      color: "#444",
      fontSize: "0.88rem",
    },
    invoiceMetaBlock: {
      textAlign: "right",
      minWidth: "200px",
    },
    invoiceNoBadge: {
      background: DARK,
      color: "white",
      fontWeight: "700",
      fontSize: "0.95rem",
      padding: "7px 18px",
      display: "inline-block",
      marginBottom: "6px",
      letterSpacing: "0.04em",
    },
    invoiceDateRow: {
      fontSize: "0.9rem",
      color: "#222",
    },
    invoiceDateVal: {
      color: PINK,
      fontWeight: "700",
    },
    // Items table
    table: {
      width: "100%",
      borderCollapse: "collapse",
      marginBottom: "0",
    },
    thead: {
      background: PINK,
    },
    th: {
      color: "white",
      fontWeight: "700",
      fontSize: "0.78rem",
      padding: "10px 12px",
      textAlign: "left",
      letterSpacing: "0.06em",
      textTransform: "uppercase",
    },
    thRight: {
      color: "white",
      fontWeight: "700",
      fontSize: "0.78rem",
      padding: "10px 12px",
      textAlign: "right",
      letterSpacing: "0.06em",
      textTransform: "uppercase",
    },
    tdEven: {
      padding: "9px 12px",
      fontSize: "0.88rem",
      color: "#222",
      background: "white",
      borderBottom: "1px solid #eee",
    },
    tdOdd: {
      padding: "9px 12px",
      fontSize: "0.88rem",
      color: "#222",
      background: LIGHT_PINK,
      borderBottom: "1px solid #eee",
    },
    tdRight: {
      textAlign: "right",
    },
    tdBold: {
      fontWeight: "600",
    },
    // Last row shaded
    lastRow: {
      background: LIGHT_PINK,
    },
    tableSection: {
      overflowX: "auto",
      marginBottom: "0",
    },
    // Payment + totals row
    bottomSection: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      padding: "20px 32px",
      gap: "24px",
    },
    paymentBlock: {
      flex: 1,
    },
    paymentBadge: {
      background: PINK,
      color: "white",
      fontWeight: "700",
      fontSize: "0.82rem",
      padding: "5px 14px",
      display: "inline-block",
      marginBottom: "10px",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
    },
    paymentRow: {
      display: "flex",
      gap: "8px",
      fontSize: "0.88rem",
      color: "#222",
      marginBottom: "2px",
    },
    paymentLabel: {
      color: "#555",
      minWidth: "90px",
      fontWeight: "500",
    },
    paymentVal: {
      fontWeight: "700",
      color: "#111",
    },
    totalsBlock: {
      minWidth: "220px",
      textAlign: "right",
    },
    totalsRow: {
      display: "flex",
      justifyContent: "space-between",
      gap: "24px",
      fontSize: "0.9rem",
      color: "#444",
      marginBottom: "4px",
      paddingBottom: "4px",
    },
    totalsRowBold: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "24px",
      background: PINK,
      color: "white",
      padding: "7px 12px",
      fontWeight: "700",
      fontSize: "1rem",
      marginTop: "4px",
    },
    totalsLabel: {
      fontWeight: "500",
      letterSpacing: "0.04em",
    },
    totalsVal: {
      fontWeight: "700",
    },
    // Terms
    termsSection: {
      padding: "0 32px 16px 32px",
    },
    termsTitle: {
      color: DARK,
      fontWeight: "800",
      fontSize: "0.9rem",
      textTransform: "uppercase",
      letterSpacing: "0.06em",
      marginBottom: "4px",
      display: "flex",
      alignItems: "center",
      gap: "10px",
    },
    termsDivider: {
      flex: 1,
      height: "1px",
      background: "#ccc",
      display: "inline-block",
    },
    termsText: {
      fontSize: "0.82rem",
      color: "#444",
      lineHeight: 1.6,
    },
    // Thank you & signature row
    thankYouRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-end",
      padding: "8px 32px 16px 32px",
    },
    thankYou: {
      color: PINK,
      fontWeight: "700",
      fontSize: "0.95rem",
      fontStyle: "italic",
    },
    signatureBlock: {
      textAlign: "center",
      minWidth: "160px",
    },
    signatureLine: {
      borderTop: "1.5px solid #333",
      paddingTop: "6px",
      marginTop: "4px",
    },
    signatureNameText: {
      fontWeight: "700",
      fontSize: "0.88rem",
      color: "#111",
      textTransform: "uppercase",
      letterSpacing: "0.03em",
    },
    signatureTitleText: {
      fontSize: "0.78rem",
      color: "#555",
    },
    // Footer bar
    footerDivider: {
      height: "2px",
      background: PINK,
      margin: "0 32px",
    },
    footer: {
      padding: "14px 32px 10px 32px",
    },
    footerRow: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      fontSize: "0.82rem",
      color: "#333",
      marginBottom: "5px",
      flexWrap: "wrap",
    },
    footerItem: {
      display: "flex",
      alignItems: "center",
      gap: "7px",
      marginRight: "20px",
    },
    // Dark corner accent bottom-right
    cornerAccent: {
      display: "flex",
      justifyContent: "flex-end",
    },
    cornerTriangle: {
      width: "80px",
      height: "22px",
      background: DARK,
      clipPath: "polygon(100% 0%, 100% 100%, 0% 100%)",
    },
  };

  // Only 1 empty padding row — more rows added as items are created
  const MIN_ROWS = 1;
  const paddedItems = [...items];
  while (paddedItems.length < MIN_ROWS) {
    paddedItems.push(null); // empty row
  }

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

        {/* ===================== PRINTABLE INVOICE ===================== */}
        <div id="print-area" style={s.page}>

          {/* White space on top */}
          <div style={s.topWhiteSpace} />

          {/* TOP HEADER: Logo + layered INVOICE banner */}
          <div style={s.topBar}>
            {/* Background shapes spanning full width */}
            <svg
              style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 1 }}
              viewBox="0 0 860 80"
              preserveAspectRatio="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Dark maroon main block — covers right portion with diagonal left edge */}
              <polygon points="420,0 860,0 860,80 380,80" fill={DARK} />
              {/* Pink accent shape — sits on top of dark, slightly offset diagonal */}
              <polygon points="480,0 560,0 520,80 440,80" fill={PINK} />
            </svg>

            <div style={s.topBarLeft}>
              {logo
                ? <img src={logo} alt="Logo" style={{ maxHeight: "56px", maxWidth: "180px", objectFit: "contain" }} />
                : (
                  <div style={{ fontWeight: "900", fontSize: "1.3rem", color: DARK, letterSpacing: "0.04em" }}>
                    {invoice.fromBusinessName || profile.businessName || "YOUR COMPANY"}
                  </div>
                )
              }
            </div>
            <div style={s.topBarRight}>
              <span style={s.invoiceTitle}>INVOICE</span>
            </div>
          </div>

          {/* Pink divider line */}
          <div style={s.pinkDivider} />

          {/* BODY */}
          <div style={s.body}>
            {/* Client info + Invoice number/date */}
            <div style={s.infoRow}>
              <div style={s.clientBlock}>
                <div style={s.invoiceTo}>Invoice to:</div>
                <div style={s.clientName}>{client.name || "CLIENT'S NAME"}</div>
                {client.company && <div style={s.clientCompany}>{client.company}</div>}
                <div style={s.clientPhone}>Tel: {client.phone || "071234567890"}</div>
              </div>
              <div style={s.invoiceMetaBlock}>
                <div style={s.invoiceNoBadge}>
                  INVOICE NO.: {invoice.invoiceNumber || invoice.id || "00001"}
                </div>
                {invoice.issueDate && (
                  <div style={s.invoiceDateRow}>
                    Invoice Date: <span style={s.invoiceDateVal}>{formatDate(invoice.issueDate)}</span>
                  </div>
                )}
                {invoice.dueDate && (
                  <div style={{ ...s.invoiceDateRow, marginTop: "3px" }}>
                    Due Date: <span style={s.invoiceDateVal}>{formatDate(invoice.dueDate)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ITEMS TABLE */}
          <div style={s.tableSection}>
            <table style={s.table}>
              <thead style={s.thead}>
                <tr>
                  <th style={{ ...s.th, width: "46px" }}>NO</th>
                  <th style={s.th}>PRODUCT/SERVICE DESCRIPTION</th>
                  <th style={{ ...s.thRight, width: "70px" }}>QTY</th>
                  <th style={{ ...s.thRight, width: "130px" }}>UNIT PRICE ({invoiceCurrency})</th>
                  <th style={{ ...s.thRight, width: "130px" }}>TOTAL PRICE ({invoiceCurrency})</th>
                </tr>
              </thead>
              <tbody>
                {paddedItems.map((it, idx) => {
                  const isLast = idx === paddedItems.length - 1;
                  const tdStyle = (isLast || idx % 2 !== 0) ? s.tdOdd : s.tdEven;
                  if (!it) {
                    return (
                      <tr key={`empty-${idx}`}>
                        <td style={{ ...tdStyle, height: "34px" }}>&nbsp;</td>
                        <td style={tdStyle}>&nbsp;</td>
                        <td style={tdStyle}>&nbsp;</td>
                        <td style={tdStyle}>&nbsp;</td>
                        <td style={tdStyle}>&nbsp;</td>
                      </tr>
                    );
                  }
                  return (
                    <tr key={it.id || idx}>
                      <td style={tdStyle}>{idx + 1}</td>
                      <td style={tdStyle}>{it.description || "—"}</td>
                      <td style={{ ...tdStyle, ...s.tdRight }}>{it.qty || 0}</td>
                      <td style={{ ...tdStyle, ...s.tdRight }}>{currencyFmt(it.unitPrice || 0, invoiceCurrency)}</td>
                      <td style={{ ...tdStyle, ...s.tdRight, ...s.tdBold }}>{currencyFmt(Number(it.qty || 0) * Number(it.unitPrice || 0), invoiceCurrency)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* PAYMENT + TOTALS */}
          <div style={s.bottomSection}>
            <div style={s.paymentBlock}>
              <div style={s.paymentBadge}>PAYMENT METHOD</div>
              <div style={s.paymentRow}>
                <span style={s.paymentLabel}>PAYBILL:</span>
                <span style={s.paymentVal}>{paybill}</span>
              </div>
              <div style={s.paymentRow}>
                <span style={s.paymentLabel}>ACC. NO.:</span>
                <span style={s.paymentVal}>{accountNumber}</span>
              </div>
              <div style={s.paymentRow}>
                <span style={s.paymentLabel}>ACC. NAME:</span>
                <span style={s.paymentVal}>{accountName}</span>
              </div>
            </div>

            <div style={s.totalsBlock}>
              <div style={s.totalsRow}>
                <span style={s.totalsLabel}>SUB TOTAL</span>
                <span style={s.totalsVal}>{currencyFmt(subtotal, invoiceCurrency)}</span>
              </div>
              <div style={s.totalsRow}>
                <span style={s.totalsLabel}>TAX ({taxPercent}%)</span>
                <span style={s.totalsVal}>{currencyFmt(tax, invoiceCurrency)}</span>
              </div>
              <div style={s.totalsRowBold}>
                <span>GRAND TOTAL</span>
                <span>{currencyFmt(total, invoiceCurrency)}</span>
              </div>
            </div>
          </div>

          {/* TERMS & CONDITIONS */}
          {terms && (
            <div style={s.termsSection}>
              <div style={s.termsTitle}>
                TERMS &amp; CONDITIONS
                <span style={s.termsDivider} />
              </div>
              <div style={s.termsText}>{terms}</div>
            </div>
          )}

          {/* THANK YOU + SIGNATURE */}
          <div style={s.thankYouRow}>
            <div style={s.thankYou}>{footerText || "Thank you for your business!"}</div>
            <div style={s.signatureBlock}>
              {signature && (
                <img src={signature} alt="Signature" style={{ maxHeight: "44px", maxWidth: "140px", objectFit: "contain", display: "block", margin: "0 auto" }} />
              )}
              {stamp && (
                <img src={stamp} alt="Stamp" style={{ maxHeight: "44px", maxWidth: "100px", objectFit: "contain", display: "block", margin: "0 auto" }} />
              )}
              <div style={s.signatureLine}>
                <div style={s.signatureNameText}>{signatureName || "AUTHORIZED SIGNATORY"}</div>
                {signatureTitle && <div style={s.signatureTitleText}>{signatureTitle}</div>}
              </div>
            </div>
          </div>

          {/* FOOTER DIVIDER */}
          <div style={s.footerDivider} />

          {/* FOOTER CONTACT ROW */}
          <div style={s.footer}>
            <div style={s.footerRow}>
              {sellerPhone && (
                <div style={s.footerItem}>
                  <PhoneCircleIcon />
                  <span>{sellerPhone}</span>
                </div>
              )}
              {sellerEmail && (
                <div style={s.footerItem}>
                  <EmailCircleIcon />
                  <span>{sellerEmail}</span>
                </div>
              )}
              {sellerWebsite && (
                <div style={s.footerItem}>
                  <WebCircleIcon />
                  <span>{sellerWebsite}</span>
                </div>
              )}
            </div>
            {(sellerAddress || sellerLocation) && (
              <div style={s.footerRow}>
                <div style={s.footerItem}>
                  <LocationCircleIcon />
                  <span>{[sellerAddress, sellerLocation].filter(Boolean).join(" ")}</span>
                </div>
              </div>
            )}
          </div>

          {/* Bottom dark corner accent */}
          <div style={s.cornerAccent}>
            <div style={s.cornerTriangle} />
          </div>

        </div>
        {/* ===================== END PRINTABLE INVOICE ===================== */}

      </div>
    </div>
  );
}