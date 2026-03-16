
import { motion } from 'framer-motion';
import { Activity, ArrowRight, Play, Shield, CheckCircle, Zap } from 'lucide-react';
import doctorImg from '../assets/doctor_3d.png';

const fadeUp = { hidden: { opacity: 0, y: 40 }, show: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.12 } } };

function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) {
    return (
        <motion.div variants={fadeUp} transition={{ duration: 0.6, delay }} className={className}>
            {children}
        </motion.div>
    );
}

export default function Hero({ onSignUp }: { onSignUp: () => void }) {
    return (
        <section className="relative min-h-screen bg-medical-bg overflow-hidden flex items-center pt-20">
            {/* BG decoration */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-medical-blue/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-medical-green/5 rounded-full translate-y-1/3 -translate-x-1/4 blur-3xl" />
            <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-medical-accent/5 rounded-full blur-2xl" />

            <div className="relative max-w-7xl mx-auto px-6 py-24 grid lg:grid-cols-2 gap-16 items-center">
                {/* Left */}
                <motion.div
                    initial="hidden" animate="show" variants={stagger}
                    className="flex flex-col gap-6"
                >
                    <FadeUp>
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-medical-blue/10 text-medical-blue text-sm font-semibold w-fit">
                            <Activity size={14} className="animate-pulse" />
                            Trusted by 50,000+ patients
                        </span>
                    </FadeUp>

                    <FadeUp delay={0.1}>
                        <h1 className="text-5xl lg:text-6xl font-bold text-slate-900 leading-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                            Your Health,{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-medical-blue to-medical-green">
                                One Click
                            </span>{" "}
                            Away
                        </h1>
                    </FadeUp>

                    <FadeUp delay={0.2}>
                        <p className="text-lg text-slate-600 leading-relaxed max-w-lg">
                            Discover trusted hospitals near you, compare diagnostic prices, and book appointments with top doctors — all in seconds.
                        </p>
                    </FadeUp>

                    <FadeUp delay={0.3} className="flex flex-wrap gap-4">
                        <button onClick={onSignUp} className="group flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-medical-blue to-medical-green text-white font-semibold shadow-xl shadow-medical-blue/20 hover:shadow-medical-blue/30 hover:scale-105 transition-all">
                            Get Started
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button className="flex items-center gap-2 px-8 py-4 rounded-full bg-white border-2 border-slate-200 text-slate-700 font-semibold hover:border-medical-blue hover:shadow-md transition-all">
                            <div className="w-8 h-8 rounded-full bg-medical-blue flex items-center justify-center">
                                <Play size={12} className="text-white ml-0.5" fill="white" />
                            </div>
                            How It Works
                        </button>
                    </FadeUp>

                    <FadeUp delay={0.4}>
                        <div className="flex flex-wrap gap-4 pt-2">
                            {[
                                { icon: <Shield size={14} />, label: "Secure Platform" },
                                { icon: <CheckCircle size={14} />, label: "Verified Hospitals" },
                                { icon: <Zap size={14} />, label: "Instant Booking" },
                            ].map(b => (
                                <span key={b.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 text-xs font-semibold shadow-sm">
                                    <span className="text-medical-green">{b.icon}</span>
                                    {b.label}
                                </span>
                            ))}
                        </div>
                    </FadeUp>
                </motion.div>

                {/* Right – illustrated mockup */}
                <motion.div
                    initial={{ opacity: 0, x: 60, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                    className="relative flex justify-center items-center"
                >
                    <div className="relative w-full max-w-2xl aspect-square flex items-center justify-center">
                        {/* 3D Doctor Image */}
                        <motion.img
                            src={doctorImg}
                            alt="3D Doctor"
                            className="w-full h-auto object-contain z-10 mix-blend-multiply"
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                        />

                        {/* Decorative back glow */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4/5 h-4/5 bg-sky-400/20 rounded-full blur-3xl -z-10" />
                    </div>

                    {/* Floating badges */}
                    {[
                        { label: "AI Powered", color: "bg-medical-accent", pos: "left-0 top-1/4" },
                        { label: "Instant Booking", color: "bg-medical-green", pos: "right-0 top-1/3" },
                        { label: "500+ Hospitals", color: "bg-medical-blue", pos: "left-4 bottom-1/4" },
                    ].map(b => (
                        <motion.div
                            key={b.label}
                            animate={{ y: [0, -8, 0] }}
                            transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, ease: "easeInOut" }}
                            className={`absolute ${b.pos} ${b.color} text-white text-xs font-bold px-3 py-2 rounded-full shadow-lg z-10`}
                        >
                            {b.label}
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
