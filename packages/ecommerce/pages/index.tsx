'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface Plan {
  id: string; name: string; description: string;
  durationHours: number; dataLimitMB: number | null;
  speedLimitKbps: number | null; priceRetail: number;
}

interface CartItem { plan: Plan; qty: number; }

const PLAN_ICONS: Record<string, string> = {
  '1 Hour': '⚡',
  '3 Hours': '🔥',
  '1 Day': '☀️',
  '1 Week': '🗓️',
  '1 Month': '🌙',
};

export default function Home() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    axios.get(`${API}/api/plans`).then(r => setPlans(r.data.data)).catch(() => {});
    const saved = localStorage.getItem('cart');
    if (saved) setCart(JSON.parse(saved));
  }, []);

  const saveCart = (c: CartItem[]) => {
    setCart(c);
    localStorage.setItem('cart', JSON.stringify(c));
  };

  const addToCart = (plan: Plan) => {
    const idx = cart.findIndex(c => c.plan.id === plan.id);
    if (idx >= 0) {
      const updated = [...cart];
      updated[idx].qty++;
      saveCart(updated);
    } else {
      saveCart([...cart, { plan, qty: 1 }]);
    }
    toast.success(`${plan.name} added to cart!`);
  };

  const removeFromCart = (planId: string) => saveCart(cart.filter(c => c.plan.id !== planId));

  const total = cart.reduce((s, c) => s + c.plan.priceRetail * c.qty, 0);
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);

  return (
    <>
      {/* NAV */}
      <nav>
        <div className="nav-logo">
          <div className="logo-icon">⚡</div>
          <span>AgentOS</span>
        </div>
        <div className="nav-links">
          <a href="#plans">Vouchers</a>
          <a href="#features">Features</a>
          <Link href="/orders">My Orders</Link>
        </div>
        <div className="nav-right">
          <button className="cart-btn" onClick={() => setCartOpen(true)}>
            🛒 Cart <span className="count">{cartCount}</span>
          </button>
        </div>
      </nav>

      {/* HERO */}
      <div className="hero">
        <h1>Fast WiFi,<br /><span>Anywhere You Go</span></h1>
        <p>Buy affordable internet vouchers instantly. Activate with QR code and start browsing in seconds.</p>
        <div className="hero-actions">
          <a href="#plans" className="btn btn-primary">Browse Plans</a>
          <Link href="/orders" className="btn btn-outline">My Orders</Link>
        </div>
      </div>

      {/* PLANS */}
      <section id="plans">
        <h2>Internet Plans</h2>
        <p className="sub">Choose the plan that suits you. Voucher code delivered instantly after payment.</p>
        <div className="plans-grid">
          {plans.map((plan, i) => (
            <div key={plan.id} className={`plan-card${i === 2 ? ' popular' : ''}`}>
              {i === 2 && <span className="plan-badge">POPULAR</span>}
              <div className="plan-icon">{PLAN_ICONS[plan.name] || '🌐'}</div>
              <div className="plan-name">{plan.name}</div>
              <div className="plan-features">
                {plan.durationHours}h access<br />
                {plan.dataLimitMB ? `${plan.dataLimitMB}MB data` : 'Unlimited data'}<br />
                {plan.speedLimitKbps ? `${Math.round(plan.speedLimitKbps/1024)}Mbps` : 'Max speed'}<br />
              </div>
              <div className="plan-price">${plan.priceRetail.toFixed(2)}<span>/voucher</span></div>
              <button className="btn btn-primary btn-full" style={{marginTop:20}} onClick={() => addToCart(plan)}>
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{background:'var(--bg2)', margin:'0 -48px', padding:'60px 48px'}}>
        <h2>Why AgentOS?</h2>
        <p className="sub">A complete hotspot ecosystem built for reliability</p>
        <div className="features-grid">
          {[
            { icon: '⚡', title: 'Instant Activation', desc: 'Scan QR code or enter code manually — connected in seconds.' },
            { icon: '🔄', title: 'Magic Roaming', desc: 'Move between hotspots without losing your session.' },
            { icon: '🛡️', title: 'Secure Sessions', desc: 'Every session is monitored, bandwidth-limited per plan.' },
            { icon: '💳', title: 'Multiple Payments', desc: 'Pay via Stripe, EcoCash, ZIPIT, or cash at a POS counter.' },
            { icon: '📱', title: 'WhatsApp Alerts', desc: 'Get activation confirmations directly on WhatsApp.' },
            { icon: '📊', title: 'Smart Allocation', desc: 'AI predicts demand and pre-stocks vouchers automatically.' },
          ].map(f => (
            <div key={f.title} className="feature">
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer>
        <span>© 2025 AgentOS. All rights reserved.</span>
        <span style={{color:'var(--text2)'}}>Built on OpenClaw</span>
      </footer>

      {/* CART DRAWER */}
      {cartOpen && (
        <>
          <div className="cart-overlay" onClick={() => setCartOpen(false)} />
          <div className="cart-drawer">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div className="cart-title">🛒 Cart ({cartCount})</div>
              <button className="btn btn-outline" style={{padding:'6px 12px',fontSize:12}} onClick={() => setCartOpen(false)}>Close</button>
            </div>
            <div className="cart-items">
              {cart.length === 0 && <p style={{color:'var(--text2)',textAlign:'center',padding:'40px 0'}}>Your cart is empty</p>}
              {cart.map(item => (
                <div className="cart-item" key={item.plan.id}>
                  <div>
                    <div className="cart-item-name">{item.plan.name}</div>
                    <div className="cart-item-sub">Qty: {item.qty} × ${item.plan.priceRetail}</div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <span style={{fontWeight:700}}>${(item.plan.priceRetail * item.qty).toFixed(2)}</span>
                    <button onClick={() => removeFromCart(item.plan.id)} style={{background:'rgba(255,82,82,0.15)',color:'#ff5252',border:'none',borderRadius:6,padding:'4px 8px',cursor:'pointer'}}>✕</button>
                  </div>
                </div>
              ))}
            </div>
            {cart.length > 0 && (
              <>
                <div className="cart-total">
                  <span>Total</span>
                  <span style={{color:'var(--accent2)'}}>${total.toFixed(2)}</span>
                </div>
                <button className="btn btn-primary btn-full" style={{marginTop:16,padding:14}} onClick={() => { setCartOpen(false); router.push('/checkout'); }}>
                  Proceed to Checkout →
                </button>
              </>
            )}
          </div>
        </>
      )}
    </>
  );
}
