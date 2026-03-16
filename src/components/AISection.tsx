
import React from 'react';
import { motion } from 'framer-motion';
import { Brain, MessageCircle, ArrowRight, CheckCircle } from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 40 }, show: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.12 } } };

function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) {
    return (
        <motion.div variants={fadeUp} transition={{ duration: 0.6, delay }} className={className}>
            {children}
        </motion.div>
    );
}

const chatMessages = [
    { from: "user", text: "I have chest pain and shortness of breath." },
    { from: "bot", text: "I understand. Based on your symptoms, I recommend visiting a Cardiologist. I found 3 verified cardiac centers near you." },
    { from: "user", text: "Which one has the shortest wait time?" },
    { from: "bot", text: "City Heart Hospital (0.8 km) has a wait time of only 15 mins today. Shall I book?" },
];

export default function AISection() {
    return (
        <motion.section
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="py-32 bg-medical-bg overflow-hidden"
        >
            <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
                {/* Chat Mockup */}
                <FadeUp>
                    <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-w-md mx-auto">
                        <div className="bg-gradient-to-r from-medical-blue to-medical-accent p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                <Brain size={20} className="text-white" />
                            </div>
                            <div>
                                <p className="text-white font-bold text-sm">Healthcare Hub AI</p>
                                <p className="text-white/80 text-xs">Online • Ready to help</p>
                            </div>
                            <div className="ml-auto w-2 h-2 rounded-full bg-medical-green animate-pulse" />
                        </div>
                        <div className="p-4 space-y-3 min-h-[280px] bg-gradient-to-b from-slate-50 to-white">
                            {chatMessages.map((m, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: m.from === "user" ? 30 : -30 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.4 }}
                                    viewport={{ once: true }}
                                    className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}
                                >
                                    <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${m.from === "user"
                                            ? "bg-gradient-to-br from-medical-blue to-medical-accent text-white rounded-br-sm"
                                            : "bg-white border border-slate-200 text-slate-700 rounded-bl-sm shadow-sm"
                                        }`}>
                                        {m.text}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                        <div className="p-4 border-t border-slate-100">
                            <div className="flex items-center gap-2 bg-slate-100 rounded-full px-4 py-2">
                                <span className="text-slate-400 text-sm flex-1">Describe your symptoms...</span>
                                <button className="w-8 h-8 rounded-full bg-medical-blue flex items-center justify-center">
                                    <ArrowRight size={14} className="text-white" />
                                </button>
                            </div>
                        </div>
                    </div>
                </FadeUp>

                {/* Text */}
                <div className="flex flex-col gap-6">
                    <FadeUp>
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-medical-blue/10 text-medical-blue text-sm font-semibold w-fit">
                            <Brain size={14} /> AI-Powered
                        </span>
                    </FadeUp>
                    <FadeUp delay={0.1}>
                        <h2 className="text-4xl font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                            Meet Your{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-medical-blue to-medical-green">
                                AI Health Companion
                            </span>
                        </h2>
                    </FadeUp>
                    <FadeUp delay={0.2}>
                        <p className="text-lg text-slate-600 leading-relaxed">
                            Not sure what you need? Describe your symptoms to our AI and get instant recommendations for hospitals, tests, and specialists — available 24/7.
                        </p>
                    </FadeUp>
                    <FadeUp delay={0.3}>
                        <ul className="space-y-3">
                            {[
                                "Instant symptom analysis",
                                "Personalized hospital recommendations",
                                "Real-time availability & pricing",
                                "Secure & confidential conversations",
                            ].map(item => (
                                <li key={item} className="flex items-center gap-3 text-slate-700 font-medium">
                                    <div className="w-5 h-5 rounded-full bg-medical-blue/10 flex items-center justify-center">
                                        <CheckCircle size={12} className="text-medical-blue" />
                                    </div>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </FadeUp>
                    <FadeUp delay={0.4}>
                        <button className="w-fit flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-medical-blue to-medical-green text-white font-semibold shadow-xl shadow-medical-blue/20 hover:shadow-medical-blue/30 hover:scale-[1.02] transition-all">
                            <MessageCircle size={18} />
                            Try AI Assistant
                        </button>
                    </FadeUp>
                </div>
            </div>
        </motion.section>
    );
}
