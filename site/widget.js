(() => {
  // UI
  const btn = document.createElement("button");
  btn.textContent = "Chat";
  btn.style.cssText =
    "position:fixed;bottom:18px;right:18px;padding:10px 14px;border-radius:999px;border:1px solid #ccc;background:#fff;cursor:pointer;z-index:99999;";
  document.body.appendChild(btn);

  const box = document.createElement("div");
  box.style.cssText =
    "position:fixed;bottom:70px;right:18px;width:320px;height:420px;border:1px solid #ccc;border-radius:12px;background:#fff;display:none;flex-direction:column;overflow:hidden;z-index:99999;";
  box.innerHTML = `
    <div style="padding:10px;border-bottom:1px solid #eee;font-weight:600;">Support Bot</div>
    <div id="cb-messages" style="flex:1;padding:10px;overflow:auto;font-family:Arial;font-size:14px;"></div>
    <div style="display:flex;gap:6px;padding:10px;border-top:1px solid #eee;">
      <input id="cb-input" placeholder="Type..." style="flex:1;padding:8px;border:1px solid #ccc;border-radius:8px;" />
      <button id="cb-send" style="padding:8px 12px;border:1px solid #ccc;border-radius:8px;background:#f7f7f7;cursor:pointer;">Send</button>
    </div>
  `;
  document.body.appendChild(box);

  btn.onclick = () => (box.style.display = box.style.display === "none" ? "flex" : "none");

  const messages = box.querySelector("#cb-messages");
  const input = box.querySelector("#cb-input");
  const send = box.querySelector("#cb-send");

  function add(role, text) {
    const div = document.createElement("div");
    div.style.cssText = "margin:8px 0;white-space:pre-wrap;";
    div.innerHTML = `<b>${role}:</b> ${text}`;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  async function sendMsg() {
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    add("You", text);
    add("Bot", "…");

    const lastBot = messages.lastChild;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();
      lastBot.innerHTML = `<b>Bot:</b> ${data.reply || "No reply"}`;
    } catch (e) {
      lastBot.innerHTML = `<b>Bot:</b> Error talking to server.`;
    }
  }

  send.onclick = sendMsg;
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMsg();
  });

  add("Bot", "Hi! Ask me anything.");
})();
