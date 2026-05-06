import React from 'react';

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

// ======================== KPI CARD COMPONENT ========================
const KpiCard = ({ title, value, hint, iconType = "default", trend, className = "" }) => {
  const IconComponent = MetricIcons[iconType] || MetricIcons.default;

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

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-5 transition-all hover:shadow-md ${className}`}>
      {/* Header with icon and trend */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            {title}
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {value}
          </div>
          {hint && (
            <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              {hint}
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