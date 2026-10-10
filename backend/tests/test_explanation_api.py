
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_explanation_without_akamai(monkeypatch):
    # Ensure this test always uses the fallback path.
    monkeypatch.delenv("AKAMAI_API_KEY", raising=False)

    payload = {
        "purchase": {
            "merchant_name": "Demo Grocery Store",
            "category": "groceries",
            "amount": 100,
            "cards": [
                {
                    "card_id": "card_a",
                    "card_name": "Card A",
                    "issuer": "Demo Bank",
                    "reward_rules": [
                        {
                            "category": "groceries",
                            "cashback_rate": 5,
                            "spending_cap": 500,
                            "amount_spent": 480,
                            "fallback_rate": 1
                        }
                    ]
                },
                {
                    "card_id": "card_b",
                    "card_name": "Card B",
                    "issuer": "Demo Bank",
                    "reward_rules": [
                        {
                            "category": "groceries",
                            "cashback_rate": 3
                        }
                    ]
                }
            ]
        }
    }

    response = client.post("/api/agent/explain", json=payload)

    assert response.status_code == 200

    data = response.json()

    assert data["recommended_card"] == "Card B"
    assert data["source"] == "deterministic_rewards_engine"
    assert data["ai_generated"] is False
    assert "$3.00" in data["explanation"]


def test_explanation_rejects_invalid_amount(monkeypatch):
    monkeypatch.delenv("AKAMAI_API_KEY", raising=False)

    payload = {
        "purchase": {
            "merchant_name": "Demo Grocery Store",
            "category": "groceries",
            "amount": -100,
            "cards": []
        }
    }

    response = client.post("/api/agent/explain", json=payload)

    assert response.status_code == 422
