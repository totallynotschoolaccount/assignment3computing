# predictor.py
# Loads the model and turns one URL into a prediction.
# Most of this comes from predict.py in Assignment 2.

import hashlib

import joblib
import pandas as pd

from features import FEATURE_NAMES, extract_features

# warning signs in plain English (same as predict.py in A2)
WARNINGS = {
    "has_ip": "Uses a number (IP address) instead of a website name",
    "has_at": "Has an @ sign, which can hide the real website",
    "has_punycode": "Has foreign letters that can look like normal ones",
    "suspicious_tld": "Uses a website ending that scammers use a lot",
    "is_shortener": "Is a short link that hides the real website",
    "brand_not_in_domain": "Mentions a big brand, but is not that brand's website",
    "lookalike_brand": "Has a fake spelling of a brand (like paypa1)",
    "has_exe": "Links straight to a download file",
}


def sha256_of(path):
    with open(path, "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()


def load_model(path, expected_hash):
    # only load the model if the file is the one we trained (Week 10, demo 4)
    if not expected_hash:
        raise RuntimeError("MODEL_SHA256 is not set, refusing to load the model")
    if sha256_of(path) != expected_hash:
        raise RuntimeError("model file hash does not match, refusing to load the model")
    return joblib.load(path)


def predict_url(model, url):
    features = extract_features(url)
    row = pd.DataFrame([features], columns=FEATURE_NAMES)

    # chance that the link is malicious, from 0 to 1
    prob = model.predict_proba(row)[0][1]

    if prob >= 0.5:
        label = "phishing"
        confidence = prob
    else:
        label = "legitimate"
        confidence = 1 - prob

    # same risk levels as A2
    score = round(prob * 100)
    if score < 30:
        risk_level = "Low"
    elif score < 60:
        risk_level = "Medium"
    else:
        risk_level = "High"

    signs = [msg for name, msg in WARNINGS.items() if features[name] == 1]
    if features["suspicious_words"] > 0:
        signs.append("Has words like login, verify or account")
    if features["url_length"] > 100:
        signs.append("The link is very long")

    return {
        "url": url,
        "label": label,
        "confidence": round(confidence, 3),
        "score": score,
        "risk_level": risk_level,
        "warning_signs": signs,
    }