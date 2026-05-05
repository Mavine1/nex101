import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // adjust path as needed
import { dashboardStyles } from '../assets/dummyStyles';

// ==================== CONSTANTS ====================
const API_BASE = "http://localhost:4000";
const HARD_RATES = { USD_TO_INR: 83 };

// ==================== HELPER FUNCTIONS ====================
function normalizeClient(raw) {
  if (!raw) return { name: "", email: "", address: "", phone: "" };
  if (typeof raw === "string")
    return { name: raw, email: "", address: "", phone: "" };
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

function currencyFmt(amount = 0, currency = "INR") {
  try {
    const n = Number(amount || 0);
    if (currency === "INR")
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
      }).format(n);
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

function convertToINR(amount = 0, currency = "INR") {
  const n = Number(amount || 0);
  const curr = String(currency || "INR").trim().toUpperCase();
  if (curr === "INR") return n;
  if (curr === "USD") return n * HARD_RATES.USD_TO_INR;
  return n;
}

// ==================== ICON COMPONENTS ====================
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

const BrainIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9.5 14.5A2.5 2.5 0 0 1 7 12c0-1.38.5-2 1-3 1.072-2.143 2.928-3.25 4.5-3 1.572.25 3 2 3 4 0 1.5-.5 2.5-1 3.5-1 2-2 3-3.5 3-1.5 0-2.5-1.5-2.5-3Z" />
    <path d="M14.5 9.5A2.5 2.5 0 0 1 17 12c0 1.38-.5 2-1 3-1.072 2.143-2.928 3.25-4.5 3-1.572-.25-3-2-3-4 0-1.5.5-2.5 1-3.5 1-2 2-3 3.5-3 1.5 0 2.5 1.5 2.5 3Z" />
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

// ==================== KPI CARD COMPONENT ====================
const KpiCard = ({ title, value, hint, iconType, trend }) => {
  const getIcon = () => {
    switch (iconType) {
      case 'document': return <FileTextIcon className="w-6 h-6" />;
      case 'revenue': return <DollarIcon className="w-6 h-6" />;
      case 'clock': return <ClockIcon className="w-6 h-6" />;
      case 'brain': return <BrainIcon className="w-6 h-6" />;
      default: return <FileTextIcon className="w-6 h-6" />;
    }
  };

  return (
    <div className={dashboardStyles.kpiCard}>
      <div className={dashboardStyles.kpiIconWrapper}>{getIcon()}</div>
      <div className={dashboardStyles.kpiContent}>
        <h3 className={dashboardStyles.kpiTitle}>{title}</h3>
        <p className={dashboardStyles.kpiValue}>{value}</p>
        <div className={dashboardStyles.kpiFooter}>
          <span className={dashboardStyles.kpiHint}>{hint}</span>
          {trend !== undefined && (
            <span className={`${dashboardStyles.kpiTrend} ${trend >= 0 ? dashboardStyles.trendPositive : dashboardStyles.trendNegative}`}>
              <TrendingUpIcon className="w-3 h-3 inline mr-1" />
              {trend >= 0 ? `+${trend}%` : `${trend}%`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// ==================== MAIN DASHBOARD COMPONENT ====================
const Dashboard = () => {
  const navigate = useNavigate();
  const { getToken, isSignedIn } = useAuth();

  // State
  const [storedInvoices, setStoredInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [businessProfile, setBusinessProfile] = useState(null);

  // Obtain token helper
  const obtainToken = useCallback(async () => {
    if (typeof getToken !== "function") return null;
    try {
      let token = await getToken({ template: "default" }).catch(() => null);
      if (!token) {
        token = await getToken({ forceRefresh: true }).catch(() => null);
      }
      return token;
    } catch {
      return null;
    }
  }, [getToken]);

  // Fetch invoices
  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await obtainToken();
      const headers = { Accept: "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/api/invoice`, {
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
        const clientObj = normalizeClient(inv.client ?? {});
        const amountVal = Number(inv.total ?? inv.amount ?? 0);
        const currency = (inv.currency || "INR").toUpperCase();

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
  }, [obtainToken]);

  // Fetch business profile
  const fetchBusinessProfile = useCallback(async () => {
    try {
      const token = await obtainToken();
      if (!token) return;

      const res = await fetch(`${API_BASE}/api/business/profile`, {
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
  }, [obtainToken]);

  // KPIs calculation
  const kpis = useMemo(() => {
    const totalInvoices = storedInvoices.length;
    let totalPaid = 0;
    let totalUnpaid = 0;
    let paidCount = 0;
    let unpaidCount = 0;

    storedInvoices.forEach((inv) => {
      const rawAmount = typeof inv.amount === "number" ? inv.amount : Number(inv.total ?? inv.amount ?? 0);
      const invCurrency = inv.currency || "INR";
      const amtInINR = convertToINR(rawAmount, invCurrency);

      if (inv.status === "Paid") {
        totalPaid += amtInINR;
        paidCount++;
      }
      if (inv.status === "Unpaid" || inv.status === "Overdue") {
        totalUnpaid += amtInINR;
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
    };
  }, [storedInvoices]);

  // Recent invoices (last 5 by issueDate)
  const recent = useMemo(() => {
    return storedInvoices
      .slice()
      .sort(
        (a, b) =>
          (Date.parse(b.issueDate || 0) || 0) -
          (Date.parse(a.issueDate || 0) || 0)
      )
      .slice(0, 5);
  }, [storedInvoices]);

  // Helpers for client display
  const getClientName = (inv) => {
    if (!inv) return "";
    if (typeof inv.client === "string") return inv.client;
    if (typeof inv.client === "object")
      return inv.client?.name || inv.client?.company || inv.company || "";
    return inv.company || "Client";
  };

  const openInvoice = (invRow) => {
    navigate(`/app/invoices/${invRow.id}`, { state: { invoice: invRow } });
  };

  // Fetch data on mount and listen to storage events
  useEffect(() => {
    if (isSignedIn) {
      fetchInvoices();
      fetchBusinessProfile();
    }

    const onStorage = (e) => {
      if (e.key === "invoice_v1" && isSignedIn) {
        fetchInvoices();
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [fetchInvoices, fetchBusinessProfile, isSignedIn]);

  // Loading state
  if (loading) {
    return (
      <div className={dashboardStyles.pageContainer}>
        <div className="p-6 text-center">Loading invoices...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    const isUnauthorized = String(error).toLowerCase().includes("unauthorized");
    return (
      <div className={dashboardStyles.pageContainer}>
        <div className="p-6">
          <div className="text-red-600 mb-3">Error: {error}</div>
          <div className="flex gap-2">
            <button onClick={fetchInvoices} className="px-3 py-1 bg-blue-600 text-white rounded">
              Retry
            </button>
            {isUnauthorized && (
              <button onClick={() => navigate("/login")} className="px-3 py-1 bg-gray-700 text-white rounded">
                Sign in
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main dashboard content
  return (
    <div className={dashboardStyles.pageContainer}>
      {/* Header */}
      <div className={dashboardStyles.headerContainer}>
        <h1 className={dashboardStyles.headerTitle}>Dashboard Overview</h1>
        <p className={dashboardStyles.headerSubtitle}>
          Track your invoicing performance and business insights
          {businessProfile?.businessName && ` — ${businessProfile.businessName}`}
        </p>
      </div>

      {/* KPI Grid */}
      <div className={dashboardStyles.kpiGrid}>
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
          hint="Pending collection"
          iconType="clock"
          trend={-5.3}
        />
        <KpiCard
          title="Collection Rate"
          value={`${kpis.paidPercentage.toFixed(1)}%`}
          hint="Paid vs total"
          iconType="brain"
          trend={kpis.paidPercentage - 65} // mock trend relative to 65% baseline
        />
      </div>

      {/* Two-column layout: Recent Invoices + Quick Actions */}
      <div className={dashboardStyles.twoColumnGrid}>
        {/* Recent Invoices Table */}
        <div className={dashboardStyles.cardContainer}>
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">Recent Invoices</h3>
              {storedInvoices.length > 5 && (
                <button
                  onClick={() => navigate("/app/invoices")}
                  className="text-sm text-blue-600 hover:underline"
                >
                  View all →
                </button>
              )}
            </div>
            {recent.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No invoices found. Create your first invoice!</p>
            ) : (
              <div className="overflow-x-auto">
                <table className={dashboardStyles.invoiceTable}>
                  <thead>
                    <tr>
                      <th>Invoice #</th>
                      <th>Client</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((inv) => (
                      <tr key={inv.id}>
                        <td className="font-medium">{inv.invoiceNumber || inv.id}</td>
                        <td>{getClientName(inv)}</td>
                        <td>{formatDate(inv.issueDate || inv.createdAt)}</td>
                        <td>{currencyFmt(inv.amount, inv.currency)}</td>
                        <td>
                          <span className={`${dashboardStyles.statusBadge} ${dashboardStyles[inv.status?.toLowerCase()]}`}>
                            {inv.status}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => openInvoice(inv)}
                            className="text-gray-500 hover:text-gray-700"
                            title="View invoice"
                          >
                            <EyeIcon className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className={dashboardStyles.cardContainer}>
          <div className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className={dashboardStyles.quickActionsContainer}>
              <button
                onClick={() => navigate("/app/create-invoice")}
                className={`${dashboardStyles.quickActionButton} ${dashboardStyles.quickActionBlue}`}
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
                className={`${dashboardStyles.quickActionButton} ${dashboardStyles.quickActionGray}`}
              >
                <div className={`${dashboardStyles.quickActionIconContainer} ${dashboardStyles.quickActionIconGray}`}>
                  <FileTextIcon className="w-4 h-4" />
                </div>
                <span className={dashboardStyles.quickActionText}>View All Invoices</span>
              </button>

              <button
                onClick={() => navigate("/app/business")}
                className={`${dashboardStyles.quickActionButton} ${dashboardStyles.quickActionGray}`}
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
    </div>
  );
};

export default Dashboard;