# schemas.py
# Pydantic models for what the API takes in and sends back.

from pydantic import BaseModel, Field, field_validator


class CheckRequest(BaseModel):
    # 2048 characters is the usual limit for a link, so a real one is never longer
    url: str = Field(min_length=1, max_length=2048, examples=["paypal.com.secure-login.tk/verify"])

    @field_validator("url")
    @classmethod
    def must_look_like_a_link(cls, value):
        value = value.strip()
        lower = value.lower()
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


class HealthResult(BaseModel):
    status: str

    model_config = {"json_schema_extra": {"examples": [{"status": "ok"}]}}


class ErrorResult(BaseModel):
    error: str
    detail: str

    model_config = {"json_schema_extra": {"examples": [
        {"error": "invalid input", "detail": "A link cannot have spaces in it"}
    ]}}