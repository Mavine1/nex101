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

// Routes
businessProfileRouter.get("/me", getMyBusinessProfile);

businessProfileRouter.post(
  "/",
  upload.fields([
    { name: "logoName", maxCount: 1 },
    { name: "stampName", maxCount: 1 },
    { name: "signatureNameMeta", maxCount: 1 },
  ]),
  createBusinessProfile
);

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