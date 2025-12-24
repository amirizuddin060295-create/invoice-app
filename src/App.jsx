import React, { useEffect, useMemo, useState } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";

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
  return `INV-${d.getFullYear().toString().slice(-2)}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}${String(d.getHours()).padStart(2,"0")}${String(d.getMinutes()).padStart(2,"0")}`;
};

const money = n => Number(n).toLocaleString("en-MY", { minimumFractionDigits: 2 });

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

  const subtotal = useMemo(
    () => items.reduce((s,i)=>s+(i.qty||0)*(i.rate||0),0),
    [items]
  );
  const discount = useMemo(
    () => items.reduce((s,i)=>s+(i.discount||0),0),
    [items]
  );
  const total = subtotal - discount;

  const addItem = () =>
    setItems([...items,{id:Date.now(),description:"",qty:1,rate:0,discount:0}]);

  const updateItem = (id,field,value) =>
    setItems(items.map(i=>i.id===id?{...i,[field]:Number(value)||value}:i));

  const removeItem = id =>
    setItems(items.filter(i=>i.id!==id));

  const saveInvoice = async () => {
    await addDoc(collection(db,"invoices"),{
      invoiceNo,customerName,currency,items,subtotal,discount,total,
      createdAt:serverTimestamp()
    });
    alert("Saved");
  };

  const downloadPDF = () => window.print();

  return (
    <div className="page">
      <header className="header">
        <div>
          <img src="/logo.png" className="logo" />
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
            <strong>{currency} {money(total)}</strong>
          </div>
        </div>
      </header>

      <section>
        <label>Billed To</label>
        <input value={customerName} onChange={e=>setCustomerName(e.target.value)} />
      </section>

      <section>
        <label>Currency</label>
        <select value={currency} onChange={e=>setCurrency(e.target.value)}>
          <option>MYR</option>
          <option>SGD</option>
        </select>
      </section>

      {/* DESKTOP TABLE (USED FOR PDF) */}
      <table className="desktop">
        <thead>
          <tr>
            <th>Description</th><th>Qty</th><th>Rate</th><th>Discount</th><th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map(i=>(
            <tr key={i.id}>
              <td>{i.description}</td>
              <td>{i.qty}</td>
              <td>{money(i.rate)}</td>
              <td>{money(i.discount)}</td>
              <td>{currency} {money(i.qty*i.rate-i.discount)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* MOBILE EDITOR */}
      <div className="mobile">
        {items.map(i=>(
          <div key={i.id} className="card">
            <input placeholder="Description" value={i.description} onChange={e=>updateItem(i.id,"description",e.target.value)} />
            <input type="number" placeholder="Qty" value={i.qty} onChange={e=>updateItem(i.id,"qty",e.target.value)} />
            <input type="number" placeholder="Rate" value={i.rate} onChange={e=>updateItem(i.id,"rate",e.target.value)} />
            <input type="number" placeholder="Discount" value={i.discount} onChange={e=>updateItem(i.id,"discount",e.target.value)} />
            <button onClick={()=>removeItem(i.id)}>Remove</button>
          </div>
        ))}
      </div>

      <button onClick={addItem}>+ Add Item</button>

      <section className="summary">
        <div>Subtotal: {currency} {money(subtotal)}</div>
        <div>Discount: -{currency} {money(discount)}</div>
        <strong>Total: {currency} {money(total)}</strong>
      </section>

      <footer>
        <div>
          <strong>Bank Details</strong>
          <span>Hong Leong Bank Berhad</span>
          <span>2120 0080 616</span>
          <span>Samyama Sdn Bhd</span>
        </div>
        <div>
          <button onClick={saveInvoice}>Save</button>
          <button onClick={downloadPDF}>Download PDF</button>
        </div>
      </footer>

      <style>{`
        .page{max-width:900px;margin:auto;padding:24px;font-family:Arial}
        .header{display:flex;justify-content:space-between;margin-bottom:32px}
        .logo{height:70px}
        input,select{width:100%;margin-top:6px}
        table{width:100%;border-collapse:collapse;margin-top:24px}
        th,td{border-bottom:1px solid #eee;padding:10px}
        .desktop{display:none}
        .mobile .card{border:1px solid #ddd;padding:12px;margin-bottom:12px}
        footer{margin-top:40px;border-top:1px solid #eee;padding-top:20px;display:flex;justify-content:space-between}

        @media (min-width:768px){
          .desktop{display:table}
          .mobile{display:none}
        }

        /* 🔥 PRINT FIX */
        @media print{
          .mobile,button,select,input{display:none!important}
          .desktop{display:table!important}
          body{background:white}
        }
      `}</style>
    </div>
  );
}
