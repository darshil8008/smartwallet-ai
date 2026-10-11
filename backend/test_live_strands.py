
import json

from dotenv import load_dotenv

from agents.rewards_agent import create_rewards_agent

load_dotenv()

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

print("Initializing AWS Strands with Akamai inference...")

agent = create_rewards_agent()

print("Agent initialized!")
print("Requesting an actual tool-based comparison...")

prompt = (
    "You MUST call the compare_credit_cards tool "
    "using the following purchase JSON. "
    "Do not calculate rewards yourself.\n\n"
    + json.dumps(purchase)
)

result = agent(prompt)

print("\n========== AGENT RESPONSE ==========")
print(result)

print("\n========== TOOL EXECUTION ==========")

tool_calls = [
    block["toolUse"]
    for message in agent.messages
    if message.get("role") == "assistant"
    for block in message.get("content", [])
    if "toolUse" in block
]

print("Tool calls detected:", len(tool_calls))

for call in tool_calls:
    print("Tool name:", call["name"])

assert any(
    call["name"] == "compare_credit_cards"
    for call in tool_calls
), "The agent did not invoke compare_credit_cards!"

print("\nSUCCESS: Real Strands tool invocation verified!")
