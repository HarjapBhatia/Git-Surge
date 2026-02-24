// this file uses natrual language processing to parse user queries in AI mode
// extracts two params: {duration, limit}

// endpoint for Gemini flash model
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

function Prompt(userInput){
    return `
    You are a parameter extractor for a CLI tool that fetches trending GitHub repositories.

    Extract exactly two values from the user's input:
    1. "limit" — how many repositories they want (a number between 1 and 100, default: 10)
    2. "duration" — the time range they want, mapped to one of: day, week, month, year
    - "today" or "24 hours" or "1 day" → "day"
    - "this week" or "7 days" or "few days" or anything 2-6 days -> "week"
    - "this month" or "30 days" or "few weeks" -> "month"
    - "this year" or "365 days" or "few months" -> "year"
    - if unclear, default to "week"

    User input: "${userInput}"

    Respond ONLY with a raw JSON object. No explanation, no markdown, no backticks.
    Example: {"limit": 10, "duration": "week"}
    `;
}

export async function parseWithAI(userInput, apiKey){
    let response;
    try{
        response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{
                    parts: [{text: Prompt(userInput)}]
                }]
            })
        });
    }catch(networkError){
        throw new Error(`Network error while connecting to Gemini API.\n Details: ${networkError.message}`);
    }

    if(!response.ok){
        if(response.status === 400){    // for invalid req
            throw new Error("Invalid request to Gemini API.");
        }
        if(response.status === 403 || response.status == 401){      // for auth errors
            throw new Error("Invalid or expired Gemini API key. Use git-surge --reset-key to set a new key.");
        }
        if(response.status === 429){    // for rate limit errors
            throw new Error("Gemini API rate limit hit. Please a moment and try again.");
        }
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}\n`);
    }

    let data;
    try{
        data = await response.json();
    }catch{
        throw new Error("Failed to parse response from Gemini API.");
    }

    // extract the content text from the response
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if(!rawText) throw new Error("Gemini API has returned an empty response.");

    let parsed;
    try{
        const clean = rawText.replace(/```json|```/g, '').trim();   // gemini sometimes wraps the JSON in ```json ... ``` responses  
        parsed = JSON.parse(clean);
    }catch{
        throw new Error("Failed to parse Gemini API response as JSON.");
    }

    // validate the parsed values
    const validDurations = ["day", "week", "month", "year"];

    const duration = validDurations.includes(parsed.duration) ? parsed.duration : "week";  // default to week if invalid
    const limit = Number.isInteger(parsed.limit) && parsed.limit >= 1 && parsed.limit <= 100 
        ? parsed.limit 
        : 10; // default to 10 if invalid

    return {duration, limit};
}