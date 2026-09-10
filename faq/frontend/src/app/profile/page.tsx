"use client";
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function ProfilePage() {
  const { user, loading, login } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ username: '', bio: '' });
  const [editError, setEditError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tabs state
  const [activeTab, setActiveTab] = useState('Recent Activity');
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<any[]>([]);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setIsFetching(true);
      try {
        const headers = { Authorization: `Bearer ${user.token}` };
        if (activeTab === 'Recent Activity' || activeTab === 'My Questions') {
          const resQ = await axios.get('http://localhost:5000/api/qa/user/questions', { headers });
          setQuestions(resQ.data);
        }
        if (activeTab === 'Recent Activity' || activeTab === 'My Answers') {
          const resA = await axios.get('http://localhost:5000/api/qa/user/answers', { headers });
          setAnswers(resA.data);
        }
        if (activeTab === 'Bookmarks') {
          const resB = await axios.get('http://localhost:5000/api/bookmarks', { headers });
          setBookmarks(resB.data);
        }
      } catch (err) {
        console.error('Failed to fetch tab data', err);
      } finally {
        setIsFetching(false);
      }
    };
    fetchData();
  }, [activeTab, user]);

  if (loading) return <div className="max-w-5xl mx-auto p-8 text-center text-slate-500 animate-pulse">Loading Profile...</div>;
  if (!user) return (
    <div className="max-w-5xl mx-auto p-8 text-center text-slate-500">
      <p className="mb-4">You are not logged in.</p>
      <Link href="/login" className="btn-primary">Sign In to view Profile</Link>
    </div>
  );

  const displayUser = {
    ...user,
    joined: new Date(user.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    stats: user.stats || {
      questions: 0,
      answers: 0,
      upvotesReceived: user.reputation || 0
    }
  };

  const avatarUrl = user.avatar || `https://ui-avatars.com/api/?name=${user.username}&background=random&color=fff&size=256`;

  const openEditModal = () => {
    setEditForm({ username: user.username, bio: user.bio || '' });
    setEditError('');
    setIsEditing(true);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError('');
    setIsSubmitting(true);
    try {
      const res = await axios.put('http://localhost:5000/api/auth/profile', editForm);
      login(res.data.token, res.data);
      setIsEditing(false);
    } catch (error: any) {
      setEditError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderTabContent = () => {
    let items: any[] = [];
    if (activeTab === 'Recent Activity') {
      const q = questions.map(q => ({ ...q, type: 'question', date: new Date(q.createdAt) }));
      const a = answers.map(a => ({ ...a, type: 'answer', date: new Date(a.createdAt) }));
      items = [...q, ...a].sort((x, y) => y.date.getTime() - x.date.getTime()).slice(0, 15);
    } else if (activeTab === 'My Questions') {
      items = questions.map(q => ({ ...q, type: 'question' }));
    } else if (activeTab === 'My Answers') {
      items = answers.map(a => ({ ...a, type: 'answer' }));
    } else if (activeTab === 'Bookmarks') {
      items = bookmarks.map(b => ({ ...b, type: 'bookmark' }));
    }

    if (items.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 text-slate-300">
            <i className="bi bi-activity text-3xl"></i>
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">No {activeTab}</h3>
          <p className="text-slate-500 max-w-sm mb-6">When you ask questions, provide answers, or engage with the community, your activity will show up here.</p>
          <Link href="/qa/ask" className="btn-primary shadow-indigo-500/20">Ask a Question</Link>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {items.map((item, idx) => {
          if (item.type === 'question') {
            return (
              <Link href={`/qa/${item._id}`} key={`q-${idx}`} className="block p-5 bg-white border border-slate-100 rounded-2xl hover:border-indigo-200 hover:shadow-md transition-all">
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <i className="bi bi-question-lg text-lg"></i>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">{item.title}</h4>
                    <p className="text-sm text-slate-500 line-clamp-1">{item.body}</p>
                    <div className="flex gap-4 mt-3 text-xs font-semibold text-slate-400">
                      <span className="flex items-center gap-1.5 text-indigo-600"><i className="bi bi-tag-fill"></i> {item.category?.name || 'General'}</span>
                      <span className="flex items-center gap-1.5"><i className="bi bi-hand-thumbs-up-fill"></i> {item.upvoteCount} Upvotes</span>
                      <span className="flex items-center gap-1.5"><i className="bi bi-clock-history"></i> {new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          }
          if (item.type === 'answer') {
            return (
              <Link href={`/qa/${item.question?._id}`} key={`a-${idx}`} className="block p-5 bg-white border border-slate-100 rounded-2xl hover:border-emerald-200 hover:shadow-md transition-all">
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <i className="bi bi-chat-left-text-fill text-lg"></i>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Answered: {item.question?.title || 'Unknown Question'}</h4>
                    <p className="text-sm text-slate-500 line-clamp-1">{item.body}</p>
                    <div className="flex gap-4 mt-3 text-xs font-semibold text-slate-400">
                      {item.isAccepted && <span className="flex items-center gap-1.5 text-emerald-600"><i className="bi bi-check-circle-fill"></i> Accepted</span>}
                      <span className="flex items-center gap-1.5"><i className="bi bi-hand-thumbs-up-fill"></i> {item.upvoteCount} Upvotes</span>
                      <span className="flex items-center gap-1.5"><i className="bi bi-clock-history"></i> {new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          }
          if (item.type === 'bookmark') {
            return (
              <Link href={item.itemType === 'faq' ? `/faqs` : `/qa/${item.itemId?._id}`} key={`b-${idx}`} className="block p-5 bg-white border border-slate-100 rounded-2xl hover:border-amber-200 hover:shadow-md transition-all">
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <i className="bi bi-bookmark-star-fill text-lg"></i>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Bookmarked {item.itemModel}: {item.itemId?.title || item.itemId?.question || 'Item'}</h4>
                    <p className="text-sm text-slate-500">Bookmarked on {new Date(item.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </Link>
            );
          }
          return null;
        })}
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 relative">
      {/* Profile Header & Banner */}
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 overflow-hidden border border-slate-100">
        {/* Banner */}
        <div className="h-48 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
        </div>
        
        {/* Profile Details */}
        <div className="px-8 pb-8 relative">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 -mt-16 mb-6">
            <div className="relative">
              <img 
                src={avatarUrl} 
                alt={user.username} 
                className="w-32 h-32 rounded-full border-4 border-white shadow-xl bg-white object-cover"
              />
              <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 border-4 border-white rounded-full"></div>
            </div>
            <div className="flex gap-3">
              <button onClick={openEditModal} className="btn-primary shadow-indigo-500/30 shadow-lg">
                <i className="bi bi-pencil-square"></i> Edit Profile
              </button>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                {displayUser.username}
                <span className="badge-soft bg-indigo-100! text-indigo-700! px-3! py-1! text-sm">{displayUser.role || 'Member'}</span>
              </h1>
              <p className="text-slate-500 font-medium mt-1">{displayUser.email}</p>
            </div>
            
            <p className="text-slate-600 max-w-2xl leading-relaxed">
              {displayUser.bio || 'Passionate community member dedicated to sharing knowledge and helping others learn.'}
            </p>
            
            <div className="flex items-center gap-6 text-sm text-slate-500 font-medium">
              <span className="flex items-center gap-2">
                <i className="bi bi-calendar3 text-indigo-500"></i> Joined {displayUser.joined}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center text-xl shadow-inner">
            <i className="bi bi-star-fill"></i>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{displayUser.reputation || 0}</div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Reputation</div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center text-xl shadow-inner">
            <i className="bi bi-chat-left-text-fill"></i>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{displayUser.stats.answers}</div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Answers</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center text-xl shadow-inner">
            <i className="bi bi-question-circle-fill"></i>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{displayUser.stats.questions}</div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Questions</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl shadow-inner">
            <i className="bi bi-arrow-up-circle-fill"></i>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{displayUser.stats.upvotesReceived}</div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Upvotes</div>
          </div>
        </div>
      </div>
      
      {/* Main Content Area: Tabs + Activity */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100 overflow-x-auto">
          {['Recent Activity', 'My Questions', 'My Answers', 'Bookmarks'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-4 text-sm font-bold whitespace-nowrap transition-colors ${
                activeTab === tab 
                  ? 'text-indigo-600 border-b-2 border-indigo-600' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        
        <div className="p-8">
          {isFetching ? (
            <div className="flex justify-center items-center py-16 text-slate-400">
               <i className="bi bi-arrow-repeat animate-spin text-3xl"></i>
            </div>
          ) : (
            renderTabContent()
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900">Edit Profile</h3>
              <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-700">
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            
            <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
              {editError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-start gap-2">
                  <i className="bi bi-exclamation-triangle-fill mt-0.5"></i>
                  <span>{editError}</span>
                </div>
              )}
              
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 block">Username</label>
                <input 
                  type="text" 
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all shadow-sm" 
                  value={editForm.username}
                  onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 block">Bio</label>
                <textarea 
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all shadow-sm min-h-[100px] resize-none" 
                  value={editForm.bio}
                  onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                  placeholder="Tell the community about yourself..."
                ></textarea>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  className="btn-ghost flex-1" 
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
