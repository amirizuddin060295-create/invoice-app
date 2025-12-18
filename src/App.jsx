import React, { useState, useEffect, useMemo, useRef } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp
} from "firebase/firestore";
import {
  Plus,
  Trash2,
  Printer,
  CloudUpload,
  Loader2,
  CheckCircle2
} from "lucide-react";

/* ================= FIREBASE CONFIG ================= */
/* YOU WILL REPLACE THIS OBJECT LATER (STEP BY STEP) */
const firebaseConfig = {
  apiKey: "AIzaSyB5a0xtjbtUg57v15q5P0N5an0I_LiwA3U",
  authDomain: "invoice-ai-samyama.firebaseapp.com",
  projectId: "invoice-ai-samyama",
  storageBucket: "invoice-ai-samyama.firebasestorage.app",
  messagingSenderId: "249755399024",
  appId: "1:249755399024:web:f63e9005cd20830ce715b5"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* ================= GEMINI KEY ================= */
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

/* ================= APP ================= */
export default function App() {
  const [user, setUser] = useState(null);
  const [customerName, setCustomerName] = useState("John Doe");
  const [currency, setCurrency] = useState("SGD");
  const [items, setItems] = useState([
    { id: 1, description: "Luxury Item", price: 100 }
  ]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState([]);

  /* ================= AUTH ================= */
  useEffect(() => {
    signInAnonymously(auth);
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  /* ================= LOAD HISTORY ================= */
  useEffect(() => {
    if (!user) return;
    const q = collection(db, "invoices");
    return onSnapshot(q, snap => {
      setHistory(snap.docs.map(d => d.data()));
    });
  }, [user]);

  /* ================= TOTAL ================= */
  const total = useMemo(
    () => items.reduce((a, b) => a + b.price, 0),
    [items]
  );

  /* ================= SAVE ================= */
  const saveInvoice = async () => {
    setSaving(true);
    await addDoc(collection(db, "invoices"), {
      customerName,
      currency,
      items,
      total,
      createdAt: serverTimestamp()
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  /* ================= UI ================= */
  return (
    <div style={{ padding: 20, maxWidth: 800, margin: "auto" }}>
      <h1>Invoice Manager</h1>

      <label>Customer</label>
      <input
        value={customerName}
        onChange={e => setCustomerName(e.target.value)}
        style={{ width: "100%", marginBottom: 10 }}
      />

      <label>Currency</label>
      <select
        value={currency}
        onChange={e => setCurrency(e.target.value)}
        style={{ width: "100%", marginBottom: 20 }}
      >
        <option>SGD</option>
        <option>MYR</option>
      </select>

      <h3>Items</h3>
      {items.map(item => (
        <div key={item.id} style={{ display: "flex", gap: 10 }}>
          <input
            value={item.description}
            onChange={e =>
              setItems(items.map(i =>
                i.id === item.id ? { ...i, description: e.target.value } : i
              ))
            }
          />
          <input
            type="number"
            value={item.price}
            onChange={e =>
              setItems(items.map(i =>
                i.id === item.id ? { ...i, price: Number(e.target.value) } : i
              ))
            }
          />
          <button onClick={() => setItems(items.filter(i => i.id !== item.id))}>
            <Trash2 size={16} />
          </button>
        </div>
      ))}

      <button
        onClick={() =>
          setItems([...items, { id: Date.now(), description: "", price: 0 }])
        }
      >
        <Plus size={16} /> Add Item
      </button>

      <h2>Total: {currency} {total}</h2>

      <button onClick={saveInvoice} disabled={saving}>
        {saving ? <Loader2 /> : saved ? <CheckCircle2 /> : <CloudUpload />}
        Save to Cloud
      </button>

      <button onClick={() => window.print()}>
        <Printer /> Download PDF
      </button>

      <hr />
      <h3>Saved Invoices</h3>
      <ul>
        {history.map((h, i) => (
          <li key={i}>
            {h.customerName} — {h.currency} {h.total}
          </li>
        ))}
      </ul>
    </div>
  );
}
