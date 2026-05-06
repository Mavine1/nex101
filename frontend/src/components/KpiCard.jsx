import React from 'react';
import { kpiCardStyles } from '../assets/dummyStyles';

// Icons (you can copy these from your Dashboard or define here)
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

const KpiCard = ({ title, value, hint, iconType = "default", trend, className = "" }) => {
  const IconComponent = MetricIcons[iconType] || MetricIcons.default;

  const getTrendColor = (trendValue) => {
    if (trendValue > 0) return kpiCardStyles.trendBadgePositive;
    if (trendValue < 0) return kpiCardStyles.trendBadgeNegative;
    return kpiCardStyles.trendBadgeNeutral;
  };

  return (
    <div className={`${kpiCardStyles.cardContainer} ${className}`}>
      <div className={kpiCardStyles.animatedBackground}></div>
      <div className={kpiCardStyles.content}>
        <div className={kpiCardStyles.headerContainer}>
          <div className={kpiCardStyles.mainContent}>
            <div className={kpiCardStyles.iconTrendContainer}>
              <div className={kpiCardStyles.iconContainer}>
                <IconComponent />
              </div>
              {trend !== undefined && (
                <div className={getTrendColor(trend)}>
                  <svg viewBox="0 0 24 24" width="16" height="16">
                    <path d="M23 6l-9.5 9.5-5-5L1 18" />
                    <path d="M17 6h6v6" />
                  </svg>
                  {Math.abs(trend)}%
                </div>
              )}
            </div>
            <div className={kpiCardStyles.textContent}>
              <div className={kpiCardStyles.title}>{title}</div>
              <div className={kpiCardStyles.value}>{value}</div>
            </div>
          </div>
        </div>
        <div className={kpiCardStyles.hintContainer}>
          <svg strokeWidth="2" width="14" height="14" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          {hint}
        </div>
      </div>
      <div className={kpiCardStyles.cornerAccent}></div>
    </div>
  );
};

export default KpiCard;