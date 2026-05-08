import React, { useMemo } from 'react';

// ======================== ICONS ========================
const RevenueIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const DocumentIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

const InvoiceIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 12h-4l-3 9-4-18-3 9H2" />
  </svg>
);

const MetricIcons = {
  revenue: RevenueIcon,
  document: DocumentIcon,
  invoice: InvoiceIcon,
  default: InvoiceIcon,
};

// Helper: convert currency (KES, USD) to number for calculations
const convertToKES = (amount, currency) => {
  if (!currency || currency === "KES") return amount;
  if (currency === "USD") return amount * 130; // example rate
  return amount;
};

// Helper: compute invoice statistics from an array
const computeStats = (invoices) => {
  if (!invoices || !invoices.length) {
    return {
      totalCount: 0,
      totalAmount: 0,
      paidAmount: 0,
      unpaidAmount: 0,
      paidCount: 0,
      unpaidCount: 0,
    };
  }
  let totalAmount = 0;
  let paidAmount = 0;
  let unpaidAmount = 0;
  let paidCount = 0;
  let unpaidCount = 0;

  invoices.forEach(inv => {
    const amount = inv.total || inv.amount || 0;
    const currency = inv.currency || "KES";
    const amountInKES = convertToKES(amount, currency);
    totalAmount += amountInKES;
    if (inv.status?.toLowerCase() === "paid") {
      paidAmount += amountInKES;
      paidCount++;
    } else if (inv.status?.toLowerCase() === "unpaid" || inv.status?.toLowerCase() === "overdue") {
      unpaidAmount += amountInKES;
      unpaidCount++;
    }
  });
  return {
    totalCount: invoices.length,
    totalAmount,
    paidAmount,
    unpaidAmount,
    paidCount,
    unpaidCount,
  };
};

// ======================== KPI CARD COMPONENT ========================
const KpiCard = ({ 
  title, 
  value,           // optional if invoices + metricType provided
  hint, 
  iconType = "default", 
  trend, 
  className = "",
  invoices,        // optional: array of invoice objects
  metricType,      // "totalCount" | "totalAmount" | "paidAmount" | "unpaidAmount" | "paidCount" | "unpaidCount"
  currency = "KES"
}) => {
  const IconComponent = MetricIcons[iconType] || MetricIcons.default;

  // Compute dynamic value from invoices if provided
  const dynamicValue = useMemo(() => {
    if (invoices && metricType) {
      const stats = computeStats(invoices);
      let val = stats[metricType];
      if (metricType.includes("Amount") && val !== undefined) {
        // Format as currency
        return new Intl.NumberFormat("en-KE", {
          style: "currency",
          currency,
          minimumFractionDigits: 2,
        }).format(val);
      }
      return val?.toLocaleString() ?? "0";
    }
    return value;
  }, [invoices, metricType, value, currency]);

  const dynamicHint = useMemo(() => {
    if (invoices && metricType) {
      if (metricType === "paidAmount") return "Total received";
      if (metricType === "unpaidAmount") return "Outstanding balance";
      if (metricType === "totalCount") return "Active invoices";
      if (metricType === "paidCount") return "Paid invoices";
      if (metricType === "unpaidCount") return "Unpaid + overdue";
      if (metricType === "totalAmount") return "Total invoice value";
    }
    return hint;
  }, [invoices, metricType, hint]);

  const getTrendColor = (trendValue) => {
    if (trendValue > 0) return "text-green-600 bg-green-50";
    if (trendValue < 0) return "text-red-600 bg-red-50";
    return "text-gray-500 bg-gray-50";
  };

  const getTrendIcon = (trendValue) => {
    if (trendValue > 0) return "▲";
    if (trendValue < 0) return "▼";
    return "•";
  };

  // Use dynamicValue if computed, otherwise passed value
  const displayValue = dynamicValue !== undefined ? dynamicValue : (value ?? "0");

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-5 transition-all hover:shadow-md ${className}`}>
      {/* Header with icon and trend */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            {title}
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {displayValue}
          </div>
          {dynamicHint && (
            <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              {dynamicHint}
            </div>
          )}
        </div>
        <div className="p-2 bg-gray-50 rounded-full">
          <IconComponent className="w-5 h-5 text-gray-600" />
        </div>
      </div>

      {/* Trend badge */}
      {trend !== undefined && (
        <div className={`mt-4 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTrendColor(trend)}`}>
          <span>{getTrendIcon(trend)}</span>
          <span>{Math.abs(trend)}%</span>
        </div>
      )}
    </div>
  );
};

export default KpiCard;