export interface ChatTriageResponse {
  urgency: string;
  emergency_type: string;
  facility_needed: string;
  first_aid_steps: string[];
  estimated_response_time: string;
  caution_note?: string;
}

const CHAT_ENDPOINT =
  import.meta.env.VITE_CHAT_API_URL || "/.netlify/functions/chat";

export async function requestChatTriage(input: {
  symptoms: string;
  age?: number;
}): Promise<ChatTriageResponse> {
  const response = await fetch(CHAT_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || "Chat service unavailable");
  }

  return data as ChatTriageResponse;
}
