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
  const y = new Date().getFullYear().toString().slice(-2);
  const rand = Math.floor(100 + Math.random() * 900);
  return `INV${y}-${rand}`;
};

/* ================= APP ================= */
export default function App() {
  const [user, setUser] = useState(null);
  const [invoiceNo] = useState(generateInvoiceNo());
  const [customerName, setCustomerName] = useState("Arni Kamila");
  const [currency, setCurrency] = useState("MYR");

  const [items, setItems] = useState([
    { id: 1, description: "Grey Lace Shawl (FOC)", qty: 1, rate: 0 },
    { id: 2, description: "Set of Kerongsang (FOC)", qty: 1, rate: 0 },
    { id: 3, description: "Kebaya Cloth", qty: 1, rate: 800 },
    { id: 4, description: "Kebaya Tailoring", qty: 1, rate: 750 },
    { id: 5, description: "Kebaya Embroidery", qty: 1, rate: 1500 },
    { id: 6, description: "Batik Skirt Tailoring", qty: 1, rate: 450 }
  ]);

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

  /* ================= ITEM UPDATE ================= */
  const updateItem = (id, field, value) => {
    setItems(items.map(i =>
      i.id === id ? { ...i, [field]: value } : i
    ));
  };

  /* ================= UI ================= */
  return (
    <div style={{ maxWidth: 820, margin: "auto", padding: 30, fontSize: 14 }}>
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
          <h1>Invoice</h1>
          <p><strong># {invoiceNo}</strong></p>
          <p><strong>Balance Due</strong></p>
          <p>{currency} {subtotal.toFixed(2)}</p>
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

      {/* ITEMS TABLE */}
      <table width="100%" border="1" cellPadding="6" style={{ marginTop: 20, borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th align="left">Item & Description</th>
            <th align="right">Qty</th>
            <th align="right">Rate</th>
            <th align="right">Amount</th>
          </tr>
        </thead>
        <tbody>
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
                  onChange={e => updateItem(item.id, "qty", Number(e.target.value))}
                  style={{ width: 60 }}
                />
              </td>
              <td align="right">
                <input
                  type="number"
                  value={item.rate}
                  onChange={e => updateItem(item.id, "rate", Number(e.target.value))}
                  style={{ width: 80 }}
                />
              </td>
              <td align="right">
                {(item.qty * item.rate).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* TOTALS */}
      <div style={{ textAlign: "right", marginTop: 20 }}>
        <p>Sub Total: {currency} {subtotal.toFixed(2)}</p>
        <p><strong>Total: {currency} {subtotal.toFixed(2)}</strong></p>
        <p><strong>Balance Due: {currency} {subtotal.toFixed(2)}</strong></p>
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
    </div>
  );
}
