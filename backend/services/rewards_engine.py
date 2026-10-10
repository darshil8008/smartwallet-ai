
from models.schemas import (
    CreditCard,
    RewardRule,
    PurchaseRequest,
    CardRecommendation,
    RecommendationResponse,
)


def calculate_cashback(
    amount: float,
    rule: RewardRule
) -> float:
    """
    Calculate cashback with support for spending caps
    and fallback rates.
    """

    if rule.spending_cap is None:
        cashback = amount * rule.cashback_rate / 100
        return round(cashback, 2)

    remaining_cap = max(
        0.0,
        rule.spending_cap - rule.amount_spent
    )

    bonus_amount = min(amount, remaining_cap)
    regular_amount = amount - bonus_amount

    cashback = (
        bonus_amount * rule.cashback_rate / 100
        + regular_amount * rule.fallback_rate / 100
    )

    return round(cashback, 2)


def evaluate_card(
    card: CreditCard,
    category: str,
    amount: float
) -> CardRecommendation:
    """
    Evaluate the cashback offered by one card.
    """

    normalized_category = category.strip().lower()

    matching_rule = next(
        (
            rule for rule in card.reward_rules
            if rule.category.strip().lower()
            == normalized_category
        ),
        None
    )

    if matching_rule is None:
        matching_rule = next(
            (
                rule for rule in card.reward_rules
                if rule.category.strip().lower()
                == "all"
            ),
            None
        )

    if matching_rule is None:
        raise ValueError(
            f"No applicable reward rule for {card.card_name}"
        )

    cashback = calculate_cashback(amount, matching_rule)

    effective_rate = (
        cashback / amount * 100
        if amount > 0 else 0
    )

    explanation = (
        f"{card.card_name} earns approximately "
        f"${cashback:.2f} cashback on this "
        f"${amount:.2f} purchase."
    )

    return CardRecommendation(
        card_id=card.card_id,
        card_name=card.card_name,
        estimated_cashback=cashback,
        effective_rate=round(effective_rate, 2),
        explanation=explanation
    )


def recommend_cards(
    request: PurchaseRequest
) -> RecommendationResponse:
    """
    Evaluate and rank all available credit cards.
    """

    rankings = [
        evaluate_card(
            card,
            request.category,
            request.amount
        )
        for card in request.cards
    ]

    rankings.sort(
        key=lambda card: (
            -card.estimated_cashback,
            card.card_name
        )
    )

    return RecommendationResponse(
        merchant_name=request.merchant_name,
        purchase_amount=request.amount,
        recommended_card=rankings[0].card_name,
        rankings=rankings
    )
