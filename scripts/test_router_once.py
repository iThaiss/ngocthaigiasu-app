from pathlib import Path

import anthropic

import import_math as im


LOG = Path("exports/generated-theory/router-test.log")
LOG.parent.mkdir(parents=True, exist_ok=True)


def log(message: str) -> None:
    with LOG.open("a", encoding="utf-8") as f:
        f.write(message + "\n")


log(f"base={im.ROUTER_BASE_URL}")
client = anthropic.Anthropic(api_key=im.ROUTER_API_KEY, base_url=im.ROUTER_BASE_URL, timeout=30)
log("client-created")
message = client.messages.create(
    model="loz/gpt-5.5",
    max_tokens=50,
    temperature=0,
    system="Return plain text.",
    messages=[{"role": "user", "content": "Say OK"}],
)
log("response-created")
log(str(message))
