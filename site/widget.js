(function () {
  function init() {
    if (!document.body) {
      return setTimeout(init, 50);
    }

    const root = document.createElement("div");
    root.style.cssText =
      "position:fixed;inset:0;pointer-events:none;z-index:2147483647;";
    document.body.appendChild(root);

    const btn = document.createElement("button");
    btn.textContent = "Chat";
    btn.style.cssText =
      "position:fixed;bottom:20px;right:20px;padding:12px 16px;background:#111;color:#fff;border:none;border-radius:999px;font-family:Arial;cursor:pointer;pointer-events:auto;";
    root.appendChild(btn);

    const box = document.createElement("div");
    box.style.cssText =
      "position:fixed;bottom:70px;right:20px;width:320px;height:420px;background:#fff;border-radius:12px;border:1px solid #ddd;display:none;flex-direction:column;overflow:hidden;pointer-events:auto;";
    root.appendChild(box);

    box.innerHTML = `
      <div style="padding:12px;font-weight:600;border-bottom:1px solid #eee">Support</div>
      <div id="msgs" style="flex:1;padding:10px;overflow:auto;font-family:Arial;font-size:14px"></div>
      <div style="display:flex;padding:10px;border-top:1px solid #eee">
        <input id="inp" style="flex:1;padding:8px;border:1px solid #ccc;border-radius:8px"/>
        <button id="send" style="margin-left:6px;padding:8px 12px">Send</button>
      </div>
    `;

    btn.onclick = () => {
      box.style.display = box.style.display === "none" ? "flex" : "none";
    };

    const msgs = box.querySelector("#msgs");
    const inp = box.querySelector("#inp");
    const send = box.querySelector("#send");

    function add(role, text) {
      const d = document.createElement("div");
      d.innerHTML = `<b>${role}:</b> ${text}`;
      d.style.margin = "6px 0";
      msgs.appendChild(d);
      msgs.scrollTop = msgs.scrollHeight;
    }

    async function sendMsg() {
      const t = inp.value.trim();
      if (!t) return;
      inp.value = "";
      add("You", t);
      add("Bot", "…");
      const last = msgs.lastChild;

      try {
        const r = await fetch("https://chatbotbis.netlify.app/.netlify/functions/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: t }),
        });
        const j = await r.json();
        last.innerHTML = `<b>Bot:</b> ${j.reply || "No reply"}`;
      } catch {
        last.innerHTML = "<b>Bot:</b> Error";
      }
    }

    send.onclick = sendMsg;
    inp.addEventListener("keydown", (e) => e.key === "Enter" && sendMsg());
  }

  init();
})();
