from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
# from openAI_API import chat_completion, GPT
from openAI_API_personal import chat_completion, GPT

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

llm = GPT.gpt_4o_0806  
temp = 0.8

@app.get("/")
def root():
    return {"message": "Backend is running."}

@app.post("/prompt_llm")
async def generate_idea(request: Request):
    body = await request.json()
    window_id = body.get("window_id")
    problem = body.get("problem", "")
    ideas = body.get("ideas", [])

    if window_id == "B":
        return await decompose_problem(problem, ideas)
    elif window_id == "C":
        apparent_problem = ideas.get("idea_b", [])
        problem_difficulty = ideas.get("idea_c", [])
        return await diagnose_problem(problem, apparent_problem, problem_difficulty)
    elif window_id == "D":
        frame = ideas.get("idea_d", [])
        solution = ideas.get("idea_e", [])
        return await reframe_problem(problem, frame, solution)
    elif window_id == "E":
        frame = ideas.get("idea_d", [])
        solution = ideas.get("idea_e", [])
        return await suggest_solution(problem, frame, solution)
    else:
        return {"text": "Unknown window_id"}
    
async def decompose_problem(_problem: str, _ideas: list):
    prompt = [
        {
            "role": "developer",
            "content": f"You are a creative assistant designed to suggest novel and useful ideas.\n"
                       f"Your task is to decompose the PROBLEM DESCRIPTION below:\n"
                       f"### PROBLEM DESCRIPTION ###\n"
                       f"{_problem}\n"
                       f"\n"
        },
        {
            "role": "user",
            "content": f""
                       f"The following problems are listed from the PROBLEM DESCRIPTION:\n"
                       f"### PROBLEM LIST ###\n"
                       f"{_ideas}\n"
                       f"\n"
                       f"Is there a problem missing from the PROBLEM DESCRIPTION?\n"
                       f"If all problems are listed, reply \"No more problems to list.\"\n"
                       f"If there is an unlisted problem, write one in a short subject-verbe-object/adjective sentence.\n"
                       f"Show only the result as a plain text."
        }
    ]

    _, output, _ = chat_completion(llm, prompt, temp)
    return {"text": output}


async def diagnose_problem(_problem: str, _ideas_b: list, _ideas_self: list):
    prompt = [
        {
            "role": "developer",
            "content": f"You are a creative assistant designed to suggest novel and useful ideas.\n"
                       f"Your task is to suggest NEW perspectives on the PROBLEM CONTEXT below:\n"
                       f"### PROBLEM CONTEXT ###\n"
                       f"{_problem}\n"
                       f"\n"
        },
        {
            "role": "user",
            "content": f""
                       f"Here are the main PROBLEMS identified so far:\n"
                       f"### PROBLEMS ###\n"                    
                       f"{_ideas_b}\n"
                       f"\n"
                       f"Here are why we think the problems are difficult to solve:\n"
                       f"### DIFFICULTIES ###\n"
                       f"{_ideas_self}\n"
                       f"\n"
                       f"What makes the PROBLEMS difficult to solve?\n"
                       f"Write a very short causality that does not exist in the DIFFICULTIES.\n"
                       f"Show only the result."
        }
    ]

    _, output, _ = chat_completion(llm, prompt, temp)
    return {"text": output}


async def reframe_problem(_problem: str, _frame: list, _solution: list):
    prompt = [
        {
            "role": "developer",
            "content": f"You are a creative assistant designed to suggest novel and useful ideas.\n"
                       f"Your task is to think about how else the problem can be approached to bring benefits beyond solving the original problems.\n"
                       f"### PROBLEM CONTEXT ###\n"
                       f"{_problem}\n"
                       f"\n"
                       f"You MUST randomly pick one problem keyword from the PROBLEM CONTEXT and think about a preferable state of that keyword."
        },
        {
            "role": "user",
            "content": f""
                       f"Here are PROBLEM FRAMES and POTENTIAL SOLUTIONS explored so far:\n"
                       f"### PROBLEM FRAMES ###\n"                    
                       f"{_frame}\n"
                       f"\n"
                       f"### POTENTIAL SOLUTIONS ###\n"
                       f"{_solution}\n"
                       f"\n"
                       f"How else can we think about the problem?\n"
                       f"Suggest an original idea that does not exists in the PROBLEM CONTEXT, PROBLEM FRAMES and POTENTIAL SOLUTIONS.\n"
                       f"Write it in a very short sentence with a simple vocalbulary.\n"
                       f"Show only the result in the following format:\n"
                       "The problem is not that . The problem is that ."
                    #    "..."
        }
    ]

    _, output, _ = chat_completion(llm, prompt, temp)
    return {"text": output}


async def suggest_solution(_problem: str, _frame: list, _solution: list):
    prompt = [
        {
            "role": "developer",
            "content": f"You are a creative assistant designed to suggest novel and useful ideas.\n"
                       f"Your task is to think about creative solusions to bring benefits beyond solving the original problems.\n"
                       f"### PROBLEM CONTEXT ###\n"
                       f"{_problem}\n"
                       f"\n"
        },
        {
            "role": "user",
            "content": f""
                       f"Here are PROBLEM FRAMES and POTENTIAL SOLUTIONS explored so far:\n"
                       f"### PROBLEM FRAMES ###\n"                    
                       f"{_frame}\n"
                       f"\n"
                       f"### POTENTIAL SOLUTIONS ###\n"
                       f"{_solution}\n"
                       f"\n"
                       f"What else could be a solution?\n"
                       f"Suggest a new idea that does not exists in the PROBLEM CONTEXT, PROBLEM FRAMES and POTENTIAL SOLUTIONS.\n"
                       f"Write it in a very short sentence with a simple vocalbulary.\n"
                       f"Show only the result in the following format:\n"
                       f"What if ..."
        }
    ]

    _, output, _ = chat_completion(llm, prompt, temp)
    return {"text": output}