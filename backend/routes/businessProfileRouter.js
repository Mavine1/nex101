import express from 'express';
import multer from 'multer';
import path from 'path';
import { clerkMiddleware } from '@clerk/express';
import {
  createBusinessProfile,
  updateBusinessProfile,
  getMyBusinessProfile
} from '../controllers/businessProfileController.js';

const businessProfileRouter = express.Router();

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), "uploads"));
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 100);
    const ext = path.extname(file.originalname);
    cb(null, `business-${unique}${ext}`);
  }
});

const upload = multer({ storage: storage });

// Apply clerk middleware to all routes
businessProfileRouter.use(clerkMiddleware());

// GET current user's profile (includes location, website, terms, footer, payment settings)
businessProfileRouter.get("/me", getMyBusinessProfile);

// POST - create or update (upsert) the current user's profile
// Handles all fields: businessName, email, address, phone, location, website, 
// terms, footer, paymentMethod, paybill, accountNumber, accountName,
// signature details, defaultTaxPercent, and image uploads (logo, stamp, signature)
businessProfileRouter.post(
  "/me",
  upload.fields([
    { name: "logoName", maxCount: 1 },
    { name: "stampName", maxCount: 1 },
    { name: "signatureNameMeta", maxCount: 1 },
  ]),
  createBusinessProfile
);

// PUT - update by ID (optional, kept for backward compatibility)
businessProfileRouter.put(
  "/:id",
  upload.fields([
    { name: "logoName", maxCount: 1 },
    { name: "stampName", maxCount: 1 },
    { name: "signatureNameMeta", maxCount: 1 },
  ]),
  updateBusinessProfile
);

export default businessProfileRouter;