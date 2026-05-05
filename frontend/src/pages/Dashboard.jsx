// /* normalize client object */
// function normalizeClient(raw) {
//   if (!raw) return { name: "", email: "", address: "", phone: "" };
//   if (typeof raw === "string")
//     return { name: raw, email: "", address: "", phone: "" };
//   if (typeof raw === "object") {
//     return {
//       name: raw.name ?? raw.company ?? raw.client ?? "",
//       email: raw.email ?? raw.emailAddress ?? "",
//       address: raw.address ?? "",
//       phone: raw.phone ?? raw.contact ?? "",
//     };
//   }
//   return { name: "", email: "", address: "", phone: "" };
// }

// function currencyFmt(amount = 0, currency = "INR") {
//   try {
//     const n = Number(amount || 0);
//     if (currency === "INR")
//       return new Intl.NumberFormat("en-IN", {
//         style: "currency",
//         currency: "INR",
//       }).format(n);
//     return new Intl.NumberFormat(undefined, {
//       style: "currency",
//       currency,
//     }).format(n);
//   } catch {
//     return `${currency} ${amount}`;
//   }
// }

// /* helpers to format icons */
// const TrendingUpIcon = ({ className = "w-5 h-5" }) => (
//   <svg
//     className={className}
//     viewBox="0 0 24 24"
//     fill="none"
//     stroke="currentColor"
//     strokeWidth="2"
//   >
//     <path d="M23 6l-9.5 9.5-5-5L1 18" />
//     <path d="M17 6h6v6" />
//   </svg>
// );
// const DollarIcon = ({ className = "w-5 h-5" }) => (
//   <svg
//     className={className}
//     viewBox="0 0 24 24"
//     fill="none"
//     stroke="currentColor"
//     strokeWidth="2"
//   >
//     <line x1="12" y1="1" x2="12" y2="23" />
//     <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
//   </svg>
// );
// const ClockIcon = ({ className = "w-5 h-5" }) => (
//   <svg
//     className={className}
//     viewBox="0 0 24 24"
//     fill="none"
//     stroke="currentColor"
//     strokeWidth="2"
//   >
//     <circle cx="12" cy="12" r="10" />
//     <polyline points="12 6 12 12 16 14" />
//   </svg>
// );
// const BrainIcon = ({ className = "w-5 h-5" }) => (
//   <svg
//     className={className}
//     viewBox="0 0 24 24"
//     fill="none"
//     stroke="currentColor"
//     strokeWidth="2"
//   >
//     <path d="M9.5 14.5A2.5 2.5 0 0 1 7 12c0-1.38.5-2 1-3 1.072-2.143 2.928-3.25 4.5-3 1.572.25 3 2 3 4 0 1.5-.5 2.5-1 3.5-1 2-2 3-3.5 3-1.5 0-2.5-1.5-2.5-3Z" />
//     <path d="M14.5 9.5A2.5 2.5 0 0 1 17 12c0 1.38-.5 2-1 3-1.072 2.143-2.928 3.25-4.5 3-1.572-.25-3-2-3-4 0-1.5.5-2.5 1-3.5 1-2 2-3 3.5-3 1.5 0 2.5 1.5 2.5 3Z" />
//   </svg>
// );
// const FileTextIcon = ({ className = "w-5 h-5" }) => (
//   <svg
//     className={className}
//     viewBox="0 0 24 24"
//     fill="none"
//     stroke="currentColor"
//     strokeWidth="2"
//   >
//     <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
//     <polyline points="14 2 14 8 20 8" />
//     <line x1="16" y1="13" x2="8" y2="13" />
//     <line x1="16" y1="17" x2="8" y2="17" />
//     <polyline points="10 9 9 9 8 9" />
//   </svg>
// );
// const EyeIcon = ({ className = "w-4 h-4" }) => (
//   <svg
//     className={className}
//     viewBox="0 0 24 24"
//     fill="none"
//     stroke="currentColor"
//     strokeWidth="2"
//   >
//     <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
//     <circle cx="12" cy="12" r="3" />
//   </svg>
// );

// /* small helpers */
// function capitalize(s) {
//   if (!s) return s;
//   return String(s).charAt(0).toUpperCase() + String(s).slice(1);
// }

// /* ---------- date formatting helper: DD/MM/YYYY ---------- */
// function formatDate(dateInput) {
//   if (!dateInput) return "—";
//   const d = dateInput instanceof Date ? dateInput : new Date(String(dateInput));
//   if (Number.isNaN(d.getTime())) return "—";
//   const dd = String(d.getDate()).padStart(2, "0");
//   const mm = String(d.getMonth() + 1).padStart(2, "0");
//   const yyyy = d.getFullYear();
//   return `${dd}/${mm}/${yyyy}`;
// }

// /* ---------- Component (fetch from backend) ---------- */
//       if (res.status === 401) {
//         // unauthorized - prompt login
//         setError("Unauthorized. Please sign in.");
//         setStoredInvoices([]);
//         return;
//       }

//       if (!res.ok) {
//         const msg = json?.message || `Failed to fetch (${res.status})`;
//         throw new Error(msg);
//       }

//       const raw = json?.data || [];
//       const mapped = (Array.isArray(raw) ? raw : []).map((inv) => {
//         const clientObj = inv.client ?? {};
//         const amountVal = Number(inv.total ?? inv.amount ?? 0);
//         const currency = (inv.currency || "INR").toUpperCase();

//         return {
//           ...inv,
//           id: inv.invoiceNumber || inv._id || String(inv._id || ""),
//           client: clientObj,
//           amount: amountVal,
//           currency,
//           // keep status normalized
//           status:
//             typeof inv.status === "string"
//               ? capitalize(inv.status)
//               : inv.status || "Draft",
//         };
//       });
//       setStoredInvoices(mapped);
//     } catch (err) {
//       console.error("Failed to fetch invoices:", err);
//       setError(err?.message || "Failed to load invoices");
//       setStoredInvoices([]);
//     } 

    
//   // fetch user's business profile (if authenticated)
//   const fetchBusinessProfile = useCallback(async () => {
//     try {

//       if (res.status === 401) {
//         // silently ignore; profile not available
//         return;
//       }
//       if (!res.ok) return;
//       const json = await res.json().catch(() => null);
//       const data = json?.data || null;
//       if (data) setBusinessProfile(data);
//     } catch (err) {
//       // non-fatal
//       console.warn("Failed to fetch business profile:", err);
//     }
//   }, [obtainToken]);


  
//   const HARD_RATES = {
//     USD_TO_INR: 83, 
//   };

//   function convertToINR(amount = 0, currency = "INR") {
//     const n = Number(amount || 0);
//     const curr = String(currency || "INR")
//       .trim()
//       .toUpperCase();

//     if (curr === "INR") return n;
//     if (curr === "USD") return n * HARD_RATES.USD_TO_INR;
//     return n;
//   }

//   const kpis = useMemo(() => {
//     const totalInvoices = storedInvoices.length;
//     let totalPaid = 0; // in INR
//     let totalUnpaid = 0; // in INR
//     let paidCount = 0;
//     let unpaidCount = 0;

//     storedInvoices.forEach((inv) => {
//       const rawAmount =
//         typeof inv.amount === "number"
//           ? inv.amount
//           : Number(inv.total ?? inv.amount ?? 0);
//       const invCurrency = inv.currency || "INR";
//       const amtInINR = convertToINR(rawAmount, invCurrency);

//       if (inv.status === "Paid") {
//         totalPaid += amtInINR;
//         paidCount++;
//       }
//       if (inv.status === "Unpaid" || inv.status === "Overdue") {
//         totalUnpaid += amtInINR;
//         unpaidCount++;
//       }
//     });

//     const totalAmount = totalPaid + totalUnpaid;
//     const paidPercentage =
//       totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0;
//     const unpaidPercentage =
//       totalAmount > 0 ? (totalUnpaid / totalAmount) * 100 : 0;

//     return {
//       totalInvoices,
//       totalPaid,
//       totalUnpaid,
//       paidCount,
//       unpaidCount,
//       paidPercentage,
//       unpaidPercentage,
//     };
//   }, [storedInvoices]);


//   const recent = useMemo(() => {
//     return storedInvoices
//       .slice()
//       .sort(
//         (a, b) =>
//           (Date.parse(b.issueDate || 0) || 0) -
//           (Date.parse(a.issueDate || 0) || 0)
//       )
//       .slice(0, 5);
//   }, [storedInvoices]);


//   const getClientName = (inv) => {
//     if (!inv) return "";
//     if (typeof inv.client === "string") return inv.client;
//     if (typeof inv.client === "object")
//       return inv.client?.name || inv.client?.company || inv.company || "";
//     return inv.company || "Client";
//   };

//   const getClientInitial = (inv) => {
//     const clientName = getClientName(inv);
//     return clientName ? clientName.charAt(0).toUpperCase() : "C";
//   };

//   function openInvoice(invRow) {
//     const payload = invRow;
//     navigate(`/app/invoices/${invRow.id}`, { state: { invoice: payload } });
//   }




//                     <svg
//                       className="w-4 h-4"
//                       viewBox="0 0 24 24"
//                       fill="none"
//                       stroke="currentColor"
//                       strokeWidth="2"
//                     >
//                       <path d="M12 5v14m-7-7h14" />
//                     </svg>
                

//      <div className={dashboardStyles.cardContainer}>
//             <div className="p-6">
//               <h3 className="font-semibold text-gray-900 mb-4">
//                 Quick Actions
//               </h3>
//               <div className={dashboardStyles.quickActionsContainer}>
//                 <button
//                   onClick={() => navigate("/app/create-invoice")}
//                   className={`${dashboardStyles.quickActionButton} ${dashboardStyles.quickActionBlue}`}
//                 >
//                   <div
//                     className={`${dashboardStyles.quickActionIconContainer} ${dashboardStyles.quickActionIconBlue}`}
//                   >
//                     <svg
//                       className="w-4 h-4"
//                       viewBox="0 0 24 24"
//                       fill="none"
//                       stroke="currentColor"
//                       strokeWidth="2"
//                     >
//                       <path d="M12 5v14m-7-7h14" />
//                     </svg>
//                   </div>
//                   <span className={dashboardStyles.quickActionText}>
//                     Create Invoice
//                   </span>
//                 </button>

//                 <button
//                   onClick={() => navigate("/app/invoices")}
//                   className={`${dashboardStyles.quickActionButton} ${dashboardStyles.quickActionGray}`}
//                 >
//                   <div
//                     className={`${dashboardStyles.quickActionIconContainer} ${dashboardStyles.quickActionIconGray}`}
//                   >
//                     <FileTextIcon className="w-4 h-4" />
//                   </div>
//                   <span className={dashboardStyles.quickActionText}>
//                     View All Invoices
//                   </span>
//                 </button>

//                 <button
//                   onClick={() => navigate("/app/business")}
//                   className={`${dashboardStyles.quickActionButton} ${dashboardStyles.quickActionGray}`}
//                 >
//                   <div
//                     className={`${dashboardStyles.quickActionIconContainer} ${dashboardStyles.quickActionIconGray}`}
//                   >
//                     <svg
//                       className="w-4 h-4"
//                       viewBox="0 0 24 24"
//                       fill="none"
//                       stroke="currentColor"
//                       strokeWidth="2"
//                     >
//                       <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
//                       <circle cx="12" cy="7" r="4" />
//                     </svg>
//                   </div>
//                   <span className={dashboardStyles.quickActionText}>
//                     Business Profile
//                   </span>
//                 </button>
//               </div>
//             </div>
//           </div>
           
//                   <svg
//                     className="w-4 h-4"
//                     viewBox="0 0 24 24"
//                     fill="none"
//                     stroke="currentColor"
//                     strokeWidth="2"
//                   >
//                     <path d="M5 12h14m-7-7l7 7-7 7" />
//                   </svg>
               
import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";

const Dashboard = () => {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [error, setError] = useState(null);

  // Token key (must match the one used in Navbar / AppShell)
  const TOKEN_KEY = "token";

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        // 1. Retrieve token from localStorage
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) {
          setError("Authentication token missing. Please sign in again.");
          setLoading(false);
          return;   // ✅ This return is inside the async function – perfectly valid
        }

        // 2. Call your protected API endpoint
        const response = await fetch("/api/invoices", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            setError("Unauthorized. Please sign in again.");
          } else {
            setError(`Error ${response.status}: Failed to load invoices.`);
          }
          setInvoices([]);
          return;   // ✅ Again, return inside async function
        }

        const data = await response.json();
        setInvoices(data);
        setError(null);
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Network error. Please try again later.");
        setInvoices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []); // Empty dependency array – runs once on mount

  // Helper to format currency (example)
  const formatCurrency = (amount, currency = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.firstName || "User"}! 👋
        </h1>
        <p className="text-gray-600 mt-2">
          Here's an overview of your recent invoices.
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
          <p className="font-medium">⚠️ {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Invoices List */}
      {!loading && !error && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {invoices.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No invoices found.</p>
              <button
                onClick={() => (window.location.href = "/app/create-invoice")}
                className="mt-3 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create your first invoice
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {inv.number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {inv.clientName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(inv.total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            inv.status === "paid"
                              ? "bg-green-100 text-green-800"
                              : inv.status === "overdue"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {inv.status || "Pending"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button className="text-blue-600 hover:text-blue-800">
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;