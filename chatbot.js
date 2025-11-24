window.chatbotSend = async function (message, history = [], sessionId = "") {
  const response = await fetch("http://localhost:3000/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history, sessionId })
  });

  const data = await response.json();
  return data.reply;
};
