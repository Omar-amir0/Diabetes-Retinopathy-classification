import React, { useState } from 'react';
import {
  AlertCircle,
  Award,
  CheckCircle2,
  Cpu,
  Layers,
  TrendingUp,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ModelKey, ModelsResponse } from '../types';

interface Props {
  modelsData: ModelsResponse;
  onGoDiagnose: () => void;
}

export const ModelsTab: React.FC<Props> = ({ modelsData, onGoDiagnose }) => {
  const [selectedHistoryKey, setSelectedHistoryKey] = useState<ModelKey>('efficientnet');

  const activeModel =
    modelsData.models.find((m) => m.key === selectedHistoryKey) || modelsData.models[0];

  const effModel = modelsData.models.find((m) => m.key === 'efficientnet');
  const cnnModel = modelsData.models.find((m) => m.key === 'cnn');

  const f1ComparisonData = modelsData.classes.map((cls) => ({
    name: `G${cls.grade}: ${cls.label}`,
    EfficientNetB0: effModel?.per_class?.[cls.grade]?.f1 ?? 0,
    CustomCNN: cnnModel?.per_class?.[cls.grade]?.f1 ?? 0,
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-5 border-b border-slate-200 pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Layers className="h-6 w-6 text-orange-400" />
            Deep Learning Architectures & Evaluation Benchmark
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            All three models were trained on the same 512×512 CLAHE balanced training split
            (6,315 images) and evaluated on the unaugmented validation/test splits (550
            images each).
          </p>
        </div>
        <button
          onClick={onGoDiagnose}
          className="keep-white self-start rounded-xl bg-[#1428A0] px-4 py-2.5 text-xs font-semibold text-white transition-colors duration-150 hover:bg-[#0f207f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1428A0] focus-visible:ring-offset-2"
        >
          Test All 3 Models Live →
        </button>
      </div>

      {/* 3 Model Architecture Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {modelsData.models.map((m) => (
          <div
            key={m.key}
            className={`rounded-2xl border p-6 flex flex-col justify-between space-y-5 ${
              m.recommended
                ? 'border-[#bfc8ff] bg-[#f7f8ff] shadow-sm'
                : 'border-slate-200 bg-white'
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-400">
                    {m.family}
                  </span>
                  <h3 className="text-xl font-extrabold text-white mt-0.5">{m.name}</h3>
                </div>
                {m.recommended && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                    <Award className="h-3.5 w-3.5" />
                    Best Model
                  </span>
                )}
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="border-l-2 border-[#cbd3ff] py-1 pl-3">
                  <div className="text-[10px] uppercase text-slate-400">
                    Accuracy ({m.evaluation_split})
                  </div>
                  <div className="text-lg font-extrabold text-white mt-0.5">
                    {(m.metrics.accuracy * 100).toFixed(2)}%
                  </div>
                </div>
                <div className="border-l-2 border-[#cbd3ff] py-1 pl-3">
                  <div className="text-[10px] uppercase text-slate-400">
                    Quadratic Kappa (QWK)
                  </div>
                  <div className="text-lg font-extrabold text-emerald-400 mt-0.5">
                    {m.metrics.qwk !== null ? m.metrics.qwk.toFixed(4) : 'Val-only'}
                  </div>
                </div>
                <div className="border-l-2 border-slate-200 py-1 pl-3">
                  <div className="text-[10px] uppercase text-slate-400">Macro F1</div>
                  <div className="text-base font-bold text-slate-200 mt-0.5">
                    {m.metrics.macro_f1 !== null ? m.metrics.macro_f1.toFixed(3) : '—'}
                  </div>
                </div>
                <div className="border-l-2 border-slate-200 py-1 pl-3">
                  <div className="text-[10px] uppercase text-slate-400">Input & Size</div>
                  <div className="text-base font-bold text-slate-200 mt-0.5">
                    {m.input_size}² · {m.size_mb} MB
                  </div>
                </div>
              </div>

              {/* Specs */}
              <div className="space-y-2 text-xs text-slate-300">
                <div>
                  <span className="text-slate-400">Parameters:</span>{' '}
                  <strong>{m.total_params.toLocaleString()}</strong> total (
                  {m.trainable_params.toLocaleString()} trainable)
                </div>
                <div>
                  <span className="text-slate-400">Preprocessing:</span> {m.preprocessing}
                </div>
                <div>
                  <span className="text-slate-400">Training:</span> {m.training.optimizer} ·
                  batch {m.training.batch_size} · best epoch {m.training.best_epoch}/
                  {m.training.epochs}
                </div>
              </div>

              {/* Layer stack */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold uppercase text-slate-400">
                  Layer Pipeline
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {m.architecture.map((layer, idx) => (
                    <span
                      key={idx}
                      className="rounded-lg bg-slate-950 border border-slate-800 px-2.5 py-1 text-[11px] font-mono text-blue-200"
                    >
                      {layer}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 space-y-1.5">
              {m.highlights.map((h, i) => (
                <div key={i} className="flex items-start gap-1.5 text-xs text-slate-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{h}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Training Curves & Per-Class F1 Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Interactive Epoch Curves */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-400" />
                Epoch-by-Epoch Training vs Validation Accuracy
              </h3>
              <p className="text-xs text-slate-400">
                Parsed directly from the training logs of each notebook.
              </p>
            </div>
            <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800">
              {modelsData.models.map((m) => (
                <button
                  key={m.key}
                  onClick={() => setSelectedHistoryKey(m.key)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    selectedHistoryKey === m.key
                      ? 'bg-[#1428A0] text-white keep-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span className={selectedHistoryKey === m.key ? 'keep-white' : ''}>
                    {m.name.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={activeModel.history}
                margin={{ top: 10, right: 15, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="epoch"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  label={{ value: 'Epoch', position: 'insideBottomRight', offset: -4, fill: '#64748b', fontSize: 11 }}
                />
                <YAxis domain={[0.2, 0.9]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    borderColor: '#e2e8f0',
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  itemStyle={{ color: '#0f172a' }}
                  labelStyle={{ color: '#334155', fontWeight: 600 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey="accuracy"
                  name="Train Accuracy"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="val_accuracy"
                  name="Validation Accuracy"
                  stroke="#f97316"
                  strokeWidth={2.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Per-Grade F1 Comparison (EfficientNetB0 vs Custom CNN on Test Split) */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Cpu className="h-4 w-4 text-emerald-400" />
              Per-Grade F1 Score on Held-Out Test Split (550 Images)
            </h3>
            <p className="text-xs text-slate-400">
              Transfer learning with EfficientNetB0 dramatically improves minority grades
              (Grades 1, 3, and 4) where the scratch CNN collapses into Grade 2.
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={f1ComparisonData}
                margin={{ top: 10, right: 15, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis domain={[0, 1]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    borderColor: '#e2e8f0',
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  itemStyle={{ color: '#0f172a' }}
                  labelStyle={{ color: '#334155', fontWeight: 600 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="EfficientNetB0" fill="#22c55e" radius={[6, 6, 0, 0]} />
                <Bar dataKey="CustomCNN" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Confusion Matrices & Saved Training Curves */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-3">
          <h3 className="text-base font-bold text-white">
            EfficientNetB0 Confusion Matrix (Test Split · QWK 0.8294)
          </h3>
          <p className="text-xs text-slate-400">
            Strong diagonal on Grade 0 (96.3% recall) and Grade 2 (82.0% recall), with
            meaningful recovery on Grades 1, 3, and 4.
          </p>
          <div className="rounded-xl bg-black p-3 flex items-center justify-center">
            <img
              src="/static/figures/efficientnet_confusion_matrix.webp"
              alt="EfficientNetB0 confusion matrix"
              className="max-h-80 object-contain"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-3">
          <h3 className="text-base font-bold text-white">
            Custom 512×512 CNN Confusion Matrix (Test Split · QWK 0.7224)
          </h3>
          <p className="text-xs text-slate-400">
            252/271 Grade 0 and 138/150 Grade 2 are correct, but most Grade 1, 3, and 4
            examples are pulled into Grade 2 (Moderate).
          </p>
          <div className="rounded-xl bg-black p-3 flex items-center justify-center">
            <img
              src="/static/figures/confusion_matrix_512_clahe.webp"
              alt="Custom CNN confusion matrix"
              className="max-h-80 object-contain"
            />
          </div>
        </div>
      </div>

      {/* Transparent Engineering Audit Note */}
      <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-5 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-slate-300 leading-relaxed">
          <div className="font-bold text-white text-sm">
            Methodology & Evaluation Transparency Notes
          </div>
          <p>
            • <strong>ResNet50 Input Parity:</strong> ResNet50 was trained with{' '}
            <code>tf.keras.applications.resnet50.preprocess_input</code> (RGB→BGR + ImageNet
            zero-centering) outside the saved model graph. Our FastAPI registry applies this
            exact transform before inference, while feeding raw <code>[0..255]</code> float
            tensors to EfficientNetB0 and Custom CNN (which contain internal rescaling
            layers).
          </p>
          <p>
            • <strong>Validation vs Test Split Reporting:</strong> EfficientNetB0 (77.45%)
            and Custom CNN (71.82%) were evaluated on the held-out 550-image test split;
            ResNet50 (77.27%) was evaluated on the 550-image validation split in its
            training notebook.
          </p>
        </div>
      </div>
    </div>
  );
};

