import { Fragment, useState } from 'react';
import { RANKS, SESSIONS, nights, stdWindow } from '../data.js';
import { useAuth } from '../auth.jsx';
import { Avatar, Badge } from '../ui.jsx';

const VIP_RANKS = ['Supreme Court Judge', 'High Court Judge', 'Faculty'];
const blank = { sessionId: '', name: '', rank: 'District Judge', category: 'Training', phone: '', email: '', idType: 'Government ID', idNo: '', org: '', purpose: '', from: '', to: '', notes: '', companions: [] };

export default function Guests({ bookings, add, setAudit }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(blank);
  const [c, setC] = useState('');
  const [errs, setErrs] = useState({});
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(null);
  const [done, setDone] = useState('');
  const cat = VIP_RANKS.includes(f.rank) ? 'VIP' : f.category === 'VIP' ? 'Training' : f.category;
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const field = (k, label, type = 'text', dis = false) => (
    <label>{label}<input type={type} value={f[k]} disabled={dis} onChange={(e) => set(k, e.target.value)} />{errs[k] && <span className="err">{errs[k]}</span>}</label>);
  const addC = () => { if (c.trim()) { set('companions', [...f.companions, c.trim()]); setC(''); } };
  const submit = (e) => {
    e.preventDefault();
    const x = {};
    if (!f.name.trim()) x.name = "Enter the guest's full name.";
    if (cat === 'Training' && !f.sessionId) x.sessionId = 'Choose the training session.';
    if (!/^\d{10}$/.test(f.phone)) x.phone = 'Enter a 10-digit mobile number.';
    if (f.email && !/^\S+@\S+\.\S+$/.test(f.email)) x.email = 'Enter a valid email address.';
    if (!f.idNo.trim()) x.idNo = 'Enter the ID number.';
    if (!f.from) x.from = 'Choose an arrival date.';
    if (!f.to) x.to = 'Choose a departure date.';
    else if (f.to <= f.from) x.to = 'Departure must be after arrival.';
    else if (cat === 'Non-Training' && nights(f.from, f.to) > 3) x.to = 'Non-training stays are limited to 3 nights.';
    setErrs(x);
    if (Object.keys(x).length) return;
    add({ ...f, name: f.name.trim(), category: cat, sessionId: cat === 'Training' ? f.sessionId : '' });
    setDone(`${f.name.trim()} is registered. The booking is now in the Allocation queue.`);
    setF(blank); setOpen(false);
  };
  const toggle = (b) => {
    if (sel !== b.id) setAudit((a) => [{ at: new Date().toLocaleString(), booking: b.name, from: '—', to: '—', reason: 'Viewed guest details (PII)', user: user.username }, ...a]);
    setSel(sel === b.id ? null : b.id);
  };
  const rows = bookings.filter((b) => (b.name + b.rank + (b.phone || '')).toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <div className="toolbar">
        <input placeholder="Search by name, rank or phone" aria-label="Search guests" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="primary" style={{ marginTop: 0 }} onClick={() => { setOpen(!open); setDone(''); }}>{open ? 'Close form' : 'Register new guest'}</button>
      </div>
      {done && <p className="notice ok" role="status">{done}</p>}
      {open && (
        <form className="panel" onSubmit={submit} noValidate>
          <h3>Guest details</h3>
          <div className="form-grid">
            {field('name', 'Full name')}
            <label>Rank or designation<select value={f.rank} onChange={(e) => set('rank', e.target.value)}>{RANKS.map((r) => <option key={r}>{r}</option>)}</select></label>
            <label>Category<select value={cat} disabled={cat === 'VIP'} onChange={(e) => set('category', e.target.value)}>
              {cat === 'VIP' ? <option>VIP</option> : <><option>Training</option><option>Non-Training</option></>}</select></label>
            {field('org', 'Court or organisation')}
            {cat === 'Training' && <label className="full">Training session
              <select value={f.sessionId} onChange={(e) => { const s = SESSIONS.find((x) => x.id === e.target.value); setF((p) => ({ ...p, sessionId: e.target.value, ...(s ? stdWindow(s) : {}) })); }}>
                <option value="">Select session…</option>{SESSIONS.map((s) => <option key={s.id} value={s.id}>{s.title} ({s.start} to {s.end})</option>)}</select>
              {errs.sessionId && <span className="err">{errs.sessionId}</span>}
              <small className="muted">Dates are set to the standard window: the day before the session to the day after it ends.</small></label>}
            {field('phone', 'Mobile number', 'tel')}
            {field('email', 'Email (optional)', 'email')}
          </div>
          <h3>Identity</h3>
          <div className="form-grid">
            <label>ID type<select value={f.idType} onChange={(e) => set('idType', e.target.value)}>
              {['Government ID', 'Aadhaar', 'Passport', 'Driving licence', 'Official ID card'].map((t) => <option key={t}>{t}</option>)}</select></label>
            {field('idNo', 'ID number')}
          </div>
          <h3>Stay</h3>
          <div className="form-grid">
            {field('from', 'Arrival date', 'date', cat === 'Training')}
            {field('to', 'Departure date', 'date', cat === 'Training')}
            <label className="full">Purpose of visit<input value={f.purpose} onChange={(e) => set('purpose', e.target.value)} /></label>
          </div>
          <h3>Accompanying family or attendants</h3>
          <ul className="chips">{f.companions.map((n, i) => <li key={i}>{n}<button type="button" className="x" aria-label={`Remove ${n}`} onClick={() => set('companions', f.companions.filter((_, j) => j !== i))}>×</button></li>)}
            {!f.companions.length && <li className="muted">None added.</li>}</ul>
          <div className="row">
            <label>Name<input value={c} onChange={(e) => setC(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addC())} /></label>
            <button type="button" className="ghost" onClick={addC}>Add person</button>
          </div>
          <label>Special requirements<textarea rows="2" value={f.notes} onChange={(e) => set('notes', e.target.value)} /></label>
          <button className="primary" type="submit">Register guest</button>
        </form>)}
      <div className="panel scroll">
        <table>
          <thead><tr><th>Guest</th><th>Category</th><th>Stay</th><th>Companions</th><th>Status</th></tr></thead>
          <tbody>
            {rows.map((b) => (
              <Fragment key={b.id}>
                <tr className="click" tabIndex={0} onClick={() => toggle(b)} onKeyDown={(e) => e.key === 'Enter' && toggle(b)}>
                  <td><div className="who"><Avatar name={b.name} /><div><b>{b.name}</b><br /><span className="muted">{b.rank}</span></div></div></td>
                  <td><Badge kind={{ VIP: 'vip', Training: 'train', 'Non-Training': 'paid' }[b.category]}>{b.category}</Badge></td>
                  <td>{b.from} to {b.to}</td><td>{b.companions.length}</td>
                  <td><Badge kind={({ Confirmed: 'free', 'Checked-in': 'train', 'Checked-out': 'paid' })[b.status] || 'vip'}>{b.status}</Badge></td>
                </tr>
                {sel === b.id && <tr><td colSpan="5"><dl className="details">
                  {[['Mobile', b.phone], ['Email', b.email], [b.idType || 'ID', b.idNo], ['Organisation', b.org], ['Purpose', b.purpose], ['Room', b.room || 'Not allocated'],
                    ['Companions', b.companions.join(', ')], ['Special requirements', b.notes]].map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v || '—'}</dd></div>)}
                </dl></td></tr>}
              </Fragment>))}
            {!rows.length && <tr><td colSpan="5" className="muted">No guests match your search.</td></tr>}
          </tbody>
        </table>
      </div>
    </>);
}
