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
  const now = new Date();

  const yy = now.getFullYear().toString().slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");

  return `INV-${yy}${mm}${dd}${hh}${min}`;
};

const money = (n) =>
  n.toLocaleString("en-MY", { minimumFractionDigits: 2 });

/* ================= APP ================= */
export default function App() {
  const [user, setUser] = useState(null);
  const [invoiceNo] = useState(generateInvoiceNo());
  const [customerName, setCustomerName] = useState("");
  const [items, setItems] = useState([]);

  useEffect(() => {
    signInAnonymously(auth);
    return onAuthStateChanged(auth, setUser);
  }, []);

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, i) => sum + (i.qty * i.rate - i.discount),
        0
      ),
    [items]
  );

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
            <div className="balance-amount">
              <span>MYR</span>
              <strong>{money(subtotal)}</strong>
            </div>
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
      <div className="table-wrap">
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
      </div>

      <button className="add" onClick={addItem}>+ Add Item</button>

      {/* TOTAL */}
      <section className="total">
        <span>Total</span>
        <strong>MYR {money(subtotal)}</strong>
      </section>

      {/* FOOTER */}
   <footer className="footer">
  <div className="bank">
    <strong className="bank-title">Bank Details</strong>

    <div className="bank-line">
      <span className="label">Bank</span>
      <span className="value">Hong Leong Bank Berhad</span>
    </div>

    <div className="bank-line">
      <span className="label">Account No.</span>
      <span className="value">2120 0080 616</span>

        <div className="actions">
          <button onClick={saveInvoice}>Save</button>
          <button onClick={() => window.print()}>Download PDF</button>
        </div>
      </footer>

      {/* STYLES */}
      <style>{`
        body { background:#f4f4f4; }

        .page {
          background:#fff;
          max-width:900px;
          margin:20px auto;
          padding:24px;
          font-family:"Helvetica Neue", Arial, sans-serif;
          color:#111;
        }

        .header {
          display:flex;
          justify-content:space-between;
          gap:24px;
          flex-wrap:wrap;
          margin-bottom:40px;
        }

        .brand {
          display:flex;
          gap:16px;
          align-items:center;
        }

        .logo {
          height:70px;
        }

        .company span {
          display:block;
          font-size:12px;
          color:#555;
        }

        .meta {
          text-align:right;
        }

        h1 {
          font-weight:300;
          letter-spacing:3px;
          color:${BRAND_COLOR};
          margin-bottom:6px;
        }

        .balance-amount strong {
          font-size:20px;
          color:${BRAND_COLOR};
        }

        .client {
          margin-bottom:32px;
        }

        input {
          border:none;
          border-bottom:1px solid #ddd;
          width:100%;
          font-size:14px;
          padding:6px 0;
        }

        .table-wrap {
          overflow-x:auto;
        }

        table {
          width:100%;
          min-width:600px;
          border-collapse:collapse;
        }

        th {
          font-size:12px;
          border-bottom:1px solid #eee;
          padding-bottom:12px;
          text-align:left;
        }

        td {
          padding:16px 6px;
        }

        .amount {
          text-align:right;
          font-weight:500;
        }

        .add {
          margin-top:16px;
          background:none;
          border:none;
          color:${BRAND_COLOR};
        }

        .total {
          margin-top:40px;
          display:flex;
          justify-content:flex-end;
          font-size:20px;
        }

        footer {
          margin-top:48px;
          padding-top:24px;
          border-top:1px solid #eee;
          display:flex;
          flex-direction:column;
          gap:24px;
          font-size:12px;
        }

        .actions {
          display:flex;
          gap:12px;
          flex-wrap:wrap;
        }

        button {
          border:1px solid ${BRAND_COLOR};
          background:none;
          padding:10px 16px;
          color:${BRAND_COLOR};
        }

        /* ===== DESKTOP ===== */
        @media (min-width: 768px) {
          .page {
            padding:60px;
          }

          footer {
            flex-direction:row;
            justify-content:space-between;
          }

          .meta {
            text-align:right;
          }
        }

        /* ===== PRINT ===== */
        @media print {
          button { display:none; }
          body { background:#fff; }
        }
      `}</style>
    </div>
  );
}


