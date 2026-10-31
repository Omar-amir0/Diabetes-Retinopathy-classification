import React from 'react';
import {
  ArrowRight,
  BarChart3,
  Check,
  Database,
  Layers,
  Microscope,
  ScanLine,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { DRClassInfo, EdaResponse, ModelsResponse, SampleFundus } from '../types';

interface Props {
  modelsData: ModelsResponse;
  edaData: EdaResponse;
  samples: SampleFundus[];
  onGoDiagnose: (sampleGrade?: number) => void;
  onGoTab: (tab: 'diagnose' | 'eda' | 'models' | 'pipeline') => void;
}

const clinicalMetadata: Record<number, { code: string; triage: string; detail: string }> = {
  0: { code: 'E11.9', triage: 'Routine screening', detail: 'No visible diabetic retinopathy' },
  1: { code: 'E11.329', triage: 'Monitor', detail: 'Microaneurysms only' },
  2: { code: 'E11.339', triage: 'Refer', detail: 'Moderate non-proliferative DR' },
  3: { code: 'E11.349', triage: 'Priority referral', detail: 'Severe non-proliferative DR' },
  4: { code: 'E11.359', triage: 'Urgent referral', detail: 'Proliferative DR' },
};

const metricCards = [
  { label: 'Validated images', value: '6,315', detail: 'Balanced across five ICDR grades', icon: Database },
  { label: 'Quadratic kappa', value: '0.8294', detail: 'Strong ordinal agreement', icon: BarChart3 },
  { label: 'Healthy sensitivity', value: '96.3%', detail: 'Reliable rule-out performance', icon: ShieldCheck },
  { label: 'Retinal detail gain', value: '3.2×', detail: 'After LAB-L CLAHE enhancement', icon: ScanLine },
];

export const HomeTab: React.FC<Props> = ({ modelsData, edaData, samples, onGoDiagnose, onGoTab }) => {
  const bestModel = modelsData.models.find((model) => model.recommended) || modelsData.models[0];

  return (
    <div className="space-y-16 sm:space-y-20">
      <section className="grid items-center gap-12 py-8 sm:py-12 md:grid-cols-[1.08fr_0.92fr] lg:py-16">
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#cfd5ff] bg-[#f5f6ff] px-3 py-1.5 text-xs font-semibold text-[#1428A0]">
            <Sparkles className="size-3.5" />
            Samsung Innovation Campus · AI for healthcare
          </div>
          <h1 className="text-balance font-display text-4xl font-bold leading-[1.08] text-slate-950 sm:text-5xl lg:text-[64px]">
            Earlier insight for healthier vision.
          </h1>
          <p className="mt-6 max-w-2xl text-pretty text-base leading-7 text-slate-600 sm:text-lg">
            RetinaScan AI turns fundus images into clear, five-grade diabetic retinopathy screening results with calibrated model confidence and visual evidence.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => onGoDiagnose()}
              className="keep-white inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#1428A0] px-5 text-sm font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-[#0f207f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1428A0] focus-visible:ring-offset-2"
            >
              Start AI screening
              <ArrowRight className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => onGoTab('models')}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition-colors duration-150 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1428A0]"
            >
              <Layers className="size-4 text-[#1428A0]" />
              Explore the model lab
            </button>
          </div>

          <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-slate-500">
            {['5-grade ICDR scale', 'Multi-model ensemble', 'Grad-CAM evidence'].map((item) => (
              <span key={item} className="inline-flex items-center gap-1.5">
                <Check className="size-3.5 text-emerald-600" strokeWidth={2.5} />
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-xl flex-col items-center justify-center py-6 text-center">
          <img
            src="/logo.png"
            alt="RetinaScan AI logo"
            className="size-64 object-contain sm:size-80"
          />
          <div className="mt-5 flex items-center gap-3 text-left">
            <span className="flex size-10 items-center justify-center rounded-xl bg-[#eef1ff] text-[#1428A0]"><Microscope className="size-5" /></span>
            <div><p className="text-xs font-medium text-slate-500">Best validation performance</p><p className="font-display text-lg font-bold tabular-nums text-slate-950">QWK {bestModel.metrics.qwk}</p></div>
          </div>
        </div>
      </section>

      <section aria-labelledby="impact-heading">
        <div className="mb-6 max-w-2xl">
          <p className="text-sm font-semibold text-[#1428A0]">Measured performance</p>
          <h2 id="impact-heading" className="mt-2 text-balance font-display text-3xl font-bold text-slate-950">Evidence, not decoration.</h2>
          <p className="mt-2 text-pretty text-sm leading-6 text-slate-600">Every number is tied to the APTOS clinical workflow and held-out validation data.</p>
        </div>
        <div className="grid border-y border-slate-200 sm:grid-cols-2 lg:grid-cols-4">
          {metricCards.map(({ label, value, detail, icon: Icon }, index) => (
            <article key={label} className={`py-6 sm:px-6 ${index > 0 ? 'lg:border-l lg:border-slate-200' : ''} ${index % 2 === 1 ? 'sm:border-l sm:border-slate-200' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <span className="text-sm font-medium text-slate-500">{label}</span>
                <span className="flex size-9 items-center justify-center rounded-lg bg-[#eef1ff] text-[#1428A0]"><Icon className="size-4" /></span>
              </div>
              <p className="mt-5 font-display text-3xl font-bold tabular-nums text-slate-950">{label === 'Validated images' ? edaData.dataset.labelled_images.toLocaleString() : value}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="scale-heading">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-[#1428A0]">Clinical reference</p>
            <h2 id="scale-heading" className="mt-2 text-balance font-display text-3xl font-bold text-slate-950">Five grades. One clear care pathway.</h2>
            <p className="mt-2 text-pretty text-sm leading-6 text-slate-600">Review a representative case, clinical status, and recommended next step for every ICDR grade.</p>
          </div>
          <button type="button" onClick={() => onGoTab('eda')} className="inline-flex items-center gap-2 self-start rounded-lg px-1 py-2 text-sm font-semibold text-[#1428A0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1428A0] sm:self-auto">
            View data audit <ArrowRight className="size-4" />
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {modelsData.classes.map((cls: DRClassInfo) => {
            const sample = samples.find((item) => item.grade === cls.grade);
            const meta = clinicalMetadata[cls.grade];
            const urgent = cls.grade >= 3;
            return (
              <article key={cls.grade} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-950">
                  {sample && <img src={sample.url} alt={`${cls.label} retinal sample`} className="size-full object-cover transition-transform duration-200 group-hover:scale-[1.02]" />}
                  <span className="absolute left-3 top-3 rounded-lg bg-white/95 px-2.5 py-1 text-xs font-bold text-slate-900 shadow-sm">Grade {cls.grade}</span>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display text-base font-bold text-slate-950">{cls.label}</h3>
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">{meta.code}</span>
                  </div>
                  <p className={`mt-3 text-xs font-semibold ${urgent ? 'text-orange-700' : 'text-[#1428A0]'}`}>{meta.triage}</p>
                  <p className="mt-1 min-h-10 text-xs leading-5 text-slate-500">{meta.detail}</p>
                  <button
                    type="button"
                    onClick={() => onGoDiagnose(cls.grade)}
                    className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 transition-colors duration-150 hover:border-[#1428A0] hover:text-[#1428A0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1428A0]"
                  >
                    Screen this case <ArrowRight className="size-3.5" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="grid gap-10 border-y border-slate-200 py-10 sm:py-14 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
        <div>
          <span className="inline-flex size-11 items-center justify-center rounded-xl bg-[#eef1ff] text-[#1428A0]"><Sparkles className="size-5" /></span>
          <h2 className="mt-5 text-balance font-display text-3xl font-bold text-slate-950">Built for a clinical story judges can follow.</h2>
          <p className="mt-3 text-pretty text-sm leading-6 text-slate-600">From image quality and preprocessing to model comparison and explainability, every stage stays inspectable.</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-3 sm:divide-x sm:divide-slate-200">
          {[
            ['01', 'Prepare', 'Color-preserving CLAHE and circular retinal crop'],
            ['02', 'Predict', 'Three-model reliability-calibrated ensemble'],
            ['03', 'Explain', 'Grad-CAM focus and actionable triage result'],
          ].map(([step, title, detail]) => (
            <div key={step} className="sm:px-6 sm:first:pl-0 sm:last:pr-0">
              <span className="text-xs font-bold text-[#1428A0]">{step}</span>
              <h3 className="mt-4 font-display text-lg font-bold text-slate-950">{title}</h3>
              <p className="mt-2 text-xs leading-5 text-slate-600">{detail}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
