"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import md5 from 'md5';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { unreadNotifications } = useSocket();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  useEffect(() => {
    if (user) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      axios.get(`${apiUrl}/api/notifications`, {
        headers: { Authorization: `Bearer ${user.token}` }
      })
      .then(res => setNotifications(res.data))
      .catch(console.error);
    } else {
      setNotifications([]);
    }
  }, [user]);

  const markAsRead = async (id: string, link: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      await axios.patch(`${apiUrl}/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      if (link) window.location.href = link;
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      await axios.post(`${apiUrl}/api/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white px-6 py-3">
      <div className="flex items-center gap-4">
        <button onClick={() => window.dispatchEvent(new Event('toggleSidebar'))} id="sidebar-toggle" type="button" className="icon-btn lg:!hidden" aria-label="Open sidebar">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
        
        <form className="relative max-w-xl flex-1" action="/faqs">
          <i className="bi bi-search pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input className="search-input" type="search" name="q" placeholder="Search the FAQ — type a keyword (e.g. NOC, hostel, stipend)" id="global-search" />
        </form>
        
        <div className="relative">
          <button onClick={() => setShowDropdown(!showDropdown)} className="icon-btn relative bg-white/50 hover:bg-white/80" aria-label="Notifications">
            <i className="bi bi-bell"></i>
            {unreadNotifications > 0 && <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse"></span>}
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-50">
              <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <span className="font-bold text-slate-800">Notifications</span>
                {unreadNotifications > 0 && (
                  <button onClick={markAllAsRead} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">Mark all as read</button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-slate-500 text-sm">No new notifications</div>
                ) : (
                  notifications.map(n => (
                    <div 
                      key={n._id} 
                      onClick={() => markAsRead(n._id, n.link)}
                      className={`p-3 border-b border-slate-50 cursor-pointer hover:bg-white/80 transition-colors flex gap-3 ${!n.isRead ? 'bg-indigo-50/50' : ''}`}
                    >
                      <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${!n.isRead ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]' : 'bg-transparent'}`}></div>
                      <div>
                        <p className={`text-sm ${!n.isRead ? 'text-slate-900 font-bold' : 'text-slate-600'}`}>{n.message}</p>
                        <p className="text-xs text-slate-400 mt-1">{new Date(n.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="relative ml-2">
          {user ? (
            <div className="relative">
              <button 
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition-all hover:border-indigo-200 hover:bg-slate-50 focus:outline-none"
              >
                <img 
                  src={user.avatar || `https://ui-avatars.com/api/?name=${user.username}&background=random&color=fff&size=64`} 
                  alt={user.username} 
                  className="w-8 h-8 rounded-full border-2 border-white shadow-sm object-cover"
                />
                <span className="text-sm font-bold text-slate-700 hidden sm:block">{user.username}</span>
                <i className={`bi bi-chevron-down text-xs text-slate-400 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`}></i>
              </button>

              {showProfileDropdown && (
                <div className="absolute right-0 mt-3 w-56 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-50 origin-top-right">
                  <div className="p-4 border-b border-slate-100 bg-slate-50">
                    <p className="text-sm font-bold text-slate-900 truncate">{user.username}</p>
                    <p className="text-xs font-medium text-slate-500 truncate">{user.email}</p>
                  </div>
                  <div className="p-2 space-y-1">
                    {user.role === 'admin' && (
                      <Link href="/moderation" onClick={() => setShowProfileDropdown(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-rose-600 rounded-xl hover:bg-rose-50/80 transition-colors">
                        <i className="bi bi-shield-lock-fill text-lg"></i> Admin Dashboard
                      </Link>
                    )}
                    <Link href="/profile" onClick={() => setShowProfileDropdown(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-slate-700 rounded-xl hover:bg-indigo-50/80 hover:text-indigo-700 transition-colors">
                      <i className="bi bi-person text-lg"></i> My Profile
                    </Link>
                    <Link href="/profile" onClick={() => setShowProfileDropdown(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-slate-700 rounded-xl hover:bg-indigo-50/80 hover:text-indigo-700 transition-colors">
                      <i className="bi bi-gear text-lg"></i> Settings
                    </Link>
                  </div>
                  <div className="p-2 border-t border-white/20">
                    <button 
                      onClick={logout} 
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-rose-600 rounded-xl hover:bg-rose-50/80 transition-colors"
                    >
                      <i className="bi bi-box-arrow-right text-lg"></i> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login" className="px-5 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors hidden sm:block">Login</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
