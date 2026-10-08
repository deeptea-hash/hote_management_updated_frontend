import { createContext, useContext, useState } from 'react';
// Mock authentication for the UI phase. Replace login() with POST /auth/login (JWT) once the NestJS API exists.
export const ROLES = { superadmin: 'SuperAdmin', frontdesk: 'Front-Desk', accounts: 'Accounts', guest: 'Guest' };
export const USERS = [
  { username: 'admin', password: 'admin123', name: 'System Administrator', role: 'superadmin' },
  { username: 'frontdesk', password: 'desk123', name: 'Front Desk Officer', role: 'frontdesk' },
  { username: 'accounts', password: 'acc123', name: 'Accounts Officer', role: 'accounts' },
  { username: 'sharma', password: 'guest123', name: 'Hon. A. Sharma', role: 'guest', bookingId: 'B1' },
  { username: 'menon', password: 'guest123', name: 'R. Menon', role: 'guest', bookingId: 'B2' },
];
export const homeFor = (role) => (role === 'guest' ? '/portal' : '/admin');
const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => { try { return JSON.parse(sessionStorage.getItem('user')); } catch { return null; } });
  const login = (u, p) => {
    const found = USERS.find((x) => x.username === u.trim() && x.password === p);
    if (!found) return null;
    const { password, ...safe } = found;
    sessionStorage.setItem('user', JSON.stringify(safe)); setUser(safe); return safe;
  };
  const logout = () => { sessionStorage.removeItem('user'); setUser(null); };
  return <Ctx.Provider value={{ user, login, logout }}>{children}</Ctx.Provider>;
}
