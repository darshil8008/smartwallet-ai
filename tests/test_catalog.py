from decimal import Decimal
from fastapi.testclient import TestClient

from scripts.validate_data import validate
from deployment.preview_api import app

client = TestClient(app)


def test_catalog_valid():
    cards, merchants = validate()
    assert len(cards) == 3
    assert len(merchants) == 6


def test_demo_cap_example():
    # Independent, transparent sample expected output to share with Khevna.
    amount = Decimal("180")
    card_a = Decimal("20") * Decimal("0.05") + Decimal("160") * Decimal("0.01")
    card_b = amount * Decimal("0.03")
    card_c = amount * Decimal("0.02")
    assert (card_a, card_b, card_c) == (Decimal("2.60"), Decimal("5.40"), Decimal("3.60"))
    assert max((("card_a", card_a), ("card_b", card_b), ("card_c", card_c)), key=lambda x: x[1])[0] == "card_b"


def test_preview_catalog_routes():
    assert client.get("/health").json()["status"] == "ok"
    assert len(client.get("/api/cards").json()) == 3
    assert len(client.get("/api/merchants").json()) == 6
