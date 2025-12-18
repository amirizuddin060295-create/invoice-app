import React, { useEffect, useMemo, useState } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from "firebase/firestore";

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
  const year = new Date().getFullYear().toString().slice(-2);
  const rand = Math.floor(100 + Math.random() * 900);
  return `INV${year}-${rand}`;
};

const money = (n) =>
  n.toLocaleString("en-MY", { minimumFractionDigits: 2 });

/* ================= APP ================= */
export default function App() {
  const [user, setUser] = useState(null);
  const [invoiceNo] = useState(generateInvoiceNo());
  const [customerName, setCustomerName] = useState("");
  const [currency] = useState("MYR");
  const [items, setItems] = useState([]);

  /* ================= AUTH ================= */
  useEffect(() => {
    signInAnonymously(auth);
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  /* ================= TOTAL ================= */
  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.qty * i.rate, 0),
    [items]
  );

  /* ================= SAVE ================= */
  const saveInvoice = async () => {
    if (!user) return;
    await addDoc(collection(db, "invoices"), {
      invoiceNo,
      customerName,
      currency,
      items,
      total: subtotal,
      createdAt: serverTimestamp()
    });
    alert("Invoice saved");
  };

  /* ================= ITEM HELPERS ================= */
  const addItem = () => {
    setItems([...items, { id: Date.now(), description: "", qty: 1, rate: 0 }]);
  };

  const updateItem = (id, field, value) => {
    setItems(items.map(i =>
      i.id === id ? { ...i, [field]: value } : i
    ));
  };

  const removeItem = (id) => {
    setItems(items.filter(i => i.id !== id));
  };

  /* ================= UI ================= */
  return (
    <div style={{ maxWidth: 820, margin: "auto", padding: 40, fontSize: 13 }}>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <h2>Samyama Sdn Bhd</h2>
          <p>Registration No 202001027188</p>
          <p>B-2-3a Seni Mont Kiara</p>
          <p>2a Changkat Duta Kiara</p>
          <p>Kuala Lumpur 50480, Malaysia</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <h1>INVOICE</h1>
          <p><strong># {invoiceNo}</strong></p>
          <p style={{ marginTop: 10 }}>
            <strong>Balance Due</strong><br />
            {currency} {money(subtotal)}
          </p>
        </div>
      </div>

      <hr />

      {/* BILL TO */}
      <p>
        <strong>Bill To:</strong>{" "}
        <input
          value={customerName}
          onChange={e => setCustomerName(e.target.value)}
        />
      </p>

      <p><strong>Invoice Date:</strong> {new Date().toLocaleDateString()}</p>
      <p><strong>Terms:</strong> Net 3</p>

      {/* ITEMS */}
      <table width="100%" border="1" cellPadding="6" style={{ marginTop: 20, borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th align="left">Item & Description</th>
            <th align="right">Qty</th>
            <th align="right">Rate</th>
            <th align="right">Amount</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && (
            <tr>
              <td colSpan="5" align="center" style={{ color: "#888" }}>
                No items yet
              </td>
            </tr>
          )}

          {items.map((item, i) => (
            <tr key={item.id}>
              <td>
                {i + 1}.{" "}
                <input
                  value={item.description}
                  onChange={e => updateItem(item.id, "description", e.target.value)}
                />
              </td>
              <td align="right">
                <input
                  type="number"
                  value={item.qty}
                  min="1"
                  onChange={e => updateItem(item.id, "qty", Number(e.target.value))}
                  style={{ width: 60 }}
                />
              </td>
              <td align="right">
                <input
                  type="number"
                  value={item.rate}
                  min="0"
                  onChange={e => updateItem(item.id, "rate", Number(e.target.value))}
                  style={{ width: 80 }}
                />
              </td>
              <td align="right">
                {money(item.qty * item.rate)}
              </td>
              <td align="center">
                <button onClick={() => removeItem(item.id)}>✕</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button onClick={addItem} style={{ marginTop: 10 }}>
        + Add Item
      </button>

      {/* TOTALS */}
      <div style={{ textAlign: "right", marginTop: 20 }}>
        <p>Sub Total: {currency} {money(subtotal)}</p>
        <p><strong>Total: {currency} {money(subtotal)}</strong></p>
        <p><strong>Balance Due: {currency} {money(subtotal)}</strong></p>
      </div>

      <hr />

      {/* BANK */}
      <p><strong>Bank Details for Payment:</strong></p>
      <p>Bank Name: Hong Leong Bank Berhad</p>
      <p>Account Number: 2120 0080 616</p>
      <p>Account Holder: Samyama Sdn Bhd</p>
      <p>SWIFT Code: HLBBMYKLXXX</p>

      {/* ACTIONS */}
      <div style={{ marginTop: 20 }}>
        <button onClick={saveInvoice}>Save to Cloud</button>
        <button onClick={() => window.print()} style={{ marginLeft: 10 }}>
          Download PDF
        </button>
      </div>

      {/* PRINT STYLE */}
      <style>
        {`@media print {
          button { display: none; }
          input { border: none; }
        }`}
      </style>
    </div>
  );
}
