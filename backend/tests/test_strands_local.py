
import json

from agents.rewards_agent import compare_credit_cards

purchase = {
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

def test_strands_cashback_tool():
    result = compare_credit_cards(
        json.dumps(purchase)
    )

    data = json.loads(result)

    assert data["recommended_card"] == "Card B"
    assert data["rankings"][0]["estimated_cashback"] == 3.0
    assert data["rankings"][1]["estimated_cashback"] == 1.8

    print("\nStrands cashback tool test PASSED!")