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
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "—";
  const day = d.getDate();
  const month = d.toLocaleString("default", { month: "long" });
  const year = d.getFullYear();
  const suffix = day => {
    if (day > 3 && day < 21) return "th";
    switch (day % 10) {
      case 1: return "st";
      case 2: return "nd";
      case 3: return "rd";
      default: return "th";
    }
  };
  return `${day}${suffix(day)} ${month} ${year}`;
}

function normalizeClient(raw) {
  if (!raw) return { name: "", email: "", address: "", phone: "", company: "" };
  if (typeof raw === "string") return { name: raw, email: "", address: "", phone: "", company: "" };
  return {
    name: raw.name || raw.company || raw.client || "",
    email: raw.email || "",
    address: raw.address || "",
    phone: raw.phone || "",
    company: raw.company || "",
  };
}

// ----- icons (modern, pink accent) -----
const PhoneIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c0005a" strokeWidth="2">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);
const EmailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c0005a" strokeWidth="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);
const WebIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c0005a" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10A15.3 15.3 0 0 1 8 12a15.3 15.3 0 0 1 4-10z" />
  </svg>
);
const LocationIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c0005a" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
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
  const [invoice, setInvoice] = useState(() => invoiceFromState || null);
  const [loadingInvoice, setLoadingInvoice] = useState(!invoiceFromState && Boolean(id));
  const [invoiceError, setInvoiceError] = useState(null);

  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

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

  // Fetch invoice if not passed via state
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
          const json = await res.json();
          const data = json?.data ?? json;
          if (mounted && data) {
            setInvoice({
              ...data,
              id: data._id ?? data.id ?? id,
              items: Array.isArray(data.items) ? data.items : [],
              invoiceNumber: data.invoiceNumber ?? "",
              currency: data.currency || "KES",
              issueDate: data.issueDate,
              dueDate: data.dueDate,
              client: data.client,
            });
          }
        } else if (res.status === 404) {
          setInvoiceError("Invoice not found");
        }
      } catch (err) {
        console.warn("Error fetching invoice:", err);
        setInvoiceError("Failed to load invoice");
      } finally {
        if (mounted) setLoadingInvoice(false);
      }
    }
    fetchInvoice();
    return () => { mounted = false; };
  }, [id, invoiceFromState, obtainToken]);

  // Fetch business profile
  useEffect(() => {
    let mounted = true;
    async function fetchProfile() {
      setProfileLoading(true);
      try {
        const token = await obtainToken();
        const headers = { Accept: "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const res = await fetch("/api/businessProfile/me", { method: "GET", headers });
        if (res.ok) {
          const json = await res.json();
          const data = json?.data ?? json;
          if (mounted && data) {
            setProfile({
              businessName: data.businessName || "",
              email: data.email || "",
              address: data.address || "",
              phone: data.phone || "",
              location: data.location || "",
              website: data.website || "",
              terms: data.terms || "",
              footer: data.footer || "",
              paybill: data.paybill || "247247",
              accountNumber: data.accountNumber || "0799501465",
              accountName: data.accountName || "NEX101",
              stampDataUrl: data.stampUrl ?? data.stampDataUrl ?? null,
              signatureDataUrl: data.signatureUrl ?? data.signatureDataUrl ?? null,
              logoDataUrl: data.logoUrl ?? data.logoDataUrl ?? null,
              defaultTaxPercent: Number(data.defaultTaxPercent) || 18,
              signatureName: data.signatureOwnerName || data.signatureName || "",
              signatureTitle: data.signatureOwnerTitle || data.signatureTitle || "",
            });
          }
        }
      } catch (err) {
        console.warn("Error fetching profile:", err);
      } finally {
        if (mounted) setProfileLoading(false);
      }
    }
    fetchProfile();
    return () => { mounted = false; };
  }, [obtainToken]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  if (loadingInvoice || profileLoading) {
    return <div className="p-6">Loading…</div>;
  }
  if (!invoice || invoiceError) {
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
            <p className={invoicePreviewStyles.emptyStateMessage}>{invoiceError || "The invoice you're looking for doesn't exist."}</p>
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

  // Compute invoice data from invoice and profile
  const items = (invoice.items || []).filter(Boolean);
  let subtotal = 0;
  items.forEach(it => { subtotal += (it.qty || 0) * (it.unitPrice || 0); });
  const taxPercent = invoice.taxPercent ?? profile?.defaultTaxPercent ?? 18;
  const tax = (subtotal * taxPercent) / 100;
  const total = subtotal + tax;

  const logo = resolveImageUrl(invoice.logoDataUrl ?? profile?.logoDataUrl ?? null);
  const stamp = resolveImageUrl(invoice.stampDataUrl ?? profile?.stampDataUrl ?? null);
  const signature = resolveImageUrl(invoice.signatureDataUrl ?? profile?.signatureDataUrl ?? null);
  const signatureName = invoice.signatureName ?? profile?.signatureName ?? "";
  const signatureTitle = invoice.signatureTitle ?? profile?.signatureTitle ?? "";
  const client = normalizeClient(invoice.client);
  const currency = invoice.currency || "KES";

  const sellerName = invoice.fromBusinessName || profile?.businessName || "";
  const sellerAddress = invoice.fromAddress || profile?.address || "";
  const sellerEmail = invoice.fromEmail || profile?.email || "";
  const sellerPhone = invoice.fromPhone || profile?.phone || "";
  const sellerLocation = invoice.fromLocation || profile?.location || "";
  const sellerWebsite = profile?.website || "";

  const paybill = profile?.paybill || "247247";
  const accountNumber = profile?.accountNumber || "0799501465";
  const accountName = profile?.accountName || "NEX101";
  const terms = invoice.terms || profile?.terms || "";
  const footer = invoice.footer || profile?.footer || "Thank you for your business!";

  // Colors
  const DARK = "#3b0030";
  const PINK = "#c0005a";
  const LIGHT_PINK = "#f5e6ee";

  // Inline styles for the invoice card (matching the picture)
  const styles = {
    page: {
      fontFamily: "'Segoe UI', Arial, sans-serif",
      maxWidth: "860px",
      margin: "0 auto",
      background: "white",
      boxShadow: "0 2px 24px rgba(0,0,0,0.10)",
      overflow: "hidden",
    },
    topWhiteSpace: { height: "18px", background: "white" },
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
      zIndex: 3,
    },
    pinkDivider: { height: "3px", background: PINK, width: "100%" },
    body: { padding: "24px 32px 0 32px" },
    infoRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: "22px",
      gap: "16px",
    },
    clientBlock: { flex: 1 },
    invoiceTo: { fontSize: "0.85rem", color: "#555", marginBottom: "2px" },
    clientName: { color: PINK, fontWeight: "700", fontSize: "1.05rem", textTransform: "uppercase" },
    clientCompany: { color: "#222", fontSize: "0.92rem" },
    clientPhone: { color: "#444", fontSize: "0.88rem" },
    invoiceMetaBlock: { textAlign: "right", minWidth: "200px" },
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
    invoiceDateRow: { fontSize: "0.9rem", color: "#222" },
    invoiceDateVal: { color: PINK, fontWeight: "700" },
    tableSection: { overflowX: "auto", marginBottom: "0" },
    table: { width: "100%", borderCollapse: "collapse" },
    thead: { background: PINK },
    th: { color: "white", fontWeight: "700", fontSize: "0.78rem", padding: "10px 12px", textAlign: "left", textTransform: "uppercase" },
    thRight: { textAlign: "right" },
    tdEven: { padding: "10px 12px", fontSize: "0.88rem", color: "#222", background: "white", borderBottom: "1px solid #e8d0dc" },
    tdOdd: { padding: "10px 12px", fontSize: "0.88rem", color: "#222", background: LIGHT_PINK, borderBottom: "1px solid #e8d0dc" },
    tdRight: { textAlign: "right" },
    tdBold: { fontWeight: "600" },
    bottomSection: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      padding: "20px 32px",
      gap: "24px",
    },
    paymentBlock: { flex: 1 },
    paymentBadge: {
      background: PINK,
      color: "white",
      fontWeight: "700",
      fontSize: "0.82rem",
      padding: "5px 14px",
      display: "inline-block",
      marginBottom: "10px",
      textTransform: "uppercase",
    },
    paymentRow: { display: "flex", gap: "8px", fontSize: "0.88rem", color: "#222", marginBottom: "2px" },
    paymentLabel: { color: "#555", minWidth: "90px", fontWeight: "500" },
    paymentVal: { fontWeight: "700", color: "#111" },
    totalsBlock: { minWidth: "220px", textAlign: "right" },
    totalsRow: { display: "flex", justifyContent: "space-between", gap: "24px", fontSize: "0.9rem", color: "#444", marginBottom: "4px" },
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
    termsSection: { padding: "0 32px 16px 32px" },
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
    termsText: { fontSize: "0.82rem", color: "#444", lineHeight: 1.6, maxWidth: "55%" },
    thankYouRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-end",
      padding: "8px 32px 16px 32px",
    },
    thankYou: { color: PINK, fontWeight: "700", fontSize: "0.95rem", fontStyle: "italic" },
    signatureBlock: { textAlign: "center", minWidth: "150px" },
    signatureLine: { borderTop: "1.5px solid #333", paddingTop: "6px", marginTop: "4px" },
    signatureNameText: { fontWeight: "700", fontSize: "0.86rem", color: "#111", textTransform: "uppercase" },
    signatureTitleText: { fontSize: "0.76rem", color: "#555" },
    footerDivider: { height: "2px", background: PINK, margin: "0 32px" },
    footer: { padding: "14px 32px 10px 32px" },
    footerRow: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      fontSize: "0.82rem",
      color: "#333",
      marginBottom: "5px",
      flexWrap: "wrap",
    },
    footerItem: { display: "flex", alignItems: "center", gap: "7px", marginRight: "20px" },
    cornerAccent: { display: "flex", justifyContent: "flex-end" },
    cornerTriangle: { width: "80px", height: "22px", background: DARK, clipPath: "polygon(100% 0%, 100% 100%, 0% 100%)" },
  };

  return (
    <div className={invoicePreviewStyles.pageContainer}>
      <div className={invoicePreviewStyles.container}>
        {/* Print / Edit header (no-print) */}
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

        {/* Printable invoice card */}
        <div id="print-area" style={styles.page}>
          <div style={styles.topWhiteSpace} />

          {/* Header with trapezium SVG */}
          <div style={styles.topBar}>
            <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 1 }} viewBox="0 0 794 76" preserveAspectRatio="none">
              <polygon points="340,0 794,0 794,76 290,76" fill={DARK} />
              <polygon points="580,0 680,0 650,76 550,76" fill={PINK} />
              <rect x="774" y="0" width="20" height="76" fill="#1a0015" />
            </svg>
            <div style={styles.topBarLeft}>
              {logo ? (
                <img src={logo} alt="Logo" style={{ maxHeight: "56px", maxWidth: "180px", objectFit: "contain" }} />
              ) : (
                <div style={{ fontWeight: "900", fontSize: "1.3rem", color: DARK, letterSpacing: "0.04em" }}>
                  {sellerName || "YOUR COMPANY"}
                </div>
              )}
            </div>
            <div style={styles.topBarRight}>
              <span style={styles.invoiceTitle}>INVOICE</span>
            </div>
          </div>
          <div style={styles.pinkDivider} />

          {/* Client & Invoice Info */}
          <div style={styles.body}>
            <div style={styles.infoRow}>
              <div style={styles.clientBlock}>
                <div style={styles.invoiceTo}>Invoice to:</div>
                <div style={styles.clientName}>{client.name || "CLIENT'S NAME"}</div>
                {client.company && <div style={styles.clientCompany}>{client.company}</div>}
                <div style={styles.clientPhone}>Tel: {client.phone || "071234567890"}</div>
              </div>
              <div style={styles.invoiceMetaBlock}>
                <div style={styles.invoiceNoBadge}>
                  INVOICE NO.: {invoice.invoiceNumber || invoice.id || "00001"}
                </div>
                {invoice.issueDate && (
                  <div style={styles.invoiceDateRow}>
                    Invoice Date: <span style={styles.invoiceDateVal}>{formatDate(invoice.issueDate)}</span>
                  </div>
                )}
                {invoice.dueDate && (
                  <div style={{ ...styles.invoiceDateRow, marginTop: "3px" }}>
                    Due Date: <span style={styles.invoiceDateVal}>{formatDate(invoice.dueDate)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Items Table (striped) */}
          <div style={styles.tableSection}>
            <table style={styles.table}>
              <thead style={styles.thead}>
                <tr>
                  <th style={{ ...styles.th, width: "46px" }}>NO</th>
                  <th style={styles.th}>PRODUCT/SERVICE DESCRIPTION</th>
                  <th style={{ ...styles.th, ...styles.thRight, width: "70px" }}>QTY</th>
                  <th style={{ ...styles.th, ...styles.thRight, width: "130px" }}>UNIT PRICE ({currency})</th>
                  <th style={{ ...styles.th, ...styles.thRight, width: "130px" }}>TOTAL PRICE ({currency})</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ ...styles.tdEven, textAlign: "center", color: "#999", padding: "20px" }}>
                      No items added to this invoice.
                    </td>
                  </tr>
                ) : (
                  items.map((it, idx) => {
                    const rowStyle = idx % 2 === 0 ? styles.tdEven : styles.tdOdd;
                    return (
                      <tr key={it.id || idx}>
                        <td style={rowStyle}>{idx + 1}</td>
                        <td style={rowStyle}>{it.description || "—"}</td>
                        <td style={{ ...rowStyle, ...styles.tdRight }}>{it.qty || 0}</td>
                        <td style={{ ...rowStyle, ...styles.tdRight }}>{currencyFmt(it.unitPrice || 0, currency)}</td>
                        <td style={{ ...rowStyle, ...styles.tdRight, ...styles.tdBold }}>
                          {currencyFmt((it.qty || 0) * (it.unitPrice || 0), currency)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Payment Method & Totals */}
          <div style={styles.bottomSection}>
            <div style={styles.paymentBlock}>
              <div style={styles.paymentBadge}>PAYMENT METHOD</div>
              <div style={styles.paymentRow}>
                <span style={styles.paymentLabel}>PAYBILL:</span>
                <span style={styles.paymentVal}>{paybill}</span>
              </div>
              <div style={styles.paymentRow}>
                <span style={styles.paymentLabel}>ACC. NO.:</span>
                <span style={styles.paymentVal}>{accountNumber}</span>
              </div>
              <div style={styles.paymentRow}>
                <span style={styles.paymentLabel}>ACC. NAME:</span>
                <span style={styles.paymentVal}>{accountName}</span>
              </div>
            </div>
            <div style={styles.totalsBlock}>
              <div style={styles.totalsRow}>
                <span>SUB TOTAL</span>
                <span>{currencyFmt(subtotal, currency)}</span>
              </div>
              <div style={styles.totalsRow}>
                <span>TAX ({taxPercent}%)</span>
                <span>{currencyFmt(tax, currency)}</span>
              </div>
              <div style={styles.totalsRowBold}>
                <span>GRAND TOTAL</span>
                <span>{currencyFmt(total, currency)}</span>
              </div>
            </div>
          </div>

          {/* Terms & Conditions */}
          {terms && (
            <div style={styles.termsSection}>
              <div style={styles.termsTitle}>
                <span>TERMS &amp; CONDITIONS</span>
                <span style={{ flex: 1, height: "1px", background: "#bbb", marginLeft: "10px" }} />
              </div>
              <div style={styles.termsText}>{terms}</div>
            </div>
          )}

          {/* Thank you + Signature + Stamp */}
          <div style={styles.thankYouRow}>
            <div style={styles.thankYou}>{footer}</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "24px" }}>
              {stamp && (
                <div style={{ textAlign: "center" }}>
                  <img src={stamp} alt="Stamp" style={{ maxHeight: "60px", maxWidth: "60px", objectFit: "contain" }} />
                </div>
              )}
              <div style={styles.signatureBlock}>
                {signature && (
                  <img src={signature} alt="Signature" style={{ maxHeight: "36px", maxWidth: "130px", objectFit: "contain", marginBottom: "4px" }} />
                )}
                <div style={styles.signatureLine}>
                  <div style={styles.signatureNameText}>{signatureName || "AUTHORIZED SIGNATORY"}</div>
                  {signatureTitle && <div style={styles.signatureTitleText}>{signatureTitle}</div>}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={styles.footerDivider} />
          <div style={styles.footer}>
            <div style={styles.footerRow}>
              {sellerPhone && (
                <div style={styles.footerItem}>
                  <PhoneIcon /> <span>{sellerPhone}</span>
                </div>
              )}
              {sellerEmail && (
                <div style={styles.footerItem}>
                  <EmailIcon /> <span>{sellerEmail}</span>
                </div>
              )}
              {sellerWebsite && (
                <div style={styles.footerItem}>
                  <WebIcon /> <span>{sellerWebsite}</span>
                </div>
              )}
            </div>
            {(sellerAddress || sellerLocation) && (
              <div style={styles.footerRow}>
                <div style={styles.footerItem}>
                  <LocationIcon /> <span>{[sellerAddress, sellerLocation].filter(Boolean).join(", ")}</span>
                </div>
              </div>
            )}
          </div>
          <div style={styles.cornerAccent}>
            <div style={styles.cornerTriangle} />
          </div>
        </div>
      </div>
    </div>
  );
}