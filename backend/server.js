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

// Required for __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 4000;

// MIDDLEWARES
app.use(cors({
    origin: [
        "http://localhost:5173",
        "https://nexinvoice.vercel.app"
    ],
    credentials: true
}));
app.use(clerkMiddleware());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

// ❌ Static 'uploads' folder will NOT work on Vercel (ephemeral storage)
// Instead, we conditionally enable it only in local development.
const isVercel = process.env.VERCEL === '1';
if (!isVercel) {
    app.use('/uploads', express.static(path.join(__dirname, "uploads")));
    console.log('📁 Uploads folder served locally only');
}

// DATABASE CONNECTION – reused across serverless invocations
connectDB();

// ROUTES
app.use('/api/invoice', invoiceRouter);
app.use('/api/businessProfile', businessProfileRouter);
app.use('/api/ai-invoice', aiInvoiceRouter);   // ✅ FIXED: now matches frontend request

app.get('/', (req, res) => {
    res.send('API WORKING');
});

// Start server only in local development (not on Vercel)
if (!isVercel) {
    app.listen(port, () => {
        console.log(`✅ Server started on http://localhost:${port}`);
    });
} else {
    console.log('🚀 Running on Vercel (serverless mode) – no app.listen() called');
}

// Export for Vercel serverless functions
export default app;