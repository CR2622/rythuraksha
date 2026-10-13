/**
 * Agent 3: Telugu Farmer AI Assistant (TeluguAssistant.tsx)
 * Priority 7: Telugu & English text chat, case grounding, speech-to-text, TTS voice playback, and fallback.
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  MessageSquare,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  X,
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { askTeluguAssistant } from '../services/api';

interface TeluguAssistantProps {
  caseId?: string;
  isOpen?: boolean;
  onClose?: () => void;
  embedded?: boolean;
}

interface ChatMessage {
  id: string;
  role: 'farmer' | 'assistant';
  text: string;
  statusBadge?: string;
  modelUsed?: string;
}

const PRESET_QUESTIONS = [
  {
    te: 'నా పంట పరిస్థితి ఎలా ఉంది?',
    en: 'How is my crop damage condition?',
  },
  {
    te: 'నా ఇన్సూరెన్స్ క్లెయిమ్ స్థితి ఏమిటి?',
    en: 'What is my current claim status?',
  },
  {
    te: 'నేను లోన్ రిలీఫ్ కోసం ఎలా దరఖాస్తు చేయాలి?',
    en: 'How do I apply for agricultural loan relief?',
  },
  {
    te: 'బ్యాంకు అధికారి సమీక్ష వ్యాఖ్యలు ఏమిటి?',
    en: 'What are the reviewer remarks?',
  },
];

export const TeluguAssistant: React.FC<TeluguAssistantProps> = ({
  caseId = 'RR001',
  isOpen = true,
  onClose,
  embedded = false,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-msg',
      role: 'assistant',
      text: `నమస్కారం రైతు సోదరా! నేను రైతు రక్ష AI సహాయకుడిని (Agent 3). మీ కేసు (${caseId}) యొక్క పంట నష్ట విశ్లేషణ, బీమా క్లెయిమ్ స్థితి లేదా లోన్ రిలీఫ్ సహాయం గురించి నన్ను తెలుగులో లేదా ఇంగ్లీషులో అడగండి.`,
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechRecognitionSupported, setSpeechRecognitionSupported] = useState(false);
  const [speechSynthesisSupported, setSpeechSynthesisSupported] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [voiceNote, setVoiceNote] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Check browser SpeechRecognition & SpeechSynthesis support on mount
  useEffect(() => {
    const win = window as any;
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (SpeechRec) {
      setSpeechRecognitionSupported(true);
      const rec = new SpeechRec();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'te-IN'; // Telugu primary

      rec.onstart = () => {
        setIsListening(true);
        setVoiceNote('మీరు మాట్లాడుతున్నది వింటున్నాను... (Listening in Telugu/English)');
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputText(transcript);
          handleAsk(transcript);
        }
        setIsListening(false);
        setVoiceNote('');
      };

      rec.onerror = (e: any) => {
        setIsListening(false);
        setVoiceNote('వాయిస్ ఇన్‌పుట్ అందుబాటులో లేదు. దయచేసి టెక్స్ట్ టైప్ చేయండి.');
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }

    if ('speechSynthesis' in window) {
      setSpeechSynthesisSupported(true);
    }
  }, []);

  const toggleListening = () => {
    if (!speechRecognitionSupported || !recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
      } catch {
        recognitionRef.current.stop();
      }
    }
  };

  const speakText = (msgId: string, text: string) => {
    if (!('speechSynthesis' in window)) return;

    if (speakingMessageId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#_]/g, '');
    const utter = new SpeechSynthesisUtterance(cleanText);

    // Try finding Telugu or Indian English voice
    const voices = window.speechSynthesis.getVoices();
    const teVoice =
      voices.find((v) => v.lang.toLowerCase().includes('te-in')) ||
      voices.find((v) => v.lang.toLowerCase().startsWith('te')) ||
      voices.find((v) => v.lang.toLowerCase().includes('en-in'));
    if (teVoice) {
      utter.voice = teVoice;
    }

    utter.rate = 0.95;
    utter.onend = () => setSpeakingMessageId(null);
    utter.onerror = () => setSpeakingMessageId(null);

    setSpeakingMessageId(msgId);
    window.speechSynthesis.speak(utter);
  };

  const handleAsk = async (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed || loading) return;

    const userMsgId = `user-${Date.now()}`;
    setMessages((prev) => [...prev, { id: userMsgId, role: 'farmer', text: trimmed }]);
    setInputText('');
    setLoading(true);

    try {
      const res = await askTeluguAssistant(trimmed, caseId);
      const aiMsgId = `ai-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: aiMsgId,
          role: 'assistant',
          text: res.answer_te,
          statusBadge: res.current_status,
          modelUsed: res.model_used,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          role: 'assistant',
          text: 'నమస్కారం! సాంకేతిక కారణాల వల్ల ప్రత్యుత్తరం ఇవ్వలేకపోయాను. దయచేసి మళ్లీ ప్రయత్నించండి.',
          modelUsed: 'offline_fallback',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!embedded && !isOpen) return null;

  const content = (
    <div
      className={`flex flex-col bg-white overflow-hidden ${
        embedded
          ? 'rounded-2xl border border-[#3B7C61]/30 shadow-sm h-[520px]'
          : 'fixed bottom-4 right-4 z-50 w-96 sm:w-[420px] max-w-[95vw] h-[580px] rounded-2xl shadow-2xl border border-[#3B7C61]/30 ring-1 ring-black/5'
      }`}
    >
      {/* Header */}
      <div className="px-4 py-3.5 bg-[#153E32] text-white flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
            <MessageSquare className="w-4 h-4 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight">తెలుగు సహాయకుడు</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-400/20 text-emerald-200 font-semibold border border-emerald-400/30">
                Agent 3
              </span>
            </div>
            <span className="text-[11px] text-emerald-200/90 block -mt-0.5">
              Grounded on Case: <strong>{caseId}</strong>
            </span>
          </div>
        </div>

        {!embedded && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Preset Question Chips */}
      <div className="px-3 py-2 bg-[#F5F3EA] border-b border-[#3B7C61]/15 overflow-x-auto flex items-center gap-1.5 shrink-0">
        <span className="text-[10px] font-bold text-[#153E32] uppercase tracking-wider shrink-0 flex items-center gap-1">
          <HelpCircle className="w-3 h-3 text-[#3B7C61]" />
          త్వరిత ప్రశ్నలు:
        </span>
        {PRESET_QUESTIONS.map((pq, i) => (
          <button
            key={i}
            type="button"
            disabled={loading}
            onClick={() => handleAsk(pq.te)}
            className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-white border border-[#3B7C61]/30 text-[#153E32] hover:bg-[#153E32] hover:text-white hover:border-[#153E32] transition shrink-0 shadow-2xs disabled:opacity-50"
          >
            {pq.te}
          </button>
        ))}
      </div>

      {/* Chat Messages Body */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-slate-50/50 text-xs">
        {messages.map((m) => {
          const isFarmer = m.role === 'farmer';
          return (
            <div
              key={m.id}
              className={`flex flex-col ${isFarmer ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 shadow-2xs ${
                  isFarmer
                    ? 'bg-[#153E32] text-white rounded-br-xs'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                }`}
              >
                <p className="whitespace-pre-line leading-relaxed font-sans">{m.text}</p>

                {/* Status Badge & Audio Action */}
                {!isFarmer && (
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-[10px] text-slate-500">
                    <div className="flex items-center gap-1.5">
                      {m.statusBadge && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
                          {m.statusBadge}
                        </span>
                      )}
                      {m.modelUsed && (
                        <span className="text-slate-400 font-mono text-[9px]">
                          {m.modelUsed.replace('huggingface:', '')}
                        </span>
                      )}
                    </div>

                    {speechSynthesisSupported && (
                      <button
                        type="button"
                        onClick={() => speakText(m.id, m.text)}
                        title={speakingMessageId === m.id ? 'Stop audio' : 'Listen in Telugu'}
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-slate-100 text-slate-600 font-medium transition"
                      >
                        {speakingMessageId === m.id ? (
                          <>
                            <VolumeX className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                            <span className="text-amber-700 font-bold">ఆపు</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5 text-[#3B7C61]" />
                            <span>వినండి</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2 text-slate-500 text-xs italic pl-2">
            <div className="w-2 h-2 rounded-full bg-[#3B7C61] animate-bounce" />
            <div className="w-2 h-2 rounded-full bg-[#3B7C61] animate-bounce [animation-delay:0.2s]" />
            <div className="w-2 h-2 rounded-full bg-[#3B7C61] animate-bounce [animation-delay:0.4s]" />
            <span>రైతు రక్ష AI ప్రత్యుత్తరం సిద్ధం చేస్తోంది...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Voice feedback banner */}
      {voiceNote && (
        <div className="px-3 py-1 bg-amber-50 border-t border-amber-200 text-amber-800 text-[10px] flex items-center gap-1.5">
          <Info className="w-3 h-3 text-amber-600 shrink-0" />
          <span>{voiceNote}</span>
        </div>
      )}

      {/* Input Form Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAsk(inputText);
        }}
        className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
      >
        {speechRecognitionSupported && (
          <button
            type="button"
            onClick={toggleListening}
            title={isListening ? 'Stop listening' : 'Speak in Telugu'}
            className={`p-2 rounded-xl transition ${
              isListening
                ? 'bg-red-500 text-white animate-pulse shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-[#3B7C61]/15 hover:text-[#153E32]'
            }`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        )}

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="తెలుగులో లేదా ఇంగ్లీషులో అడగండి... (Ask a question)"
          className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#3B7C61] focus:border-[#3B7C61]"
        />

        <button
          type="submit"
          disabled={!inputText.trim() || loading}
          className="p-2 rounded-xl bg-[#153E32] hover:bg-[#204E3D] text-white disabled:opacity-40 transition shadow-2xs"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );

  return content;
};

export default TeluguAssistant;
