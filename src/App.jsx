import React, { useEffect, useMemo, useState } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from "firebase/firestore";

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
  Number(n).toLocaleString("en-MY", { minimumFractionDigits: 2 });

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

  /* ===== CALCULATIONS ===== */
  const subtotal = useMemo(
    () =>
      items.reduce(
        (s, i) => s + (Number(i.qty || 0) * Number(i.rate || 0)),
        0
      ),
    [items]
  );

  const totalDiscount = useMemo(
    () => items.reduce((s, i) => s + Number(i.discount || 0), 0),
    [items]
  );

  const total = useMemo(
    () => subtotal - totalDiscount,
    [subtotal, totalDiscount]
  );

  /* ===== ACTIONS ===== */
  const addItem = () =>
    setItems([
      ...items,
      { id: Date.now(), description: "", qty: "", rate: "", discount: "" }
    ]);

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
      subtotal,
      totalDiscount,
      total,
      createdAt: serverTimestamp()
    });
    alert("Invoice saved");
  };

  const handleDownload = () => {
    document.body.classList.add("print-mode");
    setTimeout(() => {
      window.print();
      document.body.classList.remove("print-mode");
    }, 300);
  };

  return (
    <div className="page">
      {/* HEADER */}
      <header className="header">
        <div>
          <img src="/logo.png" className="logo" alt="Logo" />
          <div className="company">
            <strong>Samyama Sdn Bhd</strong>
            <span>Kuala Lumpur, Malaysia</span>
          </div>
        </div>

        <div className="meta">
          <h1>Invoice</h1>
          <span>{invoiceNo}</span>
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
          placeholder="Client name"
          value={customerName}
          onChange={e => setCustomerName(e.target.value)}
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

      {/* ITEMS TABLE */}
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
          {items.map(i => (
            <tr key={i.id}>
              <td>
                <div className="edit">
                  <input
                    placeholder="Description"
                    value={i.description}
                    onChange={e => updateItem(i.id,"description",e.target.value)}
                  />
                </div>
                <div className="print">{i.description || "—"}</div>
              </td>

              <td>
                <div className="edit">
                  <input
                    type="number"
                    placeholder="Qty"
                    value={i.qty}
                    onChange={e => updateItem(i.id,"qty",e.target.value)}
                  />
                </div>
                <div className="print">{i.qty || 0}</div>
              </td>

              <td>
                <div className="edit">
                  <input
                    type="number"
                    placeholder="Rate"
                    value={i.rate}
                    onChange={e => updateItem(i.id,"rate",e.target.value)}
                  />
                </div>
                <div className="print">{money(i.rate || 0)}</div>
              </td>

              <td>
                <div className="edit">
                  <input
                    type="number"
                    placeholder="Discount"
                    value={i.discount}
                    onChange={e => updateItem(i.id,"discount",e.target.value)}
                  />
                </div>
                <div className="print">{money(i.discount || 0)}</div>
              </td>

              <td className="amount">
                {currency} {money((i.qty||0)*(i.rate||0)-(i.discount||0))}
              </td>

              <td className="edit">
                <button onClick={() => removeItem(i.id)}>✕</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button className="add edit" onClick={addItem}>+ Add Item</button>

      {/* SUMMARY */}
      <section className="summary">
        <div>
          <span>Subtotal</span>
          <span>{currency} {money(subtotal)}</span>
        </div>
        <div>
          <span>Total Discount</span>
          <span>- {currency} {money(totalDiscount)}</span>
        </div>
        <div className="grand">
          <span>Total</span>
          <span>{currency} {money(total)}</span>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div>
          <strong>Bank Details</strong>
          <span>Hong Leong Bank Berhad</span>
          <span>2120 0080 616</span>
          <span>Samyama Sdn Bhd</span>
        </div>
        <div className="edit">
          <button onClick={saveInvoice}>Save</button>
          <button onClick={handleDownload}>Download PDF</button>
        </div>
      </footer>

      {/* STYLES */}
      <style>{`
        .page { max-width:900px; margin:auto; padding:24px; font-family:Arial; }
        .header { display:flex; justify-content:space-between; margin-bottom:40px; }
        .logo { height:70px; }
        .company span { display:block; font-size:12px; color:#555; }
        input, select { width:100%; border:none; border-bottom:1px solid #ccc; }
        label { font-size:12px; color:#777; }
        table { width:100%; border-collapse:collapse; margin-top:24px; }
        th, td { padding:12px; border-bottom:1px solid #eee; }
        .amount { text-align:right; }
        .add { margin-top:16px; }
        .summary { margin-top:32px; max-width:300px; margin-left:auto; }
        .summary div { display:flex; justify-content:space-between; margin-top:8px; }
        .summary .grand { font-weight:bold; font-size:18px; margin-top:12px; }
        footer { margin-top:48px; padding-top:24px; border-top:1px solid #eee; display:flex; justify-content:space-between; font-size:12px; }
        .print { display:none; }

        @media print {
          .edit, button, select, input, .add { display:none !important; }
          .print { display:block !important; }
          .page { padding:0; }
        }
      `}</style>
    </div>
  );
}
