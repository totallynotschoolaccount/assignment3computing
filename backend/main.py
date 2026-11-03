# main.py
# PhishFight back end.
# Start it with:  uvicorn main:app --reload --env-file .env

import os
from contextlib import asynccontextmanager
from http import HTTPStatus

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from predictor import load_model, predict_url
from schemas import CheckRequest, CheckResult, ErrorResult, HealthResult

# settings come from the .env file, not from the code
MODEL_PATH = os.environ.get("MODEL_PATH", "model/phishfight_model.joblib")
MODEL_SHA256 = os.environ.get("MODEL_SHA256", "")
FRONTEND_ORIGIN = os.environ.get("FRONTEND_ORIGIN", "http://localhost:5173")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # load the model once when the server starts, not on every request
    app.state.model = load_model(MODEL_PATH, MODEL_SHA256)
    yield


app = FastAPI(
    title="PhishFight API",
    description="Checks if a link looks like phishing. It only reads the text of the link and never opens the website.",
    lifespan=lifespan,
)

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
    responses={422: {"model": ErrorResult, "description": "The link is empty, too long or not a web link"}},
)
def check(req: CheckRequest):
    """Checks one link. Returns phishing or legitimate, how confident the model is,
    a risk score from 0 to 100, and warning signs in plain English."""
    return predict_url(app.state.model, req.url)