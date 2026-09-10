"use client";
import Link from 'next/link';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const fetchBookmarks = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/bookmarks', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setBookmarks(res.data);
      } catch (err) {
        console.error("Failed to fetch bookmarks", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookmarks();
  }, [user]);

  const handleRemoveBookmark = async (itemId: string, itemType: string) => {
    try {
      await axios.post('http://localhost:5000/api/bookmarks/toggle', 
        { itemId, itemType },
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      setBookmarks(prev => prev.filter(b => b.itemId?._id !== itemId));
    } catch (err) {
      console.error("Failed to remove bookmark", err);
      alert("Failed to remove bookmark");
    }
  };

  if (!user) {
    return (
      <div className="max-w-5xl mx-auto p-8 text-center text-slate-500 card-modern mt-10">
        <div className="inline-flex bg-indigo-100 text-indigo-600 rounded-xl w-16 h-16 items-center justify-center text-3xl mb-4">
          <i className="bi bi-bookmark-star"></i>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Sign in to view your bookmarks</h2>
        <p className="mb-6">Save your favorite FAQs and Q&A threads to find them easily later.</p>
        <Link href="/login" className="btn-primary">Sign In</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="mb-8">
        <h1 className="page-title text-indigo-600 flex items-center gap-2">
          <i className="bi bi-bookmark-star"></i>
          My Bookmarks
        </h1>
        <p className="text-slate-500 mt-2">Access your saved FAQs and community questions.</p>
      </div>

      <div className="card-modern p-6">
        {loading ? (
          <div className="text-center py-10 text-slate-500 animate-pulse">Loading bookmarks...</div>
        ) : bookmarks.length === 0 ? (
          <div className="text-center py-10 text-slate-500">
            <p>You haven't bookmarked anything yet.</p>
            <div className="mt-4 flex justify-center gap-4">
              <Link href="/faqs" className="btn-soft">Browse FAQs</Link>
              <Link href="/qa" className="btn-soft">Browse Q&A</Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {bookmarks.map(b => (
              <div key={b._id} className="p-4 border border-slate-100 rounded-xl hover:shadow-md transition-shadow bg-white flex justify-between items-start group">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`badge-soft ${b.itemType === 'faq' ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'}`}>
                      {b.itemType === 'faq' ? 'FAQ' : 'Question'}
                    </span>
                    <span className="text-xs text-slate-400">
                      Saved {new Date(b.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <Link href={b.itemType === 'faq' ? `/faqs/${b.itemId?.slug}` : `/qa/${b.itemId?._id}`} className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {b.itemId?.title || 'Unknown Item'}
                  </Link>
                  <p className="text-sm text-slate-500 mt-1 line-clamp-1">
                    {b.itemId?.question || b.itemId?.body || 'No description available'}
                  </p>
                </div>
                <button onClick={() => handleRemoveBookmark(b.itemId?._id, b.itemType)} className="text-indigo-600 p-2 hover:bg-indigo-50 rounded-lg transition-colors" title="Remove Bookmark">
                  <i className="bi bi-bookmark-fill text-xl"></i>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
