import React, { useEffect, useMemo, useState } from "react";
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken,
  onAuthStateChanged 
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  onSnapshot 
} from "firebase/firestore";
import { Printer, Save, Plus, Trash2, FileText, Download } from "lucide-react";

/* ================= FIREBASE SETUP ================= */
// Using environment variables for security and compatibility
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = __app_id || 'invoice-app';

/* ================= HELPERS ================= */
const generateInvoiceNo = () => {
  const d = new Date();
  const dateStr = `${d.getFullYear().toString().slice(-2)}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`;
  const timeStr = `${String(d.getHours()).padStart(2,"0")}${String(d.getMinutes()).padStart(2,"0")}`;
  return `INV-${dateStr}-${timeStr}`;
};

const formatMoney = (amount, currency = 'MYR') => {
  return new Intl.NumberFormat('en-MY', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0);
};

/* ================= APP COMPONENT ================= */
export default function App() {
  const [user, setUser] = useState(null);
  const [invoiceNo] = useState(generateInvoiceNo());
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [currency, setCurrency] = useState("MYR");
  const [isSaving, setIsSaving] = useState(false);
  
  // Initialize with one empty item
  const [items, setItems] = useState([
    { id: Date.now(), description: "Consultation Services", qty: 1, rate: 150, discount: 0 }
  ]);

  // 1. AUTHENTICATION (Fixed Pattern)
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth failed:", err);
      }
    };
    initAuth();
    return onAuthStateChanged(auth, setUser);
  }, []);

  // 2. CALCULATIONS
  const calculations = useMemo(() => {
    let subtotal = 0;
    let totalDiscount = 0;

    const processedItems = items.map(item => {
      const q = parseFloat(item.qty) || 0;
      const r = parseFloat(item.rate) || 0;
      const d = parseFloat(item.discount) || 0;
      const lineAmount = (q * r) - d;
      
      subtotal += (q * r);
      totalDiscount += d;
      
      return { ...item, lineAmount };
    });

    return {
      subtotal,
      discount: totalDiscount,
      total: subtotal - totalDiscount,
      processedItems
    };
  }, [items]);

  // 3. HANDLERS
  const addItem = () => {
    setItems([...items, { id: Date.now(), description: "", qty: 1, rate: 0, discount: 0 }]);
  };

  // Fixed: Don't coerce to Number immediately to allow decimal input
  const updateItem = (id, field, value) => {
    setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const removeItem = (id) => {
    if (items.length === 1) return; // Prevent removing last item
    setItems(items.filter(i => i.id !== id));
  };

  const saveInvoice = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      // Fixed: Using correct path structure
      const invoiceData = {
        invoiceNo,
        customerName,
        customerEmail,
        currency,
        items: items.map(i => ({
          ...i,
          qty: parseFloat(i.qty) || 0,
          rate: parseFloat(i.rate) || 0,
          discount: parseFloat(i.discount) || 0
        })),
        totals: {
          subtotal: calculations.subtotal,
          discount: calculations.discount,
          total: calculations.total
        },
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'invoices'), invoiceData);
      
      // Simple visual feedback since alert() is discouraged
      const btn = document.getElementById('saveBtn');
      if(btn) {
        const originalText = btn.innerText;
        btn.innerText = "Saved!";
        setTimeout(() => btn.innerText = originalText, 2000);
      }
    } catch (error) {
      console.error("Error saving:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-slate-800">
      
      {/* PAPER CONTAINER */}
      <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-lg overflow-hidden print:shadow-none print:rounded-none print:max-w-none">
        
        {/* HEADER */}
        <div className="p-8 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center text-white">
               {/* Replaced broken img with Icon */}
               <FileText size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Samyama Sdn Bhd</h2>
              <p className="text-sm text-gray-500 mt-1">
                Level 23, Menara 1<br/>
                Kuala Lumpur, 50450<br/>
                Malaysia
              </p>
            </div>
          </div>

          <div className="text-right w-full md:w-auto">
            <h1 className="text-3xl font-light text-gray-900 uppercase tracking-widest mb-2">Invoice</h1>
            <p className="font-mono text-gray-600 mb-4">{invoiceNo}</p>
            <div className="bg-blue-50 p-4 rounded-lg print:bg-transparent print:p-0 print:border print:border-gray-200">
              <p className="text-xs uppercase text-blue-800 font-semibold mb-1 print:text-black">Balance Due</p>
              <p className="text-2xl font-bold text-blue-700 print:text-black">
                {currency} {formatMoney(calculations.total)}
              </p>
            </div>
          </div>
        </div>

        {/* CLIENT DETAILS */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Billed To</label>
            {/* Input visible on screen, hidden on print */}
            <input 
              type="text"
              placeholder="Client Name / Company"
              className="w-full text-lg font-medium border-b border-dashed border-gray-300 focus:border-blue-500 focus:ring-0 px-0 py-2 bg-transparent placeholder-gray-300 print:hidden"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
            />
            {/* Text visible on print, hidden on screen */}
            <div className="hidden print:block text-lg font-medium mb-1">
              {customerName || "_________________"}
            </div>

            <input 
              type="text"
              placeholder="Client Email / Address"
              className="w-full text-sm text-gray-600 border-b border-dashed border-gray-300 focus:border-blue-500 focus:ring-0 px-0 py-1 bg-transparent placeholder-gray-300 print:hidden mt-2"
              value={customerEmail}
              onChange={e => setCustomerEmail(e.target.value)}
            />
             <div className="hidden print:block text-sm text-gray-600">
              {customerEmail}
            </div>
          </div>

          <div className="md:text-right flex flex-col items-start md:items-end">
            <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Currency & Date</label>
            <select 
              value={currency} 
              onChange={e => setCurrency(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-32 p-2.5 print:hidden mb-2"
            >
              <option value="MYR">MYR (RM)</option>
              <option value="USD">USD ($)</option>
              <option value="SGD">SGD ($)</option>
            </select>
            <div className="hidden print:block font-medium mb-1">{currency}</div>
            <p className="text-sm text-gray-500">
              Date: {new Date().toLocaleDateString('en-MY', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* ITEMS TABLE */}
        <div className="p-0 md:p-8 overflow-x-auto">
          <table className="w-full min-w-[600px] text-left">
            <thead>
              <tr className="border-b-2 border-gray-100 text-xs uppercase text-gray-500 bg-gray-50 print:bg-white">
                <th className="py-3 px-4 w-1/2">Description</th>
                <th className="py-3 px-4 text-center">Qty</th>
                <th className="py-3 px-4 text-right">Rate</th>
                <th className="py-3 px-4 text-right">Disc.</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 w-10 print:hidden"></th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {items.map((item, index) => (
                <tr key={item.id} className="border-b border-gray-50 group hover:bg-blue-50/30 transition-colors">
                  <td className="p-2">
                    <input 
                      className="w-full bg-transparent border-0 focus:ring-0 p-2 font-medium text-gray-800 placeholder-gray-300"
                      placeholder="Item description"
                      value={item.description}
                      onChange={e => updateItem(item.id, 'description', e.target.value)}
                    />
                  </td>
                  <td className="p-2">
                    <input 
                      type="number"
                      className="w-full bg-transparent border-0 focus:ring-0 p-2 text-center text-gray-600"
                      value={item.qty}
                      onChange={e => updateItem(item.id, 'qty', e.target.value)}
                    />
                  </td>
                  <td className="p-2 text-right">
                    <input 
                      type="number"
                      className="w-full bg-transparent border-0 focus:ring-0 p-2 text-right text-gray-600"
                      value={item.rate}
                      onChange={e => updateItem(item.id, 'rate', e.target.value)}
                    />
                  </td>
                  <td className="p-2 text-right">
                    <input 
                      type="number"
                      className="w-full bg-transparent border-0 focus:ring-0 p-2 text-right text-gray-600"
                      value={item.discount}
                      onChange={e => updateItem(item.id, 'discount', e.target.value)}
                    />
                  </td>
                  <td className="p-4 text-right font-medium text-gray-700">
                    {formatMoney((parseFloat(item.qty||0) * parseFloat(item.rate||0)) - parseFloat(item.discount||0))}
                  </td>
                  <td className="p-2 text-center print:hidden">
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove Item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <button 
            onClick={addItem}
            className="mt-4 ml-4 flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 print:hidden"
          >
            <Plus size={16} /> Add Item
          </button>
        </div>

        {/* SUMMARY & FOOTER */}
        <div className="p-8 bg-gray-50 print:bg-white flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <div className="w-full md:w-1/2">
            <h4 className="font-bold text-gray-900 mb-2">Payment Details</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Bank: <span className="font-medium text-gray-800">Hong Leong Bank</span></p>
              <p>Account: <span className="font-medium text-gray-800">2120 0080 616</span></p>
              <p>Name: <span className="font-medium text-gray-800">Samyama Sdn Bhd</span></p>
            </div>
            <div className="mt-6 text-xs text-gray-400">
              <p>Thank you for your business.</p>
              <p>Please send payment within 14 days.</p>
            </div>
          </div>

          <div className="w-full md:w-1/3 space-y-3">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>{formatMoney(calculations.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Discount</span>
              <span>- {formatMoney(calculations.discount)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-gray-900 pt-3 border-t border-gray-200">
              <span>Total</span>
              <span>{currency} {formatMoney(calculations.total)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* FLOATING ACTION BUTTONS */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-4 print:hidden">
        <button 
          id="saveBtn"
          onClick={saveInvoice}
          disabled={isSaving}
          className="flex items-center gap-2 bg-slate-800 text-white px-6 py-3 rounded-full shadow-lg hover:bg-slate-700 transition-all disabled:opacity-50"
        >
          <Save size={20} />
          {isSaving ? "Saving..." : "Save Invoice"}
        </button>
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-full shadow-lg hover:bg-blue-500 transition-all"
        >
          <Download size={20} />
          Download PDF
        </button>
      </div>

    </div>
  );
}
