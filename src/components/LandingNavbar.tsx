
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cross, Menu, X } from "lucide-react";

export default function LandingNavbar({ onLogin, onSignUp }: { onLogin: () => void, onSignUp: () => void }) {
    const [open, setOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const h = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", h);
        return () => window.removeEventListener("scroll", h);
    }, []);

    return (
        <motion.nav
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-md shadow-md" : "bg-transparent"
                }`}
        >
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                {/* Logo */}
                <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-medical-blue to-medical-green flex items-center justify-center">
                        <Cross size={18} className="text-white" strokeWidth={3} />
                    </div>
                    <span className="text-xl font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        Healthcare<span className="text-medical-blue"> Hub</span>
                    </span>
                </div>

                {/* Desktop Links */}
                <div className="hidden md:flex items-center gap-8">
                    {["Home", "Services", "About", "Contact"].map(l => (
                        <a key={l} href="#" className="text-slate-600 hover:text-medical-blue font-medium transition-colors text-sm">
                            {l}
                        </a>
                    ))}
                </div>

                {/* Auth Buttons */}
                <div className="hidden md:flex items-center gap-3">
                    <button onClick={onLogin} className="px-5 py-2 rounded-full border-2 border-medical-blue text-medical-blue font-semibold text-sm hover:bg-medical-bg transition-all">
                        Login
                    </button>
                    <button onClick={onSignUp} className="px-5 py-2 rounded-full bg-gradient-to-r from-medical-blue to-medical-green text-white font-semibold text-sm shadow-lg shadow-medical-blue/20 hover:shadow-medical-blue/30 hover:scale-105 transition-all">
                        Sign Up
                    </button>
                </div>

                {/* Mobile Toggle */}
                <button className="md:hidden text-slate-700" onClick={() => setOpen(!open)}>
                    {open ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="md:hidden bg-white border-t border-slate-100 px-6 py-4 flex flex-col gap-4"
                    >
                        {["Home", "Services", "About", "Contact"].map(l => (
                            <a key={l} href="#" className="text-slate-700 font-medium">{l}</a>
                        ))}
                        <div className="flex gap-3 pt-2">
                            <button onClick={() => { setOpen(false); onLogin(); }} className="flex-1 py-2 rounded-full border-2 border-medical-blue text-medical-blue font-semibold text-sm">Login</button>
                            <button onClick={() => { setOpen(false); onSignUp(); }} className="flex-1 py-2 rounded-full bg-gradient-to-r from-medical-blue to-medical-green text-white font-semibold text-sm">Sign Up</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    );
}
