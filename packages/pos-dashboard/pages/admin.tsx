'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Link from 'next/link';
import toast from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('token') || '' : ''; }

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [gateway, setGateway] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [agents, setAgents] = useState<string[]>([]);
  const [mcpToolCount, setMcpToolCount] = useState<number>(0);
  const [channels, setChannels] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'MISSION_CONTROL' | 'CHANNELS' | 'USERS' | 'AI_AGENTS'>('MISSION_CONTROL');

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (!u || JSON.parse(u).role !== 'ADMIN') { router.push('/pos'); return; }
    fetchData();
  }, [tab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (tab === 'MISSION_CONTROL') {
        const [statRes, gwRes] = await Promise.all([
          axios.get(`${API}/api/admin/dashboard`, { headers: { Authorization: `Bearer ${getToken()}` } }),
          axios.get(`${API}/api/health`, { headers: { Authorization: `Bearer ${getToken()}` } }) // Assuming health has GW stats
        ]);
        setStats(statRes.data.data);
        setGateway(gwRes.data.data.gateway);
      } else if (tab === 'USERS') {
        const res = await axios.get(`${API}/api/admin/users`, { headers: { Authorization: `Bearer ${getToken()}` } });
        setUsers(res.data.data);
      } else if (tab === 'AI_AGENTS') {
        const res = await axios.get(`${API}/health`);
        setAgents(res.data.data.agents || []);
        setMcpToolCount(res.data.data.mcpToolCount || 0);
      } else if (tab === 'CHANNELS') {
        const res = await axios.get(`${API}/api/channels/status`, { headers: { Authorization: `Bearer ${getToken()}` } });
        setChannels(res.data.data);
      }
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo"><div className="logo-icon">⚡</div><span>AgentOS</span></div>
        <div className="nav-section-label">POS</div>
        <Link href="/pos" className="nav-item">🛒 Checkout</Link>
        <Link href="/vouchers" className="nav-item">🎫 Vouchers</Link>
        <div className="nav-section-label" style={{marginTop:16}}>Admin</div>
        <Link href="/admin" className="nav-item active">⚙️ Admin</Link>
        <Link href="/reports" className="nav-item">📊 Reports</Link>
        <div style={{flex:1}}/>
        <button className="nav-item" style={{color:'var(--red)'}} onClick={() => { localStorage.clear(); router.push('/'); }}>🚪 Logout</button>
      </aside>

      <main className="main">
        <div style={{marginBottom:28, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <div>
            <h1 style={{fontSize:24,fontWeight:700}}>⚙️ Admin Mission Control</h1>
            <p style={{color:'var(--text2)',fontSize:13}}>System orchestration and management</p>
          </div>
          <div className="btn-group" style={{display:'flex', gap:8, background:'var(--bg3)', padding:4, borderRadius:8}}>
             <button className={`btn btn-sm ${tab==='MISSION_CONTROL'?'btn-primary':'btn-ghost'}`} onClick={()=>setTab('MISSION_CONTROL')}>Mission Control</button>
             <button className={`btn btn-sm ${tab==='AI_AGENTS'?'btn-primary':'btn-ghost'}`} onClick={()=>setTab('AI_AGENTS')}>AI Agents</button>
             <button className={`btn btn-sm ${tab==='CHANNELS'?'btn-primary':'btn-ghost'}`} onClick={()=>setTab('CHANNELS')}>Channels</button>
             <button className={`btn btn-sm ${tab==='USERS'?'btn-primary':'btn-ghost'}`} onClick={()=>setTab('USERS')}>Users</button>
          </div>
        </div>

        {loading ? <div className="spinner" style={{margin:'100px auto'}}/> : (
          <>
            {tab === 'MISSION_CONTROL' && (
              <div className="stat-grid">
                <div className="stat-card">
                  <div className="stat-label">Total Users</div>
                  <div className="stat-value">{stats?.totalUsers || 0}</div>
                  <div className="stat-sub">Across all roles</div>
                </div>
                <div className="stat-card" style={{borderTop:'3px solid var(--accent2)'}}>
                  <div className="stat-label">Gateway Status</div>
                  <div className="stat-value" style={{color: gateway?.status === 'ONLINE' ? 'var(--green)' : 'var(--red)'}}>
                    {gateway?.status || 'OFFLINE'}
                  </div>
                  <div className="stat-sub">Port {gateway?.port || 4001}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Active Channels</div>
                  <div className="stat-value" style={{color:'var(--accent)'}}>{gateway?.activeChannels || 0}</div>
                  <div className="stat-sub">WebSocket nodes</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Revenue</div>
                  <div className="stat-value" style={{color:'var(--green)'}}>${stats?.totalRevenue?.toFixed(2) || '0.00'}</div>
                  <div className="stat-sub">Total sales volume</div>
                </div>
              </div>
            )}

            {tab === 'USERS' && (
              <div className="card">
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Created</th></tr></thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id}>
                          <td>{u.name}</td>
                          <td>{u.email}</td>
                          <td><span className={`badge ${u.role==='ADMIN'?'badge-red':u.role==='PARTNER'?'badge-purple':'badge-blue'}`}>{u.role}</span></td>
                          <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {tab === 'CHANNELS' && (
              <div className="card">
                 <h3 style={{marginBottom:16}}>Active Communication Channels</h3>
                 <div className="plan-grid">
                    <div className="plan-card">
                        <div className="plan-name">WhatsApp</div>
                        <div className="plan-duration">Meta Business API</div>
                        <div className={`badge ${channels?.whatsapp?.status === 'CONNECTED' ? 'badge-green' : 'badge-yellow'}`}>
                          {channels?.whatsapp?.status || 'UNKNOWN'}
                        </div>
                    </div>
                    <div className="plan-card">
                        <div className="plan-name">Email</div>
                        <div className="plan-duration">SMTP Service</div>
                        <div className={`badge ${channels?.email?.status === 'CONNECTED' ? 'badge-green' : 'badge-yellow'}`}>
                          {channels?.email?.status || 'UNKNOWN'}
                        </div>
                    </div>
                    <div className="plan-card">
                        <div className="plan-name">Push</div>
                        <div className="plan-duration">Firebase Cloud Messaging</div>
                        <div className={`badge ${channels?.push?.status === 'CONNECTED' ? 'badge-green' : 'badge-yellow'}`}>
                          {channels?.push?.status || 'UNKNOWN'}
                        </div>
                    </div>
                 </div>
              </div>
            )}

            {tab === 'AI_AGENTS' && (
              <div>
                 <div className="stat-grid" style={{marginBottom:24}}>
                   <div className="stat-card">
                     <div className="stat-label">Registered Agents</div>
                     <div className="stat-value" style={{color:'var(--accent)'}}>{agents.length}</div>
                     <div className="stat-sub">Active in Kernel</div>
                   </div>
                   <div className="stat-card">
                     <div className="stat-label">Available MCP Tools</div>
                     <div className="stat-value" style={{color:'var(--green)'}}>{mcpToolCount}</div>
                     <div className="stat-sub">Registered in MCPRegistry</div>
                   </div>
                 </div>
                 
                 <div className="card">
                    <h3 style={{marginBottom:16}}>Agent Inventory</h3>
                    <div className="plan-grid">
                      {agents.map(a => (
                        <div className="plan-card" key={a} style={{display:'flex', flexDirection:'column', gap:8}}>
                          <div style={{display:'flex', justifyContent:'space-between'}}>
                            <div className="plan-name" style={{fontSize:16}}>{a}</div>
                            <div className="badge badge-green">IDLE</div>
                          </div>
                          <div className="plan-duration" style={{fontSize:12}}>Managed by AgentOS</div>
                        </div>
                      ))}
                    </div>
                 </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
