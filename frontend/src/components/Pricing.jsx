import React, { useState } from "react";
import { useAuth, useClerk, SignedIn, SignedOut } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { pricingStyles, pricingCardStyles } from "../assets/dummyStyles";

const PricingCard = ({
  title,
  price,
  period,
  billingPeriod,
  description,
  features = [],
  isPopular = false,
  delay = 0,
  onCtaClick,
}) => {
  return (
    <div
      className={`${pricingCardStyles.card} ${
        isPopular ? pricingCardStyles.cardPopular : pricingCardStyles.cardRegular
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {isPopular && (
        <div className={pricingCardStyles.popularBadge}>
          <div className={pricingCardStyles.popularBadgeContent}>Most Popular</div>
        </div>
      )}
      {isPopular && <div className={pricingCardStyles.gradientOverlay} />}
      <div className={pricingCardStyles.animatedBorder}></div>

      <div className={pricingCardStyles.content}>
        <div className={pricingCardStyles.header}>
          <h3
            className={`${pricingCardStyles.title} ${
              isPopular ? pricingCardStyles.titlePopular : pricingCardStyles.titleRegular
            }`}
          >
            {title}
          </h3>
          <p className={pricingCardStyles.description}>{description}</p>
        </div>

        <div className={pricingCardStyles.priceContainer}>
          <div className={pricingCardStyles.priceWrapper}>
            <span
              className={`${pricingCardStyles.price} ${
                isPopular ? pricingCardStyles.pricePopular : pricingCardStyles.priceRegular
              }`}
            >
              {price}
            </span>
            {period && <span className={pricingCardStyles.period}>/{period}</span>}
          </div>
          {period === "year" && (
            <div className={pricingCardStyles.annualBadge}>Save 20% annually</div>
          )}
        </div>

        <ul className={pricingCardStyles.featuresList}>
          {features.map((feature, idx) => (
            <li key={idx} className={pricingCardStyles.featureItem}>
              <div
                className={`${pricingCardStyles.featureIcon} ${
                  isPopular
                    ? pricingCardStyles.featureIconPopular
                    : pricingCardStyles.featureIconRegular
                }`}
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <span className={pricingCardStyles.featureText}>{feature}</span>
            </li>
          ))}
        </ul>

        <div style={{ marginTop: 12 }}>
          <SignedIn>
            <button
              type="button"
              onClick={() => onCtaClick && onCtaClick({ title, isPopular, period: billingPeriod })}
              className={`${pricingCardStyles.ctaButton} ${
                isPopular
                  ? pricingCardStyles.ctaButtonPopular
                  : pricingCardStyles.ctaButtonRegular
              }`}
            >
              <span
                className={`${pricingCardStyles.ctaButtonText} ${
                  isPopular
                    ? pricingCardStyles.ctaButtonTextPopular
                    : pricingCardStyles.ctaButtonTextRegular
                }`}
              >
                {isPopular ? "Get Started" : "Choose Plan"}
              </span>
            </button>
          </SignedIn>

          <SignedOut>
            <button
              type="button"
              onClick={() =>
                onCtaClick &&
                onCtaClick(
                  { title, isPopular, period: billingPeriod },
                  { openSignInFallback: true }
                )
              }
              className={`${pricingCardStyles.ctaButton} ${pricingCardStyles.ctaButtonRegular}`}
            >
              <span className={pricingCardStyles.ctaButtonText}>Sign in to get started</span>
            </button>
          </SignedOut>
        </div>
      </div>
    </div>
  );
};
const Pricing = () => {
  const [billingPeriod, setBillingPeriod] = useState("monthly"); // "weekly", "monthly", "annual"
  const clerk = useClerk();
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();
  // All prices in Kenyan Shillings (KSh)
  const plans = {
    weekly: [
      {
        title: "Starter",
        price: "KSh 0",
        period: "week",
        description: "Perfect for freelancers and small projects",
        features: [
          "5 invoices per week",
          "Basic AI parsing",
          "Standard templates",
          "Email support",
          "PDF export",
        ],
        isPopular: false,
      },
      {
        title: "Professional",
        price: "KSh 500",
        period: "week",
        description: "For growing businesses and agencies",
        features: [
          "Unlimited invoices",
          "Advanced AI parsing",
          "Custom branding",
          "Priority support",
          "Advanced analytics",
          "Team collaboration (3 members)",
          "API access",
          "Unlimited AI tokens",
          "Expenses module",
        ],
        isPopular: true,
      },
      {
        title: "Enterprise",
        price: "KSh 650",
        period: "week",
        description: "For large organizations with custom needs",
        features: [
          "Everything in Professional",
          "Unlimited AI tokens",
          "Unlimited team members",
          "Custom workflows",
          "Dedicated account manager",
          "SLA guarantee",
          "White-label solutions",
          "Advanced security",
        ],
        isPopular: false,
      },
    ],
    monthly: [
      {
        title: "Starter",
        price: "KSh 0",
        period: "month",
        description: "Perfect for freelancers and small projects",
        features: [
          "5 invoices per month",
          "Basic AI parsing",
          "Standard templates",
          "Email support",
          "PDF export",
        ],
        isPopular: false,
      },
      {
        title: "Professional",
        price: "KSh 1,999",
        period: "month",
        description: "For growing businesses and agencies",
        features: [
          "Unlimited invoices",
          "Advanced AI parsing",
          "Custom branding",
          "Priority support",
          "Advanced analytics",
          "Team collaboration (3 members)",
          "API access",
          "Unlimited AI tokens",
          "Expenses module",
        ],
        isPopular: true,
      },
      {
        title: "Enterprise",
        price: "KSh 2,599",
        period: "month",
        description: "For large organizations with custom needs",
        features: [
          "Everything in Professional",
          "Unlimited AI tokens",
          "Unlimited team members",
          "Custom workflows",
          "Dedicated account manager",
          "SLA guarantee",
          "White-label solutions",
          "Advanced security",
        ],
        isPopular: false,
      },
    ],
    annual: [
      {
        title: "Starter",
        price: "KSh 0",
        period: "year",
        description: "Perfect for freelancers and small projects",
        features: [
          "5 invoices per month",
          "Basic AI parsing",
          "Standard templates",
          "Email support",
          "PDF export",
        ],
        isPopular: false,
        isAnnual: true,
      },
      {
        title: "Professional",
        price: "KSh 19,990",
        period: "year",
        description: "For growing businesses and agencies (billed annually)",
        features: [
          "Unlimited invoices",
          "Advanced AI parsing",
          "Custom branding",
          "Priority support",
          "Advanced analytics",
          "Team collaboration (3 members)",
          "API access",
          "Unlimited AI tokens",
          "Expenses module",
        ],
        isPopular: true,
        isAnnual: true,
      },
      {
        title: "Enterprise",
        price: "KSh 25,990",
        period: "year",
        description: "For large organizations with custom needs (billed annually)",
        features: [
          "Everything in Professional",
          "Unlimited AI tokens",
          "Unlimited team members",
          "Custom workflows",
          "Dedicated account manager",
          "SLA guarantee",
          "White-label solutions",
          "Advanced security",
        ],
        isPopular: false,
        isAnnual: true,
      },
    ],
  };

  const currentPlans = plans[billingPeriod];

  const handleCtaClick = (planMeta, flags = {}) => {
    if (flags.openSignInFallback || !isSignedIn) {
      if (clerk && typeof clerk.openSignIn === "function") {
        clerk.openSignIn({ redirectUrl: "/app/create-invoice" });
      } else {
        navigate("/sign-in");
      }
      return;
    }
    navigate("/app/create-invoice", { state: { fromPlan: planMeta } });
  };

  // Additional features list
  const additionalFeatures = [
    "Secure cloud storage",
    "Mobile-friendly interface",
    "Automatic backups",
    "Real-time notifications",
    "Multi-currency support",
    "Tax calculation (Kenya VAT 16%)",
  ];

  return (
    <section id="pricing" className={pricingStyles.section}>
      <div className={pricingStyles.bgElement1}></div>
      <div className={pricingStyles.bgElement2}></div>
      <div className={pricingStyles.bgElement3}></div>

      <div className={pricingStyles.container}>
        <div className={pricingStyles.headerContainer}>
          <div className={pricingStyles.badge}>
            <span className={pricingStyles.badgeDot}></span>
            <span className={pricingStyles.badgeText}>Transparent Pricing</span>
          </div>
          <h2 className={pricingStyles.title}>
            Simple, <span className={pricingStyles.titleGradient}>Fair</span>
          </h2>
          <p className={pricingStyles.description}>
            Start free, upgrade as you grow. No hidden fees, no surprise charges.
          </p>
        </div>

        {/* Billing Toggle – now three options */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex bg-white/80 backdrop-blur-sm rounded-2xl p-2 border border-gray-200/60 shadow-sm gap-2">
            <button
              onClick={() => setBillingPeriod("weekly")}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                billingPeriod === "weekly"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                billingPeriod === "monthly"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod("annual")}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                billingPeriod === "annual"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Annual
              <span className="ml-2 text-sm bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className={pricingStyles.grid}>
          {currentPlans.map((plan, index) => (
            <PricingCard
              key={plan.title}
              title={plan.title}
              price={plan.price}
              period={plan.period}
              description={plan.description}
              features={plan.features}
              isPopular={plan.isPopular}
              isAnnual={plan.isAnnual || false}
              delay={index * 100}
              onCtaClick={handleCtaClick}
            />
          ))}
        </div>

        {/* Additional Features Section */}
        <div className={pricingStyles.additionalInfo}>
          <div className={pricingStyles.featuresCard}>
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Everything you need to manage invoices
            </h3>
            <div className={pricingStyles.featuresGrid}>
              {additionalFeatures.map((feature, index) => (
                <div key={index} className={pricingStyles.featureItem}>
                  <div className={pricingStyles.featureDot}></div>
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FAQ CTA Section */}
        <div className={pricingStyles.faqCta}>
          <p className={pricingStyles.faqText}>
            Have questions about pricing?{" "}
            <button className={pricingStyles.contactLink}>
              Contact our sales team
            </button>
          </p>
        </div>
      </div>
    </section>
  );
};

export default Pricing;