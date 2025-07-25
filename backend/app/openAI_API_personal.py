"""
OpenAI API for chat completion
"""

import os
import sys
from openai import OpenAI
from dotenv import load_dotenv

# Load the config.env
dotenv_loaded = load_dotenv(".env")
print(f"config.env load: {dotenv_loaded}")

# Set the API key
openai_api_key = os.getenv("OPENAI_API_KEY") or sys.exit("OPENAI_API_KEY environment variable not set")

# Available LLM models
class GPT:
    chatgpt_4o_latest = "chatgpt-4o-latest"
    gpt_4_turbo = "gpt-4-turbo-2024-04-09"
    gpt_4o_0513 = "gpt-4o-2024-05-13"
    gpt_4o_0806 = "gpt-4o-2024-08-06"
    gpt_o1_1217 = "o1-2024-12-17"
    gpt_o1_mini_0912 = "o1-mini-2024-09-12"
    gpt_o3_mini_0131 = "o3-mini-2025-01-31"
    emb_3_small = "text-embedding-3-small"
    emb_3_large = "text-embedding-3-large"
    emb_ada_002 = "text-embedding-ada-002"

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


# OpenAI API for chat completion
def chat_completion(_llm, _prompt, _temp, _token=35):
    client = OpenAI(
        api_key=openai_api_key
    )

    llm_response = client.chat.completions.create(
        model=_llm,
        messages=_prompt,
        temperature=_temp,
        max_tokens=_token
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
