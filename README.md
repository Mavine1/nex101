# NEXInvoice Frontend

React frontend for the NEXInvoice application.

## Tech Stack

- React 19
- Vite
- Tailwind CSS
- React Router
- Clerk Authentication

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```
The frontend runs on http://localhost:5173 (default Vite port).

## Scripts

- `npm run dev` — Start development server with HMR
- `npm run build` — Build for production
- `npm run preview` — Preview production build
- `npm run lint` — Run ESLint

## Configuration

Set the following in your environment or `.env.local`:

```
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_API_URL=http://localhost:4000
```

## Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/` | Home | Landing page |
| `/app` | AppShell | Protected app wrapper |
| `/app/dashboard` | Dashboard | Main dashboard |
| `/app/invoices` | Invoices | Invoice list |
| `/app/invoices/new` | CreateInvoice | Create new invoice |
| `/app/invoices/:id` | InvoicePreview | View invoice |
| `/app/business` | BusinessProfile | Business settings |