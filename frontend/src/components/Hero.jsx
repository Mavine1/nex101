import React from "react";
import { useNavigate } from "react-router-dom";
import { useClerk, SignedIn, SignedOut } from "@clerk/clerk-react";
import { heroStyles } from "../assets/dummyStyles";

const Hero = () => {
  const navigate = useNavigate();
  const clerk = useClerk();

  const handleSignedInPrimary = () => {
    navigate("/app/create-invoice");
  };

  const handleSignedOutPrimary = () => {
    try {
      if (clerk && typeof clerk.openSignUp === "function") {
        clerk.openSignUp();
      }
    } catch (err) {
      console.error("failed to open clerk signup modal:", err);
    }
  };

  // Demo data for the invoice preview card (Kenyan Shillings)
  const invoiceItems = [
    { description: "Website Design & Development", amount: "KSh 15,000" },
    { description: "Consultation (2 hours)", amount: "KSh 3,000" },
    { description: "Premium Hosting Setup", amount: "KSh 2,500" },
  ];

  const features = [
    { icon: "🤖", label: "AI-Powered", desc: "Smart text parsing" },
    { icon: "⚡", label: "Lightning Fast", desc: "Generate in seconds" },
    { icon: "🎨", label: "Professional", desc: "Branded templates" },
  ];

  return (
    <section className={heroStyles.section}>
      {/* Background decorative elements */}
      <div className={heroStyles.bgElement1}></div>
      <div className={heroStyles.bgElement2}></div>
      <div className={heroStyles.bgElement3}></div>
      <div className={heroStyles.gridPattern}></div>

      <div className={heroStyles.container}>
        <div className={heroStyles.grid}>
          {/* Left Column - Content */}
          <div className={heroStyles.content}>
            <div className={heroStyles.contentInner}>
              {/* Badge */}
              <div className={heroStyles.badge}>
                <div className={heroStyles.badgeDot} />
                <span className={heroStyles.badgeText}>
                  AI-Powered Invoicing Platform
                </span>
              </div>

              {/* Main Heading */}
              <h1>
                <span className={heroStyles.headingLine1}>Create </span>
                <span className={heroStyles.headingLine2}>Invoices</span>
                <br />
                <span className={heroStyles.headingLine3}>in Seconds</span>
              </h1>

              {/* Description */}
              <p className={heroStyles.description}>
                Transform conversations into professional invoices with AI.{" "}
                <span className={heroStyles.descriptionHighlight}>
                  Paste any text
                </span>{" "}
                and watch AI extract items, calculate totals, and generate
                ready-to-send invoices instantly.
              </p>

              {/* CTA Buttons Container */}
              <div className={heroStyles.ctaContainer}>
                <SignedIn>
                  <button
                    type="button"
                    onClick={handleSignedInPrimary}
                    className={heroStyles.primaryButton}
                  >
                    <div className={heroStyles.primaryButtonOverlay}></div>
                    <span className={heroStyles.previewButtonText}>
                      Start Creating Free
                    </span>
                    <svg
                      className={heroStyles.primaryButtonIcon}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M5 12h14m-7-7l7 7-7 7" />
                    </svg>
                  </button>
                </SignedIn>

                <SignedOut>
                  <button
                    type="button"
                    onClick={handleSignedOutPrimary}
                    className={heroStyles.primaryButton}
                  >
                    <div className={heroStyles.primaryButtonOverlay}></div>
                    <span className={heroStyles.previewButtonText}>
                      Start Creating Free
                    </span>
                    <svg
                      className={heroStyles.primaryButtonIcon}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M5 12h14m-7-7l7 7-7 7" />
                    </svg>
                  </button>
                </SignedOut>

                {/* Secondary Button - Visible to all users */}
                <a href="#features" className={heroStyles.secondaryButton}>
                  <span>Explore Features</span>
                  <svg
                    className={heroStyles.secondaryButtonIcon}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </a>
              </div>

              {/* Features List */}
              <div className={heroStyles.featuresGrid}>
                {features.map((feature, index) => (
                  <div key={index} className={heroStyles.featureItem}>
                    <div className={heroStyles.featureIcon}>{feature.icon}</div>
                    <div className={heroStyles.featureText}>
                      <div className={heroStyles.featureLabel}>
                        {feature.label}
                      </div>
                      <div className={heroStyles.featureDesc}>
                        {feature.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Interactive Demo Card */}
          <div className={heroStyles.demoColumn}>
            <div className={heroStyles.demoFloating1}></div>
            <div className={heroStyles.demoFloating2}></div>

            <div className={heroStyles.demoContainer}>
              <div className={heroStyles.demoCard}>
                {/* Card Header */}
                <div className={heroStyles.cardHeader}>
                  <div className={heroStyles.cardLogoContainer}>
                    <div className={heroStyles.cardLogo}>AI</div>
                  </div>
                  <div className={heroStyles.cardClientName}>
                    NEX101
                  </div>
                </div>

                {/* Invoice Info */}
                <div className={heroStyles.cardInvoiceInfo}>
                  <div className={heroStyles.cardInvoiceLabel}>Invoice</div>
                  <div className={heroStyles.cardInvoiceNumber}>
                    #INV-1024
                  </div>
                </div>

                {/* Invoice Items */}
                <div className={heroStyles.itemsContainer}>
                  {invoiceItems.map((item, index) => (
                    <div key={index} className={heroStyles.itemRow}>
                      <div className={heroStyles.itemContent}>
                        <div className={heroStyles.itemDot}></div>
                        <span className={heroStyles.itemDescription}>
                          {item.description}
                        </span>
                      </div>
                      <span className={heroStyles.itemAmount}>
                        {item.amount}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Calculation Section */}
                <div className={heroStyles.calculationContainer}>
                  <div className={heroStyles.calculationRow}>
                    <span className={heroStyles.calculationLabel}>
                      Subtotal
                    </span>
                    <span className={heroStyles.calculationValue}>
                      KSh 20,500
                    </span>
                  </div>
                  <div className={heroStyles.calculationRow}>
                    <span className={heroStyles.calculationLabel}>
                      GST (18%)
                    </span>
                    <span className={heroStyles.calculationValue}>
                      KSh 3,240
                    </span>
                  </div>
                  <div className={heroStyles.totalRow}>
                    <span className={heroStyles.totalLabel}>Total Amount</span>
                    <span className={heroStyles.totalValue}>KSh 23,740</span>
                  </div>
                </div>

                {/* AI Indicator - REMOVED as requested */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;