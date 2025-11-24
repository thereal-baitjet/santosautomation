function getBaseUrl() {
  if (typeof window === "undefined") return "";
  if (window.location.protocol === "file:") return "http://localhost:3000";
  return "";
}

window.chatbotSend = async function (message, history = [], sessionId = "") {
  const base = getBaseUrl();
  const response = await fetch(`${base}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history, sessionId })
  });

  const data = await response.json();
  return data.reply;
};
