"use client";

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';

export default function AskQuestionPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const insertText = (before: string, after: string = '', defaultText: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = body;
    const selectedText = currentText.substring(start, end) || defaultText;

    const newText = currentText.substring(0, start) + before + selectedText + after + currentText.substring(end);
    setBody(newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 0);
  };

  const uploadImage = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('image', file);
      const res = await axios.post('http://localhost:5000/api/upload', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${user?.token}`
        }
      });
      insertText(`![Image](${res.data.url})\n`, '');
    } catch (err) {
      console.error("Failed to upload image", err);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleImageButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadImage(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to ask a question.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    const tagsArray = tags.split(',').map(t => t.trim()).filter(t => t);

    try {
      const res = await axios.post('http://localhost:5000/api/qa', 
        { title, body, tags: tagsArray },
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      router.push(`/qa/${res.data._id}`);
    } catch (err: any) {
      console.error("Failed to post question:", err);
      setError(err.response?.data?.message || 'Failed to post question. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent -mx-4 sm:-mx-6 lg:-mx-8 -my-4 sm:-my-6 lg:-my-8 px-4 sm:px-6 lg:px-8 py-10 font-sans">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-slate-200 pb-6 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl shadow-sm">
            <i className="bi bi-pencil-square"></i>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Create a post</h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          
          {/* Main Form Column */}
          <div className="flex-1 w-full space-y-4">
            
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-sm font-medium shadow-sm flex items-center gap-3">
                <i className="bi bi-exclamation-triangle-fill text-red-500 text-lg"></i> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Title Input */}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-[1.25rem] opacity-0 group-focus-within:opacity-10 transition duration-300"></div>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={300}
                  className="w-full relative bg-white border border-slate-200 hover:border-slate-300 focus:border-indigo-500 shadow-sm rounded-2xl px-5 py-4 text-slate-900 text-base font-medium transition-all outline-none placeholder:text-slate-400 placeholder:font-normal" 
                  placeholder="Title (e.g. How do I download the NOC?)" 
                  required 
                />
                <div className="absolute right-5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 bg-white pl-2">
                  {title.length}/300
                </div>
              </div>

              {/* Tags Input */}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-[1.25rem] opacity-0 group-focus-within:opacity-10 transition duration-300"></div>
                <input 
                  type="text" 
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full relative bg-white border border-slate-200 hover:border-slate-300 focus:border-indigo-500 shadow-sm rounded-2xl px-5 py-4 text-slate-900 text-base font-medium transition-all outline-none placeholder:text-slate-400 placeholder:font-normal" 
                  placeholder="Tags (e.g. NOC, dates, stipend) - comma separated" 
                  required 
                />
              </div>

              {/* Hidden File Input for Image Upload */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={(e) => e.target.files && uploadImage(e.target.files[0])} 
                accept="image/*" 
                className="hidden" 
              />

              {/* Reddit-Style Imposed Textbox */}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl opacity-0 group-focus-within:opacity-10 transition duration-300"></div>
                <div 
                  className="relative border border-slate-200 focus-within:border-indigo-500 shadow-sm bg-white rounded-3xl overflow-hidden transition-all flex flex-col"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                >
                  
                  <textarea 
                    ref={textareaRef}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="w-full bg-transparent px-6 py-5 text-slate-900 text-base outline-none resize-y min-h-[200px] placeholder:text-slate-400 leading-relaxed font-medium" 
                    placeholder={uploadingImage ? "Uploading image..." : "Provide all the details for your question here. Markdown is fully supported..."} 
                    disabled={uploadingImage}
                  />

                  {/* Internal Toolbar and Submit Buttons */}
                  <div className="px-4 pb-4 pt-2 flex items-center justify-between bg-slate-50 border-t border-slate-100">
                    
                    {/* Left Toolbar Icons */}
                    <div className="flex items-center gap-1.5 text-slate-500 bg-white px-2 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                      <button type="button" onClick={handleImageButtonClick} disabled={uploadingImage} className="w-8 h-8 flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors disabled:opacity-50" title="Upload Image">
                        {uploadingImage ? <i className="bi bi-arrow-repeat animate-spin text-lg"></i> : <i className="bi bi-image text-lg"></i>}
                      </button>
                      <button type="button" onClick={() => insertText('![GIF](', ')', 'https://...')} className="w-8 h-8 flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors text-xs font-black font-sans tracking-tight" title="Add a GIF">
                        GIF
                      </button>
                      <button type="button" onClick={() => insertText('**', '**', 'bold text')} className="w-8 h-8 flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors font-serif font-black text-sm" title="Bold Text">
                        Aa
                      </button>
                      <button type="button" onClick={() => insertText('[', '](https://...)', 'Link Text')} className="w-8 h-8 flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors" title="Add Link">
                        <i className="bi bi-link-45deg text-xl"></i>
                      </button>
                      <button type="button" onClick={() => insertText('```javascript\n', '\n```', 'code here')} className="w-8 h-8 flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors" title="Code Block">
                        <i className="bi bi-code-slash text-lg"></i>
                      </button>
                    </div>

                    {/* Right Action Buttons */}
                    <div className="flex items-center gap-3">
                      <button 
                        type="button" 
                        onClick={() => router.push('/qa')} 
                        className="px-5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-bold transition-all shadow-sm"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        disabled={loading || !title} 
                        className="px-8 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none text-white text-sm font-bold transition-all shadow-lg shadow-indigo-600/30 min-w-[100px] flex items-center justify-center gap-2"
                      >
                        {loading ? 'Posting...' : <>Post <i className="bi bi-send-fill"></i></>}
                      </button>
                    </div>

                  </div>
                </div>
              </div>

            </form>
          </div>

          {/* Right Column (Community Rules) */}
          <div className="w-full lg:w-[320px] shrink-0 pt-2">
            <div className="bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
              <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                <i className="bi bi-shield-check text-2xl text-emerald-500"></i>
                <h3 className="font-black text-slate-900 tracking-tight">Community Rules</h3>
              </div>
              <ol className="text-[13px] text-slate-600 font-medium">
                <li className="px-6 py-4 border-b border-slate-50 flex gap-4 hover:bg-slate-50 transition-colors">
                  <span className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">1</span>
                  <span className="leading-relaxed mt-0.5">Remember the human behind the screen</span>
                </li>
                <li className="px-6 py-4 border-b border-slate-50 flex gap-4 hover:bg-slate-50 transition-colors">
                  <span className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">2</span>
                  <span className="leading-relaxed mt-0.5">Beholden to community guidelines</span>
                </li>
                <li className="px-6 py-4 border-b border-slate-50 flex gap-4 hover:bg-slate-50 transition-colors">
                  <span className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">3</span>
                  <span className="leading-relaxed mt-0.5">Look for the original source of content</span>
                </li>
                <li className="px-6 py-4 border-b border-slate-50 flex gap-4 hover:bg-slate-50 transition-colors">
                  <span className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">4</span>
                  <span className="leading-relaxed mt-0.5">Search for duplicates before posting</span>
                </li>
                <li className="px-6 py-4 flex gap-4 hover:bg-slate-50 transition-colors">
                  <span className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">5</span>
                  <span className="leading-relaxed mt-0.5">Read the community's full rules</span>
                </li>
              </ol>
            </div>
            <div className="mt-5 text-[11px] text-slate-400 px-4 leading-relaxed font-medium uppercase tracking-wider text-center">
              Keep it professional, informative, and helpful to the community.
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
