import {
  ComparePredictResponse,
  EdaResponse,
  LLMExplanationResponse,
  ModelKey,
  ModelsResponse,
  SampleFundus,
  SinglePredictResponse,
} from './types';

export async function fetchModels(): Promise<ModelsResponse> {
  const res = await fetch('/api/models');
  if (!res.ok) throw new Error('Failed to load models metadata');
  return res.json();
}

export async function fetchEda(): Promise<EdaResponse> {
  const res = await fetch('/api/eda');
  if (!res.ok) throw new Error('Failed to load EDA data');
  return res.json();
}

export async function fetchSamples(): Promise<{ samples: SampleFundus[] }> {
  const res = await fetch('/api/samples');
  if (!res.ok) throw new Error('Failed to load sample images');
  return res.json();
}

export async function predictSingle(
  file: File,
  model: ModelKey,
  gradcam = true
): Promise<SinglePredictResponse> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`/api/predict?model=${model}&gradcam=${gradcam}`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Prediction failed' }));
    throw new Error(err.detail || 'Prediction failed');
  }
  return res.json();
}

export async function predictCompare(
  file: File,
  gradcam = true
): Promise<ComparePredictResponse> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`/api/predict/compare?gradcam=${gradcam}`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Ensemble prediction failed' }));
    throw new Error(err.detail || 'Ensemble prediction failed');
  }
  return res.json();
}

export async function predictSampleCompare(
  grade: number,
  gradcam = true
): Promise<ComparePredictResponse> {
  const res = await fetch(`/api/predict/sample/${grade}?mode=compare&gradcam=${gradcam}`, {
    method: 'POST',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Sample prediction failed' }));
    throw new Error(err.detail || 'Sample prediction failed');
  }
  return res.json();
}

export async function predictSampleSingle(
  grade: number,
  model: ModelKey,
  gradcam = true
): Promise<SinglePredictResponse> {
  const res = await fetch(
    `/api/predict/sample/${grade}?mode=single&model=${model}&gradcam=${gradcam}`,
    { method: 'POST' }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Sample prediction failed' }));
    throw new Error(err.detail || 'Sample prediction failed');
  }
  return res.json();
}

export async function requestLLMExplanation(params: {
  prediction_payload: ComparePredictResponse | SinglePredictResponse;
  language: 'ar' | 'en';
  user_question?: string;
  api_key?: string;
  provider?: 'auto' | 'gemini' | 'groq' | 'openai';
  conversation_history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}): Promise<LLMExplanationResponse> {
  const res = await fetch('/api/explain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'LLM explanation failed' }));
    throw new Error(err.detail || 'LLM explanation failed');
  }
  return res.json();
}

