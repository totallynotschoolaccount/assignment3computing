# PhishFight – Phishing URL Detection Web App (COS30049 Assignment 3)

Session 12 – Group 4
- Md Shayan Ibteshum (105950113)
- Nikolas Popovic (105920284)
- Christabella Vedy (106175603)

PhishFight checks a web link and tells you if it looks like phishing. It gives a risk score from 0 to 100, a risk level (Low, Medium or High) and warning signs in plain English. It only reads the text of the link. It never opens the website, so it is safe to check a link you don't trust.

This is the website for the Random Forest model from our Assignment 2. The front end is React, the back end is FastAPI, and the model runs on the back end.

## Contents
1. [What the app does](#1-what-the-app-does)
2. [How it fits together](#2-how-it-fits-together)
3. [Folder structure](#3-folder-structure)
4. [Running the application](#4-running-the-application)
5. [API endpoints](#5-api-endpoints)
6. [Security hygiene (2.3)](#6-security-hygiene-23)
7. [Threat model (2.6)](#7-threat-model-26)
8. [Defence 1: SQL injection (2.7, Intermediate)](#8-defence-1-sql-injection-27-intermediate)
9. [Defence 2: Denial of service (2.7, Advanced)](#9-defence-2-denial-of-service-27-advanced)
10. [Advanced security: detection evasion with look-alike letters (2.8)](#10-advanced-security-detection-evasion-with-look-alike-letters-28)
11. [Tests](#11-tests)
12. [Limitations](#12-limitations)
13. [References](#13-references)

---

## 1. What the app does

- **Check a link** (home page). Paste a link and press *Check this link*. You get:
  - phishing or legitimate, and how confident the model is
  - a risk score from 0 to 100 and a risk level: 0–29 Low, 30–59 Medium, 60–100 High
  - the warning signs it found, in plain English (for example "Mentions a big brand, but is not that brand's website")
- **Chart 1: "Your link compared with real links".** This is a bar chart of how 30,000 test links from our dataset scored, split into safe and malicious, in score ranges of 10. The range your link falls in has a white outline. Click a range, or choose one from the list under the chart, and a sentence explains what that range means.
- **History page.** It shows every link you checked in this browser tab.
  - **Chart 2** shows the score of each link, coloured by risk level.
  - Filter buttons show only High, Medium or Low links.
  - Click a bar or a row to see that link's details.
  - *Clear history* deletes your history from the database.
- **Each browser tab gets its own random session id**, so you only ever see your own history.
- **A 404 page** for unknown addresses, and an **error boundary**, so a crash shows a short message instead of a blank page.
- If the back end is not running, or it refuses a request, the page shows a clear message instead of failing silently.

**About the model.** It's the same Random Forest as Assignment 2 (`n_estimators=100`, `min_samples_leaf=3`), using the same 20 features from `features.py`. The model file we handed in for A2 gave wrong scores for some well-known sites (google.com got 100), so we retrained it with `backend/train_model.py`. It uses the same settings, dataset and 70/30 split. The results on the 30% test set are accuracy 0.855 and F1 0.789 for the malicious class.

## 2. How it fits together

```
 Browser:  React front end  (http://localhost:5173)
   |
   |  JSON over HTTP:  POST /api/check    GET /api/history    DELETE /api/history
   v
 FastAPI back end  (http://127.0.0.1:8000)
   |-- 1. request body size limit, 10 KB ........................ Defence 2
   |-- 2. CORS: only http://localhost:5173 can read the answers
   |-- 3. Pydantic checks: link up to 2048 characters,
   |       session id up to 64, simple link checks ............. Defence 2
   |-- 4. at most 4 checks at the same time, others get 503 ...... Defence 2
   |-- 5. normalise_url(): look-alike letters -> normal letters .. section 2.8
   |-- 6. features.py -> Random Forest model
   |       (loaded once at start-up, only if its SHA-256 hash matches)
   '-- 7. database.py -> SQLite file history.db,
           every query uses ? placeholders ...................... Defence 1
```

The front end never touches the model or the database. It only sends the link and the session id, and shows what comes back. Every security check runs on the back end, because anyone can skip our website and call the API directly.

## 3. Folder structure

```
assignment3computing/
├── README.md                    this file
├── .gitignore                   keeps .venv, node_modules, .env and *.db out of git
├── backend/
│   ├── main.py                  API endpoints, error handlers, CORS, Defence 2 limits
│   ├── schemas.py               Pydantic request and response models, link checks
│   ├── predictor.py             loads the model (hash check) and makes one prediction
│   ├── features.py              turns a URL into 20 features (from Assignment 2)
│   ├── normalise.py             turns look-alike letters into normal letters (2.8)
│   ├── database.py              SQLite history (Defence 1)
│   ├── train_model.py           retrains the model and prints its SHA-256 hash
│   ├── make_chart_data.py       makes the data file for chart 1
│   ├── requirements.txt         pinned Python packages
│   ├── .env.example             settings to copy into .env
│   ├── data/
│   │   └── phishfight_dataset.csv     100,000 labelled URLs from Assignment 2
│   ├── model/
│   │   └── phishfight_model.joblib    the trained Random Forest
│   ├── attacks/                 scripts that attack OUR OWN back end, on our own laptop only
│   │   ├── attack_sql_injection.py
│   │   ├── attack_dos.py
│   │   ├── measure_evasion.py
│   │   └── lookalike_links.txt  look-alike links to paste into the website
│   └── tests/                   pytest tests for all three defences
│       ├── conftest.py
│       ├── test_sql_injection.py
│       ├── test_dos.py
│       └── test_evasion.py
└── frontend/
    ├── package.json             pinned npm packages
    ├── vite.config.js           always runs on port 5173
    ├── index.html
    ├── public/data/score_distribution.json   data for chart 1
    └── src/
        ├── main.jsx             ErrorBoundary > BrowserRouter > App
        ├── App.jsx              header, routes (/, /history, 404) and footer
        ├── api.js               every call to the back end, and the session id
        ├── chartSetup.js        Chart.js setup
        ├── styles.css
        ├── components/          ErrorBoundary, ScoreChart (chart 1), HistoryChart (chart 2)
        └── pages/               CheckPage, HistoryPage, NotFoundPage
```

## 4. Running the application

### What you need

| Tool | Version we used | Notes |
|---|---|---|
| Python | 3.13 | 3.12 to 3.14 should also work |
| Node.js | 20.19 or later, or 22.12 or later | Vite 8 needs one of these |

All package versions are pinned to exact numbers.

| Back end (`backend/requirements.txt`) | Front end (`frontend/package.json`) |
|---|---|
| fastapi 0.142.4 | react 19.3.1, react-dom 19.3.1 |
| uvicorn 0.53.0 | react-router-dom 7.18.4 |
| pydantic 2.13.5 | chart.js 4.5.1, react-chartjs-2 5.3.1 |
| python-dotenv 1.2.3 | lucide-react 1.64.0 |
| scikit-learn 1.9.1, numpy 2.5.3, pandas 3.0.5, joblib 1.6.0 | vite 8.3.5, @vitejs/plugin-react 6.1.2 |
| httpx 0.28.1, pytest 9.1.1 | |

You need **two terminals**: one for the back end and one for the front end. The commands below are for Windows (PowerShell, or the VS Code terminal). The macOS / Linux version is given where it is different.

### Step 1: back end (terminal 1)

```
cd backend
py -3.13 -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn main:app --reload --env-file .env
```

On macOS / Linux use `python3 -m venv .venv`, `source .venv/bin/activate` and `cp .env.example .env` instead.

When it says `Application startup complete`, the back end is running at http://127.0.0.1:8000. The API docs are at http://127.0.0.1:8000/docs.

**Important:** always start it with `--env-file .env`. The model's SHA-256 hash is in `.env`, and without it the server refuses to load the model (this is on purpose, see section 6).

### Step 2: front end (terminal 2)

```
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser. Use `localhost`, not `127.0.0.1:5173`, because the back end only accepts the front end's exact address (CORS).

### Step 3 (optional): run the tests (terminal 3)

```
cd backend
.venv\Scripts\activate
pytest
```

You should see `9 passed`. If it says `No module named 'fastapi'`, run `python -m pytest` instead.

### Settings in `backend/.env`

`.env` is not in git. `.env.example` has the same settings, so you only need to copy it.

| Setting | What it is |
|---|---|
| `MODEL_PATH` | where the model file is |
| `MODEL_SHA256` | the hash of the model file we trained. The server refuses to load any other file |
| `FRONTEND_ORIGIN` | the only website allowed to call the API from a browser (`http://localhost:5173`) |
| `SQL_DEFENCE` | `on` (default) or `off`. The switch for Defence 1 |
| `DOS_DEFENCE` | `on` (default) or `off`. The switch for Defence 2 |
| `EVASION_DEFENCE` | `on` (default) or `off`. The switch for section 2.8 |

The three switches work the same way as the `DEFENCE` switch in the Week 11 demos. `off` exists **only** to show each attack working in our video. After you change `.env`, stop the server (Ctrl+C) and start it again, because `--reload` does not notice `.env` changes.

### Common problems

| What you see | What to do |
|---|---|
| The page says it cannot reach the PhishFight server | Start the back end (step 1) |
| `Invalid value for '--env-file': Path '.env' does not exist` | You are not in the `backend` folder, or you skipped `copy .env.example .env` |
| `model file hash does not match` | The model file was changed. Use the model file from this zip |
| `only one usage of each socket address` / port 8000 or 5173 in use | An old server is still running. Close it, or run `Stop-Process -Id (Get-NetTCPConnection -LocalPort 8000 -State Listen).OwningProcess -Force` (change 8000 to 5173 for the front end) |
| PowerShell says running scripts is disabled | Run `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` once |

## 5. API endpoints

| Method | Path | What it does | Main status codes |
|---|---|---|---|
| GET | `/api/health` | Shows the server is running | 200 |
| POST | `/api/check` | Checks one link and saves it to this session's history. Body: `{"url": "...", "session_id": "..."}` | 200, 413, 411, 422, 503 |
| GET | `/api/history?session_id=...` | Every link checked in this session, oldest first | 200, 422 |
| DELETE | `/api/history?session_id=...` | Deletes this session's history | 200, 422 |

Example answer from `POST /api/check`:

```json
{
  "url": "paypal.com.secure-login.tk/verify",
  "label": "phishing",
  "confidence": 0.959,
  "score": 96,
  "risk_level": "High",
  "warning_signs": [
    "Uses a website ending that scammers use a lot",
    "Mentions a big brand, but is not that brand's website",
    "Has words like login, verify or account"
  ]
}
```

**Every error has the same shape**, `{"error": "...", "detail": "..."}`, with no stack trace or internal details. For example:

```json
{"error": "invalid input", "detail": "A link cannot have spaces in it"}
```

This covers wrong input (422), unknown paths (404), wrong methods (405), too large (413), busy (503) and unexpected errors (500). For a 500, the real error is only printed in the server terminal.

## 6. Security hygiene (2.3)

| Requirement | How we did it | Where |
|---|---|---|
| Never render input as HTML | React escapes all text. The link is always shown as plain text, and we never use `dangerouslySetInnerHTML` | `CheckPage.jsx`, `HistoryPage.jsx` |
| Limit size on the back end | Pydantic: link 1–2048 characters, session id 1–64. A middleware refuses any POST body over 10 KB (413), or with no Content-Length (411), before reading it | `schemas.py`, `main.py` |
| CORS only allows our front end | `allow_origins` is only `FRONTEND_ORIGIN` (`http://localhost:5173`), with methods GET, POST and DELETE and header Content-Type only | `main.py` |
| Secrets out of the code | Settings and the model hash live in `.env`, which is in `.gitignore`. Only `.env.example` is committed | `.env.example`, `.gitignore` |

We also did these, even though they are not one of our two marked defences:
- **Safe model loading.** The server hashes `phishfight_model.joblib` at start-up and refuses to load it if the SHA-256 is different from `MODEL_SHA256` (Week 10, demo 4). A swapped or tampered model file never gets unpickled.
- **The model loads once**, in FastAPI's `lifespan`, not on every request.
- **No debug mode, and one error format**, so internal details never reach the user.
- **Slow work stays off the event loop.** The endpoints are plain `def`, so FastAPI runs them in its threadpool (Week 10 lecture, "Where the slow work runs").

## 7. Threat model (2.6)

**1. Who would want to attack PhishFight?**
- **A phisher** who wants their link to pass as safe. This is the main attacker for a phishing checker.
- **Someone who wants the checker broken or slow**, for example a phisher who wants it down while their campaign runs, or just a vandal.
- **A nosy or hostile user** who wants to see what other people checked. The links people check can be private, for example a bank statement link with an account number, or a password reset link.

**2. What are they trying to achieve?**
- Get a phishing link judged **legitimate** (fool the model).
- Make the service **unusable** for everyone else.
- **Read other people's history** from our database.

**3. What can they actually do?**
- They can call our back end **directly** with curl or a script, not just through our website. CORS does not stop that.
- They choose **both inputs**: the link text and the session id, at any length and as often as they like. There are no accounts or logins.
- Our back end **saves every check (link and session id) in a SQLite database**, runs a CPU-heavy model for every request in one Python process, and loads the model from a joblib file.
- They **cannot** upload files, and our back end **never opens, fetches or looks up** the link. It only reads the text.

**Risks our design has, and what we did**

| Risk | Why it applies to us | What we did |
|---|---|---|
| SQL injection (Intermediate) | Both inputs go into SQL queries for the history | **Defence 1** |
| Denial of service (Advanced) | One cheap request can cost us a lot: a crafted link against a backtracking regex, a huge body, or a flood of model calls | **Defence 2** |
| Fooling the model with look-alike letters | The phisher controls the exact characters in the link | **Section 2.8** |
| Unsafe model loading (Basic) | We load a joblib file | SHA-256 check (section 6) |
| Misconfiguration (Intermediate) | CORS, error details and secrets can leak information | Covered by section 6 |
| Missing rate limiting (Basic) | Anyone can send many requests | Partly limited by Defence 2's cap on checks running at once, but we did **not** build per-client rate limiting |

**Risks our design does not have, and why**
- **Command injection:** we never run a system command (no WHOIS lookup, no shell).
- **SSRF:** the back end never makes a request based on the input. It only reads the link as text.
- **Unsafe file upload:** we do not accept files.
- **Broken access control:** there are no user accounts. History is kept apart by a random session id (a UUID made by the browser). Someone who stole another person's session id could read that history, but a random UUID can't realistically be guessed (see Limitations).

**Why these two defences.** The phisher's own input, the link, goes straight into our database, so SQL injection is the most direct path to other people's private links. Denial of service fits because every check runs a model, which costs far more than sending a request. Also, the link-checking regex we first used is a known catastrophic-backtracking pattern. Together they cover two of the attacker's three goals (reading other people's data and breaking the service). Section 2.8 covers the third (getting a phishing link judged safe).

## 8. Defence 1: SQL injection (2.7, Intermediate)

**The attack.** If the input is pasted into the SQL text, a quote in the input ends the string early and the attacker can change what the query means. Our app has two ways in: the `session_id` (used in `SELECT ... WHERE session_id = ...`) and the `url` (used in the `INSERT`).

**The defence.** Every query in `database.py` uses `?` placeholders, so the input is always data and never part of the SQL (Week 10, demo 5; OWASP n.d.). The `DELETE` query is always parameterised. With `SQL_DEFENCE=off`, the `SELECT` and the `INSERT` paste the input into the SQL with an f-string, and print the query in the server terminal as `UNSAFE SQL: ...`, so the video can show the attack working.

**How to show it**
1. Set `SQL_DEFENCE=off` in `backend/.env`, then restart the back end.
2. In another terminal (in `backend`, with the venv on): `python attacks/attack_sql_injection.py`
3. Set `SQL_DEFENCE=on`, restart, and run the script again.

The script first saves a "victim" check of `mybank.com.au/statement?account=12345` in a different session, then attacks from an attacker session.

| Attack | `SQL_DEFENCE=off` | `SQL_DEFENCE=on` |
|---|---|---|
| session id `' OR '1'='1` on GET /api/history | every user's history comes back, including the victim's bank link | empty list, nothing leaked |
| session id `x' OR 1=1 --` (comment out the rest) | every user's history comes back | empty list, nothing leaked |
| session id `x' UNION SELECT id,session_id,'',1,1,'','' FROM checks--` | every session id in the database leaks | empty list, nothing leaked |
| link `x.com/'\|\|(SELECT(group_concat(url))FROM(checks))\|\|'` sent to POST /api/check | the `INSERT` copies **every user's links**, including the victim's, into the attacker's own history | the link is saved exactly as typed, as plain text |

**Variations covered.** Both inputs (url and session id), both the read path (`SELECT`) and the write path (`INSERT`), and the usual tricks: always-true `OR`, `--` comments, `UNION SELECT`, and a sub-query hidden inside a link. Placeholders stop all of them in the same way, because the database never reads the input as SQL.

**Cost.** Almost nothing. Parameterised queries are just as fast, and nothing a real user types is refused. The only cost is a rule for the future: every new query must use placeholders too. In a real deployment we would delete the `off` branch completely. It is only there for the video.

**Tests:** `tests/test_sql_injection.py` (3 tests).

## 9. Defence 2: Denial of service (2.7, Advanced)

**The attack.** One request that costs our server far more than it costs the attacker (Week 10 lecture; OWASP 2023). We found three ways in our app:
1. **A crafted link against a slow regex.** We first checked links with a regex copied around a lot online: `^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$`. It has a `*` inside another `*`, so a short crafted link (`"a.com/" + "a" * 24 + "!"`, 31 characters) makes it try millions of ways to match. That keeps a CPU busy for seconds. This is the same kind of bug that took down Cloudflare for 27 minutes in 2019 (Graham-Cumming 2019).
2. **A huge request body.** Pydantic only checks the link length **after** the whole body has been read and parsed.
3. **A flood of checks.** Every check runs the model, and with no cap, the work piles up until everyone waits.

**The defence (three parts, `DOS_DEFENCE=on`)**
1. **Body size limit.** A middleware in `main.py` refuses any POST over 10 KB with **413**, and any POST with no `Content-Length` with **411**, before reading the body. A real check is under 3 KB.
2. **Simple link checks instead of the regex.** `schemas.py` uses plain checks that take the same short time for any input: not empty, no spaces, has a dot, http or https only.
3. **A cap on checks running at once.** A `threading.BoundedSemaphore(4)`: if 4 checks are already running, the next one gets **503** straight away, with `Retry-After: 5`, instead of waiting in a queue. The front end shows the message "The server is busy right now. Please try again in a few seconds."

**How to show it.** Same as Defence 1, but with `DOS_DEFENCE` and `python attacks/attack_dos.py`.

**Results** (measured on our laptop, from `attack_dos.py`)

| Test | `DOS_DEFENCE=off` | `DOS_DEFENCE=on` |
|---|---|---|
| One crafted 31-character link | 5.438 s, then 422 | **0.046 s**, 200 |
| A health check sent while the crafted link runs | **5.138 s** (the server is frozen for everyone) | **0.016 s** |
| One 5 MB request body | read in full, then 422 after 0.042 s | refused with **413** before reading, 0.029 s |
| 300 checks at the same time (100 at once) | all 300 queued; slowest answer 5.316 s; health check 0.514 s | 75 answered, **225 got 503**; slowest answer **0.437 s**; health check 0.213 s |

**Variations covered.** Crafted links of any length (the new checks are linear, so a longer input is never much slower). Big bodies with and without a `Content-Length` header. Many requests at once. The test `test_crafted_link_is_answered_quickly` checks that the crafted link is answered in under 1 second.

**Cost**
- During a flood, some honest users get "server busy" and must try again a few seconds later. We think a fast "try again" is better than every user waiting 5+ seconds, or the server freezing.
- The 4-slot cap is a guess for one laptop. A real server would set it from how many CPU cores it has.
- The simple checks are looser than the regex. A few strings that are not real links get through (for example `a.b`), but that's fine, because the model still just scores the text.
- The 5 MB result looks small on localhost (0.042 s vs 0.029 s), because reading 5 MB from your own laptop is fast. The real gain is that the server never reads or parses a big body at all, which matters much more over a real network or with many big requests at once.

**What it does not cover.** A distributed flood from many machines. The lecture puts this out of scope, and it is stopped upstream by a hosting provider or CDN. It also does not cover per-client limits: one client can still keep taking free slots, because we did not build rate limiting.

**Tests:** `tests/test_dos.py` (3 tests).

## 10. Advanced security: detection evasion with look-alike letters (2.8)

**The attack.** A phisher swaps some letters in their link for characters that **look the same but are different characters**: Cyrillic or Greek letters, wide "fullwidth" letters, invisible zero-width characters, or tiny accents (Gabrilovich & Gontmakher 2002; Holgers, Watson & Gribble 2006; Zheng 2017).

For example, `sеcurе-lоgin-pаypаl.cоm/аccоunt/updаtе` looks like `secure-login-paypal.com/account/update`, but the `е`, `о` and `а` are Cyrillic. A person reads "paypal". Our features look for the brand "paypal" and words like "login" and "account", so they miss them, and the model sees a much more harmless link.

**The defence.** `normalise.py` cleans the link **before** the model reads it (`EVASION_DEFENCE=on`). It does 4 steps, in this order:
1. **Removes invisible characters**, meaning Unicode category `Cf`, such as the zero-width space.
2. **Applies Unicode NFKC**, which turns wide and fancy letters into normal ones (`ｐａｙｐａｌ` → `paypal`) (Unicode Consortium n.d. a).
3. **Lower-cases the link, then swaps look-alike letters** from Cyrillic, Greek, Armenian and a few special Latin letters for the normal letter they copy, using a small table (`LOOKALIKES`).
4. **Removes accents** (NFKD, then drops the combining marks).

The original link is still what gets shown and saved. Only the model's input is cleaned. If the link has any character outside normal keyboard text, the user also gets a warning sign: *"Has unusual or look-alike letters that can hide the real website"*.

**How we measured it** (`python attacks/measure_evasion.py`)
- **Targets:** malicious links from our 30% test set (the model never trained on them) that the model **already catches** (score 50 or more) and that contain a brand name or suspicious word for the trick to work on. That gives **2,093 links** (out of 8,166 caught).
- **The attack:** every letter inside those brand names and words is changed with one trick. "Mixed" picks a trick at random for each letter, so we ran it **10 times** with different random seeds and report the average and the range.
- **Evasion rate:** the share of attacked links the model now scores **below 50** (judged legitimate).
- **Three columns:** no defence, the "obvious" fix (NFKC only), and our `normalise_url`.

**Results**

| Trick | No defence | NFKC only | Our `normalise_url` |
|---|---|---|---|
| Cyrillic look-alikes (`а` for `a`) | 26.9% | 26.9% | **0.0%** |
| Greek look-alikes (`α` for `a`) | 25.5% | 25.5% | **0.0%** |
| Fullwidth letters (`ｐａｙｐａｌ`) | 26.9% | 0.0% | **0.0%** |
| Zero-width characters (invisible) | 29.0% | 29.0% | **0.0%** |
| Tiny accents (a dot under a letter) | 29.0% | 28.1% | **0.0%** |
| Letters with a stroke (`ø`, `ł`, `đ`) | 23.8% | 23.8% | **23.8%** (not fixed, see below) |
| Mixed at random, 10 runs | 28.4% (28.1–28.8) | 27.7% (27.2–28.5) | **0.0% (0.0–0.0)** |

Without a defence, **about 1 in 4** of these caught phishing links slips through after the trick. The "obvious" fix, NFKC alone, only fixes fullwidth letters. Cyrillic and Greek letters are real letters in their own alphabets, so NFKC leaves them alone, and it does not remove zero-width characters either. Our 4 steps bring every trick in our table down to 0%, and the 10 mixed runs show this is not luck.

**On the website**, with the look-alike `secure-login-paypal` link above:
- **Off:** **legitimate, score 40, Medium, "No clear warning signs"**. The attack hid every warning sign.
- **On:** **phishing, score 96, High.** The warning signs come back, plus the look-alike warning. This is the same score as the plain link.

**Cost** (from the same script)
- False alarms on the 18,505 safe test links: **5.56% before and 5.56% after**. No change.
- Safe test links that `normalise_url` changes at all: **0 of 18,505**.
- Extra time: about **7–11 microseconds per link** (7.4 µs on our laptop). A check already takes milliseconds, so users can't notice it.

**What it does not close (honest limits)**
- **Letters that are not in our table still get through.** Letters with a stroke (`ø`, `ł`, `đ`, `ħ`...) do not break down into a plain letter with NFKD, and they are not in our `LOOKALIKES` table, so 23.8% still slip past, the same as with no defence. We kept them in the measurement on purpose to show this gap. The user still sees the "unusual or look-alike letters" warning on these links, but the score does not go up.
- **Our table is small** (about 50 letters). The Week 11 demos recommend an established confusables library, based on the full Unicode confusables data, which covers thousands of look-alikes (Unicode Consortium n.d. b). We used Python's built-in `unicodedata` and a hand-written table to keep it simple and avoid another dependency. Switching to the full confusables data is the clear next step, and it would close the stroke row.
- **The warning can appear on honest links** written in other languages, because it fires for any non-keyboard character. Our dataset has almost no non-English links, so we could not measure how often this happens.
- **It only fixes what the model reads.** A phisher can still pick a link that looks harmless without any tricks. That is a limit of a URL-only model (see our A2 report), not of this defence.

**Tests:** `tests/test_evasion.py` (3 tests). These cover Cyrillic, Greek, fullwidth, zero-width and accents all turning into `paypal.com/login`, normal links staying the same, and the look-alike link getting the same score as the plain link through the API.

## 11. Tests

Run `pytest` in `backend` (see section 4). The tests use FastAPI's `TestClient`, so the server does not need to be running. They use a temporary test database, not your real `history.db`, and each test file turns its own defence on.

| File | Tests |
|---|---|
| `test_sql_injection.py` | crafted session id returns no one else's history; crafted link is stored and returned as plain text; the victim still sees their own history |
| `test_dos.py` | crafted link answered in under 1 second; 50 KB body refused with 413; when all slots are busy the answer is 503 with `Retry-After: 5` |
| `test_evasion.py` | look-alike letters become normal letters; normal links are not changed; look-alike link gets the same score as the plain link |

## 12. Limitations

- **The model is URL-only.** It can miss a phishing page on a hacked real website, or a plain-looking link. PhishFight is a quick second opinion, not a promise that a link is safe. The page says this to the user.
- **History is kept apart by a session id, not by accounts.** Anyone who gets your session id could read your history. It is a random UUID, stored only for that browser tab, so it can't realistically be guessed.
- **History is stored in plain text** in `history.db` on the server. There is no automatic clean-up, but *Clear history* deletes yours.
- **Built and tested on one laptop.** There is no HTTPS, and the DoS limits are set for one machine.
- **All attack scripts only target our own back end at `127.0.0.1`.** Never run them against any system you do not own.

## 13. References

Dong, R 2026a, *COS30049 Week 10 lecture: The back end, and how it gets attacked*, lecture notes, Swinburne University of Technology, Melbourne.

Dong, R 2026b, *COS30049 Week 10 workshop: Defending a FastAPI back end* (demos and README), Swinburne University of Technology, Melbourne.

Dong, R 2026c, *COS30049 Week 11 demos: Advanced security* (demos and README), Swinburne University of Technology, Melbourne.

FastAPI n.d., *Concurrency and async / await*, FastAPI documentation, viewed 10 November 2026, <https://fastapi.tiangolo.com/async/>.

FastAPI n.d., *CORS (Cross-Origin Resource Sharing)*, FastAPI documentation, viewed 10 November 2026, <https://fastapi.tiangolo.com/tutorial/cors/>.

Gabrilovich, E & Gontmakher, A 2002, 'The homograph attack', *Communications of the ACM*, vol. 45, no. 2, p. 128.

Graham-Cumming, J 2019, *Details of the Cloudflare outage on July 2, 2019*, The Cloudflare Blog, 12 July, viewed 10 November 2026, <https://blog.cloudflare.com/details-of-the-cloudflare-outage-on-july-2-2019/>.

Holgers, T, Watson, DE & Gribble, SD 2006, 'Cutting through the confusion: a measurement study of homograph attacks', in *Proceedings of the 2006 USENIX Annual Technical Conference*, USENIX Association, Boston.

OWASP 2023, *OWASP API Security Top 10 2023: API4:2023 Unrestricted Resource Consumption*, OWASP Foundation, viewed 10 November 2026, <https://owasp.org/API-Security/editions/2023/en/0xa4-unrestricted-resource-consumption/>.

OWASP n.d., *Regular expression Denial of Service – ReDoS*, OWASP Foundation, viewed 10 November 2026, <https://owasp.org/www-community/attacks/Regular_expression_Denial_of_Service_-_ReDoS>.

OWASP n.d., *SQL Injection Prevention Cheat Sheet*, OWASP Cheat Sheet Series, viewed 10 November 2026, <https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html>.

Pedregosa, F, Varoquaux, G, Gramfort, A, Michel, V, Thirion, B, Grisel, O, Blondel, M, Prettenhofer, P, Weiss, R, Dubourg, V, Vanderplas, J, Passos, A, Cournapeau, D, Brucher, M, Perrot, M & Duchesnay, É 2011, 'Scikit-learn: machine learning in Python', *Journal of Machine Learning Research*, vol. 12, pp. 2825–2830.

Python Software Foundation n.d., *sqlite3 — DB-API 2.0 interface for SQLite databases*, Python documentation, viewed 10 November 2026, <https://docs.python.org/3/library/sqlite3.html>.

Python Software Foundation n.d., *unicodedata — Unicode Database*, Python documentation, viewed 10 November 2026, <https://docs.python.org/3/library/unicodedata.html>.

Shostack, A 2014, *Threat modeling: designing for security*, Wiley, Indianapolis.

sid321axn n.d., *Malicious URLs dataset*, Kaggle dataset, viewed 6 October 2026, <https://www.kaggle.com/datasets/sid321axn/malicious-urls-dataset>.

taruntiwarihp n.d., *Phishing Site URLs*, Kaggle dataset, viewed 6 October 2026, <https://www.kaggle.com/datasets/taruntiwarihp/phishing-site-urls>.

Unicode Consortium n.d. a, *Unicode Standard Annex #15: Unicode Normalization Forms*, viewed 10 November 2026, <https://www.unicode.org/reports/tr15/>.

Unicode Consortium n.d. b, *Unicode Technical Standard #39: Unicode Security Mechanisms*, viewed 10 November 2026, <https://www.unicode.org/reports/tr39/>.

Zheng, X 2017, *Phishing with Unicode domains*, blog post, 14 April, viewed 10 November 2026, <https://www.xudongz.com/blog/2017/idn-phishing/>.