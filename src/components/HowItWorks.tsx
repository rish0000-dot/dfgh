
import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { MapPin, Search, CalendarCheck } from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 40 }, show: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.12 } } };

function FadeUp({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) {
    return (
        <motion.div variants={fadeUp} transition={{ duration: 0.6, delay }}>
            {children}
        </motion.div>
    );
}

const steps = [
    { icon: <MapPin size={32} />, title: "Enable Location", desc: "Allow location access so we can find hospitals nearest to you instantly.", num: "01" },
    { icon: <Search size={32} />, title: "Search Your Need", desc: "Enter a symptom, test, or specialty to discover matching services.", num: "02" },
    { icon: <CalendarCheck size={32} />, title: "Book & Heal", desc: "Choose your preferred hospital or doctor and confirm your booking in one tap.", num: "03" },
];

export default function HowItWorks() {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: "-80px" });

    return (
        <motion.section
            ref={ref}
            variants={stagger}
            initial="hidden"
            animate={inView ? "show" : "hidden"}
            className="py-32 bg-white"
        >
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <FadeUp><span className="text-medical-blue font-semibold text-sm uppercase tracking-widest">Process</span></FadeUp>
                    <FadeUp delay={0.1}>
                        <h2 className="text-4xl font-bold text-slate-900 mt-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                            How It Works in 3 Simple Steps
                        </h2>
                    </FadeUp>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                    <div className="hidden md:block absolute top-12 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-medical-blue/30 via-medical-green/30 to-medical-blue/30" style={{ width: "50%", left: "25%" }} />

                    {steps.map((s, i) => (
                        <FadeUp key={s.title} delay={i * 0.15}>
                            <div className="relative flex flex-col items-center text-center gap-4 p-8">
                                <div className="relative">
                                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-medical-blue to-medical-green flex items-center justify-center text-white shadow-xl shadow-medical-blue/20 rotate-3 hover:rotate-0 transition-transform duration-300">
                                        {s.icon}
                                    </div>
                                    <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                                        {s.num}
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s.title}</h3>
                                <p className="text-slate-500 leading-relaxed text-sm">{s.desc}</p>
                            </div>
                        </FadeUp>
                    ))}
                </div>
            </div>
        </motion.section>
    );
}
