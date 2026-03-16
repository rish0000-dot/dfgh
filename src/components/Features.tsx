
import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { MapPin, Search, Hospital, Stethoscope, Brain } from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 40 }, show: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.12 } } };

function FadeUp({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) {
    return (
        <motion.div variants={fadeUp} transition={{ duration: 0.6, delay }}>
            {children}
        </motion.div>
    );
}

const features = [
    {
        icon: <MapPin size={28} />, title: "Smart Location Detection",
        desc: "We automatically detect your location and show nearby hospitals within seconds.",
        color: "from-medical-blue to-medical-accent",
    },
    {
        icon: <Search size={28} />, title: "Condition-Based Search",
        desc: "Search by symptom or condition — X-ray, MRI, Blood Test, Cardiac Care & more.",
        color: "from-medical-green to-medical-accent",
    },
    {
        icon: <span className="text-xl font-black text-white">$</span>, title: "Transparent Pricing",
        desc: "See exact prices for every service upfront. No hidden fees, ever. Guaranteed.",
        color: "from-medical-green to-medical-blue",
    },
    {
        icon: <Hospital size={28} />, title: "Verified Hospital Profiles",
        desc: "View detailed hospital info, facilities, ratings, and available departments.",
        color: "from-medical-blue to-medical-green",
    },
    {
        icon: <Stethoscope size={28} />, title: "Doctor Directory & Booking",
        desc: "Browse doctor profiles and specialties, then book instant appointments.",
        color: "from-medical-accent to-medical-blue",
    },
    {
        icon: <Brain size={28} />, title: "AI Health Assistant",
        desc: "Our AI analyzes your symptoms and recommends the right hospital & service.",
        color: "from-medical-accent to-medical-green",
    },
];

export default function Features() {
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
                    <FadeUp><span className="text-medical-blue font-semibold text-sm uppercase tracking-widest">Key Features</span></FadeUp>
                    <FadeUp delay={0.1}>
                        <h2 className="text-4xl font-bold text-slate-900 mt-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                            Everything You Need in One Platform
                        </h2>
                    </FadeUp>
                    <FadeUp delay={0.2}>
                        <p className="text-lg text-slate-500 mt-4 max-w-xl mx-auto leading-relaxed">
                            Powerful features designed around your real healthcare needs.
                        </p>
                    </FadeUp>
                </div>

                <motion.div
                    variants={stagger}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {features.map((f, i) => (
                        <motion.div
                            key={f.title}
                            variants={fadeUp}
                            transition={{ delay: i * 0.1 }}
                            whileHover={{ scale: 1.04, translateY: -4 }}
                            className="bg-white rounded-2xl shadow-xl p-7 flex flex-col gap-4 border border-slate-100 cursor-default group transition-shadow hover:shadow-2xl"
                        >
                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center text-white shadow-lg group-hover:rotate-6 transition-transform`}>
                                {f.icon}
                            </div>
                            <h3 className="text-lg font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                {f.title}
                            </h3>
                            <p className="text-slate-500 leading-relaxed text-sm">{f.desc}</p>
                            <div className={`h-1 w-8 rounded-full bg-gradient-to-r ${f.color} group-hover:w-16 transition-all duration-300`} />
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </motion.section>
    );
}
