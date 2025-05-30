let BACKEND_URL = "http://127.0.0.1:8000/perguntar-openai";

document.addEventListener("DOMContentLoaded", () => {
  const chatHistory = document.getElementById("chat-history");
  const userInput = document.getElementById("user-input");
  const sendBtn = document.getElementById("send-btn");
  const typingIndicator = document.getElementById("typing");
  const suggestionsContainer = document.querySelector(".suggestions");
  const avatarMontainha = document.querySelector(".avatar-container");
  const avatarOtavianinho = document.querySelector(".avatar-container-left");
  const themeLink = document.getElementById("theme-css");

  // Inicializa com o tema Montainha por padrão
  let currentTheme = "montainha";
  setActiveAvatar();

  let historico = [];
  let firstResponseReceived = false;

  // Adiciona eventos de clique aos avatares para alternar temas e rotas
  avatarMontainha.addEventListener("click", () => {
    if (currentTheme !== "montainha") {
      currentTheme = "montainha";
      themeLink.href = "css/styles-montainha.css";
      BACKEND_URL = "http://127.0.0.1:8000/perguntar-openai";
      setActiveAvatar();
    }
  });

  avatarOtavianinho.addEventListener("click", () => {
    if (currentTheme !== "otavianinho") {
      currentTheme = "otavianinho";
      themeLink.href = "css/styles-otavianinho.css";
      BACKEND_URL = "http://127.0.0.1:8000/perguntar-pdf";
      setActiveAvatar();
    }
  });

  // Define qual avatar está ativo com base no tema atual
  function setActiveAvatar() {
    if (currentTheme === "montainha") {
      avatarMontainha.classList.add("active");
      avatarOtavianinho.classList.remove("active");
    } else {
      avatarOtavianinho.classList.add("active");
      avatarMontainha.classList.remove("active");
    }
  }

  function addMessage(role, text) {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add(role);
    messageDiv.innerHTML = `<div class="message">${text}</div>`;
    chatHistory.appendChild(messageDiv);

    chatHistory.scroll({
      top: chatHistory.scrollHeight,
      behavior: "smooth",
    });

    historico.push({ autor: role === "user" ? "user" : "bot", mensagem: text });
  }

  function renderSuggestions(sugestoes) {
    if (!firstResponseReceived) {
      suggestionsContainer.innerHTML = "";
      return;
    }

    suggestionsContainer.innerHTML = "";
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

  async function sendQuestionToBackend(question) {
    try {
      const response = await fetch(BACKEND_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pergunta: question, historico }),
      });

      const data = await response.json();
      typingIndicator.style.display = "none";

      addMessage("bot", data.resposta || "Desculpe, não consegui entender.");
      firstResponseReceived = true;

      if (data.sugestoes && Array.isArray(data.sugestoes)) {
        renderSuggestions(data.sugestoes);
      }
    } catch (error) {
      typingIndicator.style.display = "none";
      addMessage("bot", "Erro ao conectar com o servidor.");
      console.error("Erro de conexão:", error);
    }
  }

  sendBtn.addEventListener("click", () => {
    const question = userInput.value.trim();
    if (!question) return;

    addMessage("user", question);
    userInput.value = "";
    typingIndicator.style.display = "block";
    sendQuestionToBackend(question);
  });

  userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      sendBtn.click();
    }
  });

  
  const checkConnectionBtn = document.getElementById("check-connection-btn");
  const statusMessage = document.getElementById("status-message");

  checkConnectionBtn.addEventListener("click", async () => {
    statusMessage.textContent = "Verificando...";
    try {
      const response = await fetch(BACKEND_URL, {
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
