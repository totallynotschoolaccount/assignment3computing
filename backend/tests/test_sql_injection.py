# Tests for Defence 1 (SQL injection), in the style of the Week 10 demo tests.
# Run from the backend folder:  pytest

import importlib

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client(tmp_path, monkeypatch):
    # a fresh database for each test, with the defence on
    monkeypatch.setenv("DB_PATH", str(tmp_path / "test.db"))
    monkeypatch.setenv("SQL_DEFENCE", "on")
    import database
    import main
    importlib.reload(database)
    importlib.reload(main)
    with TestClient(main.app) as c:
        yield c


def test_crafted_session_id_does_not_return_other_peoples_history(client):
    client.post("/api/check", json={"url": "mybank.com.au/statement", "session_id": "victim"})
    for attack in ["' OR '1'='1", "x' OR 1=1 --", "x' UNION SELECT 1,2,3,4,5,6,7 --"]:
        r = client.get("/api/history", params={"session_id": attack})
        assert r.status_code == 200
        assert r.json() == []


def test_crafted_link_is_stored_and_returned_as_plain_text(client):
    client.post("/api/check", json={"url": "mybank.com.au/statement", "session_id": "victim"})
    attack = "x.com/'||(SELECT(group_concat(url))FROM(checks))||'"
    assert client.post("/api/check", json={"url": attack, "session_id": "attacker"}).status_code == 200
    rows = client.get("/api/history", params={"session_id": "attacker"}).json()
    assert [row["url"] for row in rows] == [attack]


def test_victim_still_sees_their_own_history(client):
    client.post("/api/check", json={"url": "mybank.com.au/statement", "session_id": "victim"})
    rows = client.get("/api/history", params={"session_id": "victim"}).json()
    assert [row["url"] for row in rows] == ["mybank.com.au/statement"]