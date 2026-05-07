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
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g., mobile apps, Postman, curl)
        if (!origin) return callback(null, true);

        // Production origin – exact match
        const allowedProduction = 'https://nexinvoice.vercel.app';
        if (origin === allowedProduction) return callback(null, true);

        // Development: allow ANY hostname but only if the port is 5173
        try {
            const url = new URL(origin);
            if (url.port === '5173') {
                return callback(null, true);
            }
        } catch (err) {
            // Invalid origin URL – block
            return callback(new Error('Not allowed by CORS'));
        }

        // If none of the above match – block
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));

app.use(clerkMiddleware());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

const isVercel = process.env.VERCEL === '1';
if (!isVercel) {
    app.use('/uploads', express.static(path.join(__dirname, "uploads")));
    console.log('📁 Uploads folder served locally only');
}

// DATABASE CONNECTION – called once when serverless function initializes (cold start)
connectDB();

// ROUTES
app.use('/api/invoice', invoiceRouter);
app.use('/api/businessProfile', businessProfileRouter);
app.use('/api/ai', aiInvoiceRouter);

app.get('/', (req, res) => {
    res.send('API WORKING');
});

// Start server only in local development (not on Vercel)
if (!isVercel) {
    app.listen(port, () => {
        // Show only the port, no hardcoded localhost
        console.log(`✅ Server started on port ${port}`);
    });
} else {
    console.log('🚀 Running on Vercel (serverless mode) – no app.listen() called');
}

// Export for Vercel serverless functions
export default app;