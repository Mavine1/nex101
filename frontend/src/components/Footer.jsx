import React from "react";
import { footerStyles } from "../assets/dummyStyles";

const Footer = () => {
  return (
    <footer className={footerStyles.footer}>
      <div className={footerStyles.container}>
        <div className={footerStyles.copyright}>
          NEX10© 2026 NEX101 Ltd. All rights reserved.
        </div>
        <div className={footerStyles.mediaLinks}>
          <a href="#" target="_blank" rel="noopener noreferrer" className={footerStyles.mediaLink}>
            Twitter
          </a>
          <a href="#" target="_blank" rel="noopener noreferrer" className={footerStyles.mediaLink}>
            LinkedIn
          </a>
          <a href="https://instagram.com/nex10" target="_blank" rel="noopener noreferrer" className={footerStyles.mediaLink}>
            Instagram
          </a>
          <a href="https://tiktok.com/@nex10" target="_blank" rel="noopener noreferrer" className={footerStyles.mediaLink}>
            TikTok
          </a>
        </div>
        <div className={footerStyles.links}>
          <a href="/terms" className={footerStyles.link}>
            Terms
          </a>
          <a href="/privacy" className={footerStyles.link}>
            Privacy
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;