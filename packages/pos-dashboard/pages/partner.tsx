'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import Link from 'next/link';
import toast from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('token') || '' : ''; }

export default function PartnerDashboard() {
  const router = useRouter();
  const [summary, setSummary] = useState<any>(null);
  const [report, setReport] = useState<any>(null);
  const [counters, setCounters] = useState<any[]>([]);
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (!u) { router.push('/'); return; }
    Promise.all([fetchData()]);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sumRes, repRes, cntRes, walRes] = await Promise.all([
        axios.get(`${API}/api/partner/predictive`, { headers: { Authorization: `Bearer ${getToken()}` } }),
        axios.get(`${API}/api/partner/report`, { headers: { Authorization: `Bearer ${getToken()}` } }),
        axios.get(`${API}/api/partner/counters`, { headers: { Authorization: `Bearer ${getToken()}` } }),
        axios.get(`${API}/api/partner/wallet`, { headers: { Authorization: `Bearer ${getToken()}` } }),
      ]);
      setSummary(sumRes.data.data);
      setReport(repRes.data.data);
      setCounters(cntRes.data.data);
      setWallet(walRes.data.data);
    } catch { toast.error('Failed to load dashboard'); }
    finally { setLoading(false); }
  };

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh'}}><span className="spinner" style={{width:40,height:40,borderWidth:3}}/></div>;

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo"><div className="logo-icon">⚡</div><span>AgentOS</span></div>
        <div className="nav-section-label">POS</div>
        <Link href="/pos" className="nav-item">🛒 Checkout</Link>
        <Link href="/vouchers" className="nav-item">🎫 Vouchers</Link>
        <div className="nav-section-label" style={{marginTop:16}}>Partner</div>
        <Link href="/partner" className="nav-item active">🏢 Dashboard</Link>
        <Link href="/reports" className="nav-item">📊 Reports</Link>
        <div style={{flex:1}}/>
        <button className="nav-item" style={{color:'var(--red)'}} onClick={() => { localStorage.clear(); router.push('/'); }}>🚪 Logout</button>
      </aside>
      <main className="main">
        <div style={{marginBottom:28}}>
          <h1 style={{fontSize:24,fontWeight:700}}>🏢 Partner Dashboard</h1>
          <p style={{color:'var(--text2)',fontSize:13}}>Overview of your hotspot business</p>
        </div>

        {/* Stats */}
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-label">Wallet Balance</div>
            <div className="stat-value" style={{color:'var(--green)'}}>${wallet?.balance?.toFixed(2) || '0.00'}</div>
            <div className="stat-sub">{wallet?.currency}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Monthly Revenue</div>
            <div className="stat-value" style={{color:'var(--accent2)'}}>${report?.total?.toFixed(2) || '0.00'}</div>
            <div className="stat-sub">Last 30 days</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Active Sessions</div>
            <div className="stat-value" style={{color:'var(--accent)'}}>{summary?.activeSessions || 0}</div>
            <div className="stat-sub">Across all hotspots</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Hotspots Online</div>
            <div className="stat-value">{summary?.onlineHotspots || 0}/{summary?.totalHotspots || 0}</div>
            <div className="stat-sub">Active routers</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Queued Vouchers</div>
            <div className="stat-value" style={{color:'var(--orange)'}}>{summary?.queuedVouchers || 0}</div>
            <div className="stat-sub">Ready to sell</div>
          </div>
        </div>

        {/* Counters Table */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
          <div className="card">
            <div className="card-header">
              <span className="card-title">🏪 Counters</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Counter</th><th>Location</th><th>Cashiers</th></tr></thead>
                <tbody>
                  {counters.map((c: any) => (
                    <tr key={c.id}>
                      <td>{c.name}</td>
                      <td style={{color:'var(--text2)',fontSize:12}}>{c.location || '-'}</td>
                      <td><span className="badge badge-purple">{c.cashiers?.length || 0}</span></td>
                    </tr>
                  ))}
                  {counters.length === 0 && <tr><td colSpan={3} style={{textAlign:'center',color:'var(--text2)',padding:20}}>No counters yet</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          {/* Predictive Alerts */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">⚠️ Predictive Alerts</span>
            </div>
            {summary?.recentAlerts?.length > 0 ? (
              summary.recentAlerts.map((a: any, i: number) => (
                <div key={i} style={{padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:13}}>
                    <span>{a.hotspot?.name || a.hotspotId}</span>
                    <span className={`badge ${a.loadPercent >= 90 ? 'badge-red' : 'badge-yellow'}`}>{a.loadPercent}% load</span>
                  </div>
                  <div style={{fontSize:11,color:'var(--text2)',marginTop:4}}>{new Date(a.createdAt).toLocaleString()}</div>
                </div>
              ))
            ) : <p style={{color:'var(--text2)',fontSize:13,padding:'20px 0',textAlign:'center'}}>✅ No alerts — all good!</p>}
          </div>
        </div>
      </main>
    </div>
  );
}
