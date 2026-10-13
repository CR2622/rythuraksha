/**
 * Developer 4 Module: Agent 3 — Telugu Farmer AI Assistant (TeluguAssistant.tsx)
 * Implements CP-05 requirements:
 * 1. Answers the 3 benchmark Telugu questions + custom farmer questions using Hugging Face + SQLite case state.
 * 2. Browser SpeechRecognition with lang = "te-IN" where supported.
 * 3. Browser speechSynthesis (selecting a Telugu te-IN voice only if installed on the device).
 * 4. Reliable Telugu text fallback when voice recognition or Telugu TTS voice is unavailable.
 */

import React, { useEffect, useState } from 'react';
import {
  MessageSquare,
  Mic,
  MicOff,
  Volume2,
  Send,
  X,
  Sparkles,
  Info,
} from 'lucide-react';
import { askTeluguAssistant } from '../services/api';

interface TeluguAssistantProps {
  caseId?: string;
  isOpen?: boolean;
  onClose?: () => void;
  embedded?: boolean;
}

interface ChatMessage {
  role: 'farmer' | 'assistant';
  text: string;
  statusBadge?: string;
  modelUsed?: string;
}

const PRESET_QUESTIONS = [
  {
    te: 'నా పంట పరిస్థితి ఎలా ఉంది?',
    en: 'How is my crop condition?',
  },
  {
    te: 'నా ఇన్సూరెన్స్ క్లెయిమ్ స్థితి ఏమిటి?',
    en: 'What is my insurance claim status?',
  },
  {
    te: 'నేను లోన్ రిలీఫ్ కోసం ఎలా దరఖాస్తు చేయాలి?',
    en: 'How do I apply for loan relief?',
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
      role: 'assistant',
      text: `నమస్కారం రైతు సోదరా! నేను రైతు రక్ష తెలుగు AI సహాయకుడిని (Agent 3). మీ కేసు (${caseId}) యొక్క పంట నష్ట విశ్లేషణ, ఇన్సూరెన్స్ క్లెయిమ్ స్థితి లేదా లోన్ రిలీఫ్ గురించి క్రింది ప్రశ్నలను ఎంచుకోండి లేదా తెలుగులో అడగండి.`,
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechRecognitionSupported, setSpeechRecognitionSupported] = useState(false);
  const [teluguVoice, setTeluguVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [voiceNote, setVoiceNote] = useState<string>('');

  // Check browser SpeechRecognition & SpeechSynthesis Telugu voice support on mount
  useEffect(() => {
    const win = window as any;
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;
    setSpeechRecognitionSupported(Boolean(SpeechRec));

    if ('speechSynthesis' in window) {
      const findVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        const teVoice =
          voices.find((v) => v.lang.toLowerCase().includes('te-in')) ||
          voices.find((v) => v.lang.toLowerCase().startsWith('te'));
        setTeluguVoice(teVoice || null);
      };
      findVoices();
      window.speechSynthesis.onvoiceschanged = findVoices;
    }
  }, []);

  const handleAsk = async (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed || loading) return;

    setMessages((prev) => [...prev, { role: 'farmer', text: trimmed }]);
    setInputText('');
    setLoading(true);

    try {
      const res = await askTeluguAssistant(trimmed, caseId);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: res.answer_te,
          statusBadge: res.current_status,
          modelUsed: res.model_used,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'సర్వర్‌తో కనెక్ట్ చేయడంలో చిన్న అంతరాయం ఏర్పడింది. దయచేసి బ్యాకెండ్ నడుస్తుందో లేదో తనిఖీ చేయండి. (Could not reach backend /api/assistant/query).',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const startMicrophoneInput = () => {
    const win = window as any;
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRec) {
      setVoiceNote(
        'ఈ బ్రౌజర్‌లో వాయిస్ రికగ్నిషన్ అందుబాటులో లేదు. దయచేసి తెలుగు టెక్స్ట్ బటన్లను ఉపయోగించండి. (SpeechRecognition unavailable on this browser; Telugu text mode active).'
      );
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.lang = 'te-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceNote('మాట్లాడండి... తెలుగు వాయిస్ వింటోంది (Listening in te-IN)...');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript || '';
        setIsListening(false);
        setVoiceNote('');
        if (transcript) {
          setInputText(transcript);
          handleAsk(transcript);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
        setVoiceNote(
          'తెలుగు మైక్రోఫోన్ గుర్తింపు అందుబాటులో లేదు — తెలుగు టెక్స్ట్ మోడ్ సిద్ధంగా ఉంది. (Voice input fallback to Telugu text).'
        );
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
      setVoiceNote('మైక్రోఫోన్ ప్రారంభించడం సాధ్యం కాలేదు. తెలుగు టెక్స్ట్ ఉపయోగించండి.');
    }
  };

  const speakTeluguResponse = (text: string) => {
    if (!('speechSynthesis' in window)) {
      setVoiceNote('ఈ బ్రౌజర్‌లో వాయిస్ అవుట్‌పుట్ అందుబాటులో లేదు.');
      return;
    }
    window.speechSynthesis.cancel();
    if (!teluguVoice) {
      setVoiceNote(
        'ఈ ల్యాప్‌టాప్‌లో ప్రత్యేక తెలుగు వాయిస్ (te-IN TTS) ఇన్‌స్టాల్ చేయబడలేదు. తెలుగు టెక్స్ట్ సమాధానం క్రింద పూర్తిగా అందుబాటులో ఉంది.'
      );
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = teluguVoice;
    utterance.lang = 'te-IN';
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  if (!isOpen && !embedded) return null;

  const containerClasses = embedded
    ? 'bg-white rounded-xl border border-forest-200 shadow-sm overflow-hidden flex flex-col'
    : 'fixed bottom-5 right-5 z-50 w-full max-w-md bg-white rounded-2xl border-2 border-forest-700 shadow-2xl overflow-hidden flex flex-col max-h-[82vh]';

  return (
    <div className={containerClasses}>
      {/* Header */}
      <div className="bg-forest-900 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-green-300" />
          <div>
            <h3 className="font-bold text-sm">
              Agent 3: తెలుగు రైతు సహాయకుడు (Telugu AI)
            </h3>
            <p className="text-[11px] text-green-200">
              Connected to Case: <strong>{caseId}</strong> • Live SQLite Status
            </p>
          </div>
        </div>
        {!embedded && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-forest-800 text-white"
            title="Close Assistant"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Preset Telugu Questions (CP-05 Step 1) */}
      <div className="px-4 py-2.5 bg-forest-50 border-b border-forest-100">
        <p className="text-[11px] font-semibold text-forest-900 mb-1.5">
          ఒక క్లిక్‌తో తెలుగులో అడగండి (Quick Telugu Questions):
        </p>
        <div className="flex flex-col gap-1.5">
          {PRESET_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              type="button"
              disabled={loading}
              onClick={() => handleAsk(q.te)}
              className="text-left px-3 py-1.5 rounded-lg bg-white hover:bg-green-100 border border-forest-200 text-xs font-medium text-forest-900 transition flex items-center justify-between"
            >
              <span>{q.te}</span>
              <span className="text-[10px] text-slate-500 ml-2">{q.en}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="p-4 space-y-3 overflow-y-auto max-h-72 bg-slate-50 flex-1">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex flex-col ${
              msg.role === 'farmer' ? 'items-end' : 'items-start'
            }`}
          >
            <div
              className={`max-w-[90%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                msg.role === 'farmer'
                  ? 'bg-forest-800 text-white'
                  : 'bg-white text-slate-800 border border-slate-200 shadow-sm'
              }`}
            >
              {msg.text}
              {msg.role === 'assistant' && (
                <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => speakTeluguResponse(msg.text)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-forest-700 hover:text-forest-900"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    తెలుగులో వినండి (Listen)
                  </button>
                  {msg.statusBadge && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-forest-50 text-forest-800 font-semibold border border-forest-200">
                      Status: {msg.statusBadge}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="text-xs text-forest-800 font-medium animate-pulse">
            Agent 3 తెలుగు సమాధానాన్ని సిద్ధం చేస్తోంది (Retrieving live case & generating Telugu response)...
          </div>
        )}
      </div>

      {/* Voice capability / fallback notice */}
      {voiceNote && (
        <div className="px-3 py-1.5 bg-amber-50 border-t border-amber-200 text-[11px] text-amber-900 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 shrink-0 text-amber-600" />
          <span>{voiceNote}</span>
        </div>
      )}

      {/* Input & Microphone Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAsk(inputText);
        }}
        className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
      >
        <button
          type="button"
          onClick={startMicrophoneInput}
          title={
            speechRecognitionSupported
              ? 'Speak in Telugu (te-IN)'
              : 'Speech recognition fallback active'
          }
          className={`p-2 rounded-lg border transition ${
            isListening
              ? 'bg-red-600 text-white border-red-600 animate-pulse'
              : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
          }`}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="తెలుగులో లేదా ఇంగ్లీష్‌లో ప్రశ్న టైప్ చేయండి..."
          className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-forest-600"
        />

        <button
          type="submit"
          disabled={loading || !inputText.trim()}
          className="px-3 py-2 rounded-lg bg-forest-800 text-white text-xs font-semibold hover:bg-forest-900 disabled:opacity-50 flex items-center gap-1"
        >
          <Send className="w-3.5 h-3.5" />
          Send
        </button>
      </form>
    </div>
  );
};

export default TeluguAssistant;
