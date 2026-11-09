# Tests for the advanced security part (2.8): look-alike letters.
# Run from the backend folder:  pytest

import importlib

import pytest
from fastapi.testclient import TestClient

from normalise import normalise_url


def test_lookalike_letters_become_normal_letters():
    assert normalise_url("pаypаl.com/lоgin") == "paypal.com/login"           # Cyrillic
    assert normalise_url("pαypαl.com/lοgin") == "paypal.com/login"           # Greek
    assert normalise_url("ｐａｙｐａｌ.com/ｌｏｇｉｎ") == "paypal.com/login"   # wide letters
    assert normalise_url("pay\u200bpal.com/log\u200bin") == "paypal.com/login"   # invisible characters
    assert normalise_url("pa\u0323ypal.com/login") == "paypal.com/login"   # accent under a letter


def test_normal_links_are_not_changed():
    for url in ["google.com", "en.wikipedia.org/wiki/phishing", "auspost.com.au/track?id=123"]:
        assert normalise_url(url) == url


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("DB_PATH", str(tmp_path / "test.db"))
    monkeypatch.setenv("EVASION_DEFENCE", "on")
    import main
    import predictor
    importlib.reload(predictor)
    importlib.reload(main)
    with TestClient(main.app) as c:
        yield c


def test_lookalike_link_gets_the_same_score_as_the_plain_link(client):
    plain = client.post("/api/check", json={"url": "secure-login-paypal.com/account/update", "session_id": "t"}).json()
    lookalike = client.post("/api/check", json={"url": "sеcurе-lоgin-pаypаl.cоm/аccоunt/updаtе", "session_id": "t"}).json()
    assert lookalike["score"] == plain["score"]
    assert lookalike["label"] == "phishing"
    assert "Has unusual or look-alike letters that can hide the real website" in lookalike["warning_signs"]