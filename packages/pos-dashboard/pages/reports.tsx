'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('token') || '' : ''; }

export default function ReportsPage() {
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('token')) { router.push('/'); return; }
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Mock data for initial restore
      const mockData = [
        { name: 'Mon', sales: 4000 },
        { name: 'Tue', sales: 3000 },
        { name: 'Wed', sales: 2000 },
        { name: 'Thu', sales: 2780 },
        { name: 'Fri', sales: 1890 },
        { name: 'Sat', sales: 2390 },
        { name: 'Sun', sales: 3490 },
      ];
      setData(mockData);
    } catch { toast.error('Failed to load reports'); }
    finally { setLoading(false); }
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo"><div className="logo-icon">⚡</div><span>AgentOS</span></div>
        <div className="nav-section-label">POS</div>
        <Link href="/pos" className="nav-item">🛒 Checkout</Link>
        <Link href="/vouchers" className="nav-item">🎫 Vouchers</Link>
        <div className="nav-section-label" style={{marginTop:16}}>Reports</div>
        <Link href="/reports" className="nav-item active">📊 Sales</Link>
        <div style={{flex:1}}/>
        <button className="nav-item" style={{color:'var(--red)'}} onClick={() => { localStorage.clear(); router.push('/'); }}>🚪 Logout</button>
      </aside>

      <main className="main">
        <div style={{marginBottom:28}}>
          <h1 style={{fontSize:24,fontWeight:700}}>📊 Sales Reports</h1>
          <p style={{color:'var(--text2)',fontSize:13}}>Performance metrics and revenue analysis</p>
        </div>

        <div className="card" style={{height:400, marginBottom:24}}>
          <div className="card-header"><span className="card-title">Weekly Revenue</span></div>
          {loading ? <div className="spinner" style={{margin:'auto'}}/> : (
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="var(--text2)" fontSize={12} />
                <YAxis stroke="var(--text2)" fontSize={12} />
                <Tooltip 
                    contentStyle={{background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:8}}
                    itemStyle={{color:'var(--accent2)'}}
                />
                <Bar dataKey="sales" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </main>
    </div>
  );
}
