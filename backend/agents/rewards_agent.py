
import json
import os

from dotenv import load_dotenv
from strands import Agent, tool
from strands.models.openai import OpenAIModel

from models.schemas import PurchaseRequest
from services.rewards_engine import recommend_cards

load_dotenv()


@tool
def compare_credit_cards(purchase_json: str) -> str:
    """Calculate and rank cashback for a purchase.

    Args:
        purchase_json: JSON string containing merchant_name,
            category, amount, and cards with reward_rules.
    """
    request = PurchaseRequest.model_validate_json(purchase_json)
    result = recommend_cards(request)

    return result.model_dump_json()


def create_rewards_agent() -> Agent:
    """Create a Strands agent using Akamai inference."""

    model = OpenAIModel(
        client_args={
            "api_key": os.environ["AKAMAI_API_KEY"],
            "base_url": os.getenv(
                "AKAMAI_BASE_URL",
                "https://ws.akamai-workshops.com/v1"
            ),
            "timeout": 30.0,
        },
        model_id=os.getenv(
            "AKAMAI_MODEL",
            "hackathon-chat"
        ),
        params={
            "temperature": 0,
            "max_tokens": 450,
        },
    )

    return Agent(
        model=model,
        tools=[compare_credit_cards],
        system_prompt=(
            "You are SmartWallet AI, a credit card rewards "
            "assistant. Use compare_credit_cards for "
            "all cashback comparisons. Never invent "
            "cashback values, reward eligibility, or "
            "merchant categories. Explain which card "
            "wins and why, including caps and limitations. "
            "Do not request or expose full card numbers."
        ),
    )


def explain_purchase(purchase: PurchaseRequest) -> str:
    agent = create_rewards_agent()
    purchase_json = purchase.model_dump_json()

    prompt = (
    "Use the compare_credit_cards tool exactly once on the "
    "purchase JSON below. "
    "Explain the recommended card in no more than 80 words. "
    "State the winner, its cashback amount, and briefly "
    "explain why the alternatives earn less. "
    "Mention spending caps when relevant. "
    "Avoid Markdown headings and long lists. "
    "Never modify the input values.\n\n"
    f"{purchase_json}"
)

    result = agent(prompt)
    return str(result)
