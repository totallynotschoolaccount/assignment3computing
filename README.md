# PhishFight - Phishing URL Detection Website (COS30049 Assignment 3)

Session 12 - Group 4
- Md Shayan Ibteshum (105950113)
- Nikolas Popovic (105920284)
- Christabella Vedy (106175603)

PhishFight is a website that checks a link (URL) and tells you if it looks like phishing. It gives a risk score out of 100, a risk level and some warning signs in simple words. It only looks at the text of the link and never opens the website.

In Assignment 2 we trained a Random Forest model. In this assignment we made a website for it. The front end is React (with Vite) and the back end is FastAPI. The model runs on the back end.

## Contents
1. What the website does
2. How it works
3. Folder structure
4. How to run it
5. API endpoints
6. Security basics (2.3)
7. Threat model (2.6)
8. Defence 1 - SQL injection (2.7)
9. Defence 2 - Denial of service (2.7)
10. Advanced security - look-alike letters (2.8)
11. Tests
12. Limitations
13. References

## 1. What the website does

**Check page (home page)**
- Paste a link and click "Check this link".
- It shows if the model thinks the link is phishing or legitimate, and how sure it is.
- It shows a risk score out of 100. 0-29 is Low, 30-59 is Medium and 60-100 is High.
- It shows warning signs, for example "Mentions a big brand, but is not that brand's website".
- Chart 1 shows how 30,000 test links from our dataset scored, safe vs malicious, in groups of 10. The group your link is in has a white outline. You can click a group, or pick one from the dropdown, to read what it means.

**History page**
- Shows all the links you checked in this browser tab.
- Chart 2 shows the score of each link, coloured by risk level.
- You can filter by High, Medium or Low, click a bar or a row to see the details, and clear your history.

**Other things**
- Every browser tab gets its own random session id, so you only see your own history.
- There is a 404 page for wrong addresses.
- There is an error boundary, so if something crashes you see a message and not a blank page.
- If the back end is not running, the page tells you.

**About the model:** We used the same Random Forest settings as A2 (n_estimators=100, min_samples_leaf=3) and the same 20 features from `features.py`. The model file from A2 gave google.com a score of 100, so we trained it again with `train_model.py`, using the same settings and the same 70/30 split. On the test set it gets accuracy 0.855 and F1 0.789 for the malicious class.

## 2. How it works

```
React front end (http://localhost:5173)
        |
        |  POST /api/check, GET /api/history, DELETE /api/history
        v
FastAPI back end (http://127.0.0.1:8000)
   - size limit on the request body (10 KB)            Defence 2
   - CORS only allows http://localhost:5173
   - Pydantic checks the link and the session id       Defence 2
   - only 4 checks can run at the same time            Defence 2
   - normalise_url() fixes look-alike letters          2.8
   - features.py + Random Forest model (hash checked before loading)
   - database.py saves the history in SQLite with ?    Defence 1
```

The front end only sends the link and the session id, then shows the answer. All the security checks are on the back end, because anyone can skip our website and send requests straight to the API.

## 3. Folder structure

```
assignment3computing/
├── README.md
├── .gitignore
├── backend/
│   ├── main.py               API endpoints, errors, CORS and the DoS limits
│   ├── schemas.py            Pydantic models and the link checks
│   ├── predictor.py          loads the model (with hash check) and checks one link
│   ├── features.py           turns a URL into 20 features (from A2)
│   ├── normalise.py          fixes look-alike letters (2.8)
│   ├── database.py           SQLite history (Defence 1)
│   ├── train_model.py        trains the model again and prints its SHA-256
│   ├── make_chart_data.py    makes the data for chart 1
│   ├── requirements.txt
│   ├── .env.example
│   ├── data/phishfight_dataset.csv     100,000 URLs from A2
│   ├── model/phishfight_model.joblib   the Random Forest model
│   ├── attacks/              scripts that attack our own back end (only on our laptop)
│   └── tests/                pytest tests
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    ├── public/data/score_distribution.json   data for chart 1
    └── src/
        ├── main.jsx, App.jsx, api.js, chartSetup.js, styles.css
        ├── components/       ErrorBoundary, ScoreChart, HistoryChart
        └── pages/            CheckPage, HistoryPage, NotFoundPage
```

## 4. How to run it

You need Python 3.13 and Node.js 20.19 or newer (Vite 8 needs 20.19+ or 22.12+). All the versions are pinned.

- Back end (`backend/requirements.txt`): fastapi 0.142.4, uvicorn 0.53.0, pydantic 2.13.5, python-dotenv 1.2.3, scikit-learn 1.9.1, numpy 2.5.3, pandas 3.0.5, joblib 1.6.0, httpx 0.28.1, pytest 9.1.1
- Front end (`frontend/package.json`): react 19.3.1, react-dom 19.3.1, react-router-dom 7.18.4, chart.js 4.5.1, react-chartjs-2 5.3.1, lucide-react 1.64.0, vite 8.3.5, @vitejs/plugin-react 6.1.2

You need 2 terminals. These commands are for Windows (PowerShell or the VS Code terminal).

**Terminal 1 - back end**
```
cd backend
py -3.13 -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn main:app --reload --env-file .env
```
On Mac use `python3 -m venv .venv`, `source .venv/bin/activate` and `cp .env.example .env`.

Wait until it says `Application startup complete`. The API docs are at http://127.0.0.1:8000/docs.

Always start it with `--env-file .env`. The model hash is in `.env`, and without it the server will not load the model.

**Terminal 2 - front end**
```
cd frontend
npm install
npm run dev
```
Then open http://localhost:5173. Use `localhost` and not `127.0.0.1:5173`, because CORS only allows `http://localhost:5173`.

**Tests (optional)**
```
cd backend
.venv\Scripts\activate
pytest
```
It should say `9 passed`. If it says `No module named 'fastapi'`, use `python -m pytest`.

### The .env file

`.env` is not on GitHub. `.env.example` has the same settings, so you just copy it.

| Setting | What it does |
|---|---|
| MODEL_PATH | where the model file is |
| MODEL_SHA256 | hash of our model file. The server will not load a different file |
| FRONTEND_ORIGIN | the only website that can call the API from a browser |
| SQL_DEFENCE | on or off, switch for Defence 1 |
| DOS_DEFENCE | on or off, switch for Defence 2 |
| EVASION_DEFENCE | on or off, switch for 2.8 |

The switches work like the DEFENCE switch in the Week 11 demos. They are all `on` by default. We only turn them `off` to show the attacks in our video. After changing `.env` you have to stop the server (Ctrl+C) and start it again, because `--reload` does not see `.env` changes.

### If something goes wrong

- "Cannot reach the PhishFight server" on the page: start the back end first.
- `Path '.env' does not exist`: you are not in the `backend` folder, or you did not copy `.env.example` to `.env`.
- `model file hash does not match`: the model file is not the one we trained.
- Port 8000 or 5173 already in use: an old server is still running. Close it, or run `Stop-Process -Id (Get-NetTCPConnection -LocalPort 8000 -State Listen).OwningProcess -Force` (use 5173 for the front end).
- PowerShell says running scripts is disabled: run `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` once.

## 5. API endpoints

| Method | Path | What it does |
|---|---|---|
| GET | /api/health | checks the server is running |
| POST | /api/check | checks one link and saves it in the history. Body: `{"url": "...", "session_id": "..."}` |
| GET | /api/history?session_id=... | gets all the links checked in this session |
| DELETE | /api/history?session_id=... | deletes the history for this session |

Example answer from POST /api/check:
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

All errors come back in the same format, with no stack trace:
```json
{"error": "invalid input", "detail": "A link cannot have spaces in it"}
```
We use 422 for bad input, 404 for wrong paths, 405 for wrong methods, 411 and 413 for the size limit, 503 when the server is busy and 500 for anything unexpected. For a 500 the real error is only printed in the server terminal.

## 6. Security basics (2.3)

- **Input is never shown as HTML.** React escapes text, and we show the link as plain text. We do not use `dangerouslySetInnerHTML` anywhere.
- **Size limit on the back end.** In `schemas.py` the link can be 1 to 2048 characters and the session id 1 to 64. In `main.py` any POST body over 10 KB gets 413 before it is read.
- **CORS only allows our front end.** Only `http://localhost:5173`, with GET, POST and DELETE.
- **No secrets in the code.** Settings and the model hash are in `.env`, which is in `.gitignore`.

We also did these:
- The model file is checked with SHA-256 before loading (like Week 10 demo 4). If someone changes the file, the server will not load it.
- The model is loaded once when the server starts, not on every request.
- The endpoints are normal `def` functions, so the slow model work runs in FastAPI's threadpool and does not block other requests.

## 7. Threat model (2.6)

**Who would attack PhishFight?**
- A phisher who wants their phishing link to be marked as safe. This is the main one.
- Someone who wants to break or slow down the checker, for example while a phishing campaign is running.
- A user who wants to see what links other people checked. These links can be private, like a bank statement link or a password reset link.

**What do they want?**
- Their phishing link marked as legitimate.
- The website not working for everyone else.
- Other people's history from our database.

**What can they do?**
- They can send requests straight to our back end with curl or a script. CORS does not stop this.
- They control the link and the session id, and they can send anything, any length, as many times as they want. There are no accounts.
- Our back end saves every link and session id in a SQLite database, runs the model for every request, and loads the model from a joblib file.
- They cannot upload files, and our back end never opens or looks up the link.

**Risks that apply to us**

| Risk | Why | What we did |
|---|---|---|
| SQL injection | the link and session id go into SQL queries | Defence 1 |
| Denial of service | one request can cost us a lot (slow regex, big body, too many model calls) | Defence 2 |
| Look-alike letters to fool the model | the phisher picks every character in the link | 2.8 |
| Unsafe model loading | we load a joblib file | SHA-256 check |
| Misconfiguration | CORS, error messages and secrets | section 6 |
| Rate limiting | anyone can send lots of requests | only partly, by the 4 checks limit in Defence 2. We did not add per-user rate limiting |

**Risks that do not apply to us**
- Command injection: we never run a system command.
- SSRF: the back end never makes a request using the link.
- File upload: we do not accept files.
- Broken access control: there are no accounts. History is split by a random session id (UUID). Someone would need to steal your session id to see your history, and a random UUID is too hard to guess.

**Why we picked these two:** The link goes straight into our database, so SQL injection is the easiest way to get other people's private links. Denial of service fits because every check runs the model, which is much more work for us than for the attacker. Also, the link regex we used at first had the backtracking problem from the lecture. These two cover the "read other people's data" and "break the website" goals. Section 2.8 covers the "make my link look safe" goal.

## 8. Defence 1 - SQL injection (2.7)

**The attack:** If the input is pasted into the SQL text, a `'` in the input ends the string early and the attacker can change the query. In our app this can happen with the session id (in the SELECT) and with the link (in the INSERT).

**The fix:** Every query in `database.py` uses `?` placeholders, so the input is always treated as data and never as SQL (Week 10 demo 5, OWASP n.d.). When `SQL_DEFENCE=off`, the SELECT and the INSERT put the input into the SQL with an f-string and print it as `UNSAFE SQL: ...` in the server terminal. This is only for showing the attack in the video. The DELETE always uses placeholders.

**How to show it:**
1. Set `SQL_DEFENCE=off` in `backend/.env` and restart the back end.
2. In another terminal in `backend` run `python attacks/attack_sql_injection.py`
3. Set `SQL_DEFENCE=on`, restart, and run the script again.

The script first saves a "victim" link, `mybank.com.au/statement?account=12345`, in another session. Then it attacks from an attacker session.

| Attack | Defence off | Defence on |
|---|---|---|
| session id `' OR '1'='1` | gets everyone's history, including the victim's bank link | empty list |
| session id `x' OR 1=1 --` | gets everyone's history | empty list |
| session id `x' UNION SELECT id,session_id,'',1,1,'','' FROM checks--` | gets every session id in the database | empty list |
| link `x.com/'\|\|(SELECT(group_concat(url))FROM(checks))\|\|'` | the INSERT copies everyone's links into the attacker's history | saved as plain text, nothing leaked |

**Variations:** We tried both inputs, both the SELECT and the INSERT, and different tricks (OR, `--` comments, UNION and a query hidden inside a link). Placeholders stop all of them, because the database never runs the input as SQL.

**Cost:** Almost nothing. Placeholders are just as fast and real users are not affected. We just have to remember to use placeholders in every new query. In a real app we would delete the unsafe `off` code.

## 9. Defence 2 - Denial of service (2.7)

**The attack:** One cheap request that costs our server a lot (Week 10 lecture, OWASP 2023). We found 3 ways:
1. **Slow regex.** At first we checked links with a regex that is copied a lot online: `^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$`. It has a `*` inside another `*`, so a short link like `"a.com/" + "a" * 24 + "!"` (31 characters) makes it try millions of matches and the CPU is stuck for seconds. The same kind of regex problem took Cloudflare down for 27 minutes in 2019 (Graham-Cumming 2019).
2. **Huge request body.** Pydantic only checks the link length after the whole body is read.
3. **Too many checks at once.** Every check runs the model, so lots of requests pile up and everyone has to wait.

**The fix (when `DOS_DEFENCE=on`):**
1. A middleware in `main.py` rejects any POST body over 10 KB with 413 (and a POST with no Content-Length with 411) before reading it. A normal check is less than 3 KB.
2. We replaced the regex with simple checks in `schemas.py`: not empty, no spaces, has a dot, only http or https. These are fast for any input.
3. A `threading.BoundedSemaphore(4)` lets only 4 checks run at the same time. If all 4 are busy, the next request gets 503 straight away with `Retry-After: 5`. The website shows "The server is busy right now. Please try again in a few seconds."

**How to show it:** same as Defence 1, but change `DOS_DEFENCE` and run `python attacks/attack_dos.py`

Results on our laptop:

| Test | Defence off | Defence on |
|---|---|---|
| one crafted 31 character link | 5.438 s, then 422 | 0.046 s, 200 |
| health check sent during the crafted link | 5.138 s (server frozen) | 0.016 s |
| one 5 MB body | whole body read, then 422 after 0.042 s | 413 before reading, 0.029 s |
| 300 checks at the same time | all 300 wait, slowest 5.316 s, health check 0.514 s | 75 answered and 225 got 503, slowest 0.437 s, health check 0.213 s |

**Variations:** crafted links of any length (the new checks are fast for any length), big bodies with and without Content-Length, and many requests at the same time.

**Cost:**
- When there are too many requests, some normal users get "server busy" and have to try again after a few seconds. We think that is better than the whole server freezing.
- 4 at a time is just a number that works on one laptop. A real server would pick it based on its CPU.
- The simple checks are not as strict as the regex, so some text that is not a real link can get through (like `a.b`). This is fine because the model still just gives it a score.
- On our own laptop the 5 MB body is still fast to read (0.042 s vs 0.029 s). The difference would be bigger on a real network or with lots of big requests.

**Not covered:** an attack from many computers at once (the lecture says this is out of scope, a hosting company or CDN handles it), and per-user limits because we did not add rate limiting.

## 10. Advanced security - look-alike letters (2.8)

**The attack:** A phisher changes some letters in the link to characters that look the same but are actually different, for example Cyrillic or Greek letters, wide letters, invisible characters or small accents (Gabrilovich & Gontmakher 2002; Holgers, Watson & Gribble 2006; Zheng 2017).

For example `sеcurе-lоgin-pаypаl.cоm/аccоunt/updаtе` looks like `secure-login-paypal.com/account/update`, but some of the letters are Cyrillic. People still read "paypal", but our features look for the word "paypal" and words like "login" and "account", so they do not find them. The model then thinks the link is much safer than it is.

**The fix:** `normalise.py` cleans the link before the model reads it (when `EVASION_DEFENCE=on`). It does 4 steps:
1. Removes invisible characters (Unicode category "Cf", like the zero-width space).
2. Uses Unicode NFKC, which changes wide letters like `ｐａｙｐａｌ` into `paypal` (Unicode Consortium n.d. a).
3. Makes the link lower case and swaps look-alike letters (Cyrillic, Greek, Armenian and a few others) for the normal letter, using a small table called `LOOKALIKES`.
4. Removes accents (NFKD and then drops the accent marks).

The website still shows and saves the original link. Only the model gets the cleaned one. If the link has any character that is not normal keyboard text, the user also gets the warning "Has unusual or look-alike letters that can hide the real website".

**How we measured it** (`python attacks/measure_evasion.py`):
- We took the malicious links from our test set (the model did not train on these) that the model already catches (score 50 or more) and that have a brand name or a suspicious word in them. That is 2,093 links out of 8,166 caught.
- For each trick, we changed the letters inside those words.
- Evasion rate = how many of the changed links now score under 50 (marked legitimate).
- We compared 3 things: no defence, only NFKC (the simple fix), and our `normalise_url`.
- The "mixed" trick picks a random trick for each letter, so we ran it 10 times with different seeds and show the average and the range.

| Trick | No defence | NFKC only | Our normalise_url |
|---|---|---|---|
| Cyrillic letters | 26.9% | 26.9% | 0.0% |
| Greek letters | 25.5% | 25.5% | 0.0% |
| Wide letters | 26.9% | 0.0% | 0.0% |
| Invisible characters | 29.0% | 29.0% | 0.0% |
| Small accents | 29.0% | 28.1% | 0.0% |
| Letters with a line through (ø, ł, đ) | 23.8% | 23.8% | 23.8% |
| Mixed, 10 runs | 28.4% (28.1-28.8) | 27.7% (27.2-28.5) | 0.0% (0.0-0.0) |

So without the defence, about 1 in 4 of these phishing links get past the model. Only using NFKC fixes the wide letters but nothing else, because Cyrillic and Greek letters are real letters and NFKC does not change them, and it does not remove invisible characters. Our version gets all of them to 0%, except the letters with a line through.

On the website with the look-alike link above:
- Defence off: legitimate, score 40, Medium, "No clear warning signs"
- Defence on: phishing, score 96, High, with the warning signs back and the look-alike warning. This is the same score as the normal link.

**Cost:**
- Safe test links wrongly marked as phishing: 5.56% before and 5.56% after, so no change.
- Safe test links that `normalise_url` changes: 0 out of 18,505.
- Extra time: about 7.4 microseconds per link on our laptop, which nobody would notice.

**What it does not fix:**
- Letters with a line through them (ø, ł, đ, ħ) are not in our table and NFKD does not split them, so 23.8% still get past. We left them in the test on purpose to show this. The user still gets the look-alike warning for these links, but the score does not change.
- Our table is small (about 50 letters). The Week 11 demos suggest using a confusables library with the full Unicode list (Unicode Consortium n.d. b), which has thousands of look-alikes. We used Python's built-in `unicodedata` and our own table to keep it simple. Using the full list would be the next step and would fix the ø, ł, đ row.
- The warning also shows for real links in other languages. Our dataset has almost no non-English links, so we could not test how often this happens.
- It only cleans what the model reads. A phisher can still make a link that looks normal without any tricks, which is a limit of a URL-only model.

## 11. Tests

Run `pytest` in the `backend` folder. The server does not need to be running because the tests use FastAPI's TestClient and a test database.

- `test_sql_injection.py` (3 tests): a crafted session id does not return other people's history, a crafted link is saved as plain text, the victim still sees their own history.
- `test_dos.py` (3 tests): the crafted link is answered in under 1 second, a 50 KB body gets 413, and when all 4 slots are busy the answer is 503 with Retry-After 5.
- `test_evasion.py` (3 tests): look-alike letters turn into normal letters, normal links do not change, and the look-alike link gets the same score as the normal link.

## 12. Limitations

- The model only looks at the URL, so it can miss phishing on a hacked real website. PhishFight should be a second opinion, not a promise that a link is safe.
- History is split by session id, not by accounts. If someone gets your session id they could see your history.
- The history is saved as plain text in `history.db` and is only deleted when you click clear history.
- We only tested on one laptop. There is no HTTPS, and the DoS limits are set for one machine.
- The attack scripts are only for our own back end on `127.0.0.1`. They should never be used on any other system.

## 13. References

Dong, R 2026a, *COS30049 Week 10 lecture: The back end, and how it gets attacked*, lecture notes, Swinburne University of Technology, Melbourne.

Dong, R 2026b, *COS30049 Week 10 workshop: Defending a FastAPI back end*, demos and README, Swinburne University of Technology, Melbourne.

Dong, R 2026c, *COS30049 Week 11 demos: Advanced security*, demos and README, Swinburne University of Technology, Melbourne.

FastAPI n.d., *Concurrency and async / await*, FastAPI documentation, viewed 10 November 2026, <https://fastapi.tiangolo.com/async/>.

FastAPI n.d., *CORS (Cross-Origin Resource Sharing)*, FastAPI documentation, viewed 10 November 2026, <https://fastapi.tiangolo.com/tutorial/cors/>.

Gabrilovich, E & Gontmakher, A 2002, 'The homograph attack', *Communications of the ACM*, vol. 45, no. 2, p. 128.

Graham-Cumming, J 2019, *Details of the Cloudflare outage on July 2, 2019*, The Cloudflare Blog, 12 July, viewed 10 November 2026, <https://blog.cloudflare.com/details-of-the-cloudflare-outage-on-july-2-2019/>.

Holgers, T, Watson, DE & Gribble, SD 2006, 'Cutting through the confusion: a measurement study of homograph attacks', in *Proceedings of the 2006 USENIX Annual Technical Conference*, USENIX Association, Boston.

OWASP 2023, *OWASP API Security Top 10 2023: API4:2023 Unrestricted Resource Consumption*, OWASP Foundation, viewed 10 November 2026, <https://owasp.org/API-Security/editions/2023/en/0xa4-unrestricted-resource-consumption/>.

OWASP n.d., *Regular expression Denial of Service - ReDoS*, OWASP Foundation, viewed 10 November 2026, <https://owasp.org/www-community/attacks/Regular_expression_Denial_of_Service_-_ReDoS>.

OWASP n.d., *SQL Injection Prevention Cheat Sheet*, OWASP Cheat Sheet Series, viewed 10 November 2026, <https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html>.

Pedregosa, F, Varoquaux, G, Gramfort, A, Michel, V, Thirion, B, Grisel, O, Blondel, M, Prettenhofer, P, Weiss, R, Dubourg, V, Vanderplas, J, Passos, A, Cournapeau, D, Brucher, M, Perrot, M & Duchesnay, É 2011, 'Scikit-learn: machine learning in Python', *Journal of Machine Learning Research*, vol. 12, pp. 2825-2830.

Python Software Foundation n.d., *sqlite3 - DB-API 2.0 interface for SQLite databases*, Python documentation, viewed 10 November 2026, <https://docs.python.org/3/library/sqlite3.html>.

Python Software Foundation n.d., *unicodedata - Unicode Database*, Python documentation, viewed 10 November 2026, <https://docs.python.org/3/library/unicodedata.html>.

Shostack, A 2014, *Threat modeling: designing for security*, Wiley, Indianapolis.

sid321axn n.d., *Malicious URLs dataset*, Kaggle dataset, viewed 6 October 2026, <https://www.kaggle.com/datasets/sid321axn/malicious-urls-dataset>.

taruntiwarihp n.d., *Phishing Site URLs*, Kaggle dataset, viewed 6 October 2026, <https://www.kaggle.com/datasets/taruntiwarihp/phishing-site-urls>.

Unicode Consortium n.d. a, *Unicode Standard Annex #15: Unicode Normalization Forms*, viewed 10 November 2026, <https://www.unicode.org/reports/tr15/>.

Unicode Consortium n.d. b, *Unicode Technical Standard #39: Unicode Security Mechanisms*, viewed 10 November 2026, <https://www.unicode.org/reports/tr39/>.

Zheng, X 2017, *Phishing with Unicode domains*, blog post, 14 April, viewed 10 November 2026, <https://www.xudongz.com/blog/2017/idn-phishing/>.