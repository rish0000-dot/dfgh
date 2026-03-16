
import { useEffect, useState } from 'react';
import { useNavigate, Routes, Route, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LogOut, User, Activity, Calendar, Shield, Search,
    MapPin, Bell, Menu, X, Building2, MessageCircle,
    ArrowRight, Star, Zap, Droplets, Microscope,
    Scan, Smile, CheckCircle2, FileText
} from 'lucide-react';

import DashboardHome from '../components/dashboard/DashboardHome';
import HospitalList from '../components/dashboard/HospitalList';
import HospitalDetail from '../components/dashboard/HospitalDetail';
import Appointments from '../components/dashboard/Appointments';
import AIAssistant from '../components/dashboard/AIAssistant';
import Profile from '../components/dashboard/Profile';
import Documents from '../components/dashboard/Documents';
import PublicProfile from './PublicProfile';
import { supabase } from '../lib/supabase';

const Dashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [userProfile, setUserProfile] = useState<any>(null);

    const userStr = localStorage.getItem('user');
    let user = null;
    try {
        user = userStr ? JSON.parse(userStr) : null;
    } catch (e) {
        console.error("Error parsing user from localStorage", e);
    }

    const firstName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'User';

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            if (mobile) setIsSidebarOpen(false);
            else setIsSidebarOpen(true);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchProfile = async () => {
        if (user?.id) {
            const { data } = await supabase.from('profiles').select('username, avatar_url, first_name').eq('id', user.id).single();
            if (data) setUserProfile(data);
        }
    };

    useEffect(() => {
        if (!localStorage.getItem('token')) {
            navigate('/');
        } else {
            fetchProfile();
        }

        window.addEventListener('profile-updated', fetchProfile);
        return () => window.removeEventListener('profile-updated', fetchProfile);
    }, [navigate, user?.id]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/dashboard/user/${searchQuery.trim()}`);
            setSearchQuery('');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    const navItems = [
        { id: 'home', label: 'Home', icon: Activity, path: '/dashboard' },
        { id: 'documents', label: 'Upload Documents', icon: FileText, path: '/dashboard/documents' },
        { id: 'hospitals', label: 'Find Hospitals', icon: Building2, path: '/dashboard/hospitals' },
        { id: 'appointments', label: 'My Appointments', icon: Calendar, path: '/dashboard/appointments' },
        { id: 'ai', label: 'AI Assistant', icon: MessageCircle, path: '/dashboard/ai-assistant' },
        { id: 'profile', label: 'Profile', icon: User, path: '/dashboard/profile' },
    ];

    const currentTab = navItems.find(item =>
        item.path === location.pathname ||
        (item.path !== '/dashboard' && location.pathname.startsWith(item.path))
    )?.id || 'home';

    return (
        <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
            {/* Sidebar (Desktop) */}
            <motion.aside
                initial={false}
                animate={{ width: isSidebarOpen ? 280 : 0, opacity: isSidebarOpen ? 1 : 0 }}
                className={`${isSidebarOpen ? 'flex' : 'hidden'} lg:flex flex-col bg-slate-900 text-white relative z-50 overflow-hidden`}
            >
                <div className="p-8 w-[280px]">
                    <div className="flex items-center gap-3 mb-12">
                        <div className="w-10 h-10 bg-medical-blue rounded-xl flex items-center justify-center shadow-lg shadow-medical-blue/20">
                            <Activity className="text-white" size={24} />
                        </div>
                        <span className="text-xl font-black tracking-tighter">HealthConnect</span>
                    </div>

                    <nav className="space-y-2">
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => navigate(item.path)}
                                className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all font-bold text-sm ${currentTab === item.id
                                        ? 'bg-medical-blue text-white shadow-xl shadow-medical-blue/20'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <item.icon size={20} />
                                {item.label}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="mt-auto p-8 border-t border-white/5 w-[280px]">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all font-bold text-sm"
                    >
                        <LogOut size={20} />
                        Logout
                    </button>
                </div>
            </motion.aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col relative h-full overflow-hidden">
                {/* Header */}
                <header className="h-20 bg-white border-b border-slate-100 px-6 lg:px-10 flex items-center justify-between flex-shrink-0 z-40">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="lg:hidden p-2.5 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100"
                        >
                            <Menu size={20} />
                        </button>
                        <div className="hidden md:block">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5 leading-none">Your Location</p>
                            <div className="flex items-center gap-1.5 cursor-pointer group">
                                <MapPin size={14} className="text-medical-blue" />
                                <span className="text-xs font-black text-slate-900 group-hover:text-medical-blue transition-colors">Delhi, India</span>
                                <span className="text-[10px] bg-medical-blue/10 text-medical-blue px-1.5 py-0.5 rounded font-black uppercase">Change</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 lg:gap-6">
                        <form onSubmit={handleSearch} className="hidden sm:flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100 focus-within:border-medical-blue focus-within:bg-white transition-all">
                            <button type="submit" className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-medical-blue shadow-sm hover:scale-105 transition-transform">
                                <Search size={16} />
                            </button>
                            <input 
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search user ID (e.g. alok@123)..."
                                className="text-xs font-bold text-slate-700 bg-transparent focus:outline-none w-48 placeholder:text-slate-400"
                            />
                        </form>

                        <div className="h-10 w-[1px] bg-slate-100 mx-2 hidden lg:block"></div>

                        <button className="relative p-2.5 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition-all group">
                            <Bell size={20} className="group-hover:rotate-12 transition-transform" />
                            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 border-2 border-white rounded-full"></span>
                        </button>

                        <div className="flex items-center gap-3 pl-2 sm:pl-4 group cursor-pointer" onClick={() => navigate('/dashboard/profile')}>
                            <div className="hidden text-right lg:block">
                                <p className="text-xs font-black text-slate-900 leading-none mb-1">
                                    {userProfile?.first_name || firstName}
                                </p>
                                <p className="text-[10px] font-bold text-medical-green leading-none">
                                    {userProfile?.username ? `ID: ${userProfile.username}` : 'Update Profile to get ID'}
                                </p>
                            </div>
                            <div className="w-10 h-10 lg:w-11 lg:h-11 rounded-[1.2rem] bg-gradient-to-br from-medical-blue to-medical-green border-2 border-white shadow-lg overflow-hidden flex items-center justify-center text-white font-black text-sm group-hover:scale-105 group-hover:shadow-medical-blue/20 transition-all">
                                {userProfile?.avatar_url ? (
                                    <img src={userProfile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    firstName?.[0] || 'U'
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content scrollable */}
                <div className="flex-1 overflow-y-auto px-6 lg:px-10 py-10">
                    <Routes>
                        <Route path="/" element={<DashboardHome />} />
                        <Route path="/hospitals" element={<HospitalList />} />
                        <Route path="/hospitals/:id" element={<HospitalDetail />} />
                        <Route path="/appointments" element={<Appointments />} />
                        <Route path="/ai-assistant" element={<AIAssistant />} />
                        <Route path="/documents" element={<Documents />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/user/:uniqueId" element={<PublicProfile />} />
                    </Routes>
                </div>

                {/* Bottom Navigation (Mobile) */}
                <nav className="lg:hidden h-20 bg-white border-t border-slate-100 px-4 flex items-center justify-around flex-shrink-0 z-40">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => navigate(item.path)}
                            className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${currentTab === item.id ? 'text-medical-blue' : 'text-slate-400'
                                }`}
                        >
                            <item.icon size={22} className={currentTab === item.id ? 'scale-110' : ''} />
                            <span className="text-[9px] font-black uppercase tracking-tight">{item.label}</span>
                        </button>
                    ))}
                </nav>
            </main>
        </div>
    );
};

export default Dashboard;
