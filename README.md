<div align="center">
  <h1>SmartLingo</h1>
  <i>AI Agent-Based Language Learning App</i>
</div>

# Motivation
There are plenty of language learning apps, each with their own approach. Some mobile apps have a fixed curriculum that the user has to follow, while others integrate AI chatbots to create a conversational learning experience that engages with the learner through real-world scenarios. However, there is no middle ground. We wanted to create a solution that combines the generative nature of LLMs with a structured approach to learning, while also providing the learner with a personalized course relevant to their interests.

# Proposed Solution
Gemma 4 supports 140 languages, which is a powerful feature for language learning use case.
We used the Gemma 4 31B model's agentic capabilities to create a multi-agent application that allows users to have a personalized learning experience. It generates language "activities" on the fly based on user-provided topics.
In the app, you'll find three types of activities: listening, reading and writing. Each has their own difficulty levels (Easy, medium and hard).

# Implementation Details
This is the technology stack for our app:
- Frontend: Expo (React Native)
- Backend: FastAPI + MongoDB
- Agentic Framework: Google ADK
- LLM: gemma-4-31b-it

We have 4 types of agents:
- Topic Generation Agent: This agent generate topics (scenarios for practicing the language)
- Activity Generation Agents: These are agents responsible for generating an activity based on the provided topic and target language. (*easy_listening_agent*, *medium_listening_agent*, *hard_listening_agent*, *easy_writing_agent*...)
- Activity Evaluation Agents: They assess the user's answer using the model's intelligence, providing flexibility in the evaluation and natural language feedback. (*hard_reading_eval_agent*, *easy_writing_eval_agent*...) (*Some activities didn't need an agent for evaluation since they are just a simple value check*)
- Recommendation Agent: The app recommends next steps after finishing an activity: Reviewing missed activity, moving on to a higher difficulty activity or changing the topic

*Example of an activity agent prompt*:
`Generate 5 listening tasks about the topic: {topic} in {target_language}.
    For each task:
    1. Write a short natural sentence in {target_language}.
    2. Pick one key word as the missing_word.
    3. Write sentence_with_blank: identical sentence but with missing_word replaced by '____'.
    4. Write options: a shuffled list of 4 words — the correct missing_word plus 3 plausible distractors in {target_language}.
    The learner will hear the full sentence (TTS) and must choose the missing word from the options.
    Respond ONLY with a valid JSON object. No preamble, no markdown.`



# Encountered Challenges

First, we started testing the model by manually prompting it to generate activities and return structured output. We used a free API key from Google AI Studio. Sometimes, the model didn't respond correctly and returned JSON in a incorrect format. Other times, the server returned error 500. It was mainly due to high usage rates, so during development, we switched to other Google models when Gemma 4 was down. Also, response time was relatively slow (sometimes surpassing 10 seconds for a single activity).
JSON parsing error were less frequent when we used the recommended temperature (1.0), top_k and top_p values.

# Future Work
At this stage, the app is just a prototype. We can improve it in the following directions:
- Implement language level frameworks (like CEFR: A1, A2, B1...)
- Implement speaking activities, using Gemma 4 multimodal capabilities (for example, using E2B or E4B to detect pronunciation mistakes from audio)
- Generate courses with Gemma: learners can read through AI-generated course materials.

# How to run this project:
1. Start your local MongoDB server
2. Create these two .env files:
  - Inside the *frontend* folder with the following content:
```
REACT_APP_API_URL=http://localhost:8000
REACT_APP_API_TIMEOUT=10000
```
  - Inside the *backend* folder with the following content:
```
GEMINI_API_KEY=
```
*(Fill in your Gemini API key from Google AI studio or other providers.)*

3. Create a virtual environment for Python backend and install dependencies:
```
cd backend
pip install -r requirements.txt
```
4. Install frontend dependencies:
```
cd frontend
npm i
```
5. Start backend and frontend dev servers with `fastapi dev main.py` and `npx expo start`
