
from fastapi import APIRouter, HTTPException

from models.schemas import (
    AIExplanationRequest,
    AIExplanationResponse,
)
from agents.rewards_agent import explain_purchase
import os

from models.schemas import (
    PurchaseRequest,
    RecommendationResponse,
)
from services.rewards_engine import recommend_cards


router = APIRouter(prefix="/api", tags=["Recommendations"])


@router.post(
    "/recommend",
    response_model=RecommendationResponse
)
def get_recommendation(request: PurchaseRequest):
    """
    Compare a user's cards and return the best
    cashback recommendation.
    """
    try:
        return recommend_cards(request)

    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc)
        ) from exc


@router.post(
    "/agent/explain",
    response_model=AIExplanationResponse
)
def explain_recommendation(request: AIExplanationRequest):
    purchase = request.purchase

    # Always compute the authoritative ranking in Python.
    try:
        ranking = recommend_cards(purchase)
    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc)
        ) from exc

    winner = ranking.rankings[0]

    # No valid inference credentials yet.
    api_key = os.getenv("AKAMAI_API_KEY")

    if not api_key or api_key == "PASTE_YOUR_TEAM_API_KEY_HERE":
        explanation = (
            f"{winner.card_name} is recommended because "
            f"it provides an estimated ${winner.estimated_cashback:.2f} "
            f"cashback on this ${purchase.amount:.2f} purchase. "
            f"The other cards have lower estimated rewards "
            f"under the supplied reward rules."
        )

        return AIExplanationResponse(
            recommended_card=ranking.recommended_card,
            explanation=explanation,
            source="deterministic_rewards_engine",
            ai_generated=False
        )

    try:
        explanation = explain_purchase(purchase)

        return AIExplanationResponse(
            recommended_card=ranking.recommended_card,
            explanation=explanation,
            source="aws_strands_akamai",
            ai_generated=True
        )

    except Exception:
        # Keep checkout recommendations available
        # if the model endpoint fails.
        return AIExplanationResponse(
            recommended_card=ranking.recommended_card,
            explanation=(
                f"{winner.card_name} provides an estimated "
                f"${winner.estimated_cashback:.2f} cashback. "
                f"AI explanations are temporarily unavailable."
            ),
            source="deterministic_rewards_engine",
            ai_generated=False
        )

