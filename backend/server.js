import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { clerkMiddleware } from '@clerk/express';
import { connectDB } from './config/db.js';
import path from 'path';
import invoiceRouter from './routes/invoiceRouter.js';
import businessProfileRouter from './routes/businessProfileRouter.js';
import aiInvoiceRouter from './routes/aiInvoiceRouter.js';

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
app.use('/uploads', express.static(path.join(process.cwd(), "uploads")));

// DATABASE CONNECTION
connectDB();

// ROUTES
app.use('/api/invoice', invoiceRouter);
app.use('/api/businessProfile', businessProfileRouter);
app.use('/api/ai', aiInvoiceRouter);

app.get('/', (req, res) => {
    res.send('API WORKING');
});

// ✅ Dynamic listen – start server only when NOT on Vercel
// Vercel sets process.env.VERCEL = '1' in serverless environment
const isVercel = process.env.VERCEL === '1';
const isProduction = process.env.NODE_ENV === 'production';

if (!isVercel && !isProduction) {
    // Local development: start the server
    app.listen(port, () => {
        console.log(`✅ Server started on http://localhost:${port}`);
    });
} else if (isVercel) {
    // On Vercel: do NOT call app.listen() – just export the app as a serverless handler
    console.log('🚀 Running on Vercel (serverless mode)');
}

// Export the Express app for Vercel serverless functions
export default app;