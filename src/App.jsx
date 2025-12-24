import React, { useEffect, useMemo, useState } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from "firebase/firestore";

/* ================= BRAND ================= */
const BRAND_COLOR = "#111111";

/* ================= FIREBASE ================= */
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
  const d = new Date();
  const yy = d.getFullYear().toString().slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `INV-${yy}${mm}${dd}${hh}${min}`;
};

const money = (n) =>
  n.toLocaleString("en-MY", { minimumFractionDigits: 2 });

/* ================= APP ================= */
export default function App() {
  const [user, setUser] = useState(null);
  const [invoiceNo] = useState(generateInvoiceNo());
  const [customerName, setCustomerName] = useState("");
  const [currency, setCurrency] = useState("MYR");
  const [items, setItems] = useState([]);

  useEffect(() => {
    signInAnonymously(auth);
    return onAuthStateChanged(auth, setUser);
  }, []);

  const total = useMemo(
    () => items.reduce((s, i) => s + (i.qty * i.rate - i.discount), 0),
    [items]
  );

  const addItem = () =>
    setItems([...items, {
      id: Date.now(),
      description: "",
      qty: 1,
      rate: 0,
      discount: 0
    }]);

  const updateItem = (id, field, value) =>
    setItems(items.map(i =>
      i.id === id ? { ...i, [field]: value } : i
    ));

  const removeItem = id =>
    setItems(items.filter(i => i.id !== id));

  const saveInvoice = async () => {
    if (!user) return;
    await addDoc(collection(db, "invoices"), {
      invoiceNo,
      customerName,
      currency,
      items,
      total,
      createdAt: serverTimestamp()
    });
    alert("Invoice saved");
  };

  return (
    <div className="page">
      {/* HEADER */}
      <header className="header">
        <div className="brand">
          <img src="/logo.png" className="logo" />
          <div className="company">
            <strong>Samyama Sdn Bhd</strong>
            <span>Kuala Lumpur, Malaysia</span>
          </div>
        </div>

        <div className="meta">
          <h1>Invoice</h1>
          <span className="inv">#{invoiceNo}</span>
          <div className="balance">
            <span>Balance Due</span>
            <div>
              <span>{currency}</span>
              <strong>{money(total)}</strong>
            </div>
          </div>
        </div>
      </header>

      {/* CLIENT */}
      <section className="client">
        <label>Billed To</label>
        <input
          value={customerName}
          onChange={e => setCustomerName(e.target.value)}
          placeholder="Client name"
        />
      </section>

      {/* CURRENCY */}
      <section className="currency">
        <label>Currency</label>
        <select value={currency} onChange={e => setCurrency(e.target.value)}>
          <option value="MYR">MYR</option>
          <option value="SGD">SGD</option>
        </select>
      </section>

      {/* DESKTOP TABLE */}
      <table className="desktop">
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
          {items.map(i => (
            <tr key={i.id}>
              <td><input value={i.description} onChange={e => updateItem(i.id,"description",e.target.value)} /></td>
              <td><input type="number" value={i.qty} onChange={e => updateItem(i.id,"qty",+e.target.value)} /></td>
              <td><input type="number" value={i.rate} onChange={e => updateItem(i.id,"rate",+e.target.value)} /></td>
              <td><input type="number" value={i.discount} onChange={e => updateItem(i.id,"discount",+e.target.value)} /></td>
              <td className="amount">{currency} {money(i.qty*i.rate - i.discount)}</td>
              <td><button onClick={() => removeItem(i.id)}>✕</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* MOBILE CARDS */}
      <div className="mobile">
        {items.map(i => (
          <div key={i.id} className="card">
            <input placeholder="Item description" value={i.description} onChange={e => updateItem(i.id,"description",e.target.value)} />
            <div className="row">
              <input type="number" placeholder="Qty" value={i.qty} onChange={e => updateItem(i.id,"qty",+e.target.value)} />
              <input type="number" placeholder="Rate" value={i.rate} onChange={e => updateItem(i.id,"rate",+e.target.value)} />
            </div>
            <input type="number" placeholder="Discount" value={i.discount} onChange={e => updateItem(i.id,"discount",+e.target.value)} />
            <div className="amount">{currency} {money(i.qty*i.rate - i.discount)}</div>
            <button onClick={() => removeItem(i.id)}>Remove</button>
          </div>
        ))}
      </div>

      <button className="add" onClick={addItem}>+ Add Item</button>

      <section className="total">
        <strong>Total</strong>
        <strong>{currency} {money(total)}</strong>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="bank">
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
        .page { max-width:900px; margin:auto; padding:20px; font-family:Arial; }
        .header { display:flex; justify-content:space-between; flex-wrap:wrap; gap:20px; }
        .logo { height:60px; }
        input, select { width:100%; border:none; border-bottom:1px solid #ccc; padding:6px 0; }
        label { font-size:12px; color:#777; }
        table { width:100%; border-collapse:collapse; margin-top:24px; }
        th,td { padding:12px; }
        .amount { text-align:right; font-weight:600; }
        .desktop { display:none; }
        .mobile .card { border:1px solid #eee; padding:16px; margin-bottom:16px; border-radius:8px; }
        .row { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:12px; }
        .add { margin-top:16px; }
        .total { margin-top:32px; display:flex; justify-content:space-between; font-size:18px; }
        footer { margin-top:40px; border-top:1px solid #eee; padding-top:24px; display:flex; flex-direction:column; gap:24px; }
        .actions { display:flex; gap:12px; flex-wrap:wrap; }

        @media (min-width: 768px) {
          .desktop { display:table; }
          .mobile { display:none; }
          footer { flex-direction:row; justify-content:space-between; }
        }

        @media print {
          .mobile, .add, button { display:none; }
        }
      `}</style>
    </div>
  );
}
