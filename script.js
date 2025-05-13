document.addEventListener("DOMContentLoaded", () => {
  const chatHistory = document.getElementById("chat-history");
  const userInput = document.getElementById("user-input");
  const sendBtn = document.getElementById("send-btn");
  const typingIndicator = document.getElementById("typing");

  // Função para adicionar mensagem
  function addMessage(role, text) {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add(role);
    messageDiv.innerHTML = `<div class="message">${text}</div>`;
    chatHistory.appendChild(messageDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight; // Rolagem automática para a última mensagem
  }

  // Enviar a pergunta ao backend
  async function sendQuestionToBackend(question) {
    try {
      const response = await fetch("http://localhost:5000/perguntar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pergunta: question }),
      });

      const data = await response.json();
      typingIndicator.style.display = "none"; // Ocultar "digitando..."
      addMessage("bot", data.resposta || "Desculpe, não consegui entender.");
    } catch (error) {
      typingIndicator.style.display = "none";
      addMessage("bot", "Erro ao conectar com o servidor.");
      console.error("Erro de conexão:", error);
    }
  }

  // Função para enviar a mensagem ao clicar no botão
  sendBtn.addEventListener("click", () => {
    const question = userInput.value.trim();
    if (!question) return;

    addMessage("user", question);
    userInput.value = ""; // Limpar o campo de entrada

    typingIndicator.style.display = "block"; // Mostrar "digitando..."
    sendQuestionToBackend(question);
  });

  // Enviar a mensagem ao pressionar Enter
  userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      sendBtn.click();
    }
  });

  // Função para adicionar as sugestões
  const suggestionButtons = document.querySelectorAll(".suggestion-btn");
  suggestionButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const suggestion = btn.innerText;
      addMessage("user", suggestion);
      typingIndicator.style.display = "block";
      sendQuestionToBackend(suggestion);
    });
  });
});

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
