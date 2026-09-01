import os
import httpx
import json

GROQ_API_KEY = os.environ.get('GROQ_API_KEY', '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')

async def generate_justification(alert_data: dict) -> str:
    url = "https://api.groq.com/openai/v1/chat/completions"
    
    system_prompt = "You are a cybersecurity SOC analyst assistant. Given an incident's risk factors, weighted scores, and rank position, explain in 1-2 concise sentences why this incident is prioritized at its current rank. Reference specific factor values that drive the ranking. Be actionable and direct."
    
    user_prompt = (
        f"Alert ID: {alert_data.get('id')}\n"
        f"Type: {alert_data.get('type')}\n"
        f"Score: {alert_data.get('score')}%\n"
        f"Rank: {alert_data.get('rank')}\n"
        f"Factors: {json.dumps(alert_data.get('factors'))}\n"
        f"Breakdown (Normalized & Weighted): {json.dumps(alert_data.get('breakdown'))}\n"
        f"Policy Notes: {json.dumps(alert_data.get('policyNotes'))}\n"
    )
    
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
    }
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"].strip()
    except Exception:
        return ""
