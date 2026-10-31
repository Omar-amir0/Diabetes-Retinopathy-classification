"""Generate a 4-slide widescreen PowerPoint deck (Pages 27, 28, 29, 30) ready to import into Canva."""
from __future__ import annotations

from pathlib import Path
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.util import Inches, Pt


def main() -> None:
    root = Path(__file__).resolve().parents[2]
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    NAVY = RGBColor(20, 40, 160)
    DARK_NAVY = RGBColor(15, 23, 42)
    TEAL = RGBColor(13, 148, 136)
    ORANGE = RGBColor(255, 122, 26)
    LIGHT_BG = RGBColor(248, 250, 252)
    CARD_BG = RGBColor(255, 255, 255)
    BORDER_GRAY = RGBColor(203, 213, 225)
    WHITE = RGBColor(255, 255, 255)

    slides_data = [
        {
            "page": "Page 27",
            "badge": "DEPLOYMENT & BACKEND ARCHITECTURE",
            "title": "FastAPI Backend & Clinical Preprocessing Pipeline",
            "subtitle": "Automated Retinal Enhancement, Quality Gating & Standardized Tensor Serving",
            "left_title": "Core Backend Engineering (FastAPI + Python 3.11)",
            "left_bullets": [
                "Asynchronous FastAPI Server: High-speed REST API serving preprocessing, 3-model inference, Grad-CAM, and LLM reasoning on Port 8000.",
                "EXIF & Aspect-Preserving Resize: Fixes camera orientation and applies 512x512 Lanczos padding without distorting circular optic discs.",
                "CIE-LAB L-Channel CLAHE (clip=2.0, grid=8x8): Boosts vascular & microaneurysm edge contrast by 3.2x (0.016 -> 0.052) while preserving RGB lesion color.",
                "Automated Quality Gate: Flags low-resolution, extreme aspect-ratio, or dark/under-exposed scans prior to inference.",
            ],
            "right_title": "Key REST API Endpoints & Pipeline Specs",
            "right_bullets": [
                "POST /api/predict/compare -> Full 3-Model Ensemble + Per-Model Grad-CAM",
                "POST /api/predict -> Single-Architecture Low-Latency Inference",
                "POST /api/explain -> Live LLM Clinical Reasoning & Multi-Turn Q&A",
                "GET /api/eda & /api/models -> Dataset Audit & Validation Telemetry",
                "Singleton Keras Model Registry -> Zero reload overhead per request",
            ],
            "kpi": ("3.2x Contrast Gain", "LAB-L CLAHE Vascular Edge Enhancement"),
        },
        {
            "page": "Page 28",
            "badge": "MULTI-MODEL ENSEMBLE & EXPLAINABLE AI",
            "title": "3-Model Calibrated Ensemble & Spatial Grad-CAM",
            "subtitle": "Combining EfficientNetB0, ResNet50 & Custom CNN with Retinal Quadrant Attribution",
            "left_title": "Reliability-Calibrated Soft-Voting Ensemble",
            "left_bullets": [
                "EfficientNetB0 (224x224): Best clinical alignment (0.8294 QWK, 77.45% Test Acc, 96.3% Grade 0 Specificity).",
                "ResNet50 (224x224): Deep residual feature extraction with Caffe zero-centered channel normalization.",
                "Custom 512x512 CNN: High-resolution local retinal texture stream (82.06% Validation Accuracy).",
                "Per-Grade Reliability Matrix: Weights EfficientNet (45%) & ResNet50 (35%) higher on Severe/Proliferative DR to prevent minority-class under-calling.",
            ],
            "right_title": "Automated Spatial Grad-CAM Telemetry",
            "right_bullets": [
                "tf.GradientTape Backpropagation: Extracted from the final convolutional feature map before Global Average Pooling.",
                "Circular Fundus Masking: Suppresses outer black padding artifacts so heatmaps highlight true retinal pathology.",
                "5-Zone Retinal Quantification: Computes activation scores across Central Macula + 4 Quadrants (Superior/Inferior Temporal & Nasal).",
                "Hotspot Coverage Metric: Calculates exact % of active lesion area (>= 0.60 activation) for clinical audit.",
            ],
            "kpi": ("0.8294 QWK", "Quadratic Weighted Kappa · 96.3% Healthy Specificity"),
        },
        {
            "page": "Page 29",
            "badge": "TELE-OPHTHALMOLOGY FRONTEND WORKSTATION",
            "title": "Medical React PACS & ICDR Clinical Triage UI",
            "subtitle": "Interactive Retinal Screening Studio, Dual Clinical Themes & EDA Audit Dashboards",
            "left_title": "Ophthalmic PACS & Screening Studio (React + TS + Tailwind)",
            "left_bullets": [
                "Dual Medical Themes: Clinical White Mode for outpatient clinics & Radiology Dark-Room Mode for contrast-sensitive fundus review.",
                "3-View Retinal Inspector: Instant toggle between Original Scan, 512x512 LAB-L CLAHE, and Per-Model Grad-CAM Heatmaps.",
                "Verified APTOS 2019 Benchmark Strip: 1-click testing across all 5 severity grades (Grade 0 to Grade 4) plus drag-and-drop upload.",
                "Printable Clinical Report: One-click diagnostic summary formatted for patient records and ophthalmology referrals.",
            ],
            "right_title": "Standardized ICDR / ETDRS Triage & Analytics",
            "right_bullets": [
                "ICD-10 Diagnostic Mapping: Automated coding from E11.9 (Normal) to E11.359 (Proliferative DR).",
                "Clinical Referral Flags: Auto-flags Referrable DR (rDR, Grade >= 2) and Vision-Threatening DR (vtDR, Grade >= 3).",
                "Interactive EDA & Camera-Bias Audit: Visualizes 3,662 raw vs. 6,315 balanced cohort and aspect-ratio shortcut discovery.",
                "Model Validation Explorer: Interactive confusion matrices, training curves, and per-class sensitivity/F1 benchmarks.",
            ],
            "kpi": ("Grades 0 - 4", "ICDR / ETDRS International Clinical Standard"),
        },
        {
            "page": "Page 30",
            "badge": "GENERATIVE AI & CLINICAL DECISION SUPPORT",
            "title": "AI Clinical Reasoning & Explainable LLM Copilot",
            "subtitle": "System-Prompt Grounded Diagnostic Explanations & Interactive Doctor Consultation",
            "left_title": "Zero-Hallucination Telemetry Grounding",
            "left_bullets": [
                "Ophthalmic Domain System Prompt: Encodes ICDR 5-stage criteria, ETDRS 4-2-1 severity rules, and model reliability profiles.",
                "Live Scan Telemetry Injection: Dynamically feeds the LLM the exact 5-class softmax probabilities, confidence margin, and 3-model votes.",
                "Spatial Grad-CAM Grounding: Passes the 5 retinal quadrant activation scores and hotspot % so the LLM explains WHERE the model looked.",
                "Multi-Provider Architecture: Runs live GPT-OSS 20B out-of-the-box with optional Google Gemini 2.5 Flash / Groq / OpenAI API support.",
            ],
            "right_title": "Bilingual Clinical Explainer & Multi-Turn Chat",
            "right_bullets": [
                "Why This Grade Was Chosen: Structured 4-pillar breakdown (Probability Margin, Grad-CAM Evidence, Lesion Signature, Ensemble Consensus).",
                "Bilingual Medical Output (Arabic & English): Instant RTL/LTR switching tailored for both clinicians and patients.",
                "Interactive Multi-Turn Consultation: Doctors can ask free-form follow-up questions about model disagreement or treatment urgency.",
                "Transparent System Prompt Inspector: Built-in UI drawer to inspect the live clinical system prompt during presentation defense.",
            ],
            "kpi": ("XAI + Live LLM", "Bilingual (AR/EN) Grounded Clinical Reasoning"),
        },
    ]

    logo_path = root / "frontend" / "public" / "logo.png"

    for sd in slides_data:
        slide = prs.slides.add_slide(blank_layout)
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
        bg.fill.solid()
        bg.fill.fore_color.rgb = LIGHT_BG
        bg.line.fill.background()

        # Top Navy Banner
        header = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, Inches(1.45))
        header.fill.solid()
        header.fill.fore_color.rgb = NAVY
        header.line.fill.background()

        # Page pill
        pill = slide.shapes.add_shape(
            MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.6), Inches(0.22), Inches(4.5), Inches(0.32)
        )
        pill.fill.solid()
        pill.fill.fore_color.rgb = TEAL
        pill.line.fill.background()
        tf_p = pill.text_frame
        p = tf_p.paragraphs[0]
        p.text = f"{sd['page']}  •  {sd['badge']}"
        p.font.size = Pt(10)
        p.font.bold = True
        p.font.color.rgb = WHITE

        # Title & Subtitle
        tb = slide.shapes.add_textbox(Inches(0.6), Inches(0.55), Inches(10.8), Inches(0.85))
        tf = tb.text_frame
        tf.word_wrap = True
        p1 = tf.paragraphs[0]
        p1.text = sd["title"]
        p1.font.size = Pt(24)
        p1.font.bold = True
        p1.font.color.rgb = WHITE
        p2 = tf.add_paragraph()
        p2.text = sd["subtitle"]
        p2.font.size = Pt(13)
        p2.font.color.rgb = RGBColor(191, 219, 254)

        if logo_path.is_file():
            slide.shapes.add_picture(str(logo_path), Inches(12.0), Inches(0.18), width=Inches(0.95))

        # Left Card
        left_card = slide.shapes.add_shape(
            MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.6), Inches(1.75), Inches(5.9), Inches(5.15)
        )
        left_card.fill.solid()
        left_card.fill.fore_color.rgb = CARD_BG
        left_card.line.color.rgb = BORDER_GRAY
        left_card.line.width = Pt(1.5)

        ltb = slide.shapes.add_textbox(Inches(0.85), Inches(1.95), Inches(5.4), Inches(4.75))
        ltf = ltb.text_frame
        ltf.word_wrap = True
        lp0 = ltf.paragraphs[0]
        lp0.text = sd["left_title"]
        lp0.font.size = Pt(16)
        lp0.font.bold = True
        lp0.font.color.rgb = NAVY
        lp0.space_after = Pt(10)

        for b in sd["left_bullets"]:
            bp = ltf.add_paragraph()
            bp.text = f"•  {b}"
            bp.font.size = Pt(13)
            bp.font.color.rgb = DARK_NAVY
            bp.space_after = Pt(10)

        # Right Card
        right_card = slide.shapes.add_shape(
            MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.8), Inches(1.75), Inches(5.9), Inches(3.85)
        )
        right_card.fill.solid()
        right_card.fill.fore_color.rgb = CARD_BG
        right_card.line.color.rgb = BORDER_GRAY
        right_card.line.width = Pt(1.5)

        rtb = slide.shapes.add_textbox(Inches(7.05), Inches(1.95), Inches(5.4), Inches(3.45))
        rtf = rtb.text_frame
        rtf.word_wrap = True
        rp0 = rtf.paragraphs[0]
        rp0.text = sd["right_title"]
        rp0.font.size = Pt(16)
        rp0.font.bold = True
        rp0.font.color.rgb = TEAL
        rp0.space_after = Pt(10)

        for b in sd["right_bullets"]:
            bp = rtf.add_paragraph()
            bp.text = f"•  {b}"
            bp.font.size = Pt(13)
            bp.font.color.rgb = DARK_NAVY
            bp.space_after = Pt(8)

        # Bottom Right KPI Highlight Box
        kpi_box = slide.shapes.add_shape(
            MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.8), Inches(5.8), Inches(5.9), Inches(1.1)
        )
        kpi_box.fill.solid()
        kpi_box.fill.fore_color.rgb = DARK_NAVY
        kpi_box.line.color.rgb = ORANGE
        kpi_box.line.width = Pt(2)

        ktb = slide.shapes.add_textbox(Inches(7.05), Inches(5.92), Inches(5.4), Inches(0.85))
        ktf = ktb.text_frame
        ktf.word_wrap = True
        kp1 = ktf.paragraphs[0]
        kp1.text = sd["kpi"][0]
        kp1.font.size = Pt(22)
        kp1.font.bold = True
        kp1.font.color.rgb = ORANGE
        kp2 = ktf.add_paragraph()
        kp2.text = sd["kpi"][1]
        kp2.font.size = Pt(12)
        kp2.font.color.rgb = WHITE

    out_file = root / "RetinaScan_Canva_Slides_27_to_30.pptx"
    prs.save(out_file)
    print("Saved:", out_file)


if __name__ == "__main__":
    main()

