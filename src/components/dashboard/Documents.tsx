import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    FileText, Upload, Plus, Calendar, Image as ImageIcon, 
    File, Trash2, Send, Loader2, Download,
    AlertCircle, X, ChevronRight, MessageSquare,
    Edit3, History, ArrowLeftRight, Clock
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import EditDocumentModal from "./EditDocumentModal";

const SCROLLBAR_STYLES = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
  .custom-scrollbar-h::-webkit-scrollbar {
    height: 4px;
  }
  .custom-scrollbar-h::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar-h::-webkit-scrollbar-thumb {
    background: #e2e8f0;
    border-radius: 10px;
  }
`;

interface AttachmentItem {
    id: string;
    document_id: string;
    file_url: string;
    file_type: string;
    file_name: string;
    created_at: string;
}

interface DocumentItem {
    id: string;
    upload_date: string;
    text_content: string | null;
    created_at: string;
    attachments?: AttachmentItem[];
}

interface HistoryItem {
    id: string;
    document_id: string;
    action: string;
    details: string;
    created_at: string;
}

const Documents = () => {
    useEffect(() => {
        const styleTag = document.createElement("style");
        styleTag.innerHTML = SCROLLBAR_STYLES;
        document.head.appendChild(styleTag);
        return () => { document.head.removeChild(styleTag); };
    }, []);

    const [documents, setDocuments] = useState<DocumentItem[]>([]);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [dates, setDates] = useState<string[]>([]);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [editingDocument, setEditingDocument] = useState<DocumentItem | null>(null);
    
    // New document form state
    const [textContent, setTextContent] = useState("");
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [error, setError] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDownload = async (fileUrl: string, fileName: string) => {
        try {
            const response = await fetch(fileUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Download failed:", err);
            window.open(fileUrl, '_blank');
        }
    };

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch Documents
            const { data: docsData, error: docsError } = await supabase
                .from('documents')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (docsError) throw docsError;

            // Fetch Attachments for all these documents
            const docIds = (docsData || []).map(d => d.id);
            let attachments: AttachmentItem[] = [];
            
            if (docIds.length > 0) {
                const { data: attachData, error: attachError } = await supabase
                    .from('document_attachments')
                    .select('*')
                    .in('document_id', docIds);
                
                if (attachError) throw attachError;
                attachments = attachData || [];
            }

            // Combine documents with their attachments
            const combinedDocs = (docsData || []).map(doc => ({
                ...doc,
                attachments: attachments.filter(a => a.document_id === doc.id)
            }));

            setDocuments(combinedDocs);
            
            // Extract unique dates
            const uniqueDates = [...new Set((docsData || []).map(doc => doc.upload_date))].sort((a, b) => b.localeCompare(a));
            setDates(uniqueDates);
            
            if (uniqueDates.length > 0 && !selectedDate) {
                setSelectedDate(uniqueDates[0]);
            } else if (uniqueDates.length === 0 && !selectedDate) {
                setSelectedDate(new Date().toISOString().split('T')[0]);
            }

            // Fetch History for the current date's documents
            if (selectedDate) {
                const currentDateDocIds = combinedDocs
                    .filter(d => d.upload_date === selectedDate)
                    .map(d => d.id);
                
                if (currentDateDocIds.length > 0) {
                    const { data: historyData } = await supabase
                        .from('document_history')
                        .select('*')
                        .in('document_id', currentDateDocIds)
                        .order('created_at', { ascending: false });
                    setHistory(historyData || []);
                } else {
                    setHistory([]);
                }
            }
        } catch (err: any) {
            console.error("Error fetching documents:", err);
            setError("Failed to load documents.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, [selectedDate]);

    const handleFileUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!textContent.trim() && selectedFiles.length === 0) {
            setError("Please provide either text content or at least one file.");
            return;
        }

        try {
            setUploading(true);
            setError("");
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not authenticated");

            // 1. Create the Document entry first
            const { data: newDoc, error: dbError } = await supabase
                .from('documents')
                .insert({
                    user_id: user.id,
                    text_content: textContent.trim() || null,
                    upload_date: new Date().toISOString().split('T')[0]
                })
                .select()
                .single();

            if (dbError) throw dbError;

            // 2. Upload and record attachments
            if (newDoc && selectedFiles.length > 0) {
                const attachmentInserts = [];
                
                for (const file of selectedFiles) {
                    const timestamp = Date.now() + Math.random();
                    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
                    const filePath = `${user.id}/${timestamp}_${sanitizedFileName}`;

                    const { error: uploadError } = await supabase.storage
                        .from('user_documents')
                        .upload(filePath, file);

                    if (uploadError) throw uploadError;

                    const { data: { publicUrl } } = supabase.storage
                        .from('user_documents')
                        .getPublicUrl(filePath);

                    attachmentInserts.push({
                        document_id: newDoc.id,
                        user_id: user.id,
                        file_url: publicUrl,
                        file_type: file.type,
                        file_name: file.name
                    });
                }

                if (attachmentInserts.length > 0) {
                    const { error: attachInsertError } = await supabase
                        .from('document_attachments')
                        .insert(attachmentInserts);
                    
                    if (attachInsertError) throw attachInsertError;
                }
            }

            // 3. Record history
            if (newDoc) {
                const historyDetails = textContent.trim() 
                    ? `Note: ${textContent.trim()}`
                    : `Record created with ${selectedFiles.length} file(s)`;

                await supabase.from('document_history').insert({
                    document_id: newDoc.id,
                    user_id: user.id,
                    action: 'Created',
                    details: historyDetails
                });
            }

            // Reset form
            setTextContent("");
            setSelectedFiles([]);
            setShowUploadModal(false);
            fetchDocuments();
        } catch (err: any) {
            console.error("Error uploading document:", err);
            setError(err.message || "Failed to upload document.");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string, attachments: AttachmentItem[] | undefined) => {
        if (!window.confirm("Are you sure you want to delete this record and all its attachments?")) return;

        try {
            // Delete all file attachments from storage
            if (attachments && attachments.length > 0) {
                for (const attach of attachments) {
                    const pathParts = attach.file_url.split('/user_documents/');
                    if (pathParts.length > 1) {
                        const filePath = pathParts[1];
                        await supabase.storage.from('user_documents').remove([filePath]);
                    }
                }
            }

            const { error } = await supabase
                .from('documents')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchDocuments();
        } catch (err: any) {
            console.error("Error deleting document:", err);
            setError("Failed to delete record.");
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setSelectedFiles(prev => [...prev, ...files]);
    };

    const removeSelectedFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const filteredDocs = documents.filter(doc => doc.upload_date === selectedDate);

    if (loading && documents.length === 0) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <Loader2 size={40} className="animate-spin text-medical-blue" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <FileText className="text-medical-blue" size={32} />
                        Medical Documents
                    </h1>
                    <p className="text-slate-500 font-medium">Upload, edit and track history of your medical records.</p>
                </div>
                <button
                    onClick={() => setShowUploadModal(true)}
                    className="flex items-center justify-center gap-2 px-6 py-4 rounded-[1.5rem] bg-slate-900 text-white font-black text-sm uppercase tracking-wider hover:bg-medical-blue/80 transition-all shadow-xl shadow-slate-900/10"
                >
                    <Plus size={20} /> New Upload
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[600px]">
                {/* Dates Sidebar */}
                <div className="lg:col-span-3 space-y-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Timeline</h3>
                    <div className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible pb-4 lg:pb-0 gap-2 no-scrollbar custom-scrollbar-h">
                        {dates.length === 0 ? (
                            <div className="p-4 rounded-3xl bg-slate-100/50 border border-slate-200 border-dashed text-center">
                                <p className="text-[10px] font-bold text-slate-400">No records yet</p>
                            </div>
                        ) : (
                            dates.map(date => (
                                <button
                                    key={date}
                                    onClick={() => setSelectedDate(date)}
                                    className={`flex items-center justify-between gap-4 px-5 py-4 rounded-2xl transition-all border shrink-0 ${
                                        selectedDate === date
                                            ? 'bg-white border-medical-blue/20 text-medical-blue shadow-lg shadow-medical-blue/10'
                                            : 'bg-transparent border-transparent text-slate-500 hover:bg-slate-50'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Calendar size={16} />
                                        <span className="font-bold text-sm">
                                            {new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                    </div>
                                    <ChevronRight size={14} className={selectedDate === date ? 'opacity-100' : 'opacity-0'} />
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Content Area */}
                <div className="lg:col-span-9 space-y-8">
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-medical-blue/5 p-8">
                        {selectedDate && (
                            <div className="mb-8 flex items-center justify-between">
                                <h2 className="text-xl font-black text-slate-900">
                                    Records for {new Date(selectedDate).toLocaleDateString(undefined, { dateStyle: 'long' })}
                                </h2>
                                <span className="px-4 py-1.5 rounded-full bg-slate-50 text-slate-500 font-bold text-[10px] uppercase tracking-wider border border-slate-100">
                                    {filteredDocs.length} {filteredDocs.length === 1 ? 'Entry' : 'Entries'}
                                </span>
                            </div>
                        )}

                        <div className="space-y-6">
                            {filteredDocs.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center">
                                    <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-300 mb-4 border border-slate-100">
                                        <Plus size={32} />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900">No records for this date</h3>
                                    <p className="text-sm text-slate-500 max-w-xs mx-auto mt-2">
                                        Start building your health timeline by uploading prescriptions or daily notes.
                                    </p>
                                </div>
                            ) : (
                                filteredDocs.map((doc) => (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        key={doc.id}
                                        className="p-6 rounded-3xl bg-slate-50 border border-slate-100 hover:border-medical-blue/30 transition-all group"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 space-y-4">
                                                {doc.text_content && (
                                                    <div className="flex gap-3">
                                                        <MessageSquare size={18} className="text-medical-blue shrink-0 mt-1" />
                                                        <p className="text-slate-700 text-sm font-medium leading-relaxed">
                                                            {doc.text_content}
                                                        </p>
                                                    </div>
                                                )}

                                                {doc.attachments && doc.attachments.length > 0 && (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                                                        {doc.attachments.map((attach) => (
                                                            <div key={attach.id} className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-slate-200/50 hover:border-medical-blue/30 transition-all">
                                                                <div className="w-10 h-10 rounded-xl bg-medical-blue/10 flex items-center justify-center text-medical-blue shrink-0">
                                                                    {attach.file_type?.startsWith('image/') ? <ImageIcon size={20} /> : <File size={20} />}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-[10px] font-black text-slate-900 truncate uppercase tracking-wider">
                                                                        {attach.file_name}
                                                                    </p>
                                                                    <p className="text-[9px] font-bold text-slate-400 capitalize">
                                                                        {attach.file_type?.split('/')[1] || 'File'}
                                                                    </p>
                                                                </div>
                                                                    <div className="flex gap-2">
                                                                        <a
                                                                            href={attach.file_url}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-medical-blue hover:bg-medical-blue/5 transition-all"
                                                                            title="View File"
                                                                        >
                                                                            <FileText size={14} />
                                                                        </a>
                                                                        <button
                                                                            onClick={() => handleDownload(attach.file_url, attach.file_name)}
                                                                            className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-medical-blue hover:bg-medical-blue/5 transition-all"
                                                                            title="Download File"
                                                                        >
                                                                            <Download size={14} />
                                                                        </button>
                                                                    </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <button
                                                    onClick={() => setEditingDocument(doc)}
                                                    className="p-2 rounded-xl text-slate-400 hover:text-sky-500 hover:bg-sky-50 transition-all"
                                                    title="Edit entry"
                                                >
                                                    <Edit3 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(doc.id, doc.attachments)}
                                                    className="p-2 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all"
                                                    title="Delete entry"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="mt-4 flex items-center gap-4">
                                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Uploaded at</span>
                                            <span className="text-[9px] font-bold text-slate-400">
                                                {new Date(doc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* History Section */}
                    {selectedDate && history.length > 0 && (
                        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl shadow-slate-900/20">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-medical-blue">
                                    <History size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black">Activity Feed</h2>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Audit Trail for {new Date(selectedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                                </div>
                            </div>

                            <div className="space-y-6 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-white/10">
                                {history.map((log) => (
                                    <div key={log.id} className="relative pl-12">
                                        <div className="absolute left-0 top-1 w-10 h-10 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center z-10">
                                            {log.action === 'Created' ? <Plus size={14} className="text-emerald-400" /> : 
                                             log.action === 'Replaced File' ? <ArrowLeftRight size={14} className="text-sky-400" /> :
                                             <Clock size={14} className="text-slate-400" />}
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-white uppercase tracking-wider mb-1">
                                                {log.action}
                                            </p>
                                            <p className="text-sm text-slate-400 font-medium">
                                                {log.details}
                                            </p>
                                            <p className="text-[10px] text-slate-500 font-bold mt-2 uppercase tracking-tight">
                                                {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Upload Modal */}
            <AnimatePresence>
                {showUploadModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
                        style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(15,23,42,0.55)" }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-medical-blue shadow-sm">
                                        <Upload size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900 leading-none">New Upload</h2>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Multiple Images, PDFs, or Note</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowUploadModal(false);
                                        setSelectedFiles([]);
                                        setTextContent("");
                                    }}
                                    className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all hover:bg-slate-50 shadow-sm"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleFileUpload} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                {error && (
                                    <div className="bg-red-50 text-red-500 text-xs font-bold p-4 rounded-2xl border border-red-100 flex items-center gap-3">
                                        <AlertCircle size={18} className="shrink-0" /> {error}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Write a Note (Optional)</label>
                                    <textarea
                                        value={textContent}
                                        onChange={(e) => setTextContent(e.target.value)}
                                        placeholder="Add context to this upload (e.g., 'Met with Dr. Smith, blood test results')"
                                        className="w-full h-32 p-4 rounded-3xl border-2 border-slate-100 focus:border-medical-blue focus:outline-none text-sm transition-all bg-slate-50 focus:bg-white resize-none font-medium"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Attach Documents (Multiple Allowed)</label>
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`group relative w-full min-h-[120px] rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center cursor-pointer p-4 ${
                                            selectedFiles.length > 0
                                                ? 'bg-medical-blue/5 border-medical-blue/30'
                                                : 'bg-slate-50 border-slate-200 hover:border-medical-blue/50 hover:bg-medical-blue/10'
                                        }`}
                                    >
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileSelect}
                                            className="hidden"
                                            accept="image/*,application/pdf"
                                            multiple
                                        />
                                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-medical-blue transition-colors shadow-sm mb-2">
                                            <Upload size={20} />
                                        </div>
                                        <p className="text-xs font-bold text-slate-400 group-hover:text-slate-600 transition-colors">Click to Add Images or PDFs</p>
                                        <p className="text-[10px] text-slate-300 font-bold uppercase tracking-wider mt-1">Max 10MB per file</p>
                                    </div>

                                    {selectedFiles.length > 0 && (
                                        <div className="grid grid-cols-2 gap-2 mt-4">
                                            {selectedFiles.map((file, idx) => (
                                                <div key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200">
                                                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-medical-blue shrink-0">
                                                        {file.type.startsWith('image/') ? <ImageIcon size={14} /> : <File size={14} />}
                                                    </div>
                                                    <p className="text-[10px] font-bold text-slate-700 truncate flex-1">{file.name}</p>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); removeSelectedFile(idx); }}
                                                        className="p-1 rounded-md text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowUploadModal(false);
                                            setSelectedFiles([]);
                                            setTextContent("");
                                        }}
                                        className="flex-1 py-4 rounded-2xl border-2 border-slate-100 text-slate-500 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={uploading}
                                        className="flex-[2] py-4 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest hover:bg-medical-blue/80 transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {uploading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                        {uploading ? 'Uploading...' : `Upload ${selectedFiles.length > 0 ? selectedFiles.length + ' Files' : 'Record'}`}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Edit Modal */}
            <AnimatePresence>
                {editingDocument && (
                    <EditDocumentModal
                        document={editingDocument}
                        onClose={() => setEditingDocument(null)}
                        onSuccess={fetchDocuments}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default Documents;
