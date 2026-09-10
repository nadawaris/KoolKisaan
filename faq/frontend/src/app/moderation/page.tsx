"use client";
import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';

export default function ModerationPage() {
  const [pendingFaqs, setPendingFaqs] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{message: string, type: 'success'|'error'} | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const toggleExpand = (id: string) => {
    setExpandedFaqId(prev => prev === id ? null : id);
  };
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [faqRes, reportRes, suggestionRes] = await Promise.all([
          axios.get('http://localhost:5000/api/faqs/pending', { headers: { Authorization: `Bearer ${user?.token}` } }),
          axios.get('http://localhost:5000/api/reports', { headers: { Authorization: `Bearer ${user?.token}` } }),
          axios.get('http://localhost:5000/api/faqs/suggestions/pending', { headers: { Authorization: `Bearer ${user?.token}` } })
        ]);
        setPendingFaqs(faqRes.data);
        setReports(reportRes.data);
        setSuggestions(suggestionRes.data);
      } catch (err) {
        console.error("Failed to load moderation data", err);
      } finally {
        setLoading(false);
      }
    };
    if (user?.token) {
      fetchData();
    }
  }, [user]);

  const handleUpdateFaqStatus = async (id: string, status: string) => {
    try {
      await axios.put(`http://localhost:5000/api/faqs/${id}/status`, { status }, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      setPendingFaqs(prev => prev.filter(f => f._id !== id));
      showToast(`FAQ has been ${status === 'published' ? 'approved' : 'rejected'}.`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to update FAQ status.', 'error');
    }
  };

  const handleResolveReport = async (id: string, status: string) => {
    try {
      await axios.put(`http://localhost:5000/api/reports/${id}/resolve`, { status }, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      setReports(prev => prev.filter(r => r._id !== id));
      showToast(`Report marked as ${status}.`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to resolve report.', 'error');
    }
  };

  const handleReviewSuggestion = async (id: string, status: string) => {
    try {
      await axios.put(`http://localhost:5000/api/faqs/suggestions/${id}/review`, { status }, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      setSuggestions(prev => prev.filter(s => s._id !== id));
      showToast(`Suggestion ${status}.`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to review suggestion.', 'error');
    }
  };

  const handleBackfillEmbeddings = async () => {
    try {
      showToast('Starting background backfill for embeddings...', 'success');
      const res = await axios.post(`http://localhost:5000/api/faqs/backfill-embeddings`, {}, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      showToast(res.data.message, 'success');
    } catch (err: any) {
      console.error(err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to start backfill.';
      showToast(`Error: ${errorMessage}`, 'error');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="page-title text-rose-600 flex items-center gap-2">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            Admin Dashboard
          </h1>
          <p className="text-slate-500 mt-2">Approve user-submitted FAQs and manage reported content.</p>
        </div>
        <div className="flex gap-4">
          <button onClick={handleBackfillEmbeddings} className="btn-secondary !rounded-2xl flex items-center gap-2">
            <i className="bi bi-robot"></i>
            Backfill Embeddings
          </button>
        </div>
      </div>

      {/* Pending FAQs Section */}
      <section className="glass-panel p-6 rounded-3xl border-t-4 border-t-amber-500 animate-slide-up">
        <h2 className="text-xl font-bold text-slate-800 mb-6">Pending FAQs ({pendingFaqs.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white/50 backdrop-blur-sm">
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-xs tracking-wider">
                <th className="py-4 px-6">Title</th>
                <th className="py-4 px-6">Author</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} className="text-center py-6 text-slate-500 animate-pulse font-medium">Loading pending FAQs...</td></tr>
              ) : pendingFaqs.length === 0 ? (
                <tr><td colSpan={3} className="text-center py-6 text-slate-500 font-medium">No pending FAQs in the review queue.</td></tr>
              ) : pendingFaqs.map(faq => (
                <React.Fragment key={faq._id}>
                  <tr className={`border-b border-white/20 transition-colors ${expandedFaqId === faq._id ? 'bg-white/60' : 'hover:bg-white/40'}`}>
                    <td className="py-4 px-6 font-bold text-slate-900">
                      <button onClick={() => toggleExpand(faq._id)} className="hover:text-indigo-600 transition-colors flex items-center gap-2 text-left">
                        <i className={`bi bi-chevron-${expandedFaqId === faq._id ? 'up' : 'down'} text-xs text-slate-400`}></i>
                        {faq.title}
                      </button>
                    </td>
                    <td className="py-4 px-6 text-slate-500 font-medium">@{faq.author?.username || 'Unknown'}</td>
                    <td className="py-4 px-6 text-right flex gap-3 justify-end">
                      <button onClick={() => toggleExpand(faq._id)} className="bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold text-sm py-2 px-4 rounded-xl shadow-sm transition-all">Review</button>
                      <button onClick={() => handleUpdateFaqStatus(faq._id, 'published')} className="bg-white border border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300 font-bold text-sm py-2 px-4 rounded-xl shadow-sm transition-all">Approve</button>
                      <button onClick={() => handleUpdateFaqStatus(faq._id, 'rejected')} className="bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 font-bold text-sm py-2 px-4 rounded-xl shadow-sm transition-all">Reject</button>
                    </td>
                  </tr>
                  {expandedFaqId === faq._id && (
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <td colSpan={3} className="p-6">
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Question</h4>
                            <p className="text-slate-900 bg-white p-4 rounded-xl border border-slate-200">{faq.question}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Answer</h4>
                            <p className="text-slate-900 bg-white p-4 rounded-xl border border-slate-200 whitespace-pre-wrap">{faq.answer}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Review Edit Suggestions Section */}
      <section className="glass-panel p-6 rounded-3xl border-t-4 border-t-indigo-500 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <h2 className="text-xl font-bold text-slate-800 mb-6">Suggested Edits ({suggestions.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white/50 backdrop-blur-sm">
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-xs tracking-wider">
                <th className="py-4 px-6">FAQ Target</th>
                <th className="py-4 px-6">Suggested Title</th>
                <th className="py-4 px-6">Suggested By</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="text-center py-6 text-slate-500 animate-pulse font-medium">Loading suggestions...</td></tr>
              ) : suggestions.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-6 text-slate-500 font-medium">No pending edit suggestions.</td></tr>
              ) : suggestions.map(suggestion => (
                <tr key={suggestion._id} className="border-b border-white/20 hover:bg-white/40 transition-colors">
                  <td className="py-4 px-6 text-slate-500 text-sm font-medium">
                    <Link href={`/faqs/${suggestion.faq?.slug}`} className="text-indigo-600 hover:text-indigo-800 hover:underline" target="_blank">
                      {suggestion.faq?.title?.substring(0, 30)}...
                    </Link>
                  </td>
                  <td className="py-4 px-6 font-bold text-slate-900">{suggestion.proposedTitle}</td>
                  <td className="py-4 px-6 text-slate-500 font-medium">@{suggestion.suggestedBy?.username || 'Unknown'}</td>
                  <td className="py-4 px-6 text-right flex gap-3 justify-end">
                    <button onClick={() => handleReviewSuggestion(suggestion._id, 'approved')} className="bg-white border border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300 font-bold text-sm py-2 px-4 rounded-xl shadow-sm transition-all">Approve</button>
                    <button onClick={() => handleReviewSuggestion(suggestion._id, 'rejected')} className="bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 font-bold text-sm py-2 px-4 rounded-xl shadow-sm transition-all">Reject</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Reported Content Section */}
      <section className="glass-panel p-6 rounded-3xl border-t-4 border-t-rose-500 animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <h2 className="text-xl font-bold text-slate-800 mb-6">Reported Content ({reports.length})</h2>
        {reports.length === 0 ? (
          <div className="text-center py-10 text-slate-500 font-medium">
            <p>No user reports to review. All clean!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report._id} className="p-5 border border-rose-200/50 rounded-2xl bg-white/40 backdrop-blur-sm flex flex-col sm:flex-row gap-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-3 text-sm text-slate-500 font-medium">
                    <span className="bg-rose-100 text-rose-800 font-bold px-3 py-1 rounded-full uppercase text-[10px] tracking-widest">{report.itemModel}</span>
                    <span>Reported by <strong className="text-slate-700">@{report.reporter?.username || 'User'}</strong></span>
                    <span>•</span>
                    <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-base font-bold text-slate-900 mb-4">"{report.reason}"</p>
                  <div className="text-sm text-slate-600 bg-white/60 p-4 rounded-xl border border-white/50">
                    <p className="mb-1"><strong className="text-slate-800">Target ID:</strong> {report.itemId?._id || 'Unknown'}</p>
                    <p className="line-clamp-2"><strong className="text-slate-800">Content:</strong> {report.itemId?.title || report.itemId?.body || report.itemId?.question || 'Content removed or unavailable'}</p>
                  </div>
                </div>
                <div className="flex sm:flex-col gap-3 justify-center">
                  <button onClick={() => handleResolveReport(report._id, 'resolved')} className="flex-1 sm:flex-none btn-danger !rounded-xl shadow-rose-200 shadow-sm !py-2.5 px-5 font-bold">Remove</button>
                  <button onClick={() => handleResolveReport(report._id, 'dismissed')} className="flex-1 sm:flex-none bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-bold text-sm py-2.5 px-5 rounded-xl shadow-sm transition-colors">Dismiss</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-8 right-8 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-slide-up z-50 transition-all ${
          toastMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-2 border-emerald-200 shadow-emerald-500/20' : 'bg-rose-50 text-rose-800 border-2 border-rose-200 shadow-rose-500/20'
        }`}>
          <i className={`bi ${toastMessage.type === 'success' ? 'bi-check-circle-fill text-emerald-500' : 'bi-exclamation-triangle-fill text-rose-500'} text-2xl`}></i>
          <span className="font-bold text-sm tracking-wide">{toastMessage.message}</span>
        </div>
      )}
    </div>
  );
}
