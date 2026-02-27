// netlify/functions/chat.js

const CLIENTS = {
  client1: {
    businessName: "Support",
    location: "prince street oshawa ontario",
    hours: "9pm to 5pm",
    phone: "2269357878",
    email: "bisnz.gc.ca",
    booking: "call: 2269357878 for booking appointment etc",
    services: ["clothing", "drug medicine", "very nice customer service"],
    policies: [
      "Refunds: (14 days refund payback)",
      "Delivery/Shipping: (usually delivers in 3-5 days. stay patient.)",
    ],
  },

  client2: {
    businessName: "HAIDARI",
    location: "Ontario, Canada (Shipping to Canada & USA)",
    hours: "Online store — 24/7",
    phone: "N/A",
    email: "businessimageal@gmail.com",
    booking: "Place orders through the website checkout",
    services: [
      "Premium modest wear",
      "Thobes",
      "Kanduras",
      "Shalwar Kameez",
      "Kaftans",
      "Islamic clothing and accessories",
    ],
    products: [
      { name: "Thobe", sizes: ["S","M","L","XL"], variants: ["White — $59 CAD","Black — $69 CAD","Navy — $69 CAD","Olive — $75 CAD"] },
      { name: "Kandura", sizes: ["S","M","L","XL"], variants: ["White — $65 CAD","Beige — $65 CAD","Grey — $70 CAD","Blue — $75 CAD"] },
      { name: "Shalwar Kameez", sizes: ["S","M","L","XL"], variants: ["White — $79 CAD","Cream — $79 CAD","Brown — $85 CAD","Charcoal — $85 CAD"] },
      { name: "Kaftan", sizes: ["S","M","L","XL"], variants: ["Black — $89 CAD","Red — $95 CAD","Blue — $95 CAD","Cream — $85 CAD"] },
    ],
    policies: [
      "Launch Sale: 10% off all products for a limited time (auto-applied).",
      "Shipping Regions: Canada and USA.",
      "Free Shipping: Automatically applied when cart has 2 or more items.",
      "Returns: Accepted within 14 days of delivery (unworn, original condition).",
      "Refunds: Processed within 30 days after return approval.",
      "Payments: Card, Apple Pay, Google Pay, PayPal, Shop Pay.",
    ],
    branding: {
      tagline: "YOUSUF IS HERE",
      vibe: "Nike/Adidas/Gymshark energy + traditional modest wear",
      colors: ["Deep Black", "Dark Navy", "Neon Green Accent"],
      font: "Cinzel",
    },
  },

  default: {
    businessName: "Customer Support",
    location: "",
    hours: "Our team is available during business hours.",
    phone: "",
    email: "",
    booking: "Please contact our support team for assistance.",
    services: ["Answering questions", "Providing support", "Helping with bookings"],
    policies: ["Support responses are provided as soon as possible."],
  },
};

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
};

exports.handler = async (event) => {
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

    // IMPORTANT: accept BOTH "client" and "clientId"
    const clientId = String(body.client || body.clientId || "default");
    const client = CLIENTS[clientId] || CLIENTS.default;

    const BUSINESS_CONTEXT = `
Business name: ${client.businessName}
Location: ${client.location}
Hours: ${client.hours}
Phone: ${client.phone}
Email: ${client.email}
Booking: ${client.booking}
Services: ${Array.isArray(client.services) ? client.services.join(", ") : ""}
Products: ${Array.isArray(client.products) ? client.products.map(p => `${p.name} (${(p.variants||[]).join(", ")}) Sizes: ${(p.sizes||[]).join("/")}`).join(" | ") : ""}
Policies: ${Array.isArray(client.policies) ? client.policies.join(" | ") : ""}
Branding: Tagline=${client.branding?.tagline || ""}, Vibe=${client.branding?.vibe || ""}
`.trim();

    const SUPPORT_RULES = `
You are a CUSTOMER SUPPORT agent for the business above.
Be short and direct (1–3 sentences).
Answer ONLY business-related questions using the business context.
If unrelated: "I can help with our products, prices, shipping, returns, and ordering. What do you need?"
If you don’t know: ask ONE short clarifying question.
`.trim();

    const prompt = `
${BUSINESS_CONTEXT}

${SUPPORT_RULES}

Customer message: ${message}
Reply as support:
`.trim();

    const model = "gemini-2.5-flash";
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=` +
      encodeURIComponent(key);

    const geminiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        generationConfig: { temperature: 0.3, topP: 0.9 },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      }),
    });

    const data = await geminiRes.json();

    if (!geminiRes.ok) {
      return {
        statusCode: geminiRes.status,
        headers,
        body: JSON.stringify({ error: data?.error?.message || "Gemini request failed" }),
      };
    }

    let reply = "";
    const parts = data?.candidates?.[0]?.content?.parts || [];
    reply = parts.map((p) => p.text || "").join("").trim();

    if (!reply) reply = "I can help with products, prices, shipping, returns, and ordering. What do you need?";

    return { statusCode: 200, headers, body: JSON.stringify({ reply }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Server error", details: String(err) }) };
  }
};
