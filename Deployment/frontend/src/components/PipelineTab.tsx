import React from 'react';
import {
  ArrowRight,
  Code2,
  Cpu,
  Database,
  ExternalLink,
  FileCode2,
  Flame,
  Layers,
  Server,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export const PipelineTab: React.FC = () => {
  const stages = [
    {
      step: '01',
      title: 'Raw APTOS 2019 Ingestion & Audit',
      file: 'EDA_and_audit_file.ipynb',
      icon: Database,
      color: 'text-[#1428A0]',
      bullets: [
        '3,662 labelled fundus photographs across 17 camera resolutions (474×358 → 4288×2848).',
        'Zero missing labels, zero duplicate IDs, 100% readable RGB images.',
        'Quantified brightness, contrast, saturation, edge density, and aspect-ratio bias per grade.',
      ],
    },
    {
      step: '02',
      title: 'CLAHE LAB-L & Aspect-Preserving Pad',
      file: 'Preprocessing.py',
      icon: Sparkles,
      color: 'text-[#1428A0]',
      bullets: [
        'EXIF transpose → RGB → LAB colour space conversion.',
        'CLAHE (clipLimit=2.0, tileGridSize=8×8) on L channel only — boosts edge density 3.2×.',
        'Lanczos aspect-preserving resize + centred black padding to 512×512 PNG.',
      ],
    },
    {
      step: '03',
      title: 'Leak-Free Split & Minority Augmentation',
      file: 'data_augmentation.ipynb',
      icon: ShieldCheck,
      color: 'text-[#1428A0]',
      bullets: [
        'Stratified 70% Train (2,562) / 15% Val (550) / 15% Test (550) with SEED = 42.',
        'Validation and test splits remain 100% untouched original images.',
        'Grades 1–4 in train are augmented (flip, rotate ±8%, zoom ±8%, contrast ±10%) to 1,263 each (6,315 total).',
      ],
    },
    {
      step: '04',
      title: 'Multi-Architecture Model Training',
      file: 'EfficientNet.ipynb · resnet50_aptos_finetuning.ipynb · cnn_baseline_comparison.ipynb',
      icon: Layers,
      color: 'text-[#1428A0]',
      bullets: [
        'EfficientNetB0 (224×224, frozen ImageNet backbone + GAP + Dropout 0.3 + Dense 5) → 77.45% test acc, 0.8294 QWK.',
        'ResNet50 (224×224 + Caffe BGR preprocess_input, label smoothing 0.05) → 77.27% val acc.',
        'Custom 3-Conv 512×512 CNN from scratch (23.9K params) → 71.82% test acc baseline.',
      ],
    },
    {
      step: '05',
      title: 'FastAPI Inference, Ensemble & Grad-CAM',
      file: 'backend/app/main.py · registry.py · gradcam.py',
      icon: Server,
      color: 'text-[#1428A0]',
      bullets: [
        'Preloads all 3 Keras 3 (.keras) models once at startup on Python 3.11 / TensorFlow 2.21.',
        'Applies identical CLAHE + 512×512 pad + model-specific tensor preparation at inference time.',
        'Computes GradientTape Grad-CAM heatmaps masked to the circular retina + weighted soft-voting ensemble.',
      ],
    },
  ];

  const endpoints = [
    {
      method: 'GET',
      path: '/api/health',
      desc: 'Liveness check + list of preloaded Keras models in memory.',
    },
    {
      method: 'GET',
      path: '/api/models',
      desc: 'Architecture metadata, evaluation metrics, confusion matrices, and per-epoch training history.',
    },
    {
      method: 'GET',
      path: '/api/eda',
      desc: 'Complete EDA statistics, per-grade geometry, paired CLAHE changes, and figure manifest.',
    },
    {
      method: 'POST',
      path: '/api/predict?model=efficientnet|resnet50|cnn&gradcam=true',
      desc: 'Single-model fundus diagnosis with CLAHE preview, 5-grade probabilities, and Grad-CAM overlay.',
    },
    {
      method: 'POST',
      path: '/api/predict/compare?gradcam=true',
      desc: 'Runs all 3 models + weighted soft-voting ensemble and returns per-model Grad-CAM heatmaps.',
    },
    {
      method: 'POST',
      path: '/api/predict/sample/{grade}',
      desc: 'Zero-upload instant test on verified APTOS 2019 sample images for Grades 0–4.',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-5 border-b border-slate-200 pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Cpu className="h-6 w-6 text-blue-400" />
            End-to-End System Design & API Architecture
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Full traceability from raw Kaggle APTOS 2019 fundus photographs to production
            FastAPI inference and React visualization.
          </p>
        </div>
        <a
          href="http://127.0.0.1:8000/docs"
          target="_blank"
          rel="noreferrer"
          className="self-start inline-flex items-center gap-2 rounded-xl bg-[#1428A0] hover:bg-blue-700 text-white keep-white font-semibold px-4 py-2.5 text-xs transition shadow"
        >
          <Code2 className="h-4 w-4 keep-white" />
          <span className="keep-white">Open FastAPI Swagger UI (/docs)</span>
          <ExternalLink className="h-3.5 w-3.5 keep-white" />
        </a>
      </div>

      {/* 5-Stage Pipeline Flow */}
      <div className="divide-y divide-slate-200 border-y border-slate-200">
        {stages.map((st, idx) => {
          const Icon = st.icon;
          return (
            <div
              key={st.step}
              className="flex flex-col items-start gap-5 py-7 md:flex-row"
            >
              <div className="flex items-center gap-3 shrink-0 md:w-64">
                <div className="flex size-11 items-center justify-center rounded-xl bg-[#eef1ff] font-mono text-sm font-bold text-[#1428A0]">
                  {st.step}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <Icon className={`h-4 w-4 ${st.color}`} />
                    <h3 className="text-sm font-bold text-white">{st.title}</h3>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-0.5 flex items-center gap-1">
                    <FileCode2 className="h-3 w-3" />
                    {st.file}
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-2 border-t border-slate-200 pt-4 text-xs text-slate-600 md:border-l md:border-t-0 md:pl-6 md:pt-0">
                {st.bullets.map((b, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <ArrowRight className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* REST API Reference */}
      <div className="space-y-5 border-t border-slate-200 pt-8">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-400" />
              FastAPI Endpoints Contract
            </h3>
            <p className="text-xs text-slate-400">
              Base URL: <code>http://127.0.0.1:8000</code> (proxied seamlessly via Vite on{' '}
              <code>http://localhost:5173</code>)
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-800/80">
          {endpoints.map((ep, i) => (
            <div
              key={i}
              className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
            >
              <div className="flex items-center gap-2.5 font-mono">
                <span
                  className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                    ep.method === 'POST'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}
                >
                  {ep.method}
                </span>
                <span className="text-white font-semibold">{ep.path}</span>
              </div>
              <span className="text-slate-400">{ep.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

