# schemas.py
# Pydantic models for what the API takes in and sends back.

import os
import re

from pydantic import BaseModel, Field, field_validator

# Defence 2 (denial of service). Keep this "on". We only turn it "off" in .env for the video.
DOS_DEFENCE = os.environ.get("DOS_DEFENCE", "on") == "on"

# A link pattern that gets copied around a lot online. It has a * inside another *, so a
# short crafted input makes it try millions of ways to match and freezes the whole server.
# This is the regex problem from the Week 10 lecture (the Cloudflare outage).
# We only use it when DOS_DEFENCE is off, to show the attack in the video.
UNSAFE_LINK_PATTERN = re.compile(r"^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$")


class CheckRequest(BaseModel):
    # 2048 characters is the usual limit for a link, so a real one is never longer
    url: str = Field(min_length=1, max_length=2048, examples=["paypal.com.secure-login.tk/verify"])
    # a random id the front end makes for each browser session, so history is kept apart
    session_id: str = Field(min_length=1, max_length=64, examples=["b7e2c3a0-1d4f-4c2a-9a51-2f6d3c1e8b90"])

    @field_validator("url")
    @classmethod
    def must_look_like_a_link(cls, value):
        value = value.strip()
        lower = value.lower()
        if not DOS_DEFENCE:
            # UNSAFE, only for the video: the slow regex instead of the simple checks below
            if not UNSAFE_LINK_PATTERN.match(lower):
                raise ValueError("That does not look like a link")
            return value
        # Defence 2, part 2 (safe): simple checks that take the same short time for any input
        if value == "":
            raise ValueError("Please enter a link")
        if any(ch.isspace() for ch in value):
            raise ValueError("A link cannot have spaces in it")
        if "." not in value:
            raise ValueError("That does not look like a link")
        # only web links, so things like javascript: or file: are refused
        if "://" in lower and not lower.startswith(("http://", "https://")):
            raise ValueError("Only http and https links can be checked")
        if lower.startswith(("javascript:", "data:", "file:", "vbscript:")):
            raise ValueError("Only http and https links can be checked")
        return value


class CheckResult(BaseModel):
    url: str
    label: str            # "phishing" or "legitimate"
    confidence: float     # how sure the model is about the label, 0 to 1
    score: int            # risk score from 0 to 100
    risk_level: str       # "Low", "Medium" or "High"
    warning_signs: list[str]

    model_config = {"json_schema_extra": {"examples": [{
        "url": "paypal.com.secure-login.tk/verify",
        "label": "phishing",
        "confidence": 0.959,
        "score": 96,
        "risk_level": "High",
        "warning_signs": [
            "Uses a website ending that scammers use a lot",
            "Mentions a big brand, but is not that brand's website",
            "Has words like login, verify or account",
        ],
    }]}}


class HistoryItem(BaseModel):
    id: int
    url: str
    label: str
    confidence: float
    score: int
    risk_level: str
    checked_at: str

    model_config = {"json_schema_extra": {"examples": [{
        "id": 1,
        "url": "google.com",
        "label": "legitimate",
        "confidence": 0.664,
        "score": 34,
        "risk_level": "Medium",
        "checked_at": "2026-11-04T09:30:00",
    }]}}


class DeleteResult(BaseModel):
    deleted: int

    model_config = {"json_schema_extra": {"examples": [{"deleted": 3}]}}


class HealthResult(BaseModel):
    status: str

    model_config = {"json_schema_extra": {"examples": [{"status": "ok"}]}}


class ErrorResult(BaseModel):
    error: str
    detail: str

    model_config = {"json_schema_extra": {"examples": [
        {"error": "invalid input", "detail": "A link cannot have spaces in it"}
    ]}}