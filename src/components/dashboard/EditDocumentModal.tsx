import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { 
    X, Upload, File, Image as ImageIcon, Loader2, Send, 
    AlertCircle, Edit3, Trash2, Calendar, Clock
} from "lucide-react";
import { supabase } from "../../lib/supabase";

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
`;

interface AttachmentItem {
    id: string;
    document_id: string;
    file_url: string;
    file_type: string;
    file_name: string;
}

interface DocumentItem {
    id: string;
    upload_date: string;
    text_content: string | null;
    created_at: string;
    attachments?: AttachmentItem[];
}

interface EditDocumentModalProps {
    document: DocumentItem;
    onClose: () => void;
    onSuccess: () => void;
}

const EditDocumentModal: React.FC<EditDocumentModalProps> = ({ document: doc, onClose, onSuccess }) => {
    React.useEffect(() => {
        const styleTag = window.document.createElement("style");
        styleTag.innerHTML = SCROLLBAR_STYLES;
        window.document.head.appendChild(styleTag);
        return () => { window.document.head.removeChild(styleTag); };
    }, []);

    const [textContent, setTextContent] = useState(doc.text_content || "");
    const [uploadDate, setUploadDate] = useState(doc.upload_date);
    const [newFiles, setNewFiles] = useState<File[]>([]);
    const [deletingAttachmentIds, setDeletingAttachmentIds] = useState<string[]>([]);
    const [renamedAttachments, setRenamedAttachments] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            // 1. Update Document Basic Info
            const { error: updateError } = await supabase
                .from('documents')
                .update({
                    text_content: textContent.trim() || null,
                    upload_date: uploadDate
                })
                .eq('id', doc.id);

            if (updateError) throw updateError;

            // 2. Handle Deletions
            if (deletingAttachmentIds.length > 0) {
                const attachmentsToDelete = doc.attachments?.filter(a => deletingAttachmentIds.includes(a.id)) || [];
                
                for (const attach of attachmentsToDelete) {
                    const pathParts = attach.file_url.split('/user_documents/');
                    if (pathParts.length > 1) {
                        const filePath = pathParts[1];
                        await supabase.storage.from('user_documents').remove([filePath]);
                    }
                }

                await supabase
                    .from('document_attachments')
                    .delete()
                    .in('id', deletingAttachmentIds);
            }

            // 2.5 Handle Renames
            const renameIds = Object.keys(renamedAttachments);
            if (renameIds.length > 0) {
                for (const id of renameIds) {
                    const { error: renameError } = await supabase
                        .from('document_attachments')
                        .update({ file_name: renamedAttachments[id] })
                        .eq('id', id);
                    if (renameError) throw renameError;
                }
            }

            // 3. Handle New Attachments
            if (newFiles.length > 0) {
                const attachmentInserts = [];
                for (const file of newFiles) {
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
                        document_id: doc.id,
                        user_id: user.id,
                        file_url: publicUrl,
                        file_type: file.type,
                        file_name: file.name
                    });
                }

                const { error: insertError } = await supabase
                    .from('document_attachments')
                    .insert(attachmentInserts);
                
                if (insertError) throw insertError;
            }

            // 4. Record History
            const changes = [];
            const finalNote = textContent.trim();
            const originalNote = doc.text_content?.trim() || "";

            if (finalNote !== originalNote) {
                changes.push(finalNote ? `Note: ${finalNote}` : "Note cleared");
            } else if (finalNote) {
                // If note didn't change but files did, we still mention the note context
                changes.push(`Context: ${finalNote}`);
            }

            if (uploadDate !== doc.upload_date) changes.push(`Date set to ${uploadDate}`);
            
            const fileModifications = [];
            if (deletingAttachmentIds.length > 0) fileModifications.push(`${deletingAttachmentIds.length} file(s) removed`);
            if (newFiles.length > 0) fileModifications.push(`${newFiles.length} file(s) added`);
            if (Object.keys(renamedAttachments).length > 0) fileModifications.push(`${Object.keys(renamedAttachments).length} file(s) renamed`);
            
            if (fileModifications.length > 0) {
                changes.push(fileModifications.join(", "));
            }

            if (changes.length > 0) {
                await supabase.from('document_history').insert({
                    document_id: doc.id,
                    user_id: user.id,
                    action: 'Edited',
                    details: changes.join(" | ")
                });
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error("Error updating document:", err);
            setError(err.message || "Failed to update record.");
        } finally {
            setLoading(false);
        }
    };

    const toggleDeleteAttachment = (id: string) => {
        setDeletingAttachmentIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleNewFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setNewFiles(prev => [...prev, ...files]);
    };

    const removeNewFile = (index: number) => {
        setNewFiles(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6"
            style={{ backdropFilter: "blur(12px)", backgroundColor: "rgba(15,23,42,0.65)" }}
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-sky-500 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
                            <Edit3 size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 leading-none">Edit Record</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Manage notes, files and dates</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all hover:bg-slate-50 shadow-sm"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar custom-scrollbar max-h-[60vh]">
                    {error && (
                        <div className="bg-rose-50 text-rose-500 text-xs font-bold p-4 rounded-2xl border border-rose-100 flex items-center gap-3">
                            <AlertCircle size={18} className="shrink-0" /> {error}
                        </div>
                    )}

                    {/* Basic Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <Calendar size={14} className="text-sky-500" /> Date
                            </label>
                            <input
                                type="date"
                                value={uploadDate}
                                onChange={(e) => setUploadDate(e.target.value)}
                                className="w-full p-4 rounded-2xl border-2 border-slate-100 focus:border-sky-400 focus:outline-none text-sm transition-all bg-slate-50 font-bold text-slate-700"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Medical Notes</label>
                        <textarea
                            value={textContent}
                            onChange={(e) => setTextContent(e.target.value)}
                            className="w-full h-32 p-4 rounded-3xl border-2 border-slate-100 focus:border-sky-400 focus:outline-none text-sm transition-all bg-slate-50 focus:bg-white resize-none font-medium text-slate-700"
                            placeholder="Add or update notes..."
                        />
                    </div>

                    {/* Existing Attachments */}
                    <div className="space-y-4">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 block">Current Attachments</label>
                        <div className="grid grid-cols-1 gap-3">
                            {doc.attachments?.map((attach: any) => {
                                const isDeleting = deletingAttachmentIds.includes(attach.id);
                                return (
                                    <div 
                                        key={attach.id} 
                                        className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-3xl border transition-all ${
                                            isDeleting 
                                            ? 'bg-rose-50 border-rose-200 opacity-60' 
                                            : 'bg-white border-slate-100 shadow-sm'
                                        }`}
                                    >
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                                            isDeleting ? 'bg-rose-100 text-rose-500' : 'bg-slate-50 text-slate-400'
                                        }`}>
                                            {attach.file_type?.startsWith('image/') ? <ImageIcon size={24} /> : <File size={24} />}
                                        </div>
                                        <div className="flex-1 min-w-0 w-full">
                                            {isDeleting ? (
                                                <p className="text-xs font-black text-rose-700 uppercase tracking-wider truncate">
                                                    {attach.file_name}
                                                </p>
                                            ) : (
                                                <input
                                                    type="text"
                                                    value={renamedAttachments[attach.id] ?? attach.file_name}
                                                    onChange={(e) => setRenamedAttachments(prev => ({ ...prev, [attach.id]: e.target.value }))}
                                                    className="w-full bg-transparent border-none p-0 focus:ring-0 text-xs font-black text-slate-900 uppercase tracking-wider mb-1"
                                                    placeholder="File Name"
                                                />
                                            )}
                                            <p className="text-[10px] font-bold text-slate-400 capitalize">
                                                {isDeleting ? 'Flagged for removal' : attach.file_type?.split('/')[1]}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 self-end sm:self-center">
                                            <button
                                                type="button"
                                                onClick={() => toggleDeleteAttachment(attach.id)}
                                                className={`p-3 rounded-2xl transition-all ${
                                                    isDeleting 
                                                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' 
                                                    : 'text-slate-300 hover:text-rose-500 hover:bg-rose-50'
                                                }`}
                                            >
                                                {isDeleting ? <Clock size={18} /> : <Trash2 size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                            {(!doc.attachments || doc.attachments.length === 0) && (
                                <p className="text-[10px] font-bold text-slate-400 py-4 px-2 italic text-center bg-slate-50 rounded-2xl">No attachments for this record.</p>
                            )}
                        </div>
                    </div>

                    {/* Add New Attachments */}
                    <div className="space-y-4 pt-4">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 block">Add New Files</label>
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full py-8 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-sky-50 hover:border-sky-300 transition-all cursor-pointer flex flex-col items-center justify-center group"
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleNewFileSelect}
                                className="hidden"
                                accept="image/*,application/pdf"
                                multiple
                            />
                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 group-hover:text-sky-500 transition-all shadow-sm mb-2">
                                <Upload size={20} />
                            </div>
                            <p className="text-xs font-bold text-slate-400 group-hover:text-slate-600">Select more Images or PDFs</p>
                        </div>

                        {newFiles.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 animate-in fade-in slide-in-from-top-2">
                                {newFiles.map((file, idx) => (
                                    <div key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-sky-50 border border-sky-100">
                                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-sky-500 shrink-0 shadow-sm">
                                            {file.type.startsWith('image/') ? <ImageIcon size={14} /> : <File size={14} />}
                                        </div>
                                        <p className="text-[10px] font-bold text-sky-700 truncate flex-1">{file.name}</p>
                                        <button
                                            type="button"
                                            onClick={() => removeNewFile(idx)}
                                            className="p-1 rounded-md text-sky-300 hover:text-rose-500 transition-all"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </form>

                {/* Footer Actions */}
                <div className="p-8 border-t border-slate-100 bg-slate-50 gap-4 flex flex-col sm:flex-row">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-4 rounded-2xl bg-white border-2 border-slate-200 text-slate-500 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-colors"
                    >
                        Discard Changes
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-[2] py-4 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest hover:bg-sky-600 transition-all shadow-xl shadow-slate-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        {loading ? 'Saving Changes...' : 'Save All Changes'}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default EditDocumentModal;
