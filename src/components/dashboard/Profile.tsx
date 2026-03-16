import React, { useEffect, useState } from 'react';
import { Mail, Phone, Shield, Bell, Moon, LogOut, ChevronRight, Edit3, Camera, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import EditProfileModal from './EditProfileModal';

const Profile = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState<any>(null);
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            
            if (user) {
                setEmail(user.email || 'user@example.com');
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (error && error.code !== 'PGRST116') {
                    // PGRST116 means zero rows found, we can handle it gracefully just in case trigger lagged
                    console.error("Error fetching profile", error);
                }
                
                if (data) {
                    setProfile(data);
                } else {
                    // Fallback to meta data if DB profile isn't ready
                    setProfile({
                        first_name: user.user_metadata?.first_name || '',
                        last_name: user.user_metadata?.last_name || '',
                        avatar_url: user.user_metadata?.avatar_url || ''
                    });
                }
            } else {
                // Not logged in -> handle session redirect logic normally handled higher up
                const userStr = localStorage.getItem('user');
                if (!userStr) navigate('/');
            }
        } catch (error) {
            console.error("Error fetching user session", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <Loader2 size={40} className="animate-spin text-medical-blue" />
            </div>
        );
    }

    const firstName = profile?.first_name || email.split('@')[0] || 'User';
    const lastName = profile?.last_name || '';
    const phoneDisplay = profile?.phone || 'Not provided';
    const usernameDisplay = profile?.username ? profile.username : '';

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">My Profile</h1>
                <p className="text-slate-500 font-medium">Manage your personal information and preferences.</p>
            </div>

            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-medical-blue/5 p-10">
                <div className="flex flex-col md:flex-row items-center gap-10">
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-medical-blue to-medical-green flex items-center justify-center text-white text-4xl font-black shadow-xl shadow-medical-blue/20 overflow-hidden">
                            {profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <span>{firstName[0]?.toUpperCase()}{lastName[0]?.toUpperCase()}</span>
                            )}
                        </div>
                        <button 
                            onClick={() => setShowEditModal(true)}
                            className="absolute -bottom-2 -right-2 p-3 rounded-2xl bg-slate-900 text-white shadow-lg group-hover:scale-110 transition-transform"
                        >
                            <Camera size={18} />
                        </button>
                    </div>

                    <div className="flex-1 text-center md:text-left">
                        <div className="flex flex-col md:flex-row md:items-center gap-2">
                            <h2 className="text-3xl font-black text-slate-900">
                                {firstName} {lastName}
                            </h2>
                             {usernameDisplay && (
                                <span className="text-sm font-bold text-medical-blue bg-medical-blue/10 px-3 py-1 rounded-xl">
                                    {usernameDisplay}
                                </span>
                            )}
                        </div>
                        
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2 flex items-center justify-center md:justify-start gap-2">
                            <Shield size={12} className="text-teal-500" /> Verified Premium Member
                        </p>
                        
                        <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-3">
                             <button 
                                onClick={() => setShowEditModal(true)}
                                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase tracking-wider hover:bg-medical-blue transition-all"
                            >
                                <Edit3 size={14} /> Edit Profile
                            </button>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border border-slate-200 text-rose-500 font-black text-xs uppercase tracking-wider hover:border-rose-100 hover:bg-rose-50 transition-all"
                            >
                                <LogOut size={14} /> Logout Account
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 space-y-6">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Contact Information</h3>
                    <div className="space-y-4">
                         <div className="flex items-center gap-4 p-4 rounded-3xl bg-slate-50 border border-slate-100/50">
                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-medical-blue shadow-sm">
                                <Mail size={18} />
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</p>
                                <p className="font-bold text-slate-700 text-sm truncate">{email}</p>
                            </div>
                        </div>
                         <div className="flex items-center gap-4 p-4 rounded-3xl bg-slate-50 border border-slate-100/50">
                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-medical-green shadow-sm">
                                <Phone size={18} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number</p>
                                <p className="font-bold text-slate-700 text-sm">{phoneDisplay}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 space-y-6">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">App Settings</h3>
                    <div className="space-y-3">
                        {[
                            { label: 'Push Notifications', icon: <Bell size={18} />, color: 'text-amber-500', enabled: true },
                            { label: 'Dark Mode', icon: <Moon size={18} />, color: 'text-violet-500', enabled: false },
                            { label: 'Privacy Policy', icon: <Shield size={18} />, color: 'text-teal-500', enabled: null },
                        ].map((item) => (
                             <div key={item.label} className="flex items-center justify-between p-4 rounded-3xl bg-slate-50 border border-slate-100/50 group hover:border-medical-blue/30 transition-all cursor-pointer">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl bg-white flex items-center justify-center ${item.color} shadow-sm group-hover:scale-110 transition-transform`}>
                                        {item.icon}
                                    </div>
                                    <span className="font-bold text-slate-700 text-sm">{item.label}</span>
                                </div>
                                 {item.enabled !== null ? (
                                    <div className={`w-12 h-6 rounded-full p-1 transition-colors ${item.enabled ? 'bg-medical-blue' : 'bg-slate-200'}`}>
                                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${item.enabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                    </div>
                                ) : (
                                    <ChevronRight size={18} className="text-slate-300" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {showEditModal && (
                <EditProfileModal 
                    currentProfile={{ ...profile, email }} 
                    onClose={() => setShowEditModal(false)}
                    onProfileUpdate={fetchProfile} 
                />
            )}
        </div>
    );
};

export default Profile;
