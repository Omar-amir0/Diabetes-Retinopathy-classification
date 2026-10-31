import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  Flame,
  Image as ImageIcon,
  Layers,
  Loader2,
  Printer,
  Sparkles,
  Upload,
} from 'lucide-react';
import {
  predictCompare,
  predictSampleCompare,
  predictSampleSingle,
  predictSingle,
} from '../api';
import {
  ComparePredictResponse,
  ModelKey,
  ModelsResponse,
  PredictionItem,
  SampleFundus,
  SinglePredictResponse,
} from '../types';
import { LLMExplainerPanel } from './LLMExplainerPanel';

interface Props {
  modelsData: ModelsResponse;
  samples: SampleFundus[];
  initialSampleGrade: number | null;
  onClearInitialSample: () => void;
}

export const DiagnoseTab: React.FC<Props> = ({
  modelsData,
  samples,
  initialSampleGrade,
  onClearInitialSample,
}) => {
  const [mode, setMode] = useState<'compare' | 'single'>('compare');
  const [selectedModel, setSelectedModel] = useState<ModelKey>('efficientnet');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeSampleGrade, setActiveSampleGrade] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [compareRes, setCompareRes] = useState<ComparePredictResponse | null>(null);
  const [singleRes, setSingleRes] = useState<SinglePredictResponse | null>(null);

  const [imageTab, setImageTab] = useState<'gradcam' | 'clahe' | 'original'>('gradcam');
  const [gradcamModelKey, setGradcamModelKey] = useState<ModelKey>('efficientnet');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const runSample = async (grade: number, runMode = mode, modelKey = selectedModel) => {
    setLoading(true);
    setError(null);
    setSelectedFile(null);
    setActiveSampleGrade(grade);
    try {
      if (runMode === 'compare') {
        const res = await predictSampleCompare(grade, true);
        setCompareRes(res);
        setSingleRes(null);
      } else {
        const res = await predictSampleSingle(grade, modelKey, true);
        setSingleRes(res);
        setCompareRes(null);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Prediction failed');
    } finally {
      setLoading(false);
    }
  };

  const runFile = async (file: File, runMode = mode, modelKey = selectedModel) => {
    setLoading(true);
    setError(null);
    setSelectedFile(file);
    setActiveSampleGrade(null);
    try {
      if (runMode === 'compare') {
        const res = await predictCompare(file, true);
        setCompareRes(res);
        setSingleRes(null);
      } else {
        const res = await predictSingle(file, modelKey, true);
        setSingleRes(res);
        setCompareRes(null);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Prediction failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialSampleGrade !== null) {
      runSample(initialSampleGrade, 'compare', selectedModel);
      onClearInitialSample();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSampleGrade]);

  const handleModeChange = (newMode: 'compare' | 'single') => {
    setMode(newMode);
    if (selectedFile) {
      runFile(selectedFile, newMode, selectedModel);
    } else if (activeSampleGrade !== null) {
      runSample(activeSampleGrade, newMode, selectedModel);
    }
  };

  const handleModelChange = (newModel: ModelKey) => {
    setSelectedModel(newModel);
    setGradcamModelKey(newModel);
    if (mode === 'single') {
      if (selectedFile) runFile(selectedFile, 'single', newModel);
      else if (activeSampleGrade !== null) runSample(activeSampleGrade, 'single', newModel);
    }
  };

  const activeData = compareRes || singleRes;
  const primaryResult: PredictionItem | null = compareRes
    ? compareRes.ensemble
    : singleRes
    ? singleRes.result
    : null;

  const activeGradcamUrl = compareRes
    ? compareRes.models.find((m) => m.model_key === gradcamModelKey)?.gradcam_image ||
      compareRes.ensemble.gradcam_image
    : singleRes?.result.gradcam_image;

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <img
            src="/logo.png"
            alt="RetinaScan MD Logo"
            className="h-11 w-11 rounded-xl bg-white p-1 border border-slate-300 dark:border-slate-700 shadow-sm shrink-0 object-contain"
          />
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Eye className="h-5 w-5 text-orange-400" />
              Interactive Retinal Fundus Diagnosis & Grad-CAM Studio
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Every uploaded image goes through EXIF orientation → LAB-L CLAHE (clip 2.0, 8×8)
              → 512×512 aspect-preserving Lanczos pad → model inference & Grad-CAM.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800">
            <button
              onClick={() => handleModeChange('compare')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                mode === 'compare'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              3-Model Ensemble + Compare
            </button>
            <button
              onClick={() => handleModeChange('single')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                mode === 'single'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Single Model
            </button>
          </div>

          {mode === 'single' && (
            <select
              value={selectedModel}
              onChange={(e) => handleModelChange(e.target.value as ModelKey)}
              className="rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-blue-500"
            >
              {modelsData.models.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.name} {m.recommended ? '★ Recommended' : ''}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Upload + Quick Sample Selector Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Upload Dropzone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) runFile(f);
          }}
          onClick={() => fileInputRef.current?.click()}
          className="lg:col-span-5 cursor-pointer rounded-2xl border-2 border-dashed border-blue-500/40 hover:border-orange-400/70 bg-slate-900/60 hover:bg-slate-900/90 p-5 transition flex items-center gap-4"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/bmp,image/tiff"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) runFile(f);
            }}
          />
          <div className="h-12 w-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <Upload className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white truncate">
              {selectedFile ? `Uploaded: ${selectedFile.name}` : 'Drop a fundus image or click to browse'}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Supports PNG, JPG, TIFF up to 15 MB · Automatic CLAHE preprocessing
            </p>
          </div>
        </div>

        {/* Sample Selector Strip */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col justify-center">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300">
              Or test immediately with verified APTOS 2019 samples (Grades 0–4):
            </span>
            {activeSampleGrade !== null && (
              <span className="text-[11px] font-semibold text-emerald-400">
                Ground Truth: Grade {activeSampleGrade}
              </span>
            )}
          </div>
          <div className="grid grid-cols-5 gap-2">
            {samples.map((s) => {
              const active = activeSampleGrade === s.grade && !selectedFile;
              return (
                <button
                  key={s.grade}
                  onClick={() => runSample(s.grade)}
                  className={`group relative rounded-xl overflow-hidden border text-left transition p-1.5 flex items-center gap-2 ${
                    active
                      ? 'border-orange-400 bg-orange-500/15 ring-1 ring-orange-400/50'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-600'
                  }`}
                >
                  <img
                    src={s.url}
                    alt={s.label}
                    className="h-9 w-9 rounded-lg object-cover shrink-0 bg-black"
                  />
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-white truncate">
                      G{s.grade}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">{s.label}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-16 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-9 w-9 text-blue-400 animate-spin" />
          <p className="text-sm font-semibold text-white">
            Running CLAHE LAB-L enhancement, deep model inference & Grad-CAM backprop...
          </p>
        </div>
      )}

      {!loading && !activeData && (
        <div className="flex min-h-64 flex-col items-center justify-center border-y border-slate-200 px-6 py-12 text-center">
          <span className="flex size-12 items-center justify-center rounded-xl bg-[#eef1ff] text-[#1428A0]">
            <ImageIcon className="size-6" />
          </span>
          <h3 className="mt-4 text-balance font-display text-lg font-bold text-slate-950">
            Ready when you are
          </h3>
          <p className="mt-2 max-w-md text-pretty text-sm leading-6 text-slate-600">
            Upload a fundus image or choose one of the verified samples above to start AI screening.
          </p>
        </div>
      )}

      {/* Results Section */}
      {!loading && activeData && primaryResult && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Visual Inspection (Original / CLAHE / Grad-CAM) */}
          <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-blue-400" />
                  Retinal Visual & Attention Inspector
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  Source: {activeData.image_size.width}×{activeData.image_size.height}px
                </span>
              </div>

              {/* View Mode Switcher */}
              <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-slate-950 p-1 border border-slate-800">
                <button
                  onClick={() => setImageTab('gradcam')}
                  className={`py-1.5 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1 ${
                    imageTab === 'gradcam'
                      ? 'bg-orange-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Flame className="h-3.5 w-3.5" />
                  Grad-CAM
                </button>
                <button
                  onClick={() => setImageTab('clahe')}
                  className={`py-1.5 rounded-lg text-xs font-semibold transition ${
                    imageTab === 'clahe'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  CLAHE 512²
                </button>
                <button
                  onClick={() => setImageTab('original')}
                  className={`py-1.5 rounded-lg text-xs font-semibold transition ${
                    imageTab === 'original'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Original
                </button>
              </div>

              {/* If Grad-CAM + Compare mode, allow switching which model's Grad-CAM is shown */}
              {imageTab === 'gradcam' && compareRes && (
                <div className="flex items-center justify-between gap-2 bg-slate-950/70 rounded-xl px-3 py-2 border border-slate-800/80">
                  <span className="text-[11px] text-slate-400">Grad-CAM layer from:</span>
                  <div className="flex gap-1">
                    {compareRes.models.map((m) => (
                      <button
                        key={m.model_key}
                        onClick={() => setGradcamModelKey(m.model_key as ModelKey)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                          gradcamModelKey === m.model_key
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-900 text-slate-400 hover:text-white'
                        }`}
                      >
                        {m.model_name.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Main Square Retinal Canvas */}
              <div className="relative aspect-square w-full max-w-[420px] mx-auto rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-inner">
                <img
                  src={
                    imageTab === 'gradcam' && activeGradcamUrl
                      ? activeGradcamUrl
                      : imageTab === 'clahe'
                      ? activeData.clahe_preview
                      : activeData.original_preview
                  }
                  alt="Retinal inspection view"
                  className="w-full h-full object-contain"
                />
                <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between rounded-lg bg-slate-950/85 backdrop-blur px-3 py-1.5 text-[11px] text-slate-300 border border-white/10">
                  <span>
                    {imageTab === 'gradcam'
                      ? `Grad-CAM Attention (${gradcamModelKey.toUpperCase()})`
                      : imageTab === 'clahe'
                      ? 'LAB-L CLAHE + 512×512 Pad'
                      : 'Raw Uploaded Fundus'}
                  </span>
                  {imageTab === 'gradcam' && (
                    <span className="text-orange-300 font-semibold">Red/Yellow = High Impact</span>
                  )}
                </div>
              </div>
            </div>

            {/* Quality Warnings if any */}
            {activeData.warnings.length > 0 && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 space-y-1">
                <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Image Quality Audit Notes
                </div>
                <ul className="text-[11px] text-amber-100/90 list-disc list-inside space-y-0.5">
                  {activeData.warnings.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Right Column: Verdict, Ensemble / Model Cards, and Probability Breakdown */}
          <div className="lg:col-span-7 space-y-5">
            {/* Primary Verdict Banner */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wider font-bold text-blue-400">
                      {primaryResult.model_name}
                    </span>
                    {compareRes?.ensemble.agreement !== undefined && (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          compareRes.ensemble.agreement
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        {compareRes.ensemble.agreement
                          ? 'Unanimous 3-Model Consensus'
                          : 'Weighted Soft-Vote Decision'}
                      </span>
                    )}
                    {activeData.ground_truth_grade !== undefined && (
                      <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-slate-200">
                        True Sample Grade: {activeData.ground_truth_grade}
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-3 pt-1">
                    <span
                      className="inline-block h-4 w-4 rounded-full shrink-0"
                      style={{ backgroundColor: primaryResult.color }}
                    />
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                      Grade {primaryResult.predicted_grade}: {primaryResult.predicted_label}
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 pt-1">
                    {primaryResult.description}
                  </p>
                </div>

                <div className="text-right bg-slate-950/80 rounded-2xl px-4 py-3 border border-slate-800">
                  <div className="text-[11px] text-slate-400 uppercase font-semibold">
                    Confidence
                  </div>
                  <div
                    className="text-2xl sm:text-3xl font-extrabold"
                    style={{ color: primaryResult.color }}
                  >
                    {(primaryResult.confidence * 100).toFixed(1)}%
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center justify-end gap-1 mt-0.5">
                    <Clock className="h-3 w-3" />
                    {primaryResult.latency_ms} ms
                  </div>
                </div>
              </div>

              {/* Clinical Recommendation Box */}
              <div className="rounded-xl bg-slate-950/90 border border-slate-800 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-slate-200">
                  <strong className="text-orange-300 uppercase tracking-wide mr-1.5">
                    Clinical Guidance ({primaryResult.urgency}):
                  </strong>
                  {primaryResult.recommendation}
                </div>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="keep-white inline-flex h-9 shrink-0 items-center gap-2 rounded-lg bg-[#1428A0] px-3.5 text-xs font-semibold text-white transition-colors duration-150 hover:bg-[#0f207f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1428A0] focus-visible:ring-offset-2"
                >
                  <Printer className="keep-white size-4 text-white" />
                  Print Report
                </button>
              </div>

              {/* 5-Class Probability Bars */}
              <div className="space-y-2 pt-1">
                <div className="text-xs font-semibold text-slate-400">
                  5-Grade Probability Distribution
                </div>
                {primaryResult.probabilities.map((p) => (
                  <div key={p.grade} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-200">
                        Grade {p.grade} — {p.label}{' '}
                        <span className="text-slate-500">({p.short})</span>
                      </span>
                      <span className="font-mono font-semibold text-slate-200">
                        {(p.probability * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-slate-950 overflow-hidden border border-slate-800/80">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max(p.probability * 100, 1.2)}%`,
                          backgroundColor: p.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Individual 3-Model Breakdown when in Compare mode */}
            {compareRes && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Individual Architecture Predictions (Click any card to view its Grad-CAM)
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Ensemble weights: EfficientNet 45% · ResNet50 35% · CNN 20%
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {compareRes.models.map((m) => {
                    const isSelectedCam =
                      imageTab === 'gradcam' && gradcamModelKey === m.model_key;
                    return (
                      <div
                        key={m.model_key}
                        onClick={() => {
                          setImageTab('gradcam');
                          setGradcamModelKey(m.model_key as ModelKey);
                        }}
                        className={`cursor-pointer rounded-2xl border p-4 transition space-y-2.5 ${
                          isSelectedCam
                            ? 'border-orange-400 bg-slate-900 shadow-lg shadow-orange-500/10'
                            : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">{m.model_name}</span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {m.latency_ms} ms
                          </span>
                        </div>
                        <div className="flex items-baseline justify-between">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: m.color }}
                            />
                            <span className="text-sm font-extrabold text-white">
                              G{m.predicted_grade}: {m.predicted_label}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-blue-300">
                            {(m.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                        {m.gradcam_image && (
                          <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                            <img
                              src={m.gradcam_image}
                              alt={`${m.model_name} Grad-CAM`}
                              className="h-10 w-10 rounded-lg object-cover border border-slate-700"
                            />
                            <span className="text-[11px] text-slate-400">
                              Click to inspect {m.model_name.split(' ')[0]} Grad-CAM
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* AI Clinical Reasoning & LLM Explainer Panel */}
            <LLMExplainerPanel activeData={activeData} />

            <p className="text-[11px] text-slate-500 leading-relaxed">
              <strong>Research & Educational Decision-Support Disclaimer:</strong> Built for
              Samsung Innovation Campus (SIC - AI803). Predictions assist screening workflows
              and must be confirmed by a qualified ophthalmologist.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

