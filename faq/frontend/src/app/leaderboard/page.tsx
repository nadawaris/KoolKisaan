"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function LeaderboardPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/leaderboard');
        setUsers(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const top3 = users.slice(0, 3);
  const others = users.slice(3);

  // Helper to get podium style
  const getPodiumStyle = (rank: number) => {
    if (rank === 1) return "from-amber-300 via-amber-400 to-amber-500 shadow-amber-500/40 border-amber-200 text-amber-900";
    if (rank === 2) return "from-slate-200 via-slate-300 to-slate-400 shadow-slate-400/40 border-slate-200 text-slate-800";
    if (rank === 3) return "from-orange-300 via-orange-400 to-orange-500 shadow-orange-500/40 border-orange-200 text-orange-950";
    return "";
  };

  const getPodiumHeight = (rank: number) => {
    if (rank === 1) return "h-56 -mt-8 z-10";
    if (rank === 2) return "h-48 z-0";
    if (rank === 3) return "h-40 z-0";
    return "";
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-500 pb-16">
      <div className="text-center pt-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white mb-6 shadow-xl shadow-indigo-500/30 transform hover:scale-105 transition-transform">
          <i className="bi bi-trophy-fill text-4xl"></i>
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">Community Leaderboard</h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">Recognizing the brilliant minds who power our knowledge base. Earn reputation by asking insightful questions and providing exceptional answers.</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <i className="bi bi-arrow-repeat animate-spin text-4xl text-indigo-400"></i>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-20 text-slate-500 bg-white rounded-3xl shadow-sm border border-slate-100">No users found.</div>
      ) : (
        <>
          {/* Top 3 Podiums */}
          {top3.length > 0 && (
            <div className="flex justify-center items-end gap-2 sm:gap-6 pt-12 px-4 pb-4">
              {/* Rank 2 */}
              {top3[1] && (
                <div className={`relative w-1/3 max-w-[220px] rounded-t-3xl bg-gradient-to-b ${getPodiumStyle(2)} ${getPodiumHeight(2)} flex flex-col items-center justify-start pt-6 border-t border-l border-r`}>
                  <div className="absolute -top-10 w-20 h-20">
                    <div className="w-full h-full rounded-full border-4 border-white shadow-xl overflow-hidden bg-white flex items-center justify-center text-2xl font-bold text-slate-400">
                      {top3[1].avatar ? <img src={top3[1].avatar} className="w-full h-full object-cover" alt={top3[1].username} /> : top3[1].username[0].toUpperCase()}
                    </div>
                  </div>
                  <div className="mt-8 text-center px-2 z-10 flex flex-col items-center">
                    <Link href={`/profile/${top3[1].username}`} className="font-bold text-lg hover:underline block truncate w-full">{top3[1].username}</Link>
                    <div className="font-black text-2xl mt-1">{top3[1].reputation} <span className="text-xs font-semibold opacity-70">REP</span></div>
                  </div>
                  <div className="mt-auto mb-4 w-10 h-10 rounded-full bg-black/10 flex items-center justify-center font-black text-xl text-black/30">2</div>
                </div>
              )}
              
              {/* Rank 1 */}
              {top3[0] && (
                <div className={`relative w-1/3 max-w-[240px] rounded-t-3xl bg-gradient-to-b ${getPodiumStyle(1)} ${getPodiumHeight(1)} flex flex-col items-center justify-start pt-6 border-t border-l border-r`}>
                  <div className="absolute -top-12 w-24 h-24">
                    <div className="w-full h-full rounded-full border-4 border-white shadow-2xl overflow-hidden bg-white flex items-center justify-center text-4xl font-bold text-amber-500 relative z-10">
                      {top3[0].avatar ? <img src={top3[0].avatar} className="w-full h-full object-cover" alt={top3[0].username} /> : top3[0].username[0].toUpperCase()}
                    </div>
                    <div className="absolute -top-4 -right-3 text-4xl drop-shadow-md z-20 transform rotate-12">👑</div>
                  </div>
                  <div className="mt-10 text-center px-2 z-10 flex flex-col items-center">
                    <Link href={`/profile/${top3[0].username}`} className="font-black text-xl hover:underline block truncate w-full">{top3[0].username}</Link>
                    <div className="font-black text-3xl mt-1">{top3[0].reputation} <span className="text-sm font-bold opacity-80">REP</span></div>
                  </div>
                  <div className="mt-auto mb-4 w-12 h-12 rounded-full bg-black/10 flex items-center justify-center font-black text-2xl text-black/30">1</div>
                </div>
              )}

              {/* Rank 3 */}
              {top3[2] && (
                <div className={`relative w-1/3 max-w-[220px] rounded-t-3xl bg-gradient-to-b ${getPodiumStyle(3)} ${getPodiumHeight(3)} flex flex-col items-center justify-start pt-6 border-t border-l border-r`}>
                  <div className="absolute -top-10 w-20 h-20">
                    <div className="w-full h-full rounded-full border-4 border-white shadow-xl overflow-hidden bg-white flex items-center justify-center text-2xl font-bold text-orange-500">
                      {top3[2].avatar ? <img src={top3[2].avatar} className="w-full h-full object-cover" alt={top3[2].username} /> : top3[2].username[0].toUpperCase()}
                    </div>
                  </div>
                  <div className="mt-8 text-center px-2 z-10 flex flex-col items-center">
                    <Link href={`/profile/${top3[2].username}`} className="font-bold text-lg hover:underline block truncate w-full">{top3[2].username}</Link>
                    <div className="font-black text-2xl mt-1">{top3[2].reputation} <span className="text-xs font-semibold opacity-70">REP</span></div>
                  </div>
                  <div className="mt-auto mb-4 w-10 h-10 rounded-full bg-black/10 flex items-center justify-center font-black text-xl text-black/30">3</div>
                </div>
              )}
            </div>
          )}

          {/* Remaining Ranks */}
          {others.length > 0 && (
            <div className="glass-panel rounded-3xl shadow-xl border border-white/20 overflow-hidden relative z-20 animate-slide-up">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-bold">
                      <th className="py-5 px-6 font-bold w-24 text-center">Rank</th>
                      <th className="py-5 px-6 font-bold">Contributor</th>
                      <th className="py-5 px-6 font-bold">Role</th>
                      <th className="py-5 px-6 font-bold text-right">Reputation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {others.map((user, index) => {
                      const rank = index + 4;
                      return (
                        <tr key={user._id} className="border-b border-slate-50 hover:bg-indigo-50/30 transition-colors group">
                          <td className="py-4 px-6 text-center">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold text-sm group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                              {rank}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-700 flex items-center justify-center font-bold shadow-sm">
                                {user.avatar ? <img src={user.avatar} className="rounded-full w-full h-full object-cover" alt={user.username} /> : user.username[0].toUpperCase()}
                              </div>
                              <Link href={`/profile/${user.username}`} className="font-bold text-slate-800 hover:text-indigo-600 transition-colors text-base">
                                {user.username}
                              </Link>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="badge-soft bg-slate-100 text-slate-600 font-semibold px-3 py-1 text-xs uppercase tracking-wider">
                              {user.role}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-3">
                              <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${top3[0]?.reputation ? Math.min(100, (user.reputation / top3[0].reputation) * 100) : 0}%` }}></div>
                              </div>
                              <span className="font-black text-indigo-600 text-lg w-12 text-right">{user.reputation}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
