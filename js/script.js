document.addEventListener("DOMContentLoaded", () => {
  let BACKEND_URL = "https://chatbot-consumidor-api.azurewebsites.net/perguntar-openai";

  const chatHistory = document.getElementById("chat-history");
  const userInput = document.getElementById("user-input");
  const sendBtn = document.getElementById("send-btn");
  const typingIndicator = document.getElementById("typing");
  const suggestionsContainer = document.querySelector(".suggestions");
  const avatarMontainha = document.querySelector(".avatar-container");
  const avatarOtavianinho = document.querySelector(".avatar-container-left");
  const themeLink = document.getElementById("theme-css");

  let currentTheme = "montainha";
  setActiveAvatar();

  let historico = [];
  let firstResponseReceived = false;

  avatarMontainha.addEventListener("click", () => {
    if (currentTheme !== "montainha") {
      currentTheme = "montainha";
      themeLink.href = "css/styles-montainha.css";
      BACKEND_URL = "https://chatbot-consumidor-api.azurewebsites.net/perguntar-openai";
      setActiveAvatar();
    }
  });

  avatarOtavianinho.addEventListener("click", () => {
    if (currentTheme !== "otavianinho") {
      currentTheme = "otavianinho";
      themeLink.href = "css/styles-otavianinho.css";
      BACKEND_URL = "https://chatbot-consumidor-api.azurewebsites.net/perguntar-pdf";
      setActiveAvatar();
    }
  });

  function setActiveAvatar() {
    if (currentTheme === "montainha") {
      avatarMontainha.classList.add("active");
      avatarOtavianinho.classList.remove("active");
    } else {
      avatarOtavianinho.classList.add("active");
      avatarMontainha.classList.remove("active");
    }
  }

  function addMessage(role, text, source = null) {
    const messageWrapper = document.createElement("div");
    messageWrapper.classList.add(role);

    if (role === "bot" && source) {
      const iconSpan = document.createElement("span");
      iconSpan.classList.add("source-icon");
      iconSpan.title = source === "pdf" ? "Fonte: PDF" : "Fonte: OpenAI";
      iconSpan.textContent = source === "pdf" ? "📄" : "🤖";
      messageWrapper.appendChild(iconSpan);
    }

    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message");
    messageDiv.textContent = text;

    messageWrapper.appendChild(messageDiv);
    chatHistory.appendChild(messageWrapper);

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
      // SOLUÇÃO CORS: Usar proxy para contornar bloqueio
      const params = new URLSearchParams({
        pergunta: question,
        historico: JSON.stringify(historico)
      });
      
      // Proxy CORS que permite requisições cross-origin
      const proxyUrl = "https://api.allorigins.win/get?url=";
      const targetUrl = encodeURIComponent(`${BACKEND_URL}?${params}`);
      const finalUrl = proxyUrl + targetUrl;
      
      const response = await fetch(finalUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Erro HTTP: ${response.status}`);
      }

      const proxyData = await response.json();
      // O proxy retorna os dados em .contents
      const responseText = proxyData.contents;
      
      // Verificar se a resposta é JSON ou texto simples
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        // Se não for JSON, tratar como resposta simples
        data = {
          resposta: responseText.includes("Rota funcionando") 
            ? "API funcionando, mas não consegui processar sua pergunta. Tente reformular." 
            : responseText,
          sugestoes: ["Como posso ajudar?", "Tire suas dúvidas sobre direito do consumidor"]
        };
      }
      
      typingIndicator.style.display = "none";

      const fonte = BACKEND_URL.includes("pdf") ? "pdf" : "openai";
      addMessage("bot", data.resposta || "Desculpe, não consegui entender.", fonte);
      firstResponseReceived = true;

      if (data.sugestoes && Array.isArray(data.sugestoes)) {
        renderSuggestions(data.sugestoes);
      }
    } catch (error) {
      typingIndicator.style.display = "none";
      const errorMessage = error.message || "Erro desconhecido.";
      addMessage("bot", `Erro: ${errorMessage}`);
      console.error("Erro ao enviar pergunta:", error);
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
});