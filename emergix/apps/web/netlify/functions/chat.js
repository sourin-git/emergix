exports.handler = async function handler(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

  if (!apiKey) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Missing OPENROUTER_API_KEY" }),
    };
  }

  try {
    const payload = JSON.parse(event.body || "{}");
    const symptoms = String(payload.symptoms || "").trim();
    const age = payload.age;

    if (!symptoms) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "symptoms is required" }),
      };
    }

    const systemPrompt =
      "You are an emergency triage assistant for a hackathon demo. Return strict JSON with keys: urgency, emergency_type, facility_needed, first_aid_steps (array of short strings), estimated_response_time, caution_note.";

    const userPrompt = `Symptoms: ${symptoms}${
      typeof age === "number" ? `; Age: ${age}` : ""
    }`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: data?.error?.message || "OpenRouter request failed" }),
      };
    }

    const content = data?.choices?.[0]?.message?.content;
    const parsed = JSON.parse(content || "{}");

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: message }),
    };
  }
};
