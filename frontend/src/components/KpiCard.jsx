import React from 'react';
import { kpiCardStyles } from '../assets/dummyStyles';

const MetricIcons = {
  // your icon map
};

const KpiCard = ({
  title,
  value,
  hint,
  iconType = "default",
  trend,
  className = "",
}) => {
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
                <IconComponent stroke="currentColor" strokeWidth="2" />
              </div>
              {trend && (
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
          <svg strokeWidth="2">
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