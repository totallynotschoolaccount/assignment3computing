# main.py
# PhishFight back end.
# Start it with:  uvicorn main:app --reload --env-file .env

import os
import threading
from contextlib import asynccontextmanager
from http import HTTPStatus

from fastapi import Depends, FastAPI, HTTPException, Query, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from database import create_table, delete_history, get_db, get_history, save_check
from predictor import load_model, predict_url
from schemas import CheckRequest, CheckResult, DeleteResult, ErrorResult, HealthResult, HistoryItem

# settings come from the .env file, not from the code
MODEL_PATH = os.environ.get("MODEL_PATH", "model/phishfight_model.joblib")
MODEL_SHA256 = os.environ.get("MODEL_SHA256", "")
FRONTEND_ORIGIN = os.environ.get("FRONTEND_ORIGIN", "http://localhost:5173")

# Defence 2 (denial of service). Keep this "on". We only turn it "off" in .env for the video.
DOS_DEFENCE = os.environ.get("DOS_DEFENCE", "on") == "on"
MAX_BODY_BYTES = 10_000   # a check request is under 3 KB, so 10 KB is plenty
MAX_BUSY = 4              # how many checks can run at the same time
busy_slots = threading.BoundedSemaphore(MAX_BUSY)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # load the model once when the server starts, not on every request
    app.state.model = load_model(MODEL_PATH, MODEL_SHA256)
    create_table()
    yield


app = FastAPI(
    title="PhishFight API",
    description="Checks if a link looks like phishing. It only reads the text of the link and never opens the website.",
    lifespan=lifespan,
)

# Defence 2, part 1: refuse big request bodies before reading them.
# Pydantic only checks the link length after the whole body has been read,
# so without this a 50 MB body would still be read and parsed first.
@app.middleware("http")
async def limit_body_size(request: Request, call_next):
    if DOS_DEFENCE and request.method == "POST":
        size = request.headers.get("content-length")
        if size is None:
            return JSONResponse(status_code=411, content={"error": "length required", "detail": "Please send a Content-Length header"})
        if int(size) > MAX_BODY_BYTES:
            return JSONResponse(status_code=413, content={"error": "request too large", "detail": "The request is too big"})
    return await call_next(request)


# only our own front end is allowed to call the API from a browser
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN],
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Content-Type"],
)


# every error uses the same shape: {"error": "...", "detail": "..."}
@app.exception_handler(RequestValidationError)
async def invalid_input(request: Request, exc: RequestValidationError):
    msg = exc.errors()[0].get("msg", "invalid input")
    msg = msg.removeprefix("Value error, ")
    return JSONResponse(status_code=422, content={"error": "invalid input", "detail": msg})


@app.exception_handler(StarletteHTTPException)
async def http_error(request: Request, exc: StarletteHTTPException):
    # covers 404 (wrong path), 405 (wrong method) and any HTTPException we raise
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": HTTPStatus(exc.status_code).phrase.lower(), "detail": str(exc.detail)},
        headers=getattr(exc, "headers", None),
    )


@app.exception_handler(Exception)
async def unexpected_error(request: Request, exc: Exception):
    # the real error is printed on the server, the user only gets a short message
    print(f"unexpected error: {type(exc).__name__}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"error": "internal error", "detail": "Something went wrong, please try again later"},
    )


@app.get("/api/health", response_model=HealthResult)
def health():
    """Shows that the server is running. The front end uses it to check the server is up."""
    return {"status": "ok"}


@app.post(
    "/api/check",
    response_model=CheckResult,
    responses={
        422: {"model": ErrorResult, "description": "The link is empty, too long or not a web link"},
        503: {"model": ErrorResult, "description": "The server is busy, try again in a few seconds"},
    },
)
def check(req: CheckRequest, db=Depends(get_db)):
    """Checks one link and saves it to this session's history. Returns phishing or legitimate,
    how confident the model is, a risk score from 0 to 100, and warning signs in plain English."""
    if not DOS_DEFENCE:
        # UNSAFE, only for the video: no limit on how many checks run at once
        return run_check(req, db)

    # Defence 2, part 3: if all the slots are busy, answer 503 straight away
    # instead of letting the work pile up until the server freezes
    if not busy_slots.acquire(blocking=False):
        raise HTTPException(
            status_code=503,
            detail="The server is busy right now. Please try again in a few seconds.",
            headers={"Retry-After": "5"},
        )
    try:
        return run_check(req, db)
    finally:
        busy_slots.release()


def run_check(req, db):
    result = predict_url(app.state.model, req.url)
    save_check(db, req.session_id, result)
    return result


@app.get(
    "/api/history",
    response_model=list[HistoryItem],
    responses={422: {"model": ErrorResult, "description": "The session id is missing or too long"}},
)
def history(session_id: str = Query(min_length=1, max_length=64), db=Depends(get_db)):
    """Returns every link checked in this session, oldest first. Used for the history chart."""
    return get_history(db, session_id)


@app.delete(
    "/api/history",
    response_model=DeleteResult,
    responses={422: {"model": ErrorResult, "description": "The session id is missing or too long"}},
)
def clear_history(session_id: str = Query(min_length=1, max_length=64), db=Depends(get_db)):
    """Deletes every check in this session's history."""
    return {"deleted": delete_history(db, session_id)}