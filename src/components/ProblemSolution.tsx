
import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 40 }, show: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.12 } } };

function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) {
    return (
        <motion.div variants={fadeUp} transition={{ duration: 0.6, delay }} className={className}>
            {children}
        </motion.div>
    );
}

export default function ProblemSolution() {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: "-80px" });

    const problems = [
        "Endless Google searches with no clear answers",
        "Hidden costs & surprise bills at every step",
        "Long waiting times with no updates",
    ];
    const solutions = [
        "Smart location-based hospital discovery",
        "Transparent upfront pricing — always",
        "Instant appointment booking in seconds",
    ];

    return (
        <motion.section
            ref={ref}
            variants={stagger}
            initial="hidden"
            animate={inView ? "show" : "hidden"}
            className="py-32 bg-medical-bg"
        >
            <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
                {/* Left */}
                <FadeUp>
                    <div className="relative">
                        <div className="w-full aspect-square max-w-md mx-auto bg-white rounded-3xl flex items-center justify-center border border-slate-200 shadow-xl">
                            <div className="text-center p-8">
                                <div className="text-8xl mb-4">😕</div>
                                <p className="text-slate-600 font-medium">Every patient has been here before...</p>
                                <div className="mt-6 space-y-2">
                                    {problems.map(p => (
                                        <div key={p} className="flex items-start gap-2 text-left">
                                            <span className="text-red-400 font-bold text-lg leading-tight">✕</span>
                                            <span className="text-sm text-slate-600">{p}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </FadeUp>

                {/* Right */}
                <div className="flex flex-col gap-6">
                    <FadeUp>
                        <span className="text-medical-green font-semibold text-sm uppercase tracking-widest">The Solution</span>
                    </FadeUp>
                    <FadeUp delay={0.1}>
                        <h2 className="text-4xl font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                            Stop Searching.{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-medical-green to-medical-blue">
                                Start Healing.
                            </span>
                        </h2>
                    </FadeUp>
                    <FadeUp delay={0.15}>
                        <p className="text-lg text-slate-600 leading-relaxed">
                            HealthConnect transforms the chaotic healthcare search experience into one seamless, intelligent journey.
                        </p>
                    </FadeUp>

                    <motion.div variants={stagger} className="flex flex-col gap-4">
                        {solutions.map((s, i) => (
                            <motion.div
                                key={s}
                                variants={fadeUp}
                                transition={{ delay: 0.2 + i * 0.1 }}
                                className="flex items-start gap-4 p-4 bg-white rounded-2xl border border-medical-green/20 hover:shadow-md transition-shadow"
                            >
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-medical-green to-medical-blue flex items-center justify-center flex-shrink-0 shadow">
                                    <CheckCircle size={16} className="text-white" />
                                </div>
                                <span className="text-slate-700 font-medium leading-relaxed">{s}</span>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </motion.section>
    );
}
