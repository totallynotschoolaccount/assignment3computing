# measure_evasion.py
# Advanced security (section 2.8): measures the detection evasion attack before and after
# our defence. Only runs on our own model, on our own laptop.
#
# The attacker's goal: take a phishing link our model already catches, and change some letters
# so it looks the same to a person but our model scores it as safe (below 50).
#
# Run from the backend folder:  python attacks/measure_evasion.py

import os
import random
import sys
import time
import unicodedata

import joblib
import pandas as pd
from sklearn.model_selection import train_test_split

# let this script import features.py and normalise.py from the backend folder
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from features import BRANDS, FEATURE_NAMES, SUSPICIOUS_WORDS, extract_features
from normalise import normalise_url

model = joblib.load("model/phishfight_model.joblib")
data = pd.read_csv("data/phishfight_dataset.csv")
# the same 30% test set as train_model.py, so the model never trained on these links
_, test = train_test_split(data, test_size=0.3, stratify=data["label"], random_state=42)


def scores(urls, defence):
    # the model's risk score (0 to 100) for each link, with or without a defence first
    if defence == "nfkc only":
        urls = [unicodedata.normalize("NFKC", u) for u in urls]
    elif defence == "our normalise_url":
        urls = [normalise_url(u) for u in urls]
    rows = pd.DataFrame([extract_features(u) for u in urls], columns=FEATURE_NAMES)
    return model.predict_proba(rows)[:, 1] * 100


# ---- the attacker's tricks: each one changes a single letter so it still looks the same ----
CYRILLIC = {"a": "а", "c": "с", "e": "е", "i": "і", "j": "ј", "o": "о", "p": "р",
            "s": "ѕ", "x": "х", "y": "у", "h": "һ", "d": "ԁ"}
GREEK = {"a": "α", "i": "ι", "k": "κ", "o": "ο", "p": "ρ", "u": "υ", "v": "ν", "x": "χ"}
# letters with a line through them: these do NOT break down into plain letters,
# and they are not in our look-alike table, so our defence is expected to miss them
STROKE = {"o": "ø", "i": "ɨ", "d": "đ", "l": "ł", "b": "ƀ", "g": "ǥ", "h": "ħ", "t": "ŧ", "z": "ƶ"}


def cyrillic(ch, rng):
    return CYRILLIC.get(ch, ch)


def greek(ch, rng):
    return GREEK.get(ch, ch)


def fullwidth(ch, rng):
    return chr(ord(ch) - ord("a") + 0xFF41) if "a" <= ch <= "z" else ch


def zero_width(ch, rng):
    return ch + "\u200b"      # an invisible character (zero-width space) after the letter


def accent(ch, rng):
    return ch + "\u0323"      # a tiny dot under the letter


def stroke(ch, rng):
    return STROKE.get(ch, ch)


def mixed(ch, rng):
    # a smarter attacker mixes tricks at random
    return rng.choice([cyrillic, greek, fullwidth, zero_width, accent])(ch, rng)


WORDS = SUSPICIOUS_WORDS + BRANDS


def attack(url, trick, rng):
    # change the letters inside brand names and suspicious words, because those are
    # the parts of the link our model reads as words
    chars = list(url)
    for word in WORDS:
        start = url.find(word)
        while start != -1:
            for i in range(start, start + len(word)):
                chars[i] = trick(url[i], rng)
            start = url.find(word, start + 1)
    return "".join(chars)


# links the attacker would want to sneak past us: malicious, already caught by the model,
# and containing a brand name or suspicious word for the trick to work on
malicious = test[test["label"] == 1]["url"].tolist()
caught = [u for u, s in zip(malicious, scores(malicious, "none")) if s >= 50]
targets = [u for u in caught if any(w in u for w in WORDS)]
print(f"Malicious test links caught by the model: {len(caught)}")
print(f"Of those, links with a brand name or suspicious word to attack: {len(targets)}")
print()

defences = ["none", "nfkc only", "our normalise_url"]
print(f"{'Trick':<14}" + "".join(f"{d:>22}" for d in defences))
print("  (evasion success rate = attacked links the model now scores below 50)")
for trick in [cyrillic, greek, fullwidth, zero_width, accent, stroke]:
    attacked = [attack(u, trick, random.Random(0)) for u in targets]
    rates = [(scores(attacked, d) < 50).mean() * 100 for d in defences]
    print(f"{trick.__name__:<14}" + "".join(f"{r:>21.1f}%" for r in rates))

# the mixed trick is random, so repeat it 10 times and report the range
runs = {d: [] for d in defences}
for seed in range(10):
    rng = random.Random(seed)
    attacked = [attack(u, mixed, rng) for u in targets]
    for d in defences:
        runs[d].append((scores(attacked, d) < 50).mean() * 100)
line = f"{'mixed (x10)':<14}"
for d in defences:
    r = runs[d]
    line += f"{sum(r) / len(r):>9.1f}% ({min(r):.1f}-{max(r):.1f})"
print(line)
print()

# ---- what the defence costs ----
safe = test[test["label"] == 0]["url"].tolist()
before = scores(safe, "none") >= 50
after = scores(safe, "our normalise_url") >= 50
print("Cost of the defence")
print(f"  safe test links wrongly flagged: {before.mean() * 100:.2f}% before, {after.mean() * 100:.2f}% after")
changed = sum(1 for u in safe if normalise_url(u) != u.lower())
print(f"  safe test links that normalise_url changes at all: {changed} of {len(safe)}")
all_urls = test["url"].tolist()
start = time.perf_counter()
for u in all_urls:
    normalise_url(u)
per_link = (time.perf_counter() - start) / len(all_urls) * 1_000_000
print(f"  extra time per link: {per_link:.1f} microseconds")