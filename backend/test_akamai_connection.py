
import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

client = OpenAI(
    api_key=os.environ["AKAMAI_API_KEY"],
    base_url=os.environ["AKAMAI_BASE_URL"],
    timeout=30.0
)

print("Connecting to Akamai AI Inference...")

try:
    response = client.chat.completions.create(
        model=os.getenv("AKAMAI_MODEL", "hackathon-chat"),
        messages=[
            {
                "role": "system",
                "content": "You are a helpful financial assistant."
            },
            {
                "role": "user",
                "content": "What is 5% cashback on a $100 purchase? Answer briefly."
            }
        ],
        max_tokens=100
    )

    print("\nAkamai AI response:")
    print(response.choices[0].message.content)
    print("\nModel:", response.model)
    print("Connection successful!")

except Exception as exc:
    print("\nConnection failed!")
    print("Error type:", type(exc).__name__)
    print("Error:", str(exc))
