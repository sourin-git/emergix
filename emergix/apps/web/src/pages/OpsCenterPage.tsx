import { useMemo, useState } from "react";
import {
  requestChatTriage,
  type ChatTriageResponse,
} from "../services/chatbotService";

type ChatState = {
  loading: boolean;
  data: ChatTriageResponse | null;
  error: string | null;
};

export function OpsCenterPage() {
  const [symptoms, setSymptoms] = useState("Severe chest pain and sweating");
  const [age, setAge] = useState("40");
  const [state, setState] = useState<ChatState>({
    loading: false,
    data: null,
    error: null,
  });

  const urgencyClass = useMemo(() => {
    if (!state.data?.urgency) {
      return "urgency-pill";
    }
    const urgency = state.data.urgency.toUpperCase();
    if (urgency === "CRITICAL" || urgency === "HIGH") {
      return "urgency-pill high";
    }
    if (urgency === "MEDIUM") {
      return "urgency-pill medium";
    }
    return "urgency-pill low";
  }, [state.data?.urgency]);

  const analyze = async () => {
    setState({ loading: true, data: null, error: null });
    try {
      const data = await requestChatTriage({
        symptoms,
        age: Number.isNaN(Number(age)) ? undefined : Number(age),
      });
      setState({ loading: false, data, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Chatbot unavailable";
      setState({ loading: false, data: null, error: message });
    }
  };

  return (
    <section className="card-grid">
      <article className="panel stitch-panel">
        <p className="eyebrow">AI EMERGENCY ASSISTANT</p>
        <h1>Hackathon Triage Copilot</h1>
        <p>
          Enter symptoms and get instant emergency classification, first-aid guidance,
          and response expectation.
        </p>

        <label className="field-label" htmlFor="symptoms-input">
          Symptoms
        </label>
        <textarea
          id="symptoms-input"
          className="text-field ops-textarea"
          value={symptoms}
          onChange={(event) => setSymptoms(event.target.value)}
          placeholder="Example: breathing difficulty, dizziness, heavy bleeding"
        />

        <label className="field-label" htmlFor="age-input">
          Age (optional)
        </label>
        <input
          id="age-input"
          className="text-field"
          value={age}
          onChange={(event) => setAge(event.target.value)}
          placeholder="Age"
        />

        <button className="ops-button" onClick={analyze}>
          {state.loading ? "Analyzing emergency..." : "Run AI Triage"}
        </button>

        {state.error ? <p className="ops-error">{state.error}</p> : null}

        {state.data ? (
          <div className="chat-result">
            <div className="chat-header-row">
              <span className={urgencyClass}>{state.data.urgency}</span>
              <span className="status-pill">{state.data.emergency_type}</span>
            </div>

            <div className="meta-row">
              <div>
                <span className="muted">Facility</span>
                <strong>{state.data.facility_needed}</strong>
              </div>
              <div>
                <span className="muted">Estimated response</span>
                <strong>{state.data.estimated_response_time}</strong>
              </div>
            </div>

            <h2>Immediate First-Aid Steps</h2>
            <ul className="check-list">
              {state.data.first_aid_steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>

            {state.data.caution_note ? (
              <p className="ops-meta">Caution: {state.data.caution_note}</p>
            ) : null}
          </div>
        ) : null}
      </article>
    </section>
  );
}
