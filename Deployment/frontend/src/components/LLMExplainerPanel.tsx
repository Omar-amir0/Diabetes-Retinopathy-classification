import React, { useEffect, useState } from 'react';
import {
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Code2,
  Compass,
  KeyRound,
  Languages,
  Loader2,
  MessageSquarePlus,
  Send,
  Sparkles,
} from 'lucide-react';
import { requestLLMExplanation } from '../api';
import {
  ComparePredictResponse,
  LLMExplanationResponse,
  SinglePredictResponse,
} from '../types';

interface Props {
  activeData: ComparePredictResponse | SinglePredictResponse;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const LLMExplainerPanel: React.FC<Props> = ({ activeData }) => {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [explanation, setExplanation] = useState<LLMExplanationResponse | null>(
    activeData.llm_explanation || null
  );
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);
  const [showApiConfig, setShowApiConfig] = useState(false);
  const [provider, setProvider] = useState<'auto' | 'gemini' | 'groq' | 'openai'>('auto');
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('retinascan_llm_api_key') || '';
  });

  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatError, setChatError] = useState<string | null>(null);

  useEffect(() => {
    setChatMessages([]);
    setChatError(null);
    if (activeData.llm_explanation) {
      setExplanation(activeData.llm_explanation);
    } else {
      // Fetch from /api/explain if not embedded
      requestLLMExplanation({
        prediction_payload: activeData,
        language: lang,
      })
        .then((res) => setExplanation(res))
        .catch(() => {});
    }
  }, [activeData]);

  const handleSaveApiKey = (val: string) => {
    setApiKey(val);
    localStorage.setItem('retinascan_llm_api_key', val);
  };

  const handleAskLLM = async (qText?: string) => {
    const queryToUse = qText !== undefined ? qText : question.trim();
    if (!queryToUse) return;
    setAsking(true);
    setChatError(null);
    try {
      const res = await requestLLMExplanation({
        prediction_payload: activeData,
        language: lang,
        user_question: queryToUse,
        api_key: apiKey.trim() || undefined,
        provider,
        conversation_history: chatMessages.slice(-8),
      });
      setExplanation(res);
      if (res.live_response) {
        setChatMessages((current) => [
          ...current,
          { role: 'user', content: queryToUse },
          { role: 'assistant', content: res.live_response as string },
        ]);
      }
      if (qText === undefined) {
        setQuestion('');
      }
    } catch {
      setChatError(
        lang === 'ar'
          ? 'تعذّر الوصول إلى المساعد الآن. تأكد من إعداد Gemini API ثم حاول مرة أخرى.'
          : 'The assistant is unavailable. Check the Gemini API configuration and try again.'
      );
    } finally {
      setAsking(false);
    }
  };

  if (!explanation) return null;

  const content = lang === 'ar' ? explanation.ar : explanation.en;
  const isRtl = lang === 'ar';
  const gradcamStats = explanation.gradcam_stats;

  const quickQuestions =
    lang === 'ar'
      ? [
          'ليه الموديل اختار الدرجة دي تحديداً؟',
          'فين ركزت خريطة الـ Grad-CAM في الشبكية؟',
          'إزاي الـ 3 موديلات صوتوا على الصورة دي؟',
          'إيه معنى الدرجة دي طبياً للمريض؟',
        ]
      : [
          'Why did the model choose this specific grade?',
          'Where did Grad-CAM focus in the retina?',
          'How did the 3 models vote on this image?',
          'What does this grade mean clinically for the patient?',
        ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1428A0] ring-1 ring-blue-100">
            <Bot className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-balance text-sm font-extrabold text-slate-950 sm:text-base">
                {lang === 'ar'
                  ? 'المفسّر الطبي الذكي (AI Clinical Reasoning & LLM Copilot)'
                  : 'AI Clinical Reasoning & LLM Diagnostic Explainer'}
              </h3>
              <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700">
                {explanation.model_used}
              </span>
            </div>
            <p className="mt-1 max-w-2xl text-pretty text-xs leading-5 text-slate-600">
              {lang === 'ar'
                ? 'يشرح لماذا اختار الموديل هذه الدرجة (0–4) بناءً على الاحتمالات، خريطة Grad-CAM، وتصويت الموديلات الثلاثة'
                : 'Explains why Grade 0–4 was chosen using softmax margins, Grad-CAM spatial quadrants & 3-model consensus'}
            </p>
          </div>
        </div>

        {/* Language Toggle + System Prompt + API Config Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1">
            <button
              onClick={() => setLang('ar')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                lang === 'ar'
                  ? 'bg-[#1428A0] text-white keep-white'
                  : 'text-slate-600 hover:bg-white hover:text-[#1428A0]'
              }`}
            >
              <Languages className="h-3.5 w-3.5" />
              عربي
            </button>
            <button
              onClick={() => setLang('en')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                lang === 'en'
                  ? 'bg-[#1428A0] text-white keep-white'
                  : 'text-slate-600 hover:bg-white hover:text-[#1428A0]'
              }`}
            >
              EN
            </button>
          </div>

          <button
            onClick={() => setShowSystemPrompt(!showSystemPrompt)}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-[#1428A0]"
          >
            <Code2 className="size-3.5 text-[#1428A0]" />
            <span>System Prompt</span>
            {showSystemPrompt ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>

          <button
            onClick={() => setShowApiConfig(!showApiConfig)}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-[#1428A0]"
          >
            <KeyRound className="size-3.5 text-[#1428A0]" />
            <span>{apiKey ? 'API Key Active' : 'LLM API Key'}</span>
          </button>
        </div>
      </div>

      {/* Collapsible System Prompt Inspector */}
      {showSystemPrompt && (
        <div className="space-y-1.5 rounded-xl border border-blue-100 bg-blue-50 p-3.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-blue-800">
            <span>ACTIVE OPHTHALMIC SYSTEM PROMPT (INJECTED WITH IMAGE TELEMETRY)</span>
            <span className="font-mono text-[10px] text-slate-500">ICDR / ETDRS 5-Grade Standard</span>
          </div>
          <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-slate-700">
            {explanation.system_prompt}
          </pre>
        </div>
      )}

      {/* Collapsible External LLM API Key Config (Gemini / Groq / OpenAI) */}
      {showApiConfig && (
        <div className="space-y-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-950">
              {lang === 'ar'
                ? 'ربط مفتاح LLM خارجي اختياري (Gemini 2.5 Flash / Groq Llama-3.3 / OpenAI)'
                : 'Optional External LLM API Key (Gemini 2.5 Flash / Groq Llama-3.3 / OpenAI)'}
            </span>
            <span className="text-pretty text-[11px] text-slate-600">
              {lang === 'ar'
                ? 'يعمل النظام تلقائياً بدون مفتاح، أو يمكنك إدخال مفتاح Gemini/Groq للتوليد السحابي المباشر'
                : 'Works automatically offline, or paste a Gemini/Groq/OpenAI key for live cloud generation'}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as 'auto' | 'gemini' | 'groq' | 'openai')}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-blue-500 focus:outline-none"
            >
              <option value="auto">Auto-Detect Key (Gemini / Groq / OpenAI)</option>
              <option value="gemini">Google Gemini API (gemini-2.5-flash)</option>
              <option value="groq">Groq API (llama-3.3-70b-versatile)</option>
              <option value="openai">OpenAI API (gpt-4o-mini)</option>
            </select>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => handleSaveApiKey(e.target.value)}
              placeholder="Paste AIza... (Gemini) or gsk_... (Groq) or sk-... (OpenAI)"
              className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
            />
            <button
              onClick={() => handleAskLLM()}
              disabled={asking}
              className="rounded-xl bg-[#1428A0] hover:bg-blue-700 text-white keep-white px-4 py-2 text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              {asking ? <Loader2 className="h-3.5 w-3.5 animate-spin keep-white" /> : <Sparkles className="h-3.5 w-3.5 keep-white" />}
              <span className="keep-white">
                {lang === 'ar' ? 'توليد التفسير عبر API' : 'Regenerate with API'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Main Structured Explanation Body */}
      <div dir={isRtl ? 'rtl' : 'ltr'} className="space-y-4">
        {/* Title & Confidence Tier Badge */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-blue-100 bg-blue-50 p-3.5">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 shrink-0 text-[#1428A0]" />
            <span className="text-balance text-sm font-extrabold text-slate-950 sm:text-base">
              {content.title}
            </span>
          </div>
          <span className="rounded-lg border border-blue-200 bg-white px-2.5 py-1 text-[11px] font-bold text-blue-700">
            {content.confidence_badge}
          </span>
        </div>

        {/* Executive Summary */}
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-pretty text-xs leading-relaxed text-slate-700 sm:text-sm">
          {content.summary}
        </div>

        {/* Why This Grade Was Chosen (4 Evidence Pillars) */}
        <div className="space-y-2">
          <h4 className="flex items-center gap-1.5 text-xs font-extrabold text-blue-800">
            <CheckCircle2 className="size-4" />
            {lang === 'ar'
              ? `لماذا اختار الموديل الدرجة (Grade ${explanation.predicted_grade}) تحديداً؟`
              : `Why the AI Selected Grade ${explanation.predicted_grade} (${explanation.predicted_label}):`}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {content.why_chosen.map((reason, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-pretty text-xs leading-relaxed text-slate-700"
              >
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[#1428A0] text-[11px] font-bold text-white keep-white">
                  {idx + 1}
                </span>
                <span>{reason}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Spatial Grad-CAM Retinal Quadrant Breakdown */}
        {gradcamStats && (
          <div className="space-y-2.5 rounded-xl border border-slate-200 bg-white p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-950">
                <Compass className="size-4 text-[#1428A0]" />
                {lang === 'ar'
                  ? 'التوزيع المكاني لانتباه الموديل (Grad-CAM Quadrant Telemetry)'
                  : 'Grad-CAM Spatial Quadrant Attention Telemetry'}
              </span>
              <span className="font-mono text-[11px] font-semibold text-blue-700">
                {lang === 'ar'
                  ? `البؤرة الأعلى: ${gradcamStats.dominant_region} (${gradcamStats.hotspot_coverage_pct}% مساحة نشطة)`
                  : `Peak Focus: ${gradcamStats.dominant_region} (${gradcamStats.hotspot_coverage_pct}% active hotspot)`}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {Object.entries(gradcamStats.region_scores).map(([region, score]) => {
                const isDom = region === gradcamStats.dominant_region;
                return (
                  <div
                    key={region}
                    className={`rounded-lg p-2 border text-[11px] ${
                      isDom
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div className="truncate font-semibold text-slate-700" title={region}>
                      {region.split(' (')[0]}
                    </div>
                    <div className="mt-1 flex items-center justify-between font-mono text-xs font-bold text-slate-950">
                      <span>{Math.round(score * 100)}%</span>
                      {isDom && <span className="text-[10px] text-blue-700">★ Peak</span>}
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, Math.max(6, Math.round(score * 100)))}%`,
                          backgroundColor: isDom ? '#1428A0' : '#60A5FA',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pathophysiology & Clinical Meaning */}
        <div className="space-y-1 rounded-xl border border-blue-100 bg-blue-50 p-3.5">
          <div className="text-xs font-bold text-blue-800">
            {lang === 'ar'
              ? 'التفسير الطبي المبسط (Clinical & Pathophysiological Meaning):'
              : 'Clinical & Pathophysiological Interpretation:'}
          </div>
          <p className="text-pretty text-xs leading-relaxed text-slate-700">{content.clinical_meaning}</p>
        </div>

        {/* Interactive Follow-Up Q&A with the LLM */}
        <div className="space-y-2.5 border-t border-slate-200 pt-3 no-print">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <MessageSquarePlus className="size-4 text-[#1428A0]" />
              {lang === 'ar'
                ? 'اسأل المساعد الذكي عن هذه الصورة:'
                : 'Ask the AI Copilot a follow-up question about this scan:'}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {quickQuestions.map((qq) => (
                <button
                  key={qq}
                  onClick={() => handleAskLLM(qq)}
                  disabled={asking}
                  className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-[#1428A0]"
                >
                  {qq}
                </button>
              ))}
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (question.trim()) handleAskLLM();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={
                lang === 'ar'
                  ? 'اكتب سؤالك هنا (مثال: ليه الموديل اختار الدرجة دي ومختارش الدرجة اللي بعدها؟)...'
                  : 'Ask anything about why this grade was selected or how the models voted...'
              }
              className="flex-1 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={asking || !question.trim()}
              className="rounded-xl bg-[#1428A0] hover:bg-blue-700 disabled:opacity-50 text-white keep-white px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 shrink-0"
            >
              {asking ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin keep-white" />
              ) : (
                <Send className="h-3.5 w-3.5 keep-white" />
              )}
              <span className="keep-white">{lang === 'ar' ? 'إرسال' : 'Ask'}</span>
            </button>
          </form>

          {chatMessages.length > 0 && (
            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
              <div className="text-[11px] font-bold text-blue-800">
                {lang === 'ar' ? 'المحادثة حول نتيجة الفحص' : 'Conversation about this screening result'}
                <span className="ms-1 font-normal text-slate-500">· {explanation.model_used}</span>
              </div>
              <div className="space-y-2.5">
                {chatMessages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={`max-w-[92%] rounded-xl px-3.5 py-2.5 text-pretty text-xs leading-relaxed sm:text-sm ${
                      message.role === 'user'
                        ? 'ms-auto bg-[#1428A0] text-white keep-white'
                        : 'me-auto border border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <div
                      className={`mb-1 text-[10px] font-bold ${
                        message.role === 'user' ? 'text-blue-100 keep-white' : 'text-blue-800'
                      }`}
                    >
                      {message.role === 'user'
                        ? lang === 'ar'
                          ? 'أنت'
                          : 'You'
                        : lang === 'ar'
                          ? 'المساعد'
                          : 'Assistant'}
                    </div>
                    <div className="whitespace-pre-line">{message.content}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {chatError && (
            <p role="alert" className="text-xs font-medium text-red-700">
              {chatError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

