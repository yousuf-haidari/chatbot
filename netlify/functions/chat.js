exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
  };

  try {
    if (event.httpMethod === "OPTIONS") {
      return { statusCode: 204, headers, body: "" };
    }

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

    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=` +
      encodeURIComponent(key);

    const geminiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: message }] }],
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

    if (!reply && json?.promptFeedback?.blockReason) {
      reply = `Blocked: ${json.promptFeedback.blockReason}`;
    }

    if (!reply && json?.candidates?.[0]?.finishReason) {
      reply = `No text (finishReason: ${json.candidates[0].finishReason})`;
    }

    if (!reply && json?.error?.message) {
      reply = json.error.message;
    }

    if (!reply) reply = "No reply";

    return { statusCode: 200, headers, body: JSON.stringify({ reply }) };
  } catch {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Server error" }) };
  }
};
