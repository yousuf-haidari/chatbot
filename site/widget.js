(function () {
  function init() {
    if (!document.body) return setTimeout(init, 50);

    // ✅ PUT YOUR BOT PFP HERE (robot image URL)
    const BOT_AVATAR_URL = "C:\Users\moham\Downloads\ChatGPT Image Feb 26, 2026, 11_07_33 AM.png";

    // ✅ Reads: <script src=".../widget.js" data-client="client1"></script>
    function getClientId() {
      try {
        const scripts = Array.from(document.getElementsByTagName("script"));
        const me =
          scripts.find((s) => (s.src || "").includes("/widget.js")) ||
          scripts.find((s) => (s.src || "").includes("widget.js")) ||
          null;
        return (me && me.dataset && me.dataset.client) ? me.dataset.client : "default";
      } catch {
        return "default";
      }
    }
    const CLIENT_ID = getClientId();

    // ===== Root layer (always on top) =====
    const root = document.createElement("div");
    root.style.cssText =
      "position:fixed;inset:0;pointer-events:none;z-index:2147483647;";
    document.body.appendChild(root);

    // ===== Floating button =====
    const btn = document.createElement("button");
    btn.type = "button";
    btn.innerHTML = `
      <span style="display:flex;align-items:center;gap:10px;">
        <span style="width:10px;height:10px;border-radius:999px;background:#4ade80;display:inline-block;"></span>
        Chat
      </span>
    `;
    btn.style.cssText =
      "position:fixed;bottom:20px;right:20px;padding:12px 16px;background:#061a3a;color:#fff;border:1px solid rgba(255,255,255,.12);border-radius:999px;font-family:Arial;font-weight:600;cursor:pointer;pointer-events:auto;box-shadow:0 12px 30px rgba(0,0,0,.35);";
    root.appendChild(btn);

    // ===== Chat box =====
    const box = document.createElement("div");
    box.style.cssText =
      "position:fixed;bottom:76px;right:20px;width:340px;height:460px;background:#061a3a;border-radius:16px;border:1px solid rgba(255,255,255,.12);display:none;flex-direction:column;overflow:hidden;pointer-events:auto;box-shadow:0 18px 50px rgba(0,0,0,.45);";
    root.appendChild(box);

    // ===== Styles (dark blue + gray messages) =====
    const styles = `
      .cb-header{
        display:flex;align-items:center;justify-content:space-between;
        padding:12px 12px;border-bottom:1px solid rgba(255,255,255,.10);
        color:#fff;font-family:Arial;
      }
      .cb-title{display:flex;align-items:center;gap:10px;font-weight:700;}
      .cb-botpfp{
        width:28px;height:28px;border-radius:999px;object-fit:cover;
        border:1px solid rgba(255,255,255,.15);
        background:rgba(255,255,255,.08);
      }
      .cb-close{
        background:transparent;color:#cbd5e1;border:0;cursor:pointer;
        font-size:18px;line-height:1;padding:6px 10px;border-radius:10px;
      }
      .cb-close:hover{background:rgba(255,255,255,.08);}
      .cb-messages{
        flex:1;padding:12px;overflow:auto;font-family:Arial;font-size:14px;
      }
      .cb-row{display:flex;gap:10px;margin:10px 0;}
      .cb-row.user{justify-content:flex-end;}
      .cb-row.bot{justify-content:flex-start;align-items:flex-end;}
      .cb-bubble{
        max-width:76%;
        padding:10px 12px;border-radius:14px;
        background:#334155;
        color:#e5e7eb;
        border:1px solid rgba(255,255,255,.08);
        white-space:pre-wrap;
      }
      .cb-inputbar{
        display:flex;gap:8px;padding:12px;border-top:1px solid rgba(255,255,255,.10);
        background:rgba(255,255,255,.02);
      }
      .cb-input{
        flex:1;padding:10px 12px;border-radius:12px;
        border:1px solid rgba(255,255,255,.12);
        background:#021027;color:#e5e7eb;
        outline:none;font-family:Arial;
      }
      .cb-input::placeholder{color:#94a3b8;}
      .cb-send{
        padding:10px 12px;border-radius:12px;
        border:1px solid rgba(255,255,255,.12);
        background:#0b2f66;color:#fff;
        cursor:pointer;font-family:Arial;font-weight:700;
      }
      .cb-send:hover{filter:brightness(1.08);}
      .cb-send:active{transform:translateY(1px);}
    `;

    box.innerHTML = `
      <style>${styles}</style>

      <div class="cb-header">
        <div class="cb-title">
          <img class="cb-botpfp" src="${BOT_AVATAR_URL}" alt="bot" onerror="this.style.display='none'"/>
          <span>Support</span>
        </div>
        <button class="cb-close" type="button" aria-label="Close">✕</button>
      </div>

      <div class="cb-messages" id="cb-msgs"></div>

      <div class="cb-inputbar">
        <input class="cb-input" id="cb-inp" placeholder="Type your message..." />
        <button class="cb-send" id="cb-send" type="button">Send</button>
      </div>
    `;

    // Toggle open/close
    const closeBtn = box.querySelector(".cb-close");
    btn.onclick = () => (box.style.display = box.style.display === "none" ? "flex" : "none");
    closeBtn.onclick = () => (box.style.display = "none");

    const msgs = box.querySelector("#cb-msgs");
    const inp = box.querySelector("#cb-inp");
    const sendBtn = box.querySelector("#cb-send");

    function escapeHtml(s) {
      return String(s)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    function addUser(text) {
      const row = document.createElement("div");
      row.className = "cb-row user";
      row.innerHTML = `<div class="cb-bubble">${escapeHtml(text)}</div>`;
      msgs.appendChild(row);
      msgs.scrollTop = msgs.scrollHeight;
    }

    // ✅ Bot message includes bot pfp ONLY
    function addBot(text) {
      const row = document.createElement("div");
      row.className = "cb-row bot";
      row.innerHTML = `
        <img class="cb-botpfp" src="${BOT_AVATAR_URL}" alt="bot" onerror="this.style.display='none'"/>
        <div class="cb-bubble">${escapeHtml(text)}</div>
      `;
      msgs.appendChild(row);
      msgs.scrollTop = msgs.scrollHeight;
      return row;
    }

    async function sendMsg() {
      const t = inp.value.trim();
      if (!t) return;

      inp.value = "";
      addUser(t);

      const thinkingRow = addBot("…");
      const bubble = thinkingRow.querySelector(".cb-bubble");

      try {
        const r = await fetch("https://chatbotbis.netlify.app/.netlify/functions/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: t, clientId: CLIENT_ID }), // ✅ sends clientId
        });

        const text = await r.text();
        let j = {};
        try { j = JSON.parse(text); } catch {}

        const answer = (j.reply || j.error || text || "No reply").toString();
        bubble.textContent = answer;
      } catch {
        bubble.textContent = "Error";
      }
    }

    sendBtn.onclick = sendMsg;
    inp.addEventListener("keydown", (e) => e.key === "Enter" && sendMsg());

    addBot("Hi! How can I help?");
  }

  init();
})();
