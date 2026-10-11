
from typing import List, Optional
from pydantic import BaseModel, Field


class RewardRule(BaseModel):
    category: str
    cashback_rate: float = Field(ge=0, le=100)
    spending_cap: Optional[float] = Field(
        default=None, ge=0
    )
    amount_spent: float = Field(default=0, ge=0)
    fallback_rate: float = Field(
        default=1.0, ge=0, le=100
    )


class CreditCard(BaseModel):
    card_id: str
    card_name: str
    issuer: str
    reward_rules: List[RewardRule]


class PurchaseRequest(BaseModel):
    merchant_name: str
    category: str
    amount: float = Field(gt=0)
    cards: List[CreditCard] = Field(min_length=1)


class CardRecommendation(BaseModel):
    card_id: str
    card_name: str
    estimated_cashback: float
    effective_rate: float
    explanation: str


class RecommendationResponse(BaseModel):
    merchant_name: str
    purchase_amount: float
    recommended_card: str
    rankings: List[CardRecommendation]


class AIExplanationRequest(BaseModel):
    purchase: PurchaseRequest


class AIExplanationResponse(BaseModel):
    recommended_card: str
    explanation: str
    source: str
    ai_generated: bool
