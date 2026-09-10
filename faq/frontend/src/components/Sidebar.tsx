"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleToggle = () => setIsOpen(prev => !prev);
    window.addEventListener('toggleSidebar', handleToggle);
    return () => window.removeEventListener('toggleSidebar', handleToggle);
  }, []);

  useEffect(() => {
    setIsOpen(false); // Close on navigation
  }, [pathname]);
  
  return (
    <>
      <div 
        id="mobile-sidebar-backdrop" 
        className={`fixed inset-0 z-30 bg-slate-950/40 lg:hidden transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      ></div>
      
      <aside className={`app-sidebar fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-white px-4 py-5 transition-transform duration-200 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Link href="/" className="mb-8 flex items-center gap-3 px-2 group">
          <div className="grid h-10 w-10 place-items-center rounded-[0.7rem] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30 flex-shrink-0 transition-transform group-hover:scale-105">
            <i className="bi bi-layers-fill text-xl"></i>
          </div>
          <div>
            <span className="block text-[17px] font-black text-slate-900 tracking-tight leading-none mb-0.5">Nexus</span>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Knowledge Base</span>
          </div>
        </Link>

        <nav className="space-y-1 text-sm font-medium">
          <Link href="/" className="nav-item" aria-current={pathname === '/' ? 'page' : undefined}>
            <i className="bi bi-grid-1x2"></i><span>Dashboard</span>
          </Link>
          <Link href="/faqs" className="nav-item" aria-current={pathname === '/faqs' ? 'page' : undefined}>
            <i className="bi bi-question-circle"></i><span>FAQs</span>
          </Link>
          <Link href="/qa/ask" className="nav-item" aria-current={pathname === '/qa/ask' ? 'page' : undefined}>
            <i className="bi bi-plus-circle"></i><span>Ask Question</span>
          </Link>
          <Link href="/qa" className="nav-item" aria-current={pathname === '/qa' ? 'page' : undefined}>
            <i className="bi bi-chat-dots"></i><span>Questions</span>
          </Link>
          <Link href="/qa/my-questions" className="nav-item" aria-current={pathname === '/qa/my-questions' ? 'page' : undefined}>
            <i className="bi bi-person-lines-fill"></i><span>My Questions</span>
          </Link>
          <Link href="/faqs/my-submissions" className="nav-item" aria-current={pathname === '/faqs/my-submissions' ? 'page' : undefined}>
            <i className="bi bi-journal-text"></i><span>My FAQ Proposals</span>
          </Link>
          <Link href="/bookmarks" className="nav-item" aria-current={pathname === '/bookmarks' ? 'page' : undefined}>
            <i className="bi bi-bookmark"></i><span>Bookmarks</span>
          </Link>
          <Link href="/leaderboard" className="nav-item" aria-current={pathname === '/leaderboard' ? 'page' : undefined}>
            <i className="bi bi-trophy"></i><span>Leaderboard</span>
          </Link>
          <Link href="/profile" className="nav-item" aria-current={pathname === '/profile' ? 'page' : undefined}>
            <i className="bi bi-sliders2"></i><span>Settings</span>
          </Link>
        </nav>

        {user?.role === 'admin' && (
          <div className="mt-8 border-t border-slate-100 pt-5">
            <p className="px-3 pb-2 text-xs font-bold uppercase text-slate-400">Workspace</p>
            <nav className="space-y-1 text-sm font-medium">
              <Link href="/moderation" className="nav-item" aria-current={pathname === '/moderation' ? 'page' : undefined}>
                <i className="bi bi-shield-check"></i><span>Admin Dashboard</span>
              </Link>
            </nav>
          </div>
        )}
        
        <div className="mt-auto pt-8 pb-4 w-full">
          {!user ? (
            <Link href="/login" className="flex items-center justify-center w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors">
              Sign in
            </Link>
          ) : null}
        </div>
      </aside>
    </>
  );
}
