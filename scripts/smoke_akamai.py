"""Confirm Akamai chat completion; --tools additionally tests tool-call output.
Requires valid team credentials; cannot be run offline.
"""
import argparse
import os
import sys
import requests
from dotenv import load_dotenv

load_dotenv()
parser = argparse.ArgumentParser()
parser.add_argument("--tools", action="store_true", help="Request a tool call and inspect the model reply")
args = parser.parse_args()

key = os.getenv("AKAMAI_API_KEY", "").strip()
base = os.getenv("AKAMAI_BASE_URL", "").strip().rstrip("/")
model = os.getenv("AKAMAI_MODEL", "").strip()
if not key or not base or not model:
    sys.exit("Missing AKAMAI_API_KEY, AKAMAI_BASE_URL, or AKAMAI_MODEL in .env")

payload = {
    "model": model,
    "messages": [{"role": "user", "content": "Call calculate_cashback with amount 180 and rate 5. Do not compute it yourself."}] if args.tools else [{"role": "user", "content": "Reply with only the word OK."}],
    "max_tokens": 120,
}
if args.tools:
    payload["tools"] = [{"type": "function", "function": {"name": "calculate_cashback", "description": "Calculate cashback using the application math tool", "parameters": {"type": "object", "properties": {"amount": {"type": "number"}, "rate": {"type": "number"}}, "required": ["amount", "rate"]}}}]
    payload["tool_choice"] = "auto"
try:
    response = requests.post(
        f"{base}/chat/completions",
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
        json=payload,
        timeout=30,
    )
except requests.RequestException as exc:
    sys.exit(f"NETWORK FAILURE: {type(exc).__name__}: {exc}")
print("HTTP status:", response.status_code)
if not response.ok:
    print("Server error:", response.text[:800])
    sys.exit(1)
try:
    message = response.json()["choices"][0]["message"]
except (KeyError, IndexError, ValueError) as exc:
    sys.exit(f"UNEXPECTED RESPONSE STRUCTURE: {exc}")
print("Model content:", message.get("content"))
if args.tools:
    calls = message.get("tool_calls", [])
    if not calls:
        sys.exit("TOOL TEST INCOMPLETE: no tool call received; investigate model support/settings")
    print("TOOL REQUEST:", calls[0].get("function"))
    print("PASS: model requested a tool call. Khevna must still test actual execution via Strands.")
else:
    print("PASS: basic chat completion returned. Next test: python scripts/smoke_akamai.py --tools")
