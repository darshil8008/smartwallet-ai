
import pytest

from models.schemas import (
    RewardRule,
    CreditCard,
    PurchaseRequest,
)

from services.rewards_engine import (
    calculate_cashback,
    evaluate_card,
    recommend_cards,
)


def test_cashback_without_cap():
    rule = RewardRule(
        category="groceries",
        cashback_rate=5
    )

    assert calculate_cashback(100, rule) == 5.00


def test_partially_used_spending_cap():
    rule = RewardRule(
        category="groceries",
        cashback_rate=5,
        spending_cap=500,
        amount_spent=480,
        fallback_rate=1
    )

    assert calculate_cashback(100, rule) == 1.80


def test_exhausted_spending_cap():
    rule = RewardRule(
        category="groceries",
        cashback_rate=5,
        spending_cap=500,
        amount_spent=500,
        fallback_rate=1
    )

    assert calculate_cashback(100, rule) == 1.00


def test_correct_category_selection():
    card = CreditCard(
        card_id="card_a",
        card_name="Card A",
        issuer="Demo Bank",
        reward_rules=[
            RewardRule(
                category="restaurants",
                cashback_rate=4
            ),
            RewardRule(
                category="groceries",
                cashback_rate=5
            ),
            RewardRule(
                category="all",
                cashback_rate=1
            ),
        ]
    )

    result = evaluate_card(card, "groceries", 100)

    assert result.estimated_cashback == 5.00


def test_card_ranking():
    cards = [
        CreditCard(
            card_id="card_a",
            card_name="Card A",
            issuer="Demo Bank",
            reward_rules=[
                RewardRule(
                    category="groceries",
                    cashback_rate=5,
                    spending_cap=500,
                    amount_spent=480,
                    fallback_rate=1
                )
            ]
        ),
        CreditCard(
            card_id="card_b",
            card_name="Card B",
            issuer="Demo Bank",
            reward_rules=[
                RewardRule(
                    category="groceries",
                    cashback_rate=3
                )
            ]
        ),
        CreditCard(
            card_id="card_c",
            card_name="Card C",
            issuer="Demo Bank",
            reward_rules=[
                RewardRule(
                    category="all",
                    cashback_rate=2
                )
            ]
        ),
    ]

    request = PurchaseRequest(
        merchant_name="Demo Grocery Store",
        category="groceries",
        amount=100,
        cards=cards
    )

    response = recommend_cards(request)

    assert response.recommended_card == "Card B"

    assert [
        item.card_name for item in response.rankings
    ] == ["Card B", "Card C", "Card A"]

    assert [
        item.estimated_cashback for item in response.rankings
    ] == [3.00, 2.00, 1.80]


def test_missing_reward_rule():
    card = CreditCard(
        card_id="card_a",
        card_name="Card A",
        issuer="Demo Bank",
        reward_rules=[
            RewardRule(
                category="restaurants",
                cashback_rate=4
            )
        ]
    )

    with pytest.raises(ValueError):
        evaluate_card(card, "groceries", 100)
