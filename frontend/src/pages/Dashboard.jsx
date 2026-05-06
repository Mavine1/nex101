import React, { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";

/* ── constants ─────────────────────────────────────────── */
const API_BASE = "http://localhost:4000";

/* ── helpers ────────────────────────────────────────────── */
function capitalize(s) {
  if (!s) return s;
  return String(s).charAt(0).toUpperCase() + String(s).slice(1);
}

function formatDate(dateInput) {
  if (!dateInput) return "—";
  const d = dateInput instanceof Date ? dateInput : new Date(String(dateInput));
  if (Number.isNaN(d.getTime())) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function currencyFmt(amount = 0, currency = "INR") {
  try {
    const n = Number(amount || 0);
    if (currency === "INR")
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
      }).format(n);
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(n);
  } catch {
    return `${currency} ${amount}`;
  }
}

function normalizeClient(raw) {
  if (!raw) return { name: "", email: "", address: "", phone: "" };
  if (typeof raw === "string") return { name: raw, email: "", address: "", phone: "" };
  if (typeof raw === "object") {
    return {
      name: raw.name ?? raw.company ?? raw.client ?? "",
      email: raw.email ?? raw.emailAddress ?? "",
      address: raw.address ?? "",
      phone: raw.phone ?? raw.contact ?? "",
    };
  }
  return { name: "", email: "", address: "", phone: "" };
}

const HARD_RATES = { USD_TO_INR: 83 };

function convertToINR(amount = 0, currency = "INR") {
  const n = Number(amount || 0);
  const curr = String(currency || "INR").trim().toUpperCase();
  if (curr === "INR") return n;
  if (curr === "USD") return n * HARD_RATES.USD_TO_INR;
  return n;
}

/* ── icons ──────────────────────────────────────────────── */
const TrendingUpIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M23 6l-9.5 9.5-5-5L1 18" />
    <path d="M17 6h6v6" />
  </svg>
);

const DollarIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const ClockIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const FileTextIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const EyeIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const PlusIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 5v14m-7-7h14" />
  </svg>
);

const ArrowRightIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 12h14m-7-7l7 7-7 7" />
  </svg>
);

const UserIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

/* ── status badge ───────────────────────────────────────── */
const statusColors = {
  Paid: { bg: "#dcfce7", text: "#15803d", dot: "#16a34a" },
  Unpaid: { bg: "#fef9c3", text: "#92400e", dot: "#d97706" },
  Overdue: { bg: "#fee2e2", text: "#991b1b", dot: "#dc2626" },
  Draft: { bg: "#f1f5f9", text: "#475569", dot: "#94a3b8" },
};

function StatusBadge({ status }) {
  const colors = statusColors[status] || statusColors.Draft;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: "2px 10px",
        borderRadius: "999px",
        fontSize: "12px",
        fontWeight: 600,
        backgroundColor: colors.bg,
        color: colors.text,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          backgroundColor: colors.dot,
          flexShrink: 0,
        }}
      />
      {status}
    </span>
  );
}

/* ── KPI card ───────────────────────────────────────────── */
const iconMap = {
  document: <FileTextIcon className="w-5 h-5" />,
  revenue: <DollarIcon className="w-5 h-5" />,
  clock: <ClockIcon className="w-5 h-5" />,
  trending: <TrendingUpIcon className="w-5 h-5" />,
};

const kpiAccents = {
  document: { icon: "#6366f1", bg: "#eef2ff" },
  revenue: { icon: "#0ea5e9", bg: "#e0f2fe" },
  clock: { icon: "#f59e0b", bg: "#fef3c7" },
  trending: { icon: "#10b981", bg: "#d1fae5" },
};

function KpiCard({ title, value, hint, iconType = "document", trend }) {
  const accent = kpiAccents[iconType] || kpiAccents.document;
  const icon = iconMap[iconType] || iconMap.document;
  const isPositive = trend >= 0;

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        padding: "20px 24px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        border: "1px solid #f1f5f9",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ margin: 0, fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>{title}</p>
          <p style={{ margin: "6px 0 0", fontSize: 24, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.5px" }}>
            {value}
          </p>
        </div>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            backgroundColor: accent.bg,
            color: accent.icon,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: isPositive ? "#16a34a" : "#dc2626",
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          {isPositive ? "↑" : "↓"} {Math.abs(trend)}%
        </span>
        <span style={{ fontSize: 12, color: "#94a3b8" }}>{hint}</span>
      </div>
    </div>
  );
}

/* ── useAuth stub (replace with real hook) ──────────────── */
function useAuth() {
  return { getToken: null, isSignedIn: false };
}

/* ── Dashboard ──────────────────────────────────────────── */
const Dashboard = () => {
  const navigate = useNavigate();
  const { getToken, isSignedIn } = useAuth();

  const [storedInvoices, setStoredInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [businessProfile, setBusinessProfile] = useState(null);

  /* obtain token */
  const obtainToken = useCallback(async () => {
    if (typeof getToken !== "function") return null;
    try {
      return await getToken({ template: "default" });
    } catch {
      return null;
    }
  }, [getToken]);

  /* fetch invoices */
  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await obtainToken();
      const headers = { Accept: "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/api/invoices`, { method: "GET", headers });
      const json = await res.json().catch(() => null);

      if (res.status === 401) {
        setError("Unauthorized. Please sign in.");
        setStoredInvoices([]);
        return;
      }
      if (!res.ok) {
        throw new Error(json?.message || `Failed to fetch (${res.status})`);
      }

      const raw = json?.data || [];
      const mapped = (Array.isArray(raw) ? raw : []).map((inv) => {
        const clientObj = inv.client ?? {};
        const amountVal = Number(inv.total ?? inv.amount ?? 0);
        const currency = (inv.currency || "INR").toUpperCase();
        return {
          ...inv,
          id: inv.invoiceNumber || inv._id || String(inv._id || ""),
          client: clientObj,
          amount: amountVal,
          currency,
          status:
            typeof inv.status === "string" ? capitalize(inv.status) : inv.status || "Draft",
        };
      });
      setStoredInvoices(mapped);
    } catch (err) {
      setError(err?.message || "Failed to load invoices");
      setStoredInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [obtainToken]);

  /* fetch business profile */
  const fetchBusinessProfile = useCallback(async () => {
    try {
      const token = await obtainToken();
      const headers = { Accept: "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${API_BASE}/api/business`, { method: "GET", headers });
      if (res.status === 401 || !res.ok) return;
      const json = await res.json().catch(() => null);
      const data = json?.data || null;
      if (data) setBusinessProfile(data);
    } catch (err) {
      console.warn("Failed to fetch business profile:", err);
    }
  }, [obtainToken]);

  /* on mount */
  React.useEffect(() => {
    fetchInvoices();
    fetchBusinessProfile();
  }, [fetchInvoices, fetchBusinessProfile]);

  /* kpis */
  const kpis = useMemo(() => {
    const totalInvoices = storedInvoices.length;
    let totalPaid = 0;
    let totalUnpaid = 0;
    let paidCount = 0;
    let unpaidCount = 0;

    storedInvoices.forEach((inv) => {
      const rawAmount =
        typeof inv.amount === "number" ? inv.amount : Number(inv.total ?? inv.amount ?? 0);
      const invCurrency = inv.currency || "INR";
      const amtInINR = convertToINR(rawAmount, invCurrency);
      if (inv.status === "Paid") { totalPaid += amtInINR; paidCount++; }
      if (inv.status === "Unpaid" || inv.status === "Overdue") { totalUnpaid += amtInINR; unpaidCount++; }
    });

    const totalAmount = totalPaid + totalUnpaid;
    const paidPercentage = totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0;
    const unpaidPercentage = totalAmount > 0 ? (totalUnpaid / totalAmount) * 100 : 0;

    return { totalInvoices, totalPaid, totalUnpaid, paidCount, unpaidCount, paidPercentage, unpaidPercentage };
  }, [storedInvoices]);

  /* recent invoices */
  const recent = useMemo(() => {
    return storedInvoices
      .slice()
      .sort((a, b) => (Date.parse(b.issueDate || 0) || 0) - (Date.parse(a.issueDate || 0) || 0))
      .slice(0, 5);
  }, [storedInvoices]);

  const getClientName = (inv) => {
    if (!inv) return "";
    if (typeof inv.client === "string") return inv.client;
    if (typeof inv.client === "object")
      return inv.client?.name || inv.client?.company || inv.company || "";
    return inv.company || "Client";
  };

  const getClientInitial = (inv) => {
    const n = getClientName(inv);
    return n ? n.charAt(0).toUpperCase() : "C";
  };

  function openInvoice(invRow) {
    navigate(`/app/invoices/${invRow.id}`, { state: { invoice: invRow } });
  }

  /* ── render ─────────────────────────────────────────── */
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
        padding: "32px 24px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: "#0f172a" }}>
            Dashboard
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: "#64748b" }}>
            Welcome back{businessProfile?.name ? `, ${businessProfile.name}` : ""}
          </p>
        </div>

        {/* Error state */}
        {error && (
          <div
            style={{
              background: "#fff",
              border: "1px solid #fecaca",
              borderRadius: 12,
              padding: "16px 20px",
              marginBottom: 24,
            }}
          >
            <p style={{ margin: 0, color: "#dc2626", fontWeight: 600, fontSize: 14 }}>
              Error: {error}
            </p>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button
                onClick={fetchInvoices}
                style={{
                  padding: "6px 14px",
                  background: "#2563eb",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  fontSize: 13,
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                Retry
              </button>
              {String(error).toLowerCase().includes("unauthorized") && (
                <button
                  onClick={() => navigate("/login")}
                  style={{
                    padding: "6px 14px",
                    background: "#475569",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    fontSize: 13,
                    cursor: "pointer",
                    fontWeight: 500,
                  }}
                >
                  Sign in
                </button>
              )}
            </div>
          </div>
        )}

        {/* KPI grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
            marginBottom: 28,
          }}
        >
          <KpiCard
            title="Total Invoices"
            value={kpis.totalInvoices}
            hint="Active invoices"
            iconType="document"
            trend={8.5}
          />
          <KpiCard
            title="Total Paid"
            value={currencyFmt(kpis.totalPaid, "INR")}
            hint="Received amount (INR)"
            iconType="revenue"
            trend={12.2}
          />
          <KpiCard
            title="Total Unpaid"
            value={currencyFmt(kpis.totalUnpaid, "INR")}
            hint="Accounts receivable"
            iconType="clock"
            trend={-3.1}
          />
          <KpiCard
            title="Paid Rate"
            value={`${kpis.paidPercentage.toFixed(1)}%`}
            hint="of total billed"
            iconType="trending"
            trend={kpis.paidPercentage - 50}
          />
        </div>

        {/* Bottom grid: recent invoices + quick actions */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20 }}>

          {/* Recent Invoices */}
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              border: "1px solid #f1f5f9",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "18px 24px",
                borderBottom: "1px solid #f1f5f9",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#0f172a" }}>
                Recent Invoices
              </h3>
              <button
                onClick={() => navigate("/app/invoices")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 13,
                  color: "#2563eb",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 500,
                  padding: 0,
                }}
              >
                View all <ArrowRightIcon />
              </button>
            </div>

            {loading ? (
              <div style={{ padding: 32, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
                Loading invoices...
              </div>
            ) : recent.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
                No invoices yet.{" "}
                <button
                  onClick={() => navigate("/app/create-invoice")}
                  style={{ color: "#2563eb", background: "none", border: "none", cursor: "pointer", fontSize: 14 }}
                >
                  Create one
                </button>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["Invoice", "Client", "Date", "Amount", "Status", ""].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "10px 16px",
                          textAlign: "left",
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#64748b",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recent.map((inv, i) => (
                    <tr
                      key={inv.id || i}
                      style={{
                        borderTop: "1px solid #f1f5f9",
                        transition: "background 0.15s",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      onClick={() => openInvoice(inv)}
                    >
                      <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "#0f172a" }}>
                        #{inv.id}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: "50%",
                              background: "#e0f2fe",
                              color: "#0369a1",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 12,
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            {getClientInitial(inv)}
                          </div>
                          <span style={{ fontSize: 13, color: "#334155" }}>{getClientName(inv)}</span>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: "#64748b" }}>
                        {formatDate(inv.issueDate)}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "#0f172a" }}>
                        {currencyFmt(inv.amount, inv.currency)}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <StatusBadge status={inv.status} />
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); openInvoice(inv); }}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#94a3b8",
                            display: "flex",
                            alignItems: "center",
                            padding: 4,
                            borderRadius: 4,
                          }}
                          title="View invoice"
                        >
                          <EyeIcon />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Quick Actions */}
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              border: "1px solid #f1f5f9",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              padding: "18px 20px",
              alignSelf: "start",
            }}
          >
            <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 600, color: "#0f172a" }}>
              Quick Actions
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Create Invoice */}
              <button
                onClick={() => navigate("/app/create-invoice")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "none",
                  background: "#eff6ff",
                  color: "#1d4ed8",
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: "inherit",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#dbeafe")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#eff6ff")}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: "#2563eb",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <PlusIcon />
                </div>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Create Invoice</span>
              </button>

              {/* View All Invoices */}
              <button
                onClick={() => navigate("/app/invoices")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "none",
                  background: "#f8fafc",
                  color: "#334155",
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: "inherit",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f5f9")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#f8fafc")}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: "#e2e8f0",
                    color: "#475569",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <FileTextIcon className="w-4 h-4" />
                </div>
                <span style={{ fontSize: 13, fontWeight: 600 }}>View All Invoices</span>
              </button>

              {/* Business Profile */}
              <button
                onClick={() => navigate("/app/business")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "none",
                  background: "#f8fafc",
                  color: "#334155",
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: "inherit",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f5f9")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#f8fafc")}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: "#e2e8f0",
                    color: "#475569",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <UserIcon />
                </div>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Business Profile</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;