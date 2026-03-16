import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, Download, User as UserIcon, Loader2, File, Image as ImageIcon, MessageSquare, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';

const PublicProfile = () => {
    const { uniqueId } = useParams();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<any>(null);
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchPublicData = async () => {
            try {
                setLoading(true);
                setError('');

                // 1. Fetch Profile by unique ID (username)
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('username', uniqueId?.toLowerCase())
                    .single();

                if (profileError || !profileData) {
                    throw new Error("User not found");
                }
                setProfile(profileData);

                // 2. Fetch public documents
                const { data: docsData, error: docsError } = await supabase
                    .from('documents')
                    .select('*')
                    .eq('user_id', profileData.id)
                    .order('created_at', { ascending: false });

                if (docsError) throw docsError;

                // 3. Fetch all attachments for these documents
                const docIds = (docsData || []).map(d => d.id);
                let attachments: any[] = [];

                if (docIds.length > 0) {
                    const { data: attachData, error: attachError } = await supabase
                        .from('document_attachments')
                        .select('*')
                        .in('document_id', docIds);
                    
                    if (attachError) throw attachError;
                    attachments = attachData || [];
                }

                // Combine docs and attachments
                const combinedDocs = (docsData || []).map((doc: any) => ({
                    ...doc,
                    attachments: attachments.filter(a => a.document_id === doc.id)
                }));

                setDocuments(combinedDocs);

            } catch (err: any) {
                console.error("Error fetching public profile:", err);
                setError(err.message || "Failed to load profile.");
            } finally {
                setLoading(false);
            }
        };

        if (uniqueId) fetchPublicData();
    }, [uniqueId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <Loader2 size={40} className="animate-spin text-medical-blue" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center space-y-4">
                <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-2 shadow-sm">
                    <UserIcon size={32} />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-slate-800">User Not Found</h2>
                    <p className="text-slate-500 mt-2 font-medium">Could not find any user with the ID <b className="text-slate-700">{uniqueId}</b></p>
                </div>
                <button onClick={() => navigate(-1)} className="mt-4 px-6 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors">
                    <ArrowLeft size={16} /> Go Back
                </button>
            </div>
        );
    }

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
            // Fallback to direct link if fetch fails
            window.open(fileUrl, '_blank');
        }
    };

    const initial = profile?.first_name?.[0]?.toUpperCase() || 'U';

    return (
        <div className="max-w-4xl mx-auto pb-20 space-y-8">
            <button onClick={() => navigate(-1)} className="p-2 mb-2 bg-white border border-slate-200 shadow-sm text-slate-500 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors inline-block">
                <ArrowLeft size={20} />
            </button>
            
            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-medical-blue/5 p-10 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-medical-blue to-medical-green opacity-10" />
                
                <div className="relative flex flex-col md:flex-row items-center gap-10 mt-6 md:mt-10">
                    <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-medical-blue to-medical-green flex items-center justify-center text-white text-4xl font-black shadow-xl shadow-medical-blue/20 overflow-hidden shrink-0">
                        {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <span>{initial}</span>
                        )}
                    </div>

                    <div className="flex-1 text-center md:text-left">
                        <div className="flex flex-col md:flex-row md:items-center gap-3">
                            <h2 className="text-4xl font-black text-slate-900 tracking-tight">
                                {profile?.first_name} {profile?.last_name}
                            </h2>
                            <span className="text-sm font-black text-medical-blue bg-medical-blue/10 px-3 py-1.5 rounded-xl border border-medical-blue/20 uppercase tracking-widest hidden md:inline-block">
                                ID: {profile?.username}
                            </span>
                        </div>
                        <span className="text-sm font-black text-medical-blue bg-medical-blue/10 px-3 py-1.5 rounded-xl border border-medical-blue/20 uppercase tracking-widest md:hidden mt-3 inline-block">
                            ID: {profile?.username}
                        </span>
                        
                        <p className="text-slate-500 font-medium mt-4 max-w-lg">
                            This is a public profile. You can view and download files uploaded by {profile?.first_name || 'this user'}.
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                        <FileText className="text-medical-blue" /> Uploaded Records
                    </h3>
                    <span className="bg-slate-100 border border-slate-200 text-slate-600 px-4 py-1.5 rounded-full text-xs font-bold font-mono">
                        Total: {documents.length}
                    </span>
                </div>

                {documents.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-sm">
                        <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 mx-auto mb-4 border border-slate-100 shadow-sm">
                            <File size={32} />
                        </div>
                        <h4 className="text-lg font-bold text-slate-900">No records found</h4>
                        <p className="text-slate-500 mt-1 max-w-sm mx-auto text-sm">
                            {profile?.first_name || 'This user'} hasn't uploaded any public files yet.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {documents.map((doc: any, index: number) => (
                            <motion.div 
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                key={doc.id} 
                                className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 lg:p-8 hover:shadow-md hover:border-medical-blue/30 transition-all group"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                                    <div className="space-y-1">
                                        <h4 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                                            Record from {new Date(doc.upload_date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                                        </h4>
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                            <span>Uploaded {new Date(doc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </div>
                                </div>

                                {doc.text_content && (
                                    <div className="flex gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100/50 mb-6 group-hover:bg-medical-blue/5 transition-colors">
                                        <MessageSquare size={20} className="text-medical-blue shrink-0 mt-0.5" />
                                        <p className="text-slate-700 text-sm font-medium leading-relaxed">
                                            {doc.text_content}
                                        </p>
                                    </div>
                                )}

                                {doc.attachments && doc.attachments.length > 0 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                        {doc.attachments.map((attach: any) => (
                                            <div key={attach.id} className="relative flex flex-col p-4 rounded-2xl bg-white border border-slate-200 hover:border-medical-blue/30 hover:shadow-lg hover:shadow-medical-blue/5 transition-all outline-none">
                                                <div className="flex items-start gap-4 mb-4">
                                                    <div className="w-12 h-12 rounded-xl bg-medical-blue/10 flex items-center justify-center text-medical-blue shrink-0 border border-medical-blue/20">
                                                        {attach.file_type?.startsWith('image/') ? <ImageIcon size={24} /> : <File size={24} />}
                                                    </div>
                                                    <div className="flex-1 min-w-0 pt-1">
                                                        <p className="text-xs font-black text-slate-900 truncate" title={attach.file_name}>
                                                            {attach.file_name}
                                                        </p>
                                                        <p className="text-[10px] font-bold text-slate-400 capitalize mt-1 uppercase tracking-wider">
                                                            {attach.file_type?.split('/')[1] || 'File'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="mt-auto flex flex-col gap-2">
                                                    <a
                                                        href={attach.file_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs uppercase tracking-wider hover:bg-medical-blue/80 transition-colors"
                                                    >
                                                        <FileText size={14} /> View File
                                                    </a>
                                                    <button
                                                        onClick={() => handleDownload(attach.file_url, attach.file_name)}
                                                        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs uppercase tracking-wider hover:bg-slate-200 transition-colors border border-slate-200"
                                                    >
                                                        <Download size={14} /> Download
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PublicProfile;
