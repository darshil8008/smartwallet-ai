"""Fail-fast validation for Darshil's demo data. Uses Python standard library."""
import json
from decimal import Decimal
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATEGORIES = {"groceries", "dining", "gas", "travel", "other"}


def load(name: str):
    with (ROOT / "data" / name).open(encoding="utf-8") as file:
        return json.load(file)


def validate():
    cards, merchants = load("cards.json"), load("merchants.json")
    if not isinstance(cards, list) or not isinstance(merchants, list):
        raise ValueError("Both catalogs must be JSON arrays")
    if not cards or not merchants:
        raise ValueError("Catalogs must not be empty")
    ids = [card["id"] for card in cards]
    mids = [merchant["id"] for merchant in merchants]
    if len(ids) != len(set(ids)) or len(mids) != len(set(mids)):
        raise ValueError("Duplicate card or merchant ID")
    for card in cards:
        if card["reward_type"] != "cashback":
            raise ValueError("Hackathon MVP supports cashback cards only")
        base = Decimal(str(card["base_rate"]))
        if not 0 <= base <= 1:
            raise ValueError(f"Bad base rate: {card['id']}")
        for rule in card["bonus_rules"]:
            if rule["category"] not in CATEGORIES:
                raise ValueError(f"Unsupported category: {rule['category']}")
            rate = Decimal(str(rule["rate"]))
            if not base <= rate <= 1:
                raise ValueError(f"Invalid bonus rate: {card['id']}")
            cap = rule["cap_amount"]
            spent = Decimal(str(rule["spent_to_date"]))
            if spent < 0 or (cap is not None and (Decimal(str(cap)) <= 0 or spent > Decimal(str(cap)))):
                raise ValueError(f"Invalid cap/spend: {card['id']}")
    for merchant in merchants:
        if merchant["category"] not in CATEGORIES:
            raise ValueError(f"Unsupported merchant category: {merchant['id']}")
        if merchant["mcc_status"] not in {"assumed", "verified", "unknown"}:
            raise ValueError(f"Invalid MCC status: {merchant['id']}")
        if not (-90 <= merchant["latitude"] <= 90 and -180 <= merchant["longitude"] <= 180):
            raise ValueError(f"Invalid coordinates: {merchant['id']}")
    print(f"PASS: validated {len(cards)} cards and {len(merchants)} demo merchants")
    print("Note: rewards/MCCs/merchant locations are synthetic. No actual MCC validation.")
    return cards, merchants


if __name__ == "__main__":
    validate()
