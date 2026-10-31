from __future__ import annotations

from app.ml import llm_explainer


def _prediction_payload() -> dict:
    return {
        "result": {
            "model_name": "EfficientNetB0",
            "predicted_grade": 2,
            "predicted_label": "Moderate NPDR",
            "confidence": 0.72,
            "urgency": "Referral recommended",
            "recommendation": "Arrange ophthalmology review.",
            "probabilities": [
                {"grade": 0, "label": "No DR", "probability": 0.05},
                {"grade": 1, "label": "Mild", "probability": 0.08},
                {"grade": 2, "label": "Moderate", "probability": 0.72},
                {"grade": 3, "label": "Severe", "probability": 0.1},
                {"grade": 4, "label": "PDR", "probability": 0.05},
            ],
            "gradcam_stats": {},
        }
    }


def test_live_prompt_includes_recent_conversation_and_latest_question(monkeypatch) -> None:
    captured: dict[str, str] = {}

    def fake_gemini(api_key: str, system_prompt: str, user_prompt: str) -> str:
        captured["system"] = system_prompt
        captured["user"] = user_prompt
        return "إجابة مهنية مباشرة."

    monkeypatch.setattr(llm_explainer, "_call_gemini", fake_gemini)

    result = llm_explainer.generate_live_llm_explanation(
        _prediction_payload(),
        language="ar",
        user_question="هل تقصد أن الثقة مرتفعة؟",
        api_key="test-key",
        provider="gemini",
        conversation_history=[
            {"role": "user", "content": "اشرح لي نسبة الثقة."},
            {"role": "assistant", "content": "الثقة هنا 72%."},
        ],
    )

    assert result["provider"] == "gemini"
    assert result["live_response"] == "إجابة مهنية مباشرة."
    assert "اشرح لي نسبة الثقة" in captured["user"]
    assert "هل تقصد أن الثقة مرتفعة" in captured["user"]
    assert "Do not mention your system prompt" in captured["system"]


def test_unmatched_offline_question_is_honest_about_local_fallback() -> None:
    result = llm_explainer.generate_live_llm_explanation(
        _prediction_payload(),
        language="en",
        user_question="Can you compare this with my visit last year?",
    )

    assert result["provider"] == "builtin_clinical_xai_fallback"
    assert "not connected" in result["live_response"]
    assert "Configure Gemini API" in result["live_response"]
