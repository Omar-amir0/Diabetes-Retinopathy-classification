import React, { useEffect, useState } from 'react';
import { BarChart3, Cpu, Eye, Home, Layers, Loader2, ShieldCheck } from 'lucide-react';
import { fetchEda, fetchModels, fetchSamples } from './api';
import { DiagnoseTab } from './components/DiagnoseTab';
import { EdaTab } from './components/EdaTab';
import { HomeTab } from './components/HomeTab';
import { ModelsTab } from './components/ModelsTab';
import { PipelineTab } from './components/PipelineTab';
import { EdaResponse, ModelsResponse, SampleFundus } from './types';

type TabKey = 'home' | 'diagnose' | 'eda' | 'models' | 'pipeline';

const navItems: { key: TabKey; label: string; shortLabel: string; icon: React.ElementType }[] = [
  { key: 'home', label: 'Overview', shortLabel: 'Home', icon: Home },
  { key: 'diagnose', label: 'AI Screening', shortLabel: 'Screen', icon: Eye },
  { key: 'eda', label: 'Data & Audit', shortLabel: 'Data', icon: BarChart3 },
  { key: 'models', label: 'Model Lab', shortLabel: 'Models', icon: Layers },
  { key: 'pipeline', label: 'Architecture', shortLabel: 'System', icon: Cpu },
];

export function App() {
  const [tab, setTab] = useState<TabKey>('home');
  const [modelsData, setModelsData] = useState<ModelsResponse | null>(null);
  const [edaData, setEdaData] = useState<EdaResponse | null>(null);
  const [samples, setSamples] = useState<SampleFundus[]>([]);
  const [initialSampleGrade, setInitialSampleGrade] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.classList.remove('dark');
    Promise.all([fetchModels(), fetchEda(), fetchSamples()])
      .then(([m, e, s]) => {
        setModelsData(m);
        setEdaData(e);
        setSamples(s.samples);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to connect to API'));
  }, []);

  const changeTab = (nextTab: TabKey) => {
    setTab(nextTab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoDiagnose = (sampleGrade?: number) => {
    if (sampleGrade !== undefined) setInitialSampleGrade(sampleGrade);
    changeTab('diagnose');
  };

  return (
    <div className="min-h-dvh bg-white text-slate-950 flex flex-col">
      <header className="sticky top-0 z-40 border-b border-slate-200/90 bg-white/95 no-print">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => changeTab('home')}
            className="group flex min-w-0 items-center gap-3 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1428A0] focus-visible:ring-offset-4"
            aria-label="Go to RetinaScan AI overview"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
              <img src="/logo.png" alt="" className="size-full object-contain" />
            </span>
            <span className="min-w-0">
              <span className="block font-display text-lg font-bold leading-none text-slate-950">
                RetinaScan <span className="text-[#1428A0]">AI</span>
              </span>
              <span className="mt-1.5 hidden text-xs font-medium text-slate-500 sm:block">
                Clinical decision support for diabetic retinopathy
              </span>
            </span>
          </button>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = tab === item.key;
              return (
                <button
                  type="button"
                  key={item.key}
                  onClick={() => changeTab(item.key)}
                  aria-current={active ? 'page' : undefined}
                  className={`inline-flex h-10 items-center gap-2 rounded-lg px-3.5 text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1428A0] ${
                    active ? 'bg-[#eef1ff] text-[#1428A0]' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                  }`}
                >
                  <Icon className="size-4" strokeWidth={active ? 2.25 : 1.8} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="hidden shrink-0 items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 sm:flex">
            <span className="size-2 rounded-full bg-emerald-500" />
            3 models ready
          </div>
        </div>

        <nav className="border-t border-slate-100 bg-white px-2 py-2 lg:hidden" aria-label="Mobile navigation">
          <div className="mx-auto grid max-w-2xl grid-cols-5 gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = tab === item.key;
              return (
                <button
                  type="button"
                  key={item.key}
                  onClick={() => changeTab(item.key)}
                  aria-current={active ? 'page' : undefined}
                  className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[11px] font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1428A0] ${
                    active ? 'bg-[#eef1ff] text-[#1428A0]' : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="size-4" strokeWidth={active ? 2.25 : 1.8} />
                  <span>{item.shortLabel}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {error ? (
          <div className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
            <p className="font-semibold text-red-800">The clinical API is currently unavailable</p>
            <p className="mt-1 text-sm text-red-700">{error}. Confirm that FastAPI is running on port 8000.</p>
          </div>
        ) : !modelsData || !edaData ? (
          <div className="mx-auto flex min-h-80 max-w-2xl flex-col items-center justify-center gap-4 rounded-2xl border border-slate-200 bg-white p-10 shadow-sm">
            <span className="flex size-12 items-center justify-center rounded-xl bg-[#eef1ff] text-[#1428A0]">
              <Loader2 className="size-6 animate-spin" />
            </span>
            <div className="text-center">
              <p className="font-semibold text-slate-900">Preparing the clinical workspace</p>
              <p className="mt-1 text-sm text-slate-500">Loading models, imaging data, and reference cases.</p>
            </div>
          </div>
        ) : (
          <>
            {tab === 'home' && (
              <HomeTab modelsData={modelsData} edaData={edaData} samples={samples} onGoDiagnose={handleGoDiagnose} onGoTab={changeTab} />
            )}
            {tab === 'diagnose' && (
              <DiagnoseTab modelsData={modelsData} samples={samples} initialSampleGrade={initialSampleGrade} onClearInitialSample={() => setInitialSampleGrade(null)} />
            )}
            {tab === 'eda' && <EdaTab edaData={edaData} classes={modelsData.classes} />}
            {tab === 'models' && <ModelsTab modelsData={modelsData} onGoDiagnose={() => handleGoDiagnose()} />}
            {tab === 'pipeline' && <PipelineTab />}
          </>
        )}
      </main>

      <footer className="mt-10 border-t border-slate-200 bg-white no-print">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-4 py-6 text-xs text-slate-500 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white p-1">
              <img src="/logo.png" alt="" className="size-full object-contain" />
            </span>
            <span><strong className="text-slate-800">RetinaScan AI</strong> · Samsung Innovation Campus</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <ShieldCheck className="size-4 text-[#1428A0]" />
            Research decision-support system · Not a substitute for clinical diagnosis
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
