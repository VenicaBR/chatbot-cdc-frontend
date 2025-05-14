document.addEventListener("DOMContentLoaded", () => {
  const chatHistory = document.getElementById("chat-history");
  const userInput = document.getElementById("user-input");
  const sendBtn = document.getElementById("send-btn");
  const typingIndicator = document.getElementById("typing");
  const suggestionsContainer = document.querySelector(".suggestions");

  let historico = []; // Histórico de mensagens

  // Adiciona uma nova mensagem ao chat e histórico
  function addMessage(role, text) {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add(role);
    messageDiv.innerHTML = `<div class="message">${text}</div>`;
    chatHistory.appendChild(messageDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;

    historico.push({ autor: role === "user" ? "user" : "bot", mensagem: text });
  }

  // Mostra sugestões de próximas perguntas
  function renderSuggestions(sugestoes) {
    suggestionsContainer.innerHTML = ""; // Limpa sugestões anteriores
    sugestoes.forEach((sugestao) => {
      const btn = document.createElement("button");
      btn.className = "suggestion-btn";
      btn.textContent = sugestao;
      btn.addEventListener("click", () => {
        addMessage("user", sugestao);
        typingIndicator.style.display = "block";
        sendQuestionToBackend(sugestao);
      });
      suggestionsContainer.appendChild(btn);
    });
  }

  // Envia a pergunta ao backend com o histórico
  async function sendQuestionToBackend(question) {
    try {
      const response = await fetch("http://localhost:5000/perguntar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pergunta: question, historico }),
      });

      const data = await response.json();
      typingIndicator.style.display = "none";

      addMessage("bot", data.resposta || "Desculpe, não consegui entender.");

      if (data.sugestoes && Array.isArray(data.sugestoes)) {
        renderSuggestions(data.sugestoes);
      }
    } catch (error) {
      typingIndicator.style.display = "none";
      addMessage("bot", "Erro ao conectar com o servidor.");
      console.error("Erro de conexão:", error);
    }
  }

  // Evento de clique no botão "Enviar"
  sendBtn.addEventListener("click", () => {
    const question = userInput.value.trim();
    if (!question) return;

    addMessage("user", question);
    userInput.value = "";
    typingIndicator.style.display = "block";
    sendQuestionToBackend(question);
  });

  // Evento de pressionar Enter
  userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      sendBtn.click();
    }
  });

  // Verificação de conexão
  const checkConnectionBtn = document.getElementById("check-connection-btn");
  const statusMessage = document.getElementById("status-message");

  checkConnectionBtn.addEventListener("click", async () => {
    statusMessage.textContent = "Verificando...";
    try {
      const response = await fetch("http://localhost:5000/perguntar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pergunta: "teste de conexão" }),
      });

      if (response.ok) {
        statusMessage.textContent = "✅ Conexão com o servidor estabelecida.";
        statusMessage.style.color = "green";
      } else {
        statusMessage.textContent = "❌ Erro na resposta do servidor.";
        statusMessage.style.color = "red";
      }
    } catch (error) {
      statusMessage.textContent = "❌ Erro ao conectar com o servidor.";
      statusMessage.style.color = "red";
      console.error("Erro de conexão:", error);
    }
  });
});
