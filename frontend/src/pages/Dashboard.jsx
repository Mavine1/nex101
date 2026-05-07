import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { dashboardStyles } from "../assets/dummyStyles";
import KpiCard from '../components/KpiCard';

// ---------- Injected CSS for dashboard enhancements ----------
const injectDashboardStyles = () => {
  if (document.getElementById("dashboard-inline-styles")) return;
  const style = document.createElement("style");
  style.id = "dashboard-inline-styles";
  style.innerHTML = `
    /* Smooth row hover transition */
    .dashboard-table-row {
      transition: all 0.2s ease;
    }
    .dashboard-table-row:hover {
      background-color: rgba(208, 0, 94, 0.05);
      transform: scale(1.01);
    }
    /* Quick action buttons custom animation */
    .quick-action-btn {
      transition: all 0.2s ease;
    }
    .quick-action-btn:hover {
      transform: translateX(4px);
    }
    /* KPI card value styling */
    .kpi-value {
      font-size: 1.75rem;
      font-weight: 700;
    }
  `;
  document.head.appendChild(style);
};

const HARD_RATES = { USD_TO_KES: 130 };

// ---------- Currency formatter for Kenyan Shilling ----------
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
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(n);
  } catch {
    return `${currency} ${amount}`;
  }
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

function capitalize(s) {
  if (!s) return s;
  return String(s).charAt(0).toUpperCase() + String(s).slice(1);
}

function convertToKES(amount = 0, currency = "KES") {
  const n = Number(amount || 0);
  const curr = String(currency || "KES").trim().toUpperCase();
  if (curr === "KES") return n;
  if (curr === "USD") return n * HARD_RATES.USD_TO_KES;
  return n;
}

// Icons
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

const StatusBadge = ({ status, size = "default", showIcon = true }) => {
  let colorClass = "";
  switch (status?.toLowerCase()) {
    case "paid":
      colorClass = "bg-green-100 text-green-800";
      break;
    case "unpaid":
      colorClass = "bg-red-100 text-red-800";
      break;
    case "overdue":
      colorClass = "bg-orange-100 text-orange-800";
      break;
    default:
      colorClass = "bg-gray-100 text-gray-800";
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {showIcon && <span className="mr-1.5 h-2 w-2 rounded-full bg-current" />}
      {status || "Draft"}
    </span>
  );
};

// ======================== MAIN DASHBOARD COMPONENT ========================
const Dashboard = () => {
  const navigate = useNavigate();
  const { getToken, isSignedIn } = useAuth();

  const [storedInvoices, setStoredInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [businessProfile, setBusinessProfile] = useState(null);

  // Inject custom styles once
  useEffect(() => {
    injectDashboardStyles();
  }, []);

  const obtainToken = useCallback(async () => {
    if (typeof getToken !== "function") return null;
    try {
      let token = await getToken({ template: "default" }).catch(() => null);
      if (!token) {
        token = await getToken({ forceRefresh: true }).catch(() => null);
      }
      return token;
    } catch (err) {
      console.warn("Failed to obtain token:", err);
      return null;
    }
  }, [getToken]);

  const fetchInvoices = useCallback(async () => {
    if (!isSignedIn) return;
    setLoading(true);
    setError(null);
    try {
      const token = await obtainToken();
      const headers = { Accept: "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      // Use relative URL (proxy will forward to backend)
      const res = await fetch("/api/invoice", {
        method: "GET",
        headers,
      });

      if (res.status === 401) {
        setError("Unauthorized. Please sign in.");
        setStoredInvoices([]);
        return;
      }

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        const msg = json?.message || `Failed to fetch (${res.status})`;
        throw new Error(msg);
      }

      const json = await res.json();
      const raw = json?.data || [];
      const mapped = (Array.isArray(raw) ? raw : []).map((inv) => {
        const clientObj = inv.client ?? {};
        const amountVal = Number(inv.total ?? inv.amount ?? 0);
        const currency = (inv.currency || "KES").toUpperCase();

        return {
          ...inv,
          id: inv.invoiceNumber || inv._id || String(inv._id || ""),
          client: clientObj,
          amount: amountVal,
          currency,
          status: typeof inv.status === "string" ? capitalize(inv.status) : inv.status || "Draft",
        };
      });
      setStoredInvoices(mapped);
    } catch (err) {
      console.error("Failed to fetch invoices:", err);
      setError(err?.message || "Failed to load invoices");
      setStoredInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [isSignedIn, obtainToken]);

  const fetchBusinessProfile = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      const token = await obtainToken();
      if (!token) return;
      // Use the correct /me endpoint (no hardcoded userId)
      const res = await fetch("/api/businessProfile/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      if (res.status === 401) return;
      if (!res.ok) return;
      const json = await res.json().catch(() => null);
      const data = json?.data || null;
      if (data) setBusinessProfile(data);
    } catch (err) {
      console.warn("Failed to fetch business profile:", err);
    }
  }, [isSignedIn, obtainToken]);

  useEffect(() => {
    if (isSignedIn) {
      fetchInvoices();
      fetchBusinessProfile();
    } else {
      setStoredInvoices([]);
      setLoading(false);
    }
  }, [isSignedIn, fetchInvoices, fetchBusinessProfile]);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "invoice_v1") fetchInvoices();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [fetchInvoices]);

  const kpis = useMemo(() => {
    const totalInvoices = storedInvoices.length;
    let totalPaid = 0;
    let totalUnpaid = 0;
    let paidCount = 0;
    let unpaidCount = 0;

    storedInvoices.forEach((inv) => {
      const rawAmount = typeof inv.amount === "number" ? inv.amount : Number(inv.total ?? inv.amount ?? 0);
      const invCurrency = inv.currency || "KES";
      const amtInKES = convertToKES(rawAmount, invCurrency);

      if (inv.status === "Paid") {
        totalPaid += amtInKES;
        paidCount++;
      }
      if (inv.status === "Unpaid" || inv.status === "Overdue") {
        totalUnpaid += amtInKES;
        unpaidCount++;
      }
    });

    const totalAmount = totalPaid + totalUnpaid;
    const paidPercentage = totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0;
    const unpaidPercentage = totalAmount > 0 ? (totalUnpaid / totalAmount) * 100 : 0;

    return {
      totalInvoices,
      totalPaid,
      totalUnpaid,
      paidCount,
      unpaidCount,
      paidPercentage,
      unpaidPercentage,
      averageInvoiceValue: totalInvoices > 0 ? totalAmount / totalInvoices : 0,
      collectionEfficiency: paidPercentage,
    };
  }, [storedInvoices]);

  const recent = useMemo(() => {
    return storedInvoices
      .slice()
      .sort((a, b) => (Date.parse(b.issueDate || 0) || 0) - (Date.parse(a.issueDate || 0) || 0))
      .slice(0, 5);
  }, [storedInvoices]);

  const getClientName = (inv) => {
    if (!inv) return "";
    if (typeof inv.client === "string") return inv.client;
    if (typeof inv.client === "object") return inv.client?.name || inv.client?.company || inv.company || "";
    return inv.company || "Client";
  };

  const getClientInitial = (inv) => {
    const name = getClientName(inv);
    return name ? name.charAt(0).toUpperCase() : "C";
  };

  const openInvoice = (inv) => {
    navigate(`/app/invoices/${inv.id}`, { state: { invoice: inv } });
  };

  if (loading) {
    return <div className="p-6">Loading invoices...</div>;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-600 mb-3">Error: {error}</div>
        <div className="flex gap-2">
          <button onClick={fetchInvoices} className="px-3 py-1 bg-blue-600 text-white rounded">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <KpiCard
          title="TOTAL INVOICES"
          value={kpis.totalInvoices}
          hint="Active Invoice"
          iconType="invoice"
          trend={3.5}
        />
        <KpiCard
          title="TOTAL PAID"
          value={currencyFmt(kpis.totalPaid, "KES")}
          hint="Received amount (KES)"
          iconType="revenue"
          trend={12.2}
        />
        <KpiCard
          title="TOTAL UNPAID"
          value={currencyFmt(kpis.totalUnpaid, "KES")}
          hint="Outstanding balance (KES)"
          iconType="document"
          trend={3.1}
        />
      </div>

      {/* Two-Column Layout */}
      <div className={dashboardStyles.mainGrid}>
        {/* Sidebar Column */}
        <div className={dashboardStyles.sidebarColumn}>
          {/* Quick Stats Card */}
          <div className={dashboardStyles.quickStatsCard}>
            <h3 className={dashboardStyles.quickStatsTitle}>Quick Stats</h3>
            <div className="space-y-3">
              <div className={dashboardStyles.quickStatsRow}>
                <span className={dashboardStyles.quickStatsLabel}>Paid Rate</span>
                <span className={dashboardStyles.quickStatsValue}>
                  {kpis.totalInvoices > 0 ? ((kpis.paidCount / kpis.totalInvoices) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className={dashboardStyles.quickStatsRow}>
                <span className={dashboardStyles.quickStatsLabel}>Avg. Invoice Value</span>
                <span className={dashboardStyles.quickStatsValue}>{currencyFmt(kpis.averageInvoiceValue, "KES")}</span>
              </div>
              <div className={dashboardStyles.quickStatsRow}>
                <span className={dashboardStyles.quickStatsLabel}>Collection Eff.</span>
                <span className={dashboardStyles.quickStatsValue}>{kpis.paidPercentage.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className={dashboardStyles.cardContainer}>
            <div className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className={dashboardStyles.quickActionsContainer}>
                <button
                  onClick={() => navigate("/app/create-invoice")}
                  className={`${dashboardStyles.quickActionButton} ${dashboardStyles.quickActionBlue} quick-action-btn`}
                >
                  <div className={`${dashboardStyles.quickActionIconContainer} ${dashboardStyles.quickActionIconBlue}`}>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14m-7-7h14" />
                    </svg>
                  </div>
                  <span className={dashboardStyles.quickActionText}>Create Invoice</span>
                </button>

                <button
                  onClick={() => navigate("/app/invoices")}
                  className={`${dashboardStyles.quickActionButton} ${dashboardStyles.quickActionGray} quick-action-btn`}
                >
                  <div className={`${dashboardStyles.quickActionIconContainer} ${dashboardStyles.quickActionIconGray}`}>
                    <FileTextIcon className="w-4 h-4" />
                  </div>
                  <span className={dashboardStyles.quickActionText}>View All Invoices</span>
                </button>

                <button
                  onClick={() => navigate("/app/business")}
                  className={`${dashboardStyles.quickActionButton} ${dashboardStyles.quickActionGray} quick-action-btn`}
                >
                  <div className={`${dashboardStyles.quickActionIconContainer} ${dashboardStyles.quickActionIconGray}`}>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <span className={dashboardStyles.quickActionText}>Business Profile</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Column (Recent Invoices) */}
        <div className={dashboardStyles.contentColumn}>
          <div className={dashboardStyles.cardContainerOverflow}>
            <div className={dashboardStyles.tableHeader}>
              <div className={dashboardStyles.tableHeaderContent}>
                <h3 className={dashboardStyles.tableTitle}>Recent Invoices</h3>
                <p className="text-sm text-gray-500">Latest 5 invoices from your account</p>
              </div>
              <button onClick={() => navigate("/app/invoices")} className={dashboardStyles.tableActionButton}>
                View All
                <svg className="w-4 h-4 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14m-7-7l7 7-7 7" />
                </svg>
              </button>
            </div>

            {recent.length === 0 ? (
              <div className={dashboardStyles.emptyState}>
                <div className={dashboardStyles.emptyStateText}>
                  <FileTextIcon className={dashboardStyles.emptyStateIcon} />
                  <div className={dashboardStyles.emptyStateMessage}>No invoices yet</div>
                  <button onClick={() => navigate("/app/create-invoice")} className={dashboardStyles.emptyStateAction}>
                    Create your first invoice
                  </button>
                </div>
              </div>
            ) : (
              <table className={dashboardStyles.table}>
                <thead>
                  <tr className={dashboardStyles.tableHead}>
                    <th className={dashboardStyles.tableHeaderCell}>Client & ID</th>
                    <th className={dashboardStyles.tableHeaderCell}>Amount</th>
                    <th className={dashboardStyles.tableHeaderCell}>Status</th>
                    <th className={dashboardStyles.tableHeaderCell}>Due Date</th>
                    <th className={dashboardStyles.tableHeaderCell}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((inv) => (
                    <tr
                      key={inv.id}
                      className={`${dashboardStyles.tableRow} dashboard-table-row`}
                      onClick={() => openInvoice(inv)}
                    >
                      <td className={dashboardStyles.tableCell}>
                        <div className="flex items-center gap-3">
                          <div className={dashboardStyles.clientAvatar}>{getClientInitial(inv)}</div>
                          <div>
                            <div className={dashboardStyles.clientInfo}>{getClientName(inv)}</div>
                            <div className={dashboardStyles.clientSubInfo}>#{inv.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className={dashboardStyles.tableCell}>
                        <div className={dashboardStyles.amountCell}>{currencyFmt(inv.amount, inv.currency || "KES")}</div>
                      </td>
                      <td className={dashboardStyles.tableCell}>
                        <StatusBadge status={inv.status} showIcon />
                      </td>
                      <td className={dashboardStyles.tableCell}>
                        <div className={dashboardStyles.dateCell}>{inv.dueDate ? formatDate(inv.dueDate) : "-"}</div>
                      </td>
                      <td className={dashboardStyles.tableCell}>
                        <div className="text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openInvoice(inv);
                            }}
                            className={dashboardStyles.actionButton}
                          >
                            <EyeIcon className="w-4 h-4 group-hover/btn" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;