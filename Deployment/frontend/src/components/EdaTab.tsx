import React, { useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Info,
  Maximize2,
  Sparkles,
  X,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { DRClassInfo, EdaResponse } from '../types';

interface Props {
  edaData: EdaResponse;
  classes: DRClassInfo[];
}

export const EdaTab: React.FC<Props> = ({ edaData, classes }) => {
  const [galleryGroup, setGalleryGroup] = useState<'all' | 'raw' | 'preprocessing' | 'splits'>(
    'all'
  );
  const [lightbox, setLightbox] = useState<{
    key: string;
    title: string;
    caption: string;
  } | null>(null);

  const classChartData = edaData.class_distribution.map((d) => ({
    ...d,
    name: `G${d.grade}: ${d.label}`,
    color: classes[d.grade]?.color || '#3b82f6',
  }));

  const augChartData = edaData.augmentation.per_class.map((d) => ({
    name: `G${d.grade}: ${d.label}`,
    Original: d.original,
    Augmented: d.augmented,
  }));

  const claheChartData = edaData.clahe_effect.map((c) => ({
    name: c.label,
    Raw: Number(c.raw.toFixed(4)),
    CLAHE: Number(c.processed.toFixed(4)),
    change: c.change,
  }));

  const filteredFigures =
    galleryGroup === 'all'
      ? edaData.figures
      : edaData.figures.filter((f) => f.group === galleryGroup);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-blue-400" />
              Exploratory Data Analysis, Data Quality Audit & CLAHE Impact
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Source: {edaData.dataset.source} · {edaData.dataset.labelled_images.toLocaleString()}{' '}
              labelled training images + {edaData.dataset.unlabelled_test_images.toLocaleString()}{' '}
              competition test images.
            </p>
          </div>
          <a
            href={edaData.dataset.url}
            target="_blank"
            rel="noreferrer"
            className="self-start rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 px-4 py-2 text-xs font-semibold text-blue-200 transition"
          >
            Kaggle APTOS 2019 Competition ↗
          </a>
        </div>

      </div>

      {/* Key Engineering & Statistical Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {edaData.insights.map((ins, i) => (
          <div
            key={i}
            className={`rounded-2xl border p-5 space-y-2 ${
              ins.type === 'warning'
                ? 'border-amber-500/30 bg-amber-500/5'
                : ins.type === 'success'
                ? 'border-emerald-500/30 bg-emerald-500/5'
                : 'border-blue-500/30 bg-blue-500/5'
            }`}
          >
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              {ins.type === 'warning' ? (
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
              ) : ins.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              ) : (
                <Info className="h-4 w-4 text-blue-400 shrink-0" />
              )}
              <span>{ins.title}</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{ins.detail}</p>
          </div>
        ))}
      </div>

      {/* Interactive Charts Row 1: Raw Class Balance vs Balanced Training Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Raw Imbalance */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-3">
          <div>
            <h3 className="text-base font-bold text-white">
              1. Raw Training Class Imbalance (3,662 Images)
            </h3>
            <p className="text-xs text-slate-400">
              Grade 0 accounts for 49.3% (1,805 images), whereas Severe DR (Grade 3) is only
              5.3% (193 images) — a 9.4 : 1 imbalance ratio.
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classChartData} margin={{ top: 10, right: 15, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    color: '#f8fafc',
                    borderColor: '#334155',
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  itemStyle={{ color: '#f8fafc' }}
                  labelStyle={{ color: '#e2e8f0', fontWeight: 600 }}
                />
                <Bar dataKey="count" name="Images" radius={[6, 6, 0, 0]}>
                  {classChartData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Balanced Training Split (Originals vs Augmented) */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-3">
          <div>
            <h3 className="text-base font-bold text-white">
              2. Balanced Training Set (6,315 Images · 1,263 per Grade)
            </h3>
            <p className="text-xs text-slate-400">
              Grade 0 has zero synthetic images; Grades 1–4 are augmented via random flip,
              rotation (±8%), zoom (±8%), and contrast (±10%).
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={augChartData} margin={{ top: 10, right: 15, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    color: '#f8fafc',
                    borderColor: '#334155',
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  itemStyle={{ color: '#f8fafc' }}
                  labelStyle={{ color: '#e2e8f0', fontWeight: 600 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Original" stackId="a" fill="#3b82f6" />
                <Bar dataKey="Augmented" stackId="a" fill="#f97316" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Interactive Charts Row 2: Paired Before-vs-After CLAHE + Camera Resolutions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CLAHE Paired Impact */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-3">
          <div>
            <h3 className="text-base font-bold text-white">
              3. Paired Before vs After CLAHE Metrics ({edaData.clahe_sample_size} Originals)
            </h3>
            <p className="text-xs text-slate-400">
              Edge density increases 3.2× (0.0159 → 0.0516) and local contrast (brightness
              std) jumps +79% while mean brightness remains stable (0.328 → 0.331).
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={claheChartData} margin={{ top: 10, right: 15, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    color: '#f8fafc',
                    borderColor: '#334155',
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  itemStyle={{ color: '#f8fafc' }}
                  labelStyle={{ color: '#e2e8f0', fontWeight: 600 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Raw" fill="#64748b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="CLAHE" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Camera Resolution Distribution */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-3">
          <div>
            <h3 className="text-base font-bold text-white">
              4. Top Source Camera Resolutions (Width × Height)
            </h3>
            <p className="text-xs text-slate-400">
              1,050×1,050 (square) is the single most common resolution and is heavily
              concentrated in Grade 0 — motivating our aspect-ratio audit below.
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={edaData.top_dimensions.slice(0, 8)}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 25, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis
                  dataKey="size"
                  type="category"
                  width={90}
                  tick={{ fill: '#cbd5e1', fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    color: '#f8fafc',
                    borderColor: '#334155',
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  itemStyle={{ color: '#f8fafc' }}
                  labelStyle={{ color: '#e2e8f0', fontWeight: 600 }}
                />
                <Bar dataKey="count" name="Images" fill="#6366f1" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Per-Grade Visual & Geometry Table (Highlighting the Shortcut Finding) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-3 overflow-x-auto">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-base font-bold text-white">
              Per-Grade Raw Image Geometry & Visual Quality Summary
            </h3>
            <p className="text-xs text-slate-400">
              Notice how Grade 0 has mean aspect ratio <strong>1.167</strong> (mostly square
              1050×1050) whereas Grades 1–4 average <strong>1.38–1.40</strong> (~2500×1800).
            </p>
          </div>
          <span className="rounded-lg bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-xs font-semibold text-amber-300">
            Key EDA Audit Finding
          </span>
        </div>

        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 uppercase">
              <th className="py-2.5 px-3">Grade</th>
              <th className="py-2.5 px-3">Mean Width</th>
              <th className="py-2.5 px-3">Mean Height</th>
              <th className="py-2.5 px-3">Aspect Ratio</th>
              <th className="py-2.5 px-3">Mean Brightness</th>
              <th className="py-2.5 px-3">Contrast (Std)</th>
              <th className="py-2.5 px-3">Saturation</th>
              <th className="py-2.5 px-3">Edge Density</th>
              <th className="py-2.5 px-3">Avg File Size</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70 text-slate-200">
            {edaData.per_grade_stats.map((row) => (
              <tr key={row.grade} className="hover:bg-slate-800/40">
                <td className="py-2.5 px-3 font-bold">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full mr-2"
                    style={{ backgroundColor: classes[row.grade]?.color }}
                  />
                  G{row.grade} — {classes[row.grade]?.label}
                </td>
                <td className="py-2.5 px-3 font-mono">{row.width.toFixed(0)} px</td>
                <td className="py-2.5 px-3 font-mono">{row.height.toFixed(0)} px</td>
                <td className="py-2.5 px-3 font-mono font-bold text-amber-300">
                  {row.aspect_ratio.toFixed(3)}
                </td>
                <td className="py-2.5 px-3 font-mono">{row.brightness_mean.toFixed(4)}</td>
                <td className="py-2.5 px-3 font-mono">{row.brightness_std.toFixed(4)}</td>
                <td className="py-2.5 px-3 font-mono">{row.saturation_mean.toFixed(4)}</td>
                <td className="py-2.5 px-3 font-mono">{row.edge_density.toFixed(4)}</td>
                <td className="py-2.5 px-3 font-mono">{row.file_mb.toFixed(2)} MB</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Full Notebook & Artefact Figure Gallery (17 WebP Figures) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-orange-400" />
              Complete Research Figure Gallery ({filteredFigures.length} Plots)
            </h3>
            <p className="text-xs text-slate-400">
              All plots generated by <code>EDA_and_audit_file.ipynb</code>,{' '}
              <code>Preprocessing.py</code>, and <code>data_augmentation.ipynb</code> (click
              any figure to enlarge).
            </p>
          </div>

          <div className="inline-flex rounded-xl bg-slate-900 p-1 border border-slate-800 self-start">
            {(
              [
                ['all', 'All Figures (17)'],
                ['raw', 'Raw EDA'],
                ['preprocessing', 'CLAHE & Preprocessing'],
                ['splits', 'Splits & Augmentation'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setGalleryGroup(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  galleryGroup === key
                    ? 'bg-[#1428A0] text-white keep-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className={galleryGroup === key ? 'keep-white' : ''}>{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredFigures.map((fig) => (
            <div
              key={fig.key}
              onClick={() => setLightbox(fig)}
              className="group cursor-pointer rounded-2xl border border-slate-800 bg-slate-900/70 hover:border-blue-500/50 overflow-hidden transition flex flex-col justify-between"
            >
              <div className="relative h-56 bg-slate-950 p-2 flex items-center justify-center overflow-hidden">
                <img
                  src={`/static/figures/${fig.key}.webp`}
                  alt={fig.title}
                  loading="lazy"
                  className="max-h-full max-w-full object-contain group-hover:scale-105 transition duration-300"
                />
                <div className="absolute top-2.5 right-2.5 rounded-lg bg-slate-950/80 p-1.5 text-slate-300 opacity-0 group-hover:opacity-100 transition">
                  <Maximize2 className="h-4 w-4" />
                </div>
              </div>
              <div className="p-4 border-t border-slate-800/80">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-white">{fig.title}</h4>
                  <span className="shrink-0 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase text-[#1428A0] shadow-sm">
                    {fig.group}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{fig.caption}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm p-4 sm:p-8 flex items-center justify-center"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-5xl w-full max-h-[92vh] rounded-3xl border border-slate-700 bg-slate-900 p-5 flex flex-col gap-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">{lightbox.title}</h3>
                <p className="text-xs text-slate-400">{lightbox.caption}</p>
              </div>
              <button
                onClick={() => setLightbox(null)}
                className="rounded-xl bg-slate-800 hover:bg-slate-700 p-2 text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-black rounded-2xl p-3 flex items-center justify-center">
              <img
                src={`/static/figures/${lightbox.key}.webp`}
                alt={lightbox.title}
                className="max-h-[75vh] w-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

