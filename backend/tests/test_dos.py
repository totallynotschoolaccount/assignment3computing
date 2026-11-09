# Tests for Defence 2 (denial of service).
# Run from the backend folder:  pytest

import importlib
import time

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client(tmp_path, monkeypatch):
    # a fresh database for each test, with the defence on
    monkeypatch.setenv("DB_PATH", str(tmp_path / "test.db"))
    monkeypatch.setenv("DOS_DEFENCE", "on")
    import database
    import main
    import schemas
    importlib.reload(database)
    importlib.reload(schemas)
    importlib.reload(main)
    with TestClient(main.app) as c:
        yield c, main


def test_crafted_link_is_answered_quickly(client):
    c, _ = client
    crafted = "a.com/" + "a" * 30 + "!"
    start = time.time()
    r = c.post("/api/check", json={"url": crafted, "session_id": "test"})
    assert r.status_code == 200
    assert time.time() - start < 1


def test_big_request_is_refused_before_reading_it(client):
    c, _ = client
    r = c.post("/api/check", json={"url": "a" * 50_000, "session_id": "test"})
    assert r.status_code == 413
    assert r.json()["error"] == "request too large"


def test_busy_server_answers_503(client):
    c, main = client
    # pretend every slot is busy
    for _ in range(main.MAX_BUSY):
        main.busy_slots.acquire()
    try:
        r = c.post("/api/check", json={"url": "google.com", "session_id": "test"})
        assert r.status_code == 503
        assert r.headers["retry-after"] == "5"
    finally:
        for _ in range(main.MAX_BUSY):
            main.busy_slots.release()
    # once the slots are free again, checks work as normal
    assert c.post("/api/check", json={"url": "google.com", "session_id": "test"}).status_code == 200