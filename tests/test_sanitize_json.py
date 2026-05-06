"""
Unit tests for _sanitize_json from contracts/auditlens.py.

Run with: python -m pytest tests/ -v
"""
import json
import re
import pytest


# Extracted directly so tests run without the genlayer dependency.
def _sanitize_json(json_str: str) -> dict:
    s = json_str.strip()
    s = re.sub(r'^```(?:json)?\n?', '', s)
    s = re.sub(r'\n?```$', '', s).strip()
    first_brace = s.find("{")
    last_brace = s.rfind("}")
    if first_brace == -1 or last_brace == -1:
        raise ValueError("No JSON object found in LLM response")
    s = s[first_brace : last_brace + 1]
    s = re.sub(r",(?=\s*[}\]])", "", s)
    return json.loads(s)


class TestSanitizeJson:
    def test_plain_json(self):
        raw = '{"overall_score": 80, "findings": [], "summary": "ok"}'
        result = _sanitize_json(raw)
        assert result["overall_score"] == 80
        assert result["summary"] == "ok"

    def test_strips_leading_json_fence(self):
        raw = '```json\n{"overall_score": 75}\n```'
        result = _sanitize_json(raw)
        assert result["overall_score"] == 75

    def test_strips_leading_plain_fence(self):
        raw = '```\n{"overall_score": 60}\n```'
        result = _sanitize_json(raw)
        assert result["overall_score"] == 60

    def test_does_not_corrupt_backticks_in_content(self):
        raw = '{"recommendation": "Replace ```json with proper parsing"}'
        result = _sanitize_json(raw)
        assert "```json" in result["recommendation"]

    def test_removes_trailing_comma_in_object(self):
        raw = '{"overall_score": 50, "summary": "test",}'
        result = _sanitize_json(raw)
        assert result["overall_score"] == 50

    def test_removes_trailing_comma_in_array(self):
        raw = '{"findings": ["a", "b",]}'
        result = _sanitize_json(raw)
        assert result["findings"] == ["a", "b"]

    def test_raises_on_no_json_object(self):
        with pytest.raises(ValueError, match="No JSON object found"):
            _sanitize_json("just some text with no braces")

    def test_raises_on_empty_string(self):
        with pytest.raises(ValueError, match="No JSON object found"):
            _sanitize_json("")

    def test_raises_on_invalid_json_after_cleanup(self):
        with pytest.raises(json.JSONDecodeError):
            _sanitize_json("{bad json: no quotes}")

    def test_strips_leading_whitespace_around_fence(self):
        raw = '  ```json\n{"overall_score": 90}\n```  '
        result = _sanitize_json(raw)
        assert result["overall_score"] == 90

    def test_full_audit_payload(self):
        payload = {
            "overall_score": 55,
            "findings": [
                {
                    "category": "prompt_injection",
                    "severity": "critical",
                    "line": None,
                    "description": "Unvalidated input passed to exec_prompt",
                    "recommendation": "Sanitize user input",
                }
            ],
            "summary": "One critical issue found.",
        }
        raw = "```json\n" + json.dumps(payload) + "\n```"
        result = _sanitize_json(raw)
        assert result["overall_score"] == 55
        assert len(result["findings"]) == 1
        assert result["findings"][0]["severity"] == "critical"
