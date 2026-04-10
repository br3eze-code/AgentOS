'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import toast from 'react-hot-toast';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('token') || '' : ''; }

export default function POSPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [qty, setQty] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'WALLET'>('CASH');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (!u) { router.push('/'); return; }
    setUser(JSON.parse(u));
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await axios.get(`${API}/api/plans`, { headers: { Authorization: `Bearer ${getToken()}` } });
      setPlans(res.data.data);
    } catch { toast.error('Failed to load plans'); }
  };

  const handleCheckout = async () => {
    if (!selectedPlan) return toast.error('Select a plan');
    setLoading(true);
    try {
      const res = await axios.post(`${API}/api/pos/checkout`, {
        planId: selectedPlan.id,
        quantity: qty,
        paymentMethod,
      }, { headers: { Authorization: `Bearer ${getToken()}` } });
      setResult(res.data.data);
      toast.success('Sale complete! Vouchers generated & print queued.');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  const total = selectedPlan ? selectedPlan.priceRetail * qty : 0;

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">⚡</div>
          <span>AgentOS</span>
        </div>
        <div className="nav-section-label">POS</div>
        <Link href="/pos" className="nav-item active">🛒 Checkout</Link>
        <Link href="/vouchers" className="nav-item">🎫 Vouchers</Link>
        <div className="nav-section-label" style={{marginTop:16}}>Reports</div>
        <Link href="/reports" className="nav-item">📊 Sales</Link>
        {user?.role === 'PARTNER' && <Link href="/partner" className="nav-item">🏢 Partner</Link>}
        {user?.role === 'ADMIN' && <Link href="/admin" className="nav-item">⚙️ Admin</Link>}
        <div style={{flex:1}} />
        <button className="nav-item" style={{marginTop:'auto', color:'var(--red)'}} onClick={() => { localStorage.clear(); router.push('/'); }}>
          🚪 Logout
        </button>
      </aside>

      <main className="main">
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:28}}>
          <div>
            <h1 style={{fontSize:24,fontWeight:700}}>Point of Sale</h1>
            <p style={{color:'var(--text2)',fontSize:13}}>Generate & sell vouchers instantly</p>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <span style={{fontSize:13,color:'var(--text2)'}}>👤 {user?.name}</span>
            <span className="badge badge-purple">{user?.role}</span>
          </div>
        </div>

        <div className="pos-grid">
          {/* Plan Selection */}
          <div>
            <div className="card" style={{marginBottom:20}}>
              <div className="card-header">
                <span className="card-title">📋 Select Plan</span>
              </div>
              <div className="plan-grid">
                {plans.map(plan => (
                  <div
                    key={plan.id}
                    className={`plan-card${selectedPlan?.id === plan.id ? ' selected' : ''}`}
                    onClick={() => setSelectedPlan(plan)}
                  >
                    <div className="plan-name">{plan.name}</div>
                    <div className="plan-duration">{plan.durationHours}h · {plan.dataLimitMB ? `${plan.dataLimitMB}MB` : 'Unlimited'}</div>
                    <div className="plan-price">${plan.priceRetail.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Generated Vouchers */}
            {result && (
              <div className="card">
                <div className="card-header">
                  <span className="card-title" style={{color:'var(--green)'}}>✓ Vouchers Generated</span>
                  <button className="btn btn-sm btn-ghost" onClick={() => setResult(null)}>Clear</button>
                </div>
                <div className="voucher-codes">
                  {result.codes.map((code: string) => (
                    <div className="voucher-code" key={code}>
                      <span>{code}</span>
                      <span className="badge badge-green">Ready</span>
                    </div>
                  ))}
                </div>
                <p style={{fontSize:12,color:'var(--text2)',marginTop:12}}>
                  🖨️ Print jobs queued automatically. Total: ${result.totalAmount.toFixed(2)}
                </p>
              </div>
            )}
          </div>

          {/* Receipt Panel */}
          <div className="receipt-panel">
            <h3 style={{fontSize:16,fontWeight:600,marginBottom:20}}>🧾 Receipt</h3>

            {selectedPlan ? (
              <>
                <div className="receipt-row"><span>Plan</span><span>{selectedPlan.name}</span></div>
                <div className="receipt-row"><span>Duration</span><span>{selectedPlan.durationHours}h</span></div>
                <div className="receipt-row"><span>Data</span><span>{selectedPlan.dataLimitMB ? selectedPlan.dataLimitMB+'MB' : 'Unlimited'}</span></div>
                <div className="receipt-row"><span>Unit Price</span><span>${selectedPlan.priceRetail}</span></div>
              </>
            ) : (
              <p style={{color:'var(--text2)',fontSize:13,textAlign:'center',padding:'20px 0'}}>← Select a plan from the left</p>
            )}

            <div className="form-group" style={{marginTop:20}}>
              <label className="form-label">Quantity</label>
              <input
                className="form-input"
                type="number"
                min={1}
                max={100}
                value={qty}
                onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <select className="form-input" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as any)}>
                <option value="CASH">💵 Cash</option>
                <option value="WALLET">💳 Wallet</option>
              </select>
            </div>

            <div className="receipt-total">
              <span>Total</span>
              <span style={{color:'var(--accent2)'}}>${total.toFixed(2)}</span>
            </div>

            <button
              className="btn btn-success"
              onClick={handleCheckout}
              disabled={loading || !selectedPlan}
              style={{width:'100%',justifyContent:'center',marginTop:20,padding:'14px'}}
            >
              {loading ? <span className="spinner" /> : '💳 Complete Sale'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
