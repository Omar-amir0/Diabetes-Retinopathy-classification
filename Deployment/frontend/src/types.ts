export type ModelKey = 'efficientnet' | 'resnet50' | 'cnn';

export interface DRClassInfo {
  grade: number;
  label: string;
  short: string;
  color: string;
  description: string;
  recommendation: string;
  urgency: string;
}

export interface ClassProb {
  grade: number;
  label: string;
  short: string;
  probability: number;
  color: string;
}

export interface GradcamStats {
  dominant_region: string;
  secondary_region: string;
  hotspot_coverage_pct: number;
  peak_location: { x_norm: number; y_norm: number };
  region_scores: Record<string, number>;
}

export interface LLMExplanationLang {
  title: string;
  confidence_badge: string;
  summary: string;
  why_chosen: string[];
  clinical_meaning: string;
  next_step: string;
}

export interface LLMExplanationResponse {
  provider: string;
  model_used: string;
  predicted_grade: number;
  predicted_label: string;
  system_prompt: string;
  gradcam_stats?: GradcamStats;
  en: LLMExplanationLang;
  ar: LLMExplanationLang;
  live_response?: string;
  question_answered?: string | null;
}

export interface PredictionItem {
  model_key: string;
  model_name: string;
  predicted_grade: number;
  predicted_label: string;
  short_label: string;
  confidence: number;
  color: string;
  urgency: string;
  description: string;
  recommendation: string;
  latency_ms: number;
  gradcam_image: string | null;
  gradcam_stats?: GradcamStats | null;
  probabilities: ClassProb[];
  agreement?: boolean;
  votes?: Record<string, number>;
  weights?: Record<string, number>;
}

export interface SinglePredictResponse {
  image_size: { width: number; height: number };
  warnings: string[];
  original_preview: string;
  clahe_preview: string;
  result: PredictionItem;
  llm_explanation?: LLMExplanationResponse;
  ground_truth_grade?: number;
}

export interface ComparePredictResponse {
  image_size: { width: number; height: number };
  warnings: string[];
  original_preview: string;
  clahe_preview: string;
  ensemble: PredictionItem;
  models: PredictionItem[];
  llm_explanation?: LLMExplanationResponse;
  ground_truth_grade?: number;
}

export interface EpochMetrics {
  epoch: number;
  accuracy: number;
  loss: number;
  val_accuracy: number;
  val_loss: number;
}

export interface PerClassMetric {
  grade: number;
  precision: number;
  recall: number;
  f1: number;
  support: number;
}

export interface ModelMeta {
  key: ModelKey;
  name: string;
  family: string;
  file: string;
  input_size: number;
  preprocessing: string;
  total_params: number;
  trainable_params: number;
  size_mb: number;
  architecture: string[];
  training: {
    optimizer: string;
    loss: string;
    batch_size: number;
    epochs: number;
    best_epoch: number;
    early_stopping: string;
  };
  evaluation_split: 'test' | 'validation';
  metrics: {
    accuracy: number;
    qwk: number | null;
    macro_f1: number | null;
    weighted_f1: number | null;
    val_accuracy: number;
  };
  per_class: PerClassMetric[] | null;
  confusion_matrix: number[][] | null;
  figures: {
    training_curves: string | null;
    confusion_matrix: string | null;
  };
  highlights: string[];
  recommended: boolean;
  history: EpochMetrics[];
}

export interface ModelsResponse {
  classes: DRClassInfo[];
  models: ModelMeta[];
  ensemble: {
    method: string;
    note: string;
  };
}

export interface EdaResponse {
  dataset: {
    name: string;
    source: string;
    url: string;
    labelled_images: number;
    unlabelled_test_images: number;
    image_format: string;
    official_metric: string;
    audit: Record<string, string | number>;
  };
  class_distribution: { grade: number; label: string; count: number; percent: number }[];
  top_dimensions: { size: string; count: number }[];
  unique_resolutions: number;
  per_grade_stats: {
    grade: number;
    width: number;
    height: number;
    aspect_ratio: number;
    brightness_mean: number;
    brightness_std: number;
    saturation_mean: number;
    edge_density: number;
    file_mb: number;
  }[];
  preprocessing: {
    steps: { title: string; detail: string }[];
    alternatives_tested: { name: string; detail: string; figure: string }[];
  };
  clahe_effect: {
    metric: string;
    label: string;
    raw: number;
    processed: number;
    change: number;
    ci_low: number;
    ci_high: number;
  }[];
  clahe_sample_size: number;
  splits: {
    split: string;
    total: number;
    counts: number[];
    originals: number;
    augmented: number;
  }[];
  augmentation: {
    policy: string;
    transforms: string[];
    per_class: { grade: number; label: string; original: number; augmented: number }[];
    leakage_check: string;
  };
  insights: { title: string; detail: string; type: 'warning' | 'success' | 'info' }[];
  figures: { key: string; title: string; group: string; caption: string }[];
}

export interface SampleFundus {
  grade: number;
  label: string;
  short: string;
  color: string;
  description: string;
  url: string;
}

