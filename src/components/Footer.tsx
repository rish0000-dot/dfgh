
import React from 'react';
import { Stethoscope, Twitter, Instagram, Linkedin, Github } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-slate-950 text-white pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
                    {/* Brand */}
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-medical-blue to-teal-500 flex items-center justify-center">
                                <Stethoscope size={18} className="text-white" strokeWidth={3} />
                            </div>
                            <span className="text-xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                <span className="text-2xl font-black tracking-tighter text-medical-blue">HealthConnect</span>
                            </span>
                        </div>
                        <p className="mt-4 text-slate-500 leading-relaxed font-medium">
                            Revolutionizing healthcare access with AI-powered diagnostics and instant specialist booking.
                        </p>
                        <div className="mt-8 flex gap-4">
                            {[Twitter, Instagram, Linkedin, Github].map((Icon, i) => (
                                <a key={i} href="#" className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-medical-blue hover:text-white transition-all shadow-sm">
                                    <Icon size={18} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="font-bold text-sm uppercase tracking-wider text-slate-400 mb-4">Company</h4>
                        <ul className="space-y-3">
                            {["About Us", "Services", "Doctors", "Privacy Policy"].map(l => (
                                <li key={l}><a href="#" className="text-slate-400 hover:text-white text-sm transition-colors">{l}</a></li>
                            ))}
                        </ul>
                    </div>

                    {/* Services */}
                    <div>
                        <h4 className="font-bold text-sm uppercase tracking-wider text-slate-400 mb-4">Services</h4>
                        <ul className="space-y-3">
                            {["Find Hospitals", "Book Appointments", "AI Assistant", "Price Comparison"].map(l => (
                                <li key={l}><a href="#" className="text-slate-400 hover:text-white text-sm transition-colors">{l}</a></li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="font-bold text-sm uppercase tracking-wider text-slate-400 mb-4">Contact</h4>
                        <div className="flex gap-2">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="bg-white border-2 border-slate-100 rounded-xl px-4 py-2 text-sm focus:border-medical-blue focus:outline-none transition-all w-full font-medium"
                            />
                            <button className="bg-medical-blue text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-medical-blue/80 transition-all shadow-lg shadow-medical-blue/20">
                                Subscribe
                            </button>
                        </div>
                    </div>
                </div>

                <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-slate-500 text-sm">© 2025 Healthcare Hub. All rights reserved.</p>
                    <p className="text-slate-600 text-xs">Built with ❤️ for better healthcare</p>
                </div>
            </div>
        </footer>
    );
}
