import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Phone, Camera, Save, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "../../lib/supabase";

interface EditProfileModalProps {
    onClose: () => void;
    currentProfile: any;
    onProfileUpdate: () => void;
}

export default function EditProfileModal({ onClose, currentProfile, onProfileUpdate }: EditProfileModalProps) {
    const [firstName, setFirstName] = useState(currentProfile?.first_name || "");
    const [lastName, setLastName] = useState(currentProfile?.last_name || "");
    const [username, setUsername] = useState(currentProfile?.username || "");
    const [phone, setPhone] = useState(currentProfile?.phone || "");
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string>(currentProfile?.avatar_url || "");
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [show, setShow] = useState(false);

    useEffect(() => {
        setShow(true);
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = ""; };
    }, []);

    const handleClose = () => {
        setShow(false);
        setTimeout(onClose, 300);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            
            // Validate file size (e.g., max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                setError("Image size must be less than 2MB.");
                return;
            }
            
            // Validate file type
            if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
                setError("Only JPG, PNG, and WebP images are allowed.");
                return;
            }

            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
            setError("");
        }
    };

    const validateForm = () => {
        if (!firstName.trim()) return "First name is required.";
        if (username && !/^[A-Za-z0-9_]+@[0-9]+$/.test(username)) {
            return "ID must format like 'username@123' (letters/numbers/underscores followed by @ and numbers only).";
        }
        if (phone && !/^\+?[0-9\s\-()]{7,20}$/.test(phone)) {
            return "Please enter a valid phone number.";
        }
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            setLoading(false);
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            let avatarUrl = currentProfile?.avatar_url;

            // Upload new avatar if selected
            if (avatarFile) {
                const fileExt = avatarFile.name.split('.').pop();
                const filePath = `${user.id}/avatar.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(filePath, avatarFile, { upsert: true });

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(filePath);

                avatarUrl = publicUrl;
            }

            // Update or Insert profile record (upsert handles legacy users without a profile row)
            const { error: updateError } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    first_name: firstName.trim(),
                    last_name: lastName.trim(),
                    username: username.trim().toLowerCase() || null,
                    phone: phone.trim() || null,
                    avatar_url: avatarUrl,
                });

            if (updateError) {
                if (updateError.code === '23505' && updateError.message.includes('profiles_username_lower_idx')) {
                    throw new Error("This username is already taken. Please choose another.");
                }
                throw updateError;
            }

            // Success
            onProfileUpdate();
            window.dispatchEvent(new Event('profile-updated'));
            handleClose();

        } catch (err: any) {
            console.error(err);
            setError(err.message || "An error occurred while updating your profile.");
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
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
                    style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(15,23,42,0.55)" }}
                    onClick={handleClose}
                >
                    <motion.div
                        key="modal"
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        onClick={e => e.stopPropagation()}
                        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden my-auto"
                    >
                        {/* Header bg */}
                        <div className="h-32 bg-gradient-to-r from-sky-400 to-teal-400 relative">
                            <button
                                onClick={handleClose}
                                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors text-white"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="px-8 pb-8">
                            {/* Avatar Upload */}
                            <div className="relative -mt-16 mb-8 flex flex-col items-center">
                                <div className="relative group">
                                    <div className="w-32 h-32 rounded-[2.5rem] bg-indigo-100 border-4 border-white shadow-xl flex items-center justify-center text-indigo-300 overflow-hidden bg-gradient-to-br from-sky-100 to-teal-100">
                                        {avatarPreview ? (
                                            <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-4xl font-black text-sky-500/50">
                                                {firstName[0]?.toUpperCase()}{lastName[0]?.toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute -bottom-2 -right-2 p-3 rounded-2xl bg-slate-900 text-white shadow-lg hover:scale-110 hover:bg-sky-500 transition-all"
                                    >
                                        <Camera size={18} />
                                    </button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleImageChange}
                                        accept="image/png, image/jpeg, image/webp"
                                        className="hidden"
                                    />
                                </div>
                            </div>

                            <div className="text-center mb-6">
                                <h2 className="text-2xl font-bold text-slate-900">Edit Profile</h2>
                                <p className="text-sm text-slate-500">Update your personal information</p>
                            </div>

                            {error && (
                                <div className="mb-6 bg-red-50 text-red-500 text-sm font-bold p-4 rounded-2xl border border-red-100 flex items-center gap-2">
                                    <AlertCircle size={18} className="shrink-0" /> {error}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">First Name</label>
                                        <div className="relative">
                                            <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="text"
                                                value={firstName}
                                                onChange={e => setFirstName(e.target.value)}
                                                className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-slate-100 focus:border-sky-400 focus:outline-none text-sm transition-colors bg-slate-50 focus:bg-white font-medium"
                                                placeholder="First name"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Last Name</label>
                                        <input
                                            type="text"
                                            value={lastName}
                                            onChange={e => setLastName(e.target.value)}
                                            className="w-full px-4 py-3 rounded-2xl border-2 border-slate-100 focus:border-sky-400 focus:outline-none text-sm transition-colors bg-slate-50 focus:bg-white font-medium"
                                            placeholder="Last name"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Unique ID</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={username}
                                            onChange={e => setUsername(e.target.value)}
                                            className="w-full px-4 py-3 rounded-2xl border-2 border-slate-100 focus:border-sky-400 focus:outline-none text-sm transition-colors bg-slate-50 focus:bg-white font-medium"
                                            placeholder="username@123"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Phone Number</label>
                                    <div className="relative">
                                        <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={e => setPhone(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-slate-100 focus:border-sky-400 focus:outline-none text-sm transition-colors bg-slate-50 focus:bg-white font-medium"
                                            placeholder="+1 (555) 000-0000"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-100 flex gap-3">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="flex-1 py-3.5 rounded-2xl border-2 border-slate-100 text-slate-500 font-bold text-sm hover:bg-slate-50 transition-colors"
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-[2] flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-slate-900 text-white font-bold text-sm hover:bg-sky-500 hover:shadow-lg hover:shadow-sky-500/25 transition-all disabled:opacity-50"
                                >
                                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                    {loading ? "Saving Changes..." : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
