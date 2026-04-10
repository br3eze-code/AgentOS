'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import toast from 'react-hot-toast';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('token') || '' : ''; }

const STATUS_BADGE: Record<string, string> = {
  QUEUED: 'badge-yellow',
  ACTIVE: 'badge-green',
  USED: 'badge-blue',
  EXPIRED: 'badge-red',
  CANCELLED: 'badge-red',
};

export default function VouchersPage() {
  const router = useRouter();
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!localStorage.getItem('token')) { router.push('/'); return; }
    fetchVouchers();
  }, [page, statusFilter]);

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/vouchers`, {
        headers: { Authorization: `Bearer ${getToken()}` },
        params: { page, pageSize: 25, status: statusFilter || undefined },
      });
      setVouchers(res.data.data.items);
      setTotal(res.data.data.total);
    } catch { toast.error('Failed to load vouchers'); }
    finally { setLoading(false); }
  };

  const handleReprint = async (code: string) => {
    try {
      await axios.post(`${API}/api/vouchers/reprint`, { code }, { headers: { Authorization: `Bearer ${getToken()}` } });
      toast.success('Print job queued');
    } catch (err: any) { toast.error(err.response?.data?.error || 'Print failed'); }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this voucher?')) return;
    try {
      await axios.delete(`${API}/api/vouchers/${id}`, { headers: { Authorization: `Bearer ${getToken()}` } });
      toast.success('Voucher cancelled');
      fetchVouchers();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const filtered = search
    ? vouchers.filter(v => v.code.includes(search.toUpperCase()) || v.plan?.name?.toLowerCase().includes(search.toLowerCase()))
    : vouchers;

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo"><div className="logo-icon">⚡</div><span>AgentOS</span></div>
        <div className="nav-section-label">POS</div>
        <Link href="/pos" className="nav-item">🛒 Checkout</Link>
        <Link href="/vouchers" className="nav-item active">🎫 Vouchers</Link>
        <div className="nav-section-label" style={{marginTop:16}}>Reports</div>
        <Link href="/reports" className="nav-item">📊 Sales</Link>
        <div style={{flex:1}}/>
        <button className="nav-item" style={{color:'var(--red)'}} onClick={() => { localStorage.clear(); router.push('/'); }}>🚪 Logout</button>
      </aside>
      <main className="main">
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24}}>
          <div>
            <h1 style={{fontSize:24,fontWeight:700}}>🎫 Vouchers</h1>
            <p style={{color:'var(--text2)',fontSize:13}}>{total} total vouchers</p>
          </div>
          <div style={{display:'flex',gap:10}}>
            <input className="form-input" style={{width:200}} placeholder="Search code / plan..." value={search} onChange={e=>setSearch(e.target.value)} />
            <select className="form-input" style={{width:130}} value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="QUEUED">Queued</option>
              <option value="ACTIVE">Active</option>
              <option value="USED">Used</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>
        </div>

        <div className="card">
          <div className="table-wrap">
            {loading ? <div style={{padding:40,textAlign:'center'}}><span className="spinner" style={{margin:'auto'}}/></div> : (
              <table>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Plan</th>
                    <th>Status</th>
                    <th>MAC Address</th>
                    <th>Valid Until</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(v => (
                    <tr key={v.id}>
                      <td style={{fontFamily:'monospace',fontWeight:600,letterSpacing:1}}>{v.code}</td>
                      <td>{v.plan?.name || '-'}</td>
                      <td><span className={`badge ${STATUS_BADGE[v.status] || 'badge-blue'}`}>{v.status}</span></td>
                      <td style={{fontFamily:'monospace',fontSize:12}}>{v.macAddress || '-'}</td>
                      <td style={{fontSize:12}}>{v.validUntil ? new Date(v.validUntil).toLocaleString() : '-'}</td>
                      <td>
                        <div style={{display:'flex',gap:6}}>
                          <button className="btn btn-sm btn-ghost" onClick={() => handleReprint(v.code)}>🖨️</button>
                          {v.status === 'QUEUED' && <button className="btn btn-sm btn-danger" onClick={() => handleCancel(v.id)}>✕</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {/* Pagination */}
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:16}}>
            <span style={{fontSize:12,color:'var(--text2)'}}>Page {page} of {Math.ceil(total/25)}</span>
            <div style={{display:'flex',gap:8}}>
              <button className="btn btn-sm btn-ghost" onClick={() => setPage(p=>Math.max(1,p-1))} disabled={page===1}>← Prev</button>
              <button className="btn btn-sm btn-ghost" onClick={() => setPage(p=>p+1)} disabled={page*25>=total}>Next →</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
