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
    origin: process.env.NODE_ENV === 'production' 
        ? process.env.FRONTEND_URL  // set this in Vercel env vars
        : "http://localhost:5173",
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

if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`Server started on http://localhost:${port}`);
    });
}
export default app;