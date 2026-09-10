"use client";
import Link from 'next/link';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';

export default function MySubmissionsPage() {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const fetchMyFaqs = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/faqs/mine', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setFaqs(res.data);
      } catch (err) {
        console.error("Failed to fetch submissions", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMyFaqs();
  }, [user]);

  if (!user) return <div className="p-10 text-center">Please sign in to view your submissions.</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-end mb-8 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">My Submissions</h1>
          <p className="text-slate-500 mt-2">Track the status of the FAQs you've proposed.</p>
        </div>
        <Link href="/faqs/submit" className="btn-primary">
          <i className="bi bi-plus-lg"></i> Propose FAQ
        </Link>
      </div>

      <div className="card-modern p-6">
        {loading ? (
          <div className="text-center py-10 animate-pulse text-slate-500">Loading submissions...</div>
        ) : faqs.length === 0 ? (
          <div className="text-center py-10 text-slate-500">
            <p>You haven't submitted any FAQs yet.</p>
            <Link href="/faqs/submit" className="btn-primary mt-4 inline-block">Create your first FAQ</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-modern">
              <thead className="bg-slate-50">
                <tr>
                  <th className="py-3 px-4 text-left">Title</th>
                  <th className="py-3 px-4 text-left">Category</th>
                  <th className="py-3 px-4 text-left">Submitted On</th>
                  <th className="py-3 px-4 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {faqs.map(faq => (
                  <tr key={faq._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      {faq.status === 'published' ? (
                        <Link href={`/faqs/${faq.slug}`} className="font-bold text-indigo-600 hover:underline">{faq.title}</Link>
                      ) : (
                        <span className="font-bold text-slate-700">{faq.title}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-sm">{faq.category?.name || 'Uncategorized'}</td>
                    <td className="py-3 px-4 text-slate-500 text-sm">{new Date(faq.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4">
                      {faq.status === 'published' && <span className="badge-soft bg-emerald-100 text-emerald-800"><i className="bi bi-check-circle mr-1"></i> Published</span>}
                      {faq.status === 'pending' && <span className="badge-soft bg-amber-100 text-amber-800"><i className="bi bi-clock mr-1"></i> Pending Review</span>}
                      {faq.status === 'rejected' && <span className="badge-soft bg-rose-100 text-rose-800"><i className="bi bi-x-circle mr-1"></i> Rejected</span>}
                      {faq.status === 'draft' && <span className="badge-soft bg-slate-100 text-slate-800">Draft</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
