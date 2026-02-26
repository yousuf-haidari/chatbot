// netlify/functions/chat.js

exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
  };

  try {
    if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers, body: "" };
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, headers, body: JSON.stringify({ error: "Use POST" }) };
    }

    let body = {};
    try {
      body = JSON.parse(event.body || "{}");
    } catch {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid JSON" }) };
    }

    const message = String(body.message || "").trim();
    if (!message) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing message" }) };
    }

    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: "Missing GEMINI_API_KEY" }) };
    }

    // =========================
    // ✅ EDIT THIS FOR EACH CLIENT (customer service info)
    // =========================
    const BUSINESS_CONTEXT = `
Business name: YOUR BUSINESS NAME
Location: YOUR ADDRESS / CITY
Hours: Mon–Fri 9am–6pm, Sat 10am–4pm, Sun closed
Phone: (000) 000-0000
Email: support@yourdomain.com
Website: https://yourdomain.com

Services / Products:
- Service 1
- Service 2
- Service 3

Policies:
- Refunds: (write your policy)
- Shipping/Delivery: (write your policy)
- Booking: (how to book)

If user asks to book/order: tell them exactly how (link/phone).
`;

    // Optional: mini FAQ (keep short)
    const FAQ = `
FAQ:
Q: Where are you located?
A: (answer)

Q: What are your hours?
A: (answer)

Q: How do I book?
A: (answer)
`;

    // =========================
    // ✅ CUSTOMER SERVICE BEHAVIOR (not ChatGPT)
    // =========================
    const SUPPORT_RULES = `
You are a professional CUSTOMER SUPPORT agent for this business.
You are NOT a general chatbot.

Rules:
- Keep replies SHORT (1–4 sentences).
- Answer ONLY using the business context + FAQ above.
- If the question is unrelated to the business, say:
  "I can help with our services, hours, pricing, and booking. What do you need?"
- If you are missing info, ask ONE clarifying question.
- If the user wants booking/order: give clear next step (phone/link/hours).
- Don’t ramble. Don’t give life advice. Don’t mention policies/rules unless needed.
- End with a helpful question when appropriate (e.g., "What day works for you?").
`;

    const prompt = `
${BUSINESS_CONTEXT}

${FAQ}

${SUPPORT_RULES}

Customer message: ${message}
Reply as the support agent:
`;

    // Use a model your key supports (from your listModels output)
    const model = "gemini-2.5-flash";
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=` +
      encodeURIComponent(key);

    const geminiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        // Lower randomness = more “support agent” feel
        generationConfig: { temperature: 0.3, topP: 0.9 },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      }),
    });

    const json = await geminiRes.json();

    if (!geminiRes.ok) {
      return {
        statusCode: geminiRes.status,
        headers,
        body: JSON.stringify({ error: json?.error?.message || "Gemini request failed" }),
      };
    }

    let reply = "";
    if (json?.candidates?.length) {
      const parts = json.candidates[0].content?.parts || [];
      reply = parts.map((p) => p.text || "").join("").trim();
    }
    if (!reply && json?.promptFeedback?.blockReason) reply = `Blocked: ${json.promptFeedback.blockReason}`;
    if (!reply && json?.candidates?.[0]?.finishReason) reply = `No text (finishReason: ${json.candidates[0].finishReason})`;
    if (!reply && json?.error?.message) reply = json.error.message;
    if (!reply) reply = "Sorry—can you rephrase that?";

    return { statusCode: 200, headers, body: JSON.stringify({ reply }) };
  } catch {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Server error" }) };
  }
};
