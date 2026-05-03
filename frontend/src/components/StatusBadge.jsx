import React from "react";

const StatusIcons = {
  paid: ({ className = "w-3 h-3" }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  unpaid: ({ className = "w-3 h-3" }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
  overdue: ({ className = "w-3 h-3" }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  draft: ({ className = "w-3 h-3" }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
};

const statusConfig = {
  paid: {
    bg: "bg-emerald-50/80 backdrop-blur-sm",
    text: "text-emerald-700",
    border: "border-emerald-200",
    icon: "paid",
    gradient: "from-emerald-400 to-green-500",
    label: "Paid",
  },
  unpaid: {
    bg: "bg-amber-50/80 backdrop-blur-sm",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: "unpaid",
    gradient: "from-amber-400 to-orange-500",
    label: "Unpaid",
  },
  overdue: {
    bg: "bg-rose-50/80 backdrop-blur-sm",
    text: "text-rose-700",
    border: "border-rose-200",
    icon: "overdue",
    gradient: "from-rose-400 to-red-500",
    label: "Overdue",
  },
  draft: {
    bg: "bg-gray-50/80 backdrop-blur-sm",
    text: "text-gray-700",
    border: "border-gray-200",
    icon: "draft",
    gradient: "from-gray-400 to-gray-500",
    label: "Draft",
  },
  pending: {
    bg: "bg-blue-50/80 backdrop-blur-sm",
    text: "text-blue-700",
    border: "border-blue-200",
    icon: "draft",
    gradient: "from-blue-400 to-blue-500",
    label: "Pending",
  },
  cancelled: {
    bg: "bg-red-50/80 backdrop-blur-sm",
    text: "text-red-700",
    border: "border-red-200",
    icon: "unpaid",
    gradient: "from-red-400 to-red-500",
    label: "Cancelled",
  },
  default: {
    bg: "bg-gray-50/80 backdrop-blur-sm",
    text: "text-gray-700",
    border: "border-gray-200",
    icon: "draft",
    gradient: "from-gray-400 to-gray-500",
    label: "Unknown",
  },
};

const sizeClasses = {
  sm: "px-2 py-0.5 text-xs gap-1.5",
  md: "px-3 py-1 text-sm gap-2",
  lg: "px-4 py-1.5 text-base gap-2.5",
};

const StatusBadge = ({ 
  status = "", 
  size = "md", 
  showIcon = true,
  showLabel = true,
  className = "",
  variant = "solid"
}) => {
  const s = (status || "").toLowerCase();
  const config = statusConfig[s] || statusConfig.default;
  const IconComponent = StatusIcons[config.icon] || StatusIcons.draft;
  const sizeClass = sizeClasses[size] || sizeClasses.md;

  const getVariantClasses = () => {
    switch (variant) {
      case "outline":
        return `bg-transparent border ${config.border} ${config.text}`;
      case "gradient":
        return `bg-gradient-to-r ${config.gradient} text-white border-transparent`;
      default:
        return `${config.bg} ${config.text} border ${config.border}`;
    }
  };

  return (
    <div
      className={`
        inline-flex items-center rounded-full font-medium
        ${sizeClass}
        ${getVariantClasses()}
        transition-all duration-300 ease-out 
        hover:scale-105 hover:shadow-sm 
        group relative overflow-hidden
        ${className}
      `}
    >
      <div
        className={`
          absolute inset-0 bg-gradient-to-r ${config.gradient} 
          opacity-0 group-hover:opacity-5 
          transition-opacity duration-300
        `}
      />
      {showIcon && (
        <span className="inline-flex items-center justify-center relative z-10">
          <IconComponent className="w-3.5 h-3.5" />
        </span>
      )}
      {showLabel && (
        <span className="leading-none relative z-10">{config.label}</span>
      )}
    </div>
  );
};

// Status with count component
export const StatusWithCount = ({ status, count, size = "md", variant = "solid" }) => {
  return (
    <div className="inline-flex items-center gap-2 group">
      <StatusBadge status={status} size={size} variant={variant} />
      <span className="text-sm font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
        {count}
      </span>
    </div>
  );
};

export default StatusBadge;