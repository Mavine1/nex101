import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { clerkMiddleware } from '@clerk/express';
import { connectDB } from './config/db.js';
import path from 'path';
import invoiceRouter from './routes/invoiceRouter.js';
import businessProfileRouter from './routes/businessProfileRouter.js';
import aiInvoiceRouter from './routes/aiInvoiceRouter.js';

// DEBUGGING: Check if .env is loading
console.log('=== ENVIRONMENT VARIABLES CHECK ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('MONGODB_URI exists?', !!process.env.MONGODB_URI);
console.log('MONGODB_URI value:', process.env.MONGODB_URI);
console.log('GEMINI_API_KEY exists?', !!process.env.GEMINI_API_KEY);
console.log('CLERK_SECRET_KEY exists?', !!process.env.CLERK_SECRET_KEY);
console.log('===================================');

const app = express();
const port = 4000;

// MIDDLEWARES
app.use(cors());
app.use(clerkMiddleware());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

// STATIC FILES
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

app.listen(port, () => {
    console.log(`Server Started on http://localhost:${port}`);
});