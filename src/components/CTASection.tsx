
import { motion } from 'framer-motion';

const fadeUp = { hidden: { opacity: 0, y: 40 }, show: { opacity: 1, y: 0 } };

export default function CTASection({ onSignUp }: { onSignUp: () => void }) {
    return (
        <motion.section
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="py-32 bg-white"
        >
            <div className="max-w-4xl mx-auto px-6 text-center">
                <motion.div variants={fadeUp}>
                    <div className="bg-gradient-to-br from-medical-blue to-medical-green rounded-3xl p-16 shadow-2xl shadow-medical-blue/20 relative overflow-hidden">
                        <div className="absolute inset-0 bg-white/5 [mask-image:radial-gradient(ellipse_at_center,transparent_40%,black)]" />
                        <div className="relative">
                            <h2 className="text-4xl font-bold text-white mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                Ready to Take Control of Your Health?
                            </h2>
                            <p className="text-white/90 text-lg mb-8 leading-relaxed">
                                Join 50,000+ patients who found better healthcare, faster.
                            </p>
                            <div className="flex flex-wrap gap-4 justify-center">
                                <button onClick={onSignUp} className="px-8 py-4 rounded-full bg-white text-medical-blue font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all">
                                    Get Started Free
                                </button>
                                <button className="px-8 py-4 rounded-full bg-white/20 text-white font-bold border-2 border-white/40 hover:bg-white/30 transition-all">
                                    Download App
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </motion.section>
    );
}
