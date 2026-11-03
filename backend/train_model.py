# train_model.py
# Trains our final Random Forest from Assignment 2 again and saves it.
# We retrained because the model file in our A2 zip was an older version
# (it gave google.com a score of 100). Same data and same settings as notebook 02.
#
# Run once:  python train_model.py

import hashlib

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, f1_score
from sklearn.model_selection import train_test_split

from features import FEATURE_NAMES, extract_features

DATA_PATH = "data/phishfight_dataset.csv"
MODEL_PATH = "model/phishfight_model.joblib"

data = pd.read_csv(DATA_PATH)
X = data[FEATURE_NAMES]
y = data["label"]

# same split as Assignment 2: 70% train, 30% test
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, stratify=y, random_state=42)

model = RandomForestClassifier(n_estimators=100, min_samples_leaf=3, random_state=42)
model.fit(X_train, y_train)

pred = model.predict(X_test)
print("Accuracy:", round(accuracy_score(y_test, pred), 3))
print("F1:", round(f1_score(y_test, pred), 3))

# quick check on a few links
for url in ["google.com", "paypal.com.secure-login.tk/verify", "en.wikipedia.org/wiki/Phishing"]:
    row = pd.DataFrame([extract_features(url)], columns=FEATURE_NAMES)
    print(url, "->", round(model.predict_proba(row)[0][1] * 100))

joblib.dump(model, MODEL_PATH, compress=3)
print("Saved", MODEL_PATH)

# print the file's hash, so the server can check the file before loading it (Week 10, demo 4)
with open(MODEL_PATH, "rb") as f:
    print("MODEL_SHA256=" + hashlib.sha256(f.read()).hexdigest())