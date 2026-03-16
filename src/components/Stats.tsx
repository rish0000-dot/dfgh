
import React from 'react';
import { motion } from 'framer-motion';
import { Hospital, Stethoscope, Heart, Star } from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 40 }, show: { opacity: 1, y: 0 } };

const stats = [
    { value: "500+", label: "Verified Hospitals", icon: <Hospital size={24} /> },
    { value: "10,000+", label: "Doctors Listed", icon: <Stethoscope size={24} /> },
    { value: "50,000+", label: "Happy Patients", icon: <Heart size={24} /> },
    { value: "4.9⭐", label: "App Rating", icon: <Star size={24} /> },
];

export default function Stats() {
    return (
        <motion.section
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="py-24 bg-gradient-to-r from-medical-blue to-medical-green"
        >
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                    {stats.map((s, i) => (
                        <motion.div
                            key={s.label}
                            variants={fadeUp}
                            transition={{ delay: i * 0.1 }}
                            className="text-center flex flex-col items-center gap-3"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white">
                                {s.icon}
                            </div>
                            <div className="text-4xl font-bold text-white uppercase italic" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                {s.value}
                            </div>
                            <div className="text-white/80 font-medium text-sm">{s.label}</div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.section>
    );
}
