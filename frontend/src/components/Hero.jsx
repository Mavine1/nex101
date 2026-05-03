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
      clerk?.openSignUp?.();
    } catch (err) {
      console.error("Failed to open sign up:", err);
    }
  };

  return (
    <section className={heroStyles.section}>
      <div className={heroStyles.bgElement1} />
      <div className={heroStyles.bgElement2} />
      <div className={heroStyles.bgElement3} />
      <div className={heroStyles.gridPattern} />

      <div className={heroStyles.container}>
        <div className={heroStyles.grid}>
          {/* LEFT CONTENT */}
          <div className={heroStyles.content}>
            <div className={heroStyles.contentInner}>
              <div className={heroStyles.badge}>
                <div className={heroStyles.badgeDot} />
                <span className={heroStyles.badgeText}>
                  AI-Powered Invoicing Platform
                </span>
              </div>

              <h1 className={heroStyles.heading}>
                <span className={heroStyles.headingLine1}>Professional</span>
                <br />
                <span className={heroStyles.headingLine2}>Invoices</span>
                <br />
                <span className={heroStyles.headingLine3}>in Seconds</span>
              </h1>

              <p className={heroStyles.description}>
                Transform conversations into professional invoices with AI.{" "}
                <span className={heroStyles.descriptionHighlight}>
                  Paste any text
                </span>{" "}
                and watch AI extract items, calculate totals, and generate invoices instantly.
              </p>

              <div className={heroStyles.ctaContainer}>
                <SignedIn>
                  <button
                    type="button"
                    onClick={handleSignedInPrimary}
                    className={heroStyles.primaryButton}
                  >
                    <>
                      <div className={heroStyles.primaryButtonOverlay} />
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
                    </>
                  </button>
                </SignedIn>

                <SignedOut>
                  <button
                    type="button"
                    onClick={handleSignedOutPrimary}
                    className={heroStyles.primaryButton}
                  >
                    <>
                      <div className={heroStyles.primaryButtonOverlay} />
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
                    </>
                  </button>
                </SignedOut>

                <a href="#features" className={heroStyles.secondaryButton}>
                  <span>Explore Features</span>
                  <svg
                    className={heroStyles.secondaryButtonIcon}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M19 14l-7 7m0 0l-7-7m7-7v14" />
                  </svg>
                </a>
              </div>
            </div>

            {/* FEATURES */}
            <div className={heroStyles.featureList}>
              {[
                { icon: "🤖", label: "AI-Powered", desc: "Smart text parsing" },
                { icon: "⚡", label: "Lightning Fast", desc: "Generate in seconds" },
                { icon: "🎨", label: "Professional", desc: "Branded templates" },
              ].map((feature) => (
                <div key={feature.label} className={heroStyles.featureItem}>
                  <span className={heroStyles.featureIcon}>{feature.icon}</span>
                  <div>
                    <div className={heroStyles.featureLabel}>{feature.label}</div>
                    <div className={heroStyles.featureDesc}>{feature.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT DEMO */}
          <div className={heroStyles.demoColumn}>
            <div className={heroStyles.demoContainer}>
              <div className={heroStyles.demoCard}>
                <div className={heroStyles.cardHeader}>
                  <div>
                    <div className={heroStyles.cardLogo}>AI</div>
                    <div className={heroStyles.cardClientName}>
                      Acme Corporation
                    </div>
                    <div className={heroStyles.cardClientGst}>
                      GST: 27AAAPL1234C1ZV
                    </div>
                  </div>

                  <div className={heroStyles.cardInvoiceInfo}>
                    <div className={heroStyles.cardInvoiceLabel}>Invoice</div>
                    <div className={heroStyles.cardInvoiceNumber}>
                      #INV-2024-001
                    </div>
                    <div className={heroStyles.cardStatus}>Paid</div>
                  </div>
                </div>

                <div className={heroStyles.itemsContainer}>
                  {[
                    { description: "Website Design", amount: "₹15,000" },
                    { description: "Consultation", amount: "₹3,000" },
                    { description: "Hosting Setup", amount: "₹2,500" },
                  ].map((item) => (
                    <div key={item.description} className={heroStyles.itemRow}>
                      <span>{item.description}</span>
                      <span>{item.amount}</span>
                    </div>
                  ))}
                </div>

                <div className={heroStyles.totalRow}>
                  <span>Total Amount</span>
                  <span>₹23,740</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Hero;