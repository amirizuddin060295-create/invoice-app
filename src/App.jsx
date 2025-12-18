import React, { useEffect, useMemo, useState } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from "firebase/firestore";

/* ================= BRAND COLOR ================= */
/* Luxury black – safest, most premium */
const BRAND_COLOR = "#111111";

/* ================= FIREBASE CONFIG ================= */
const firebaseConfig = {
  apiKey: "AIzaSyB5a0xtjbtUg57v15q5P0N5an0I_LiwA3U",
  authDomain: "invoice-ai-samyama.firebaseapp.com",
  projectId: "invoice-ai-samyama",
  storageBucket: "invoice-ai-samyama.appspot.com",
  messagingSenderId: "249755399024",
  appId: "1:249755399024:web:f63e9005cd20830ce715b5"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* ================= HELPERS ================= */
const generateInvoiceNo = () => {
  const y = new Date().getFullYear().toString().slice(-2);
  const r = Math.floor(100 + Math.random() * 900);
  return `INV${y}-${r}`;
};

const money = (n) =>
  n.toLocaleString("en-MY", { minimumFractionDigits: 2 });

/* ================= APP ================= */
export default function App() {
  const [user, setUser] = useState(null);
  const [invoiceNo] = useState(generateInvoiceNo());
  const [customerName, setCustomerName] = useState("");
  const [items, setItems] = useState([]);

  /* ================= AUTH ================= */
  useEffect(() => {
    signInAnonymously(auth);
    return onAuthStateChanged(auth, setUser);
  }, []);

  /* ================= TOTAL ================= */
  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, i) => sum + (i.qty * i.rate - i.discount),
        0
      ),
    [items]
  );

  /* ================= ITEM HELPERS ================= */
  const addItem = () =>
    setItems([
      ...items,
      { id: Date.now(), description: "", qty: 1, rate: 0, discount: 0 }
    ]);

  const updateItem = (id, field, value) =>
    setItems(items.map(i =>
      i.id === id ? { ...i, [field]: value } : i
    ));

  const removeItem = (id) =>
    setItems(items.filter(i => i.id !== id));

  /* ================= SAVE ================= */
  const saveInvoice = async () => {
    if (!user) return;
    await addDoc(collection(db, "invoices"), {
      invoiceNo,
      customerName,
      items,
      total: subtotal,
      createdAt: serverTimestamp()
    });
    alert("Invoice saved");
  };

  /* ================= UI ================= */
  return (
    <div className="page">
      {/* HEADER */}
      <header className="header">
        <div className="brand">
          <img src="/logo.png" alt="Logo" className="logo" />
          <div className="company">
            <strong>Samyama Sdn Bhd</strong>
            <span>Registration No 202001027188</span>
            <span>Kuala Lumpur, Malaysia</span>
          </div>
        </div>

        <div className="meta">
          <h1>Invoice</h1>
          <span className="invoice-no">#{invoiceNo}</span>
          <div className="balance">
            <span>Balance Due</span>
            <strong>MYR {money(subtotal)}</strong>
          </div>
        </div>
      </header>

      {/* CLIENT */}
      <section className="client">
        <label>Billed To</label>
        <input
          placeholder="Client name"
          value={customerName}
          onChange={e => setCustomerName(e.target.value)}
        />
      </section>

      {/* ITEMS */}
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Qty</th>
            <th>Rate</th>
            <th>Discount</th>
            <th>Amount</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && (
            <tr>
              <td colSpan="6" className="empty">
                No items yet
              </td>
            </tr>
          )}
          {items.map(item => (
            <tr key={item.id}>
              <td>
                <input
                  value={item.description}
                  onChange={e =>
                    updateItem(item.id, "description", e.target.value)
                  }
                />
              </td>
              <td>
                <input
                  type="number"
                  value={item.qty}
                  onChange={e =>
                    updateItem(item.id, "qty", Number(e.target.value))
                  }
                />
              </td>
              <td>
                <input
                  type="number"
                  value={item.rate}
                  onChange={e =>
                    updateItem(item.id, "rate", Number(e.target.value))
                  }
                />
              </td>
              <td>
                <input
                  type="number"
                  value={item.discount}
                  onChange={e =>
                    updateItem(item.id, "discount", Number(e.target.value))
                  }
                />
              </td>
              <td className="amount">
                {money(item.qty * item.rate - item.discount)}
              </td>
              <td>
                <button onClick={() => removeItem(item.id)}>✕</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button className="add" onClick={addItem}>+ Add Item</button>

      {/* TOTAL */}
      <section className="total">
        <span>Total</span>
        <strong>MYR {money(subtotal)}</strong>
      </section>

      {/* FOOTER */}
      <footer>
        <div>
          <strong>Bank Details</strong>
          <span>Hong Leong Bank Berhad</span>
          <span>2120 0080 616</span>
          <span>Samyama Sdn Bhd</span>
        </div>
        <div className="actions">
          <button onClick={saveInvoice}>Save</button>
          <button onClick={() => window.print()}>Download PDF</button>
        </div>
      </footer>

      {/* STYLES */}
      <style>{`
        body {
          background:#f4f4f4;
        }
        .page {
          background:#fff;
          max-width:900px;
          margin:40px auto;
          padding:60px;
          font-family:"Helvetica Neue", Arial, sans-serif;
          color:#111;
        }
        .header {
          display:flex;
          justify-content:space-between;
          margin-bottom:50px;
        }
        .brand {
          display:flex;
          gap:20px;
          align-items:flex-start;
        }
        .logo {
          height:100px;
        }
        .company span {
          display:block;
          font-size:12px;
          color:#555;
        }
        h1 {
          font-weight:300;
          letter-spacing:3px;
          color:${BRAND_COLOR};
        }
        .invoice-no {
          color:#888;
        }
        .balance strong {
          font-size:20px;
          color:${BRAND_COLOR};
        }
        label {
          font-size:12px;
          text-transform:uppercase;
          letter-spacing:1px;
          color:#777;
        }
        input {
          border:none;
          border-bottom:1px solid #ddd;
          width:100%;
          font-size:14px;
        }
        table {
          width:100%;
          border-collapse:collapse;
          margin-top:50px;
        }
        th {
          text-align:left;
          font-size:12px;
          color:${BRAND_COLOR};
          border-bottom:1px solid #eee;
          padding-bottom:10px;
        }
        td {
          padding:16px 6px;
        }
        .amount {
          text-align:right;
          font-weight:500;
        }
        .add {
          margin-top:20px;
          border:none;
          background:none;
          color:${BRAND_COLOR};
          font-size:14px;
        }
        .total {
          margin-top:50px;
          display:flex;
          justify-content:flex-end;
          gap:20px;
          font-size:20px;
        }
        footer {
          margin-top:60px;
          display:flex;
          justify-content:space-between;
          font-size:12px;
          color:#555;
        }
        button {
          border:1px solid ${BRAND_COLOR};
          background:none;
          padding:8px 16px;
          color:${BRAND_COLOR};
        }
        @media print {
          button {
            display:none;
          }
          body {
            background:#fff;
          }
        }
      `}</style>
    </div>
  );
}
