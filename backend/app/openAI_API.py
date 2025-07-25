"""
Get API key from: https://aalto-openai-apigw.developer.azure-api.net/
The code requires AALTO_OPENAI_API_KEY environment variable to be set
Tested with OpenAI v1.13.0 python library
"""

import os
import sys
import httpx
from openai import OpenAI
from dotenv import load_dotenv

# Load the config.env
dotenv_loaded = load_dotenv(".env")
print(f"config.env load: {dotenv_loaded}")

aalto_openai_api_key = os.getenv("AALTO_OPENAI_API_KEY") or sys.exit("AALTO_OPENAI_API_KEY environment variable not set")

class GPT:
    """
    Rewrite the base path with Aalto mappings
    For all endpoints see https://www.aalto.fi/en/services/azure-openai#6-available-api-s
    """
    chatgpt_4o_latest = "/v1/openai/gpt4o/chat/completions"
    gpt_4_turbo = "/v1/openai/gpt4-turbo/chat/completions"
    gpt_4o_0513 = "/v1/openai/gpt4o/chat/completions"
    gpt_4o_0806 = "/v1/openai/deployments/gpt-4o-2024-08-06/chat/completions"
    gpt_o1_1217 = "/v1/openai/deployments/o1-2024-12-17/chat/completions"
    gpt_o1_mini_0912 = "/v1/openai/deployments/o1-mini-2024-09-12/chat/completions"
    gpt_o3_mini_0131 = "/v1/openai/deployments/o3-mini-2025-01-31/chat/completions"
    # emb_3_small = "text-embedding-3-small"
    emb_3_large = "/v1/openai/deployments/text-embedding-3-large/embeddings"
    emb_ada_002 = "/v1/openai/ada-002/embeddings"

    example_prompt = [
        {
            "role": "developer",
            "content": "You are a helpful assistant."
        },
        {
            "role": "user",
            "content": "Hello."
        }
    ]

def chat_completion(_llm, _prompt, _temp, _token=40):

    def update_base_url(request: httpx.Request) -> None:
        if request.url.path == "/chat/completions":
            request.url = request.url.copy_with(path=_llm)

    client = OpenAI(
        base_url="https://aalto-openai-apigw.azure-api.net",
        api_key=False, # API key not used, and rather set below
        default_headers = {
            "Ocp-Apim-Subscription-Key": os.environ.get("AALTO_OPENAI_API_KEY"),
        },
        http_client=httpx.Client(
            event_hooks={ "request": [update_base_url] }
        ),
    )

    llm_response = client.chat.completions.create(
        model="no_effect", # the model variable must be set, but has no effect, model selection done with URL
        messages=_prompt,
        temperature=_temp,
        max_tokens=_token,
    )

    # Input prompt
    input_prompts = []
    for p in _prompt:
        input_prompts.append(p["content"])
    llm_input = "\n\n".join(input_prompts)

    # Output
    llm_output = llm_response.choices[0].message.content

    # input prompt
    print(f"\n---------- INPUT ----------\n{llm_input}\n")

    # LLM response
    print(f"\n---------- OUTPUT ----------\n{llm_output}\n")

    # # All output
    # print(f"\n---------- ALL ----------\n{llm_response}\n")

    return llm_input, llm_output, llm_response


if __name__ == "__main__":
    chat_completion(GPT.gpt_4o_0806, GPT.example_prompt, 0.8)