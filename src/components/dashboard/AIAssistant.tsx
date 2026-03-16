import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, User, Bot, Sparkles, ChevronRight, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { HOSPITALS } from "../../lib/mockData";


interface Message {
    id: number;
    role: "user" | "bot";
    text: string;
    timestamp: string;
    recommendations?: any[];
    options?: string[];
}

const AIAssistant = () => {
    const navigate = useNavigate();

    // Initialize OpenAI API
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

    const [messages, setMessages] = useState<Message[]>([
        {
            id: 1,
            role: "bot",
            text: "Hello! I am your AI Health Assistant. How are you feeling today?",
            timestamp: "09:00 AM",
        },
    ]);

    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const suggestions = [
        "Chest pain",
        "Severe headache",
        "Fever & Chills",
        "Dental issue",
        "Eye problem",
        "Bone fracture",
    ];

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (text: string) => {
        if (!text.trim() || isLoading) return;

        const userMsg: Message = {
            id: Date.now(),
            role: "user",
            text,
            timestamp: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            }),
        };

        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);

        try {
            if (!apiKey) {
                throw new Error("OpenAI API key is not configured. Please check your .env file.");
            }

            const systemInstruction = `You are an AI Health Assistant for a healthcare website. Your role:
• Ask exactly ONE follow-up question at a time to understand the patient's symptoms.
• For every question, provide 3-4 clickable options for the user in brackets at the end of your response, like this: [OPTIONS: Option A, Option B, Option C].
• If the patient's condition is mild, eventually provide simple health advice and OTC medicine suggestions.
• If symptoms are severe (high fever, chest pain, breathing issues), advise immediate medical attention.
• DO NOT over-apologize. Keep answers short and direct.
• Only suggest hospitals/doctors list after you have enough info to determine the severity.
• Always include this disclaimer at the end: "This information is for general guidance only and is not a substitute for professional medical advice."`;

            // Prepare messages for DeepSeek (OpenAI format)
            const apiMessages = [
                { role: "system", content: systemInstruction },
                ...messages
                    .filter((m, index) => !(index === 0 && m.role === "bot"))
                    .map(m => ({
                        role: m.role === "user" ? "user" : "assistant",
                        content: m.text
                    })),
                { role: "user", content: text }
            ];

            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: apiMessages,
                    stream: false
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || "OpenAI API error");
            }

            const data = await response.json();
            const rawText = data.choices[0].message.content;

            // Extract options if present
            let botText = rawText;
            let options: string[] | undefined;
            const optionsMatch = rawText.match(/\[OPTIONS:\s*(.*?)\]/i);
            
            if (optionsMatch) {
                options = optionsMatch[1].split(",").map((s: string) => s.trim());
                botText = rawText.replace(/\[OPTIONS:.*?\]/i, "").trim();
            }

            let recommendations: any[] = [];
            const search = (text + botText).toLowerCase();

            // Only show recommendations if advice is being given (long enough response or specific keywords)
            if (botText.length > 100 || search.includes("consult") || search.includes("hospital") || search.includes("doctor")) {
                if (search.includes("chest") || search.includes("heart")) {
                    recommendations = HOSPITALS.filter((h) =>
                        h.services.includes("Cardiac Care")
                    ).slice(0, 2);
                } else if (search.includes("head") || search.includes("brain")) {
                    recommendations = HOSPITALS.filter((h) =>
                        h.services.includes("MRI Scan")
                    ).slice(0, 2);
                } else if (search.includes("fever")) {
                    recommendations = HOSPITALS.filter((h) =>
                        h.services.includes("Fever")
                    ).slice(0, 2);
                } else if (search.includes("dental") || search.includes("tooth")) {
                    recommendations = HOSPITALS.filter((h) =>
                        h.services.includes("Dental issue")
                    ).slice(0, 2);
                }
            }

            const botMsg: Message = {
                id: Date.now() + 1,
                role: "bot",
                text: botText,
                options,
                recommendations,
                timestamp: new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                }),
            };

            setMessages((prev) => [...prev, botMsg]);
        } catch (err: any) {
            console.error("Gemini API Error:", err);
            const botMsg: Message = {
                id: Date.now() + 1,
                role: "bot",
                text: `API Error: ${err.message || "AI server error. Please try again."}`,
                timestamp: new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                }),
            };

            setMessages((prev) => [...prev, botMsg]);
        }

        setIsLoading(false);
    };

    return (
        <div className="h-[calc(100vh-12rem)] flex flex-col bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden">

            <div className="px-10 py-8 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-sky-500/20 flex items-center justify-center text-sky-400">
                        <Sparkles size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black">AI Health Assistant</h2>
                    </div>
                </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-10 py-8 space-y-8">

                {messages.map((msg) => (
                    <motion.div
                        key={msg.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"
                            }`}
                    >
                        <div
                            className={`flex gap-4 max-w-[80%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"
                                }`}
                        >
                            <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center">
                                {msg.role === "user" ? <User size={18} /> : <Bot size={18} />}
                            </div>

                            <div>
                                <div
                                    className={`px-6 py-4 rounded-[2rem] text-sm font-bold ${msg.role === "user"
                                            ? "bg-sky-600 text-white"
                                            : "bg-slate-50 text-slate-700 border"
                                        }`}
                                >
                                    {msg.text}
                                </div>

                                {msg.options && (
                                    <div className="flex flex-wrap gap-2 mt-4">
                                        {msg.options.map((opt, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handleSend(opt)}
                                                className="px-4 py-2 rounded-xl bg-sky-50 text-sky-700 border border-sky-100 text-xs font-bold hover:bg-sky-100 transition-colors"
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {msg.recommendations &&
                                    msg.recommendations.map((h: any) => (
                                        <div
                                            key={h.id}
                                            className="mt-3 p-4 rounded-2xl border flex justify-between items-center"
                                        >
                                            <div>
                                                <p className="text-sm font-bold">{h.name}</p>
                                                <p className="text-xs text-slate-400">{h.address}</p>
                                            </div>

                                            <button
                                                onClick={() =>
                                                    navigate(`/dashboard/hospitals/${h.id}`)
                                                }
                                            >
                                                <ChevronRight size={18} />
                                            </button>
                                        </div>
                                    ))}

                                <span className="text-[10px] text-slate-400">
                                    {msg.timestamp}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                ))}

                {isLoading && (
                    <div className="flex items-center gap-2 text-sm">
                        <Loader2 className="animate-spin" size={16} />
                        AI analyzing symptoms...
                    </div>
                )}
            </div>

            <div className="p-8 border-t space-y-4">

                <div className="flex flex-wrap gap-2">
                    {suggestions.map((s) => (
                        <button
                            key={s}
                            onClick={() => handleSend(s)}
                            className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-bold"
                        >
                            {s}
                        </button>
                    ))}
                </div>

                <div className="relative flex items-center gap-4">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleSend(input);
                        }}
                        placeholder="Describe your symptoms..."
                        className="flex-1 pl-6 pr-16 py-5 rounded-[2rem] bg-slate-50 border"
                    />

                    <button
                        onClick={() => handleSend(input)}
                        className="absolute right-4 p-3 rounded-2xl bg-sky-600 text-white"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIAssistant;
