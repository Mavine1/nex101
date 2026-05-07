import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { clerkMiddleware } from '@clerk/express';
import { connectDB } from './config/db.js';
import path from 'path';
import { fileURLToPath } from 'url';
import invoiceRouter from './routes/invoiceRouter.js';
import businessProfileRouter from './routes/businessProfileRouter.js';
import aiInvoiceRouter from './routes/aiInvoiceRouter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 4000;
const isVercel = process.env.VERCEL === '1';

// MIDDLEWARES
// Only enable CORS if you need to accept requests from other domains.
// When frontend is served by Express, CORS is unnecessary.
if (!isVercel) {
  app.use(cors()); // or remove entirely
}
app.use(clerkMiddleware());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

// Static 'uploads' folder – local only
if (!isVercel) {
  app.use('/uploads', express.static(path.join(__dirname, "uploads")));
  console.log('📁 Uploads folder served locally only');
}

// Database connection
connectDB();

// API ROUTES
app.use('/api/invoice', invoiceRouter);
app.use('/api/businessProfile', businessProfileRouter);
app.use('/api/ai', aiInvoiceRouter);

// HEALTH CHECK (optional)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// ------------------ SERVE FRONTEND (same origin) ------------------
// This makes your frontend use the same host+port as your backend.
// No more hardcoded localhost in fetch() calls – just "/api/..." works.
const frontendDist = path.join(__dirname, "../frontend/dist"); // adjust path as needed
if (!isVercel && require('fs').existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  // Catch-all: serve index.html for any non-API route (SPA support)
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}
// On Vercel, your frontend is deployed separately, so the above is skipped.
// For production (Vercel), keep using relative URLs – they work automatically.

// Start server (local only)
if (!isVercel) {
  app.listen(port, () => {
    console.log(`✅ Server running on port ${port}`);
    console.log(`👉 Open http://localhost:${port} in your browser`);
  });
} else {
  console.log('🚀 Running on Vercel (serverless mode)');
}

export default app;