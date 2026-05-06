import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { invoicePreviewStyles } from "../assets/dummyStyles";
import StatusBadge from "../components/StatusBadge";

const API_BASE = "http://localhost:4000";

// ---------- helper: format KES (Kenyan Shilling) ----------
function formatCurrency(amount = 0, currency = "KES") {
  try {
    if (currency === "KES") {
      return new Intl.NumberFormat("en-KE", {
        style: "currency",
        currency: "KES",
      }).format(amount);
    }
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

function formatDate(dateInput) {
  if (!dateInput) return "—";
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-KE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ---------- resolve image URLs (same as before) ----------
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
    } catch {}
  }
  return `${API_BASE.replace(/\/+$/, "")}/${s.replace(/^\/+/, "")}`;
}

// ---------- main component ----------
export default function InvoicePreview() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { getToken, isSignedIn } = useAuth();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reminderOpen, setReminderOpen] = useState(false);

  // fetch invoice by id if not passed via state
  useEffect(() => {
    const fetchInvoice = async () => {
      if (!isSignedIn) return;
      try {
        const token = await getToken();
        const res = await fetch(`${API_BASE}/api/invoice/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Invoice not found");
        const json = await res.json();
        const data = json?.data || json;
        // normalize image URLs
        data.logo = resolveImageUrl(data.logoUrl || data.logo);
        data.stamp = resolveImageUrl(data.stampUrl || data.stamp);
        data.signature = resolveImageUrl(data.signatureUrl || data.signature);
        setInvoice(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (location.state?.invoice) {
      setInvoice(location.state.invoice);
      setLoading(false);
    } else if (id) {
      fetchInvoice();
    } else {
      setError("No invoice ID provided");
      setLoading(false);
    }
  }, [id, location.state, getToken, isSignedIn]);

  if (loading) return <div className="p-8 text-center">Loading invoice…</div>;
  if (error || !invoice)
    return (
      <div className={invoicePreviewStyles.emptyStateContainer}>
        <div className={invoicePreviewStyles.emptyStateCard}>
          <div className={invoicePreviewStyles.emptyStateIconContainer}>
            <svg className={invoicePreviewStyles.emptyStateIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className={invoicePreviewStyles.emptyStateTitle}>Invoice not found</div>
          <div className={invoicePreviewStyles.emptyStateMessage}>{error || "No invoice data"}</div>
          <button onClick={() => navigate("/app/invoices")} className={invoicePreviewStyles.emptyStateButton}>
            Back to Invoices
          </button>
        </div>
      </div>
    );

  // Destructure invoice fields with fallbacks
  const {
    invoiceNumber = "INV-0000",
    issueDate,
    dueDate,
    client = {},
    items = [],
    taxPercent = 16,
    notes = "",
    currency = "KES",
    status = "Draft",
    logo,
    stamp,
    signature,
    signatureOwnerName = "",
    signatureOwnerTitle = "",
    paymentMethod = {
      paybill: "247247",
      accountNo: "0799501465",
      accountName: "NEX101",
    },
    terms = "Deposit payable is 70% of the total cost of the project. All Payment must be cleared after completion and approval of the project.",
  } = invoice;

  const clientName = client.name || client.company || "Client Name";
  const clientEmail = client.email || "";
  const clientPhone = client.phone || "";
  const clientAddress = client.address || "";

  // Calculate subtotal, tax, total
  const subtotal = items.reduce((sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0), 0);
  const taxAmount = (subtotal * (taxPercent || 0)) / 100;
  const total = subtotal + taxAmount;

  // Helper to get item serial number
  const getSerial = (idx) => (idx + 1).toString().padStart(2, "0");

  return (
    <div className={invoicePreviewStyles.pageContainer}>
      <div className={invoicePreviewStyles.container}>
        {/* Header actions (no‑print) */}
        <div className={invoicePreviewStyles.headerContainer + " " + invoicePreviewStyles.noPrint}>
          <div>
            <h1 className={invoicePreviewStyles.headerTitle}>Invoice Preview</h1>
            <p className={invoicePreviewStyles.headerSubtitle}>
              #{invoiceNumber} · {formatDate(issueDate)}
            </p>
          </div>
          <div className={invoicePreviewStyles.headerActions}>
            <button
              onClick={() => setReminderOpen(true)}
              className={invoicePreviewStyles.sendReminderButton}
            >
              Send Reminder
            </button>
            <button
              onClick={() => navigate(`/app/invoices/${invoice.id}/edit`, { state: { invoice } })}
              className={invoicePreviewStyles.editInvoiceButton}
            >
              Edit Invoice
            </button>
            <button onClick={() => window.print()} className={invoicePreviewStyles.printButton}>
              Print / Download
            </button>
          </div>
        </div>

        {/* Printable invoice area – matches the design */}
        <div className={invoicePreviewStyles.printArea} id="invoice-print">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header with logo and invoice info */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex flex-wrap justify-between items-start gap-4">
                <div>
                  {logo ? (
                    <img src={logo} alt="Company logo" className="h-16 object-contain mb-3" />
                  ) : (
                    <div className="text-2xl font-bold text-gray-800 mb-2">Your Company</div>
                  )}
                  <div className="text-sm text-gray-600">KTDA Farmers Building</div>
                  <div className="text-sm text-gray-600">Moi Avenue, 3rd Floor - suite 303</div>
                  <div className="text-sm text-gray-600">Nairobi CBD</div>
                  <div className="text-sm text-gray-600 mt-1">+254799501465</div>
                  <div className="text-sm text-gray-600">info@nex101hub@gmail.com</div>
                  <div className="text-sm text-gray-600">www.nex101hub@gmail.com</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-800 mb-2">INVOICE</div>
                  <div className="text-sm text-gray-600">
                    <div><span className="font-medium">INVOICE NO.:</span> {invoiceNumber}</div>
                    <div><span className="font-medium">Invoice Date:</span> {formatDate(issueDate)}</div>
                    {dueDate && <div><span className="font-medium">Due Date:</span> {formatDate(dueDate)}</div>}
                    <div className="mt-2">
                      <StatusBadge status={status} size="small" showIcon />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Client & Payment Info (side by side) */}
            <div className="p-6 grid md:grid-cols-2 gap-6 border-b border-gray-100">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Invoice to:</h3>
                <div className="font-bold text-gray-800">{clientName}</div>
                {client.company && <div className="text-gray-600">{client.company}</div>}
                {clientPhone && <div className="text-gray-600">Tel: {clientPhone}</div>}
                {clientEmail && <div className="text-gray-600">{clientEmail}</div>}
                {clientAddress && <div className="text-gray-600">{clientAddress}</div>}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Payment Method</h3>
                <div className="space-y-1 text-gray-700">
                  <div><span className="font-medium">PAYBILL:</span> {paymentMethod.paybill}</div>
                  <div><span className="font-medium">ACC. NO.:</span> {paymentMethod.accountNo}</div>
                  <div><span className="font-medium">ACC. NAME:</span> {paymentMethod.accountName}</div>
                </div>
              </div>
            </div>

            {/* Items Table – exactly as the image */}
            <div className="p-6 border-b border-gray-100 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-2 font-semibold text-gray-600">NO</th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-600">PRODUCT/SERVICE DESCRIPTION</th>
                    <th className="text-right py-3 px-2 font-semibold text-gray-600">QTY</th>
                    <th className="text-right py-3 px-2 font-semibold text-gray-600">UNIT PRICE (KES)</th>
                    <th className="text-right py-3 px-2 font-semibold text-gray-600">TOTAL PRICE (KES)</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-8 text-gray-500">No items added</td>
                    </tr>
                  ) : (
                    items.map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-100">
                        <td className="py-3 px-2 text-gray-700">{getSerial(idx)}</td>
                        <td className="py-3 px-2 text-gray-800">{item.description || "—"}</td>
                        <td className="py-3 px-2 text-right text-gray-700">{item.quantity || 0}</td>
                        <td className="py-3 px-2 text-right text-gray-700">{formatCurrency(item.unitPrice || 0, "KES")}</td>
                        <td className="py-3 px-2 text-right font-medium text-gray-800">
                          {formatCurrency((item.quantity || 0) * (item.unitPrice || 0), "KES")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Totals and notes */}
            <div className="p-6 flex flex-col md:flex-row justify-between gap-6 border-b border-gray-100">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">TERMS & CONDITIONS</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{terms}</p>
                {notes && (
                  <div className="mt-4">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Notes</h3>
                    <p className="text-sm text-gray-600">{notes}</p>
                  </div>
                )}
              </div>
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(subtotal, "KES")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax ({taxPercent}%):</span>
                  <span>{formatCurrency(taxAmount, "KES")}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                  <span>Total:</span>
                  <span className="text-blue-600">{formatCurrency(total, "KES")}</span>
                </div>
              </div>
            </div>

            {/* Signature & Stamp */}
            <div className="p-6 flex flex-wrap justify-between items-end gap-6">
              <div className="text-center">
                <div className="text-sm font-medium text-gray-600 mb-2">Authorised Signature</div>
                {signature ? (
                  <img src={signature} alt="Signature" className="h-16 object-contain mx-auto" />
                ) : (
                  <div className="w-40 h-16 border-b border-gray-300 mx-auto"></div>
                )}
                <div className="mt-2 text-sm font-semibold">{signatureOwnerName || "Authorised Person"}</div>
                <div className="text-xs text-gray-500">{signatureOwnerTitle || "Director"}</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-gray-600 mb-2">Company Stamp</div>
                {stamp ? (
                  <img src={stamp} alt="Stamp" className="h-16 object-contain mx-auto" />
                ) : (
                  <div className="w-32 h-16 border border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400 text-xs">
                    Stamp
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 text-center text-xs text-gray-500 border-t border-gray-100">
              Thank you for your business!<br />
              +254799501465 · info@nex101hub@gmail.com · www.nex101hub@gmail.com<br />
              KTDA Farmers Building along Moi Avenue, 3rd Floor - suite 303 (Nairobi CBD)
            </div>
          </div>
        </div>
      </div>

      {/* AI reminder modal (same as before) */}
      <AiReminderModal
        open={reminderOpen}
        onClose={() => setReminderOpen(false)}
        invoiceNumber={invoiceNumber}
        clientName={clientName}
      />
    </div>
  );
}