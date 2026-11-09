# make_chart_data.py
# Makes the data for the "How does your link compare?" chart on the front end.
# It scores the 30% test set from Assignment 2 with our model, then counts how many
# safe and malicious links fall into each 10-point score range.
#
# Run once, after train_model.py:  python make_chart_data.py

import json
import os

import joblib
import pandas as pd
from sklearn.model_selection import train_test_split

from features import FEATURE_NAMES

DATA_PATH = "data/phishfight_dataset.csv"
MODEL_PATH = "model/phishfight_model.joblib"
OUT_PATH = "../frontend/public/data/score_distribution.json"

data = pd.read_csv(DATA_PATH)

# the same test set as train_model.py, so the model never trained on these links
_, X_test, _, y_test = train_test_split(
    data[FEATURE_NAMES], data["label"], test_size=0.3, stratify=data["label"], random_state=42)

# this is our own model file that train_model.py just made
model = joblib.load(MODEL_PATH)
scores = (model.predict_proba(X_test)[:, 1] * 100).round().astype(int)

ranges = ["0-9", "10-19", "20-29", "30-39", "40-49", "50-59", "60-69", "70-79", "80-89", "90-100"]
safe = [0] * 10
malicious = [0] * 10
for score, label in zip(scores, y_test):
    i = min(score // 10, 9)   # a score of 100 goes in the last range
    if label == 1:
        malicious[i] += 1
    else:
        safe[i] += 1

os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
with open(OUT_PATH, "w") as f:
    json.dump({"ranges": ranges, "safe": safe, "malicious": malicious}, f, indent=2)

print("Saved", OUT_PATH)
print("safe:", safe)
print("malicious:", malicious)