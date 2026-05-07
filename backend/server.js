import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { clerkMiddleware } from '@clerk/express';
import { connectDB } from './config/db.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';                           // ✅ add this
import invoiceRouter from './routes/invoiceRouter.js';
import businessProfileRouter from './routes/businessProfileRouter.js';
import aiInvoiceRouter from './routes/aiInvoiceRouter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 4000;
const isVercel = process.env.VERCEL === '1';

// MIDDLEWARES
if (!isVercel) {
  app.use(cors()); // or keep your custom CORS
}
app.use(clerkMiddleware());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

// Static uploads – local only
if (!isVercel) {
  app.use('/uploads', express.static(path.join(__dirname, "uploads")));
  console.log('📁 Uploads folder served locally only');
}

connectDB();

// API ROUTES
app.use('/api/invoice', invoiceRouter);
app.use('/api/businessProfile', businessProfileRouter);
app.use('/api/ai', aiInvoiceRouter);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// ------------------ SERVE FRONTEND (optional, for local development) ------------------
const frontendDist = path.join(__dirname, "../frontend/dist");
if (!isVercel && fs.existsSync(frontendDist)) {   // ✅ now fs.existsSync works
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
  console.log(`🌐 Serving frontend from ${frontendDist}`);
}

// Start server (local only)
if (!isVercel) {
  app.listen(port, () => {
    console.log(`✅ Server running on port ${port}`);
    console.log(`👉 Open http://localhost:${port}`);
  });
} else {
  console.log('🚀 Running on Vercel (serverless mode)');
}

export default app;