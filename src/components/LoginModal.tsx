
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Shield, Cross, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from '@react-oauth/google';
import { supabase } from '../lib/supabase';


export default function LoginModal({ initialTab, onClose }: { initialTab: "login" | "signup", onClose: () => void }) {
    const [tab, setTab] = useState(initialTab);
    const [show, setShow] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [agreed, setAgreed] = useState(false);
    const navigate = useNavigate();

    // Signup fields
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleClose = () => {
        setShow(false);
        setTimeout(onClose, 300);
    };

    useEffect(() => {
        setShow(true);
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = ""; };
    }, []);

    useEffect(() => {
        setShowPassword(false);
        setAgreed(false);
    }, [tab]);

    const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        if (!agreed) {
            setError("You must agree to the Terms of Service and Privacy Policy.");
            setLoading(false);
            return;
        }

        if (!validateEmail(email)) {
            setError("Please enter a valid email address.");
            setLoading(false);
            return;
        }

        try {
            if (tab === "login") {
                const { data, error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (signInError) throw signInError;

                if (data.session) {
                    localStorage.setItem('token', data.session.access_token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    navigate('/dashboard');
                    handleClose();
                } else {
                    setError("Session could not be established. Please try again.");
                }
            } else {
                const { data, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            first_name: firstName,
                            last_name: lastName,
                        }
                    }
                });
                if (signUpError) throw signUpError;

                if (data.session) {
                    // Immediate login successful
                    localStorage.setItem('token', data.session.access_token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    navigate('/dashboard');
                    handleClose();
                } else {
                    // Email confirmation likely required
                    setError("Account created! Please check your email to confirm your account before logging in.");
                    // Optional: Switch to login tab after a delay or just stay here
                }
            }
        } catch (err: any) {
            setError(err.message || err.response?.data?.message || "Internal server error");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (response: any) => {
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithIdToken({
                provider: 'google',
                token: response.credential,
            });

            if (error) throw error;

            if (data?.session) {
                localStorage.setItem('token', data.session.access_token);
                localStorage.setItem('user', JSON.stringify(data.user));
                navigate('/dashboard');
                handleClose();
            }
        } catch (err: any) {
            setError(err.message || "Google Authentication Failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    key="overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                    style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(15,23,42,0.55)" }}
                    onClick={handleClose}
                >
                    <motion.div
                        key="modal"
                        initial={{ opacity: 0, scale: 0.88, y: 40 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.88, y: 40 }}
                        transition={{ type: "spring", stiffness: 320, damping: 28 }}
                        onClick={e => e.stopPropagation()}
                        className="relative w-full max-w-md"
                    >
                        {/* Glow */}
                        <div className="absolute -inset-1 bg-gradient-to-br from-medical-blue via-medical-green to-medical-accent rounded-3xl blur-xl opacity-30" />

                        <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden">
                            {/* Top gradient bar */}
                            <div className="h-1.5 w-full bg-gradient-to-r from-medical-blue via-medical-green to-medical-accent" />

                            {/* Header */}
                            <div className="px-8 pt-8 pb-6 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-medical-blue to-medical-green flex items-center justify-center">
                                        <Cross size={14} className="text-white" strokeWidth={3} />
                                    </div>
                                    <span className="font-bold text-slate-900">Healthcare <span className="text-medical-blue">Hub</span></span>
                                </div>
                                <button
                                    onClick={handleClose}
                                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                                >
                                    <X size={16} className="text-slate-500" />
                                </button>
                            </div>

                            {error && (
                                <div className="px-8 mb-2">
                                    <div className="bg-red-50 text-red-500 text-xs font-bold p-3 rounded-xl border border-red-100 flex items-center gap-2">
                                        <Shield size={14} /> {error}
                                    </div>
                                </div>
                            )}

                            {/* Tab switcher */}
                            <div className="px-8">
                                <div className="flex bg-slate-100 rounded-2xl p-1">
                                    {["login", "signup"].map(t => (
                                        <button
                                            key={t}
                                            onClick={() => setTab(t as "login" | "signup")}
                                            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 capitalize ${tab === t
                                                ? "bg-white text-slate-900 shadow-md"
                                                : "text-slate-500 hover:text-slate-700"
                                                }`}
                                        >
                                            {t === "login" ? "Login" : "Sign Up"}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Form */}
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={tab}
                                    initial={{ opacity: 0, x: tab === "login" ? -20 : 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: tab === "login" ? 20 : -20 }}
                                    transition={{ duration: 0.22 }}
                                    className="px-8 pt-6 pb-8 flex flex-col gap-4"
                                >
                                    {tab === "login" ? (
                                        <>
                                            <div className="text-center mb-2">
                                                <h2 className="text-2xl font-bold text-slate-900">Welcome back 👋</h2>
                                                <p className="text-slate-500 text-sm mt-1">Sign in to your account</p>
                                            </div>

                                            {/* Secure Google login */}
                                            <div className="flex justify-center w-full">
                                                <GoogleLogin
                                                    onSuccess={handleGoogleSuccess}
                                                    onError={() => setError("Google Login Failed")}
                                                    theme="outline"
                                                    shape="pill"
                                                    width="100%"
                                                />
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-px bg-slate-200" />
                                                <span className="text-slate-400 text-xs font-medium">or</span>
                                                <div className="flex-1 h-px bg-slate-200" />
                                            </div>

                                            <div className="flex flex-col gap-1">
                                                <label className="text-xs font-semibold text-slate-600 ml-1">Email Address</label>
                                                <div className="relative">
                                                    <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                    <input
                                                        type="email"
                                                        placeholder="you@example.com"
                                                        value={email}
                                                        onChange={e => setEmail(e.target.value)}
                                                        autoComplete="off"
                                                        className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-medical-blue focus:outline-none text-sm transition-colors bg-slate-50 focus:bg-white"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-1">
                                                <label className="text-xs font-semibold text-slate-600 ml-1">Password</label>
                                                <div className="relative">
                                                    <Shield size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                    <input
                                                        type={showPassword ? "text" : "password"}
                                                        placeholder="••••••••"
                                                        value={password}
                                                        onChange={e => setPassword(e.target.value)}
                                                        autoComplete="new-password"
                                                        className="w-full pl-10 pr-12 py-3 rounded-2xl border-2 border-slate-200 focus:border-medical-blue focus:outline-none text-sm transition-colors bg-slate-50 focus:bg-white"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-medical-blue transition-colors"
                                                    >
                                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="flex flex-col gap-2">
                                                    <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer">
                                                        <input type="checkbox" className="rounded" />
                                                        Remember me
                                                    </label>
                                                    <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            className="rounded"
                                                            checked={agreed}
                                                            onChange={e => setAgreed(e.target.checked)}
                                                        />
                                                        I agree to the <a href="#" className="text-medical-blue font-semibold">Terms</a>
                                                    </label>
                                                </div>
                                                <a href="#" className="text-xs text-medical-blue font-semibold hover:text-medical-blue/80">Forgot password?</a>
                                            </div>

                                            <button
                                                onClick={handleSubmit}
                                                disabled={loading}
                                                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-medical-blue to-medical-green text-white font-bold text-sm shadow-lg shadow-medical-blue/20 hover:shadow-medical-blue/30 hover:scale-[1.02] transition-all disabled:opacity-50"
                                            >
                                                {loading ? 'Processing...' : 'Login to Healthcare Hub'}
                                            </button>

                                            <p className="text-center text-xs text-slate-500">
                                                Don't have an account?{" "}
                                                <button onClick={() => setTab("signup")} className="text-medical-blue font-semibold hover:text-medical-blue/80">Sign up free</button>
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <div className="text-center mb-2">
                                                <h2 className="text-2xl font-bold text-slate-900">Join Healthcare Hub 🏥</h2>
                                                <p className="text-slate-500 text-sm mt-1">Create your free account today</p>
                                            </div>

                                            {/* Secure Google signup */}
                                            <div className="flex justify-center w-full">
                                                <GoogleLogin
                                                    onSuccess={handleGoogleSuccess}
                                                    onError={() => setError("Google Signup Failed")}
                                                    theme="outline"
                                                    shape="pill"
                                                    width="100%"
                                                />
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-px bg-slate-200" />
                                                <span className="text-slate-400 text-xs font-medium">or</span>
                                                <div className="flex-1 h-px bg-slate-200" />
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-xs font-semibold text-slate-600 ml-1">First Name</label>
                                                    <input type="text" placeholder="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-medical-blue focus:outline-none text-sm bg-slate-50 focus:bg-white transition-colors" />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-xs font-semibold text-slate-600 ml-1">Last Name</label>
                                                    <input type="text" placeholder="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-medical-blue focus:outline-none text-sm bg-slate-50 focus:bg-white transition-colors" />
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-1">
                                                <label className="text-xs font-semibold text-slate-600 ml-1">Email Address</label>
                                                <div className="relative">
                                                    <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                    <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="off" className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-medical-blue focus:outline-none text-sm bg-slate-50 focus:bg-white transition-colors" />
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-1">
                                                <label className="text-xs font-semibold text-slate-600 ml-1">Password</label>
                                                <div className="relative">
                                                    <Shield size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                    <input
                                                        type={showPassword ? "text" : "password"}
                                                        placeholder="Min. 6 characters"
                                                        value={password}
                                                        onChange={e => setPassword(e.target.value)}
                                                        autoComplete="new-password"
                                                        className="w-full pl-10 pr-12 py-3 rounded-2xl border-2 border-slate-200 focus:border-medical-blue focus:outline-none text-sm bg-slate-50 focus:bg-white transition-colors"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-medical-blue transition-colors"
                                                    >
                                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                    </button>
                                                </div>
                                            </div>

                                            <label className="flex items-start gap-2 text-xs text-slate-500 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="rounded mt-0.5 flex-shrink-0"
                                                    checked={agreed}
                                                    onChange={e => setAgreed(e.target.checked)}
                                                />
                                                I agree to the <a href="#" className="text-medical-blue font-semibold">Terms of Service</a> and <a href="#" className="text-medical-blue font-semibold">Privacy Policy</a>
                                            </label>

                                            <button
                                                onClick={handleSubmit}
                                                disabled={loading}
                                                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-medical-blue to-medical-green text-white font-bold text-sm shadow-lg shadow-medical-blue/20 hover:shadow-medical-blue/30 hover:scale-[1.02] transition-all disabled:opacity-50"
                                            >
                                                {loading ? 'Processing...' : 'Create Free Account'}
                                            </button>

                                            <p className="text-center text-xs text-slate-500">
                                                Already have an account?{" "}
                                                <button onClick={() => setTab("login")} className="text-medical-blue font-semibold hover:text-medical-blue/80">Login</button>
                                            </p>
                                        </>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
