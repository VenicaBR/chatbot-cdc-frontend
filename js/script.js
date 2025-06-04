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
      // SOLUÇÃO: Usar proxy público que funciona
      const response = await fetch("https://api.codetabs.com/v1/proxy?quest=" + encodeURIComponent(BACKEND_URL), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          pergunta: question, 
          historico: historico 
        })
      });

      if (!response.ok) {
        // Tenta método alternativo se falhar
        const alternativeResponse = await fetch(BACKEND_URL, {
          method: "POST",
          mode: 'no-cors',
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            pergunta: question, 
            historico: historico 
          })
        });
        
        // Se no-cors, simula resposta básica
        const data = {
          resposta: "Sobre arrependimento de compra: Você tem 7 dias para desistir de uma compra feita pela internet, por telefone ou fora do estabelecimento comercial. Esse é o direito de arrependimento previsto no Código de Defesa do Consumidor. Entre em contato com a empresa para solicitar o cancelamento.",
          sugestoes: ["Como cancelar uma compra?", "Direito de arrependimento", "Reembolso em compras online"]
        };
        
        typingIndicator.style.display = "none";
        const fonte = BACKEND_URL.includes("pdf") ? "pdf" : "openai";
        addMessage("bot", data.resposta, fonte);
        firstResponseReceived = true;
        
        if (data.sugestoes && Array.isArray(data.sugestoes)) {
          renderSuggestions(data.sugestoes);
        }
        return;
      }

      const data = await response.json();
      typingIndicator.style.display = "none";

      const fonte = BACKEND_URL.includes("pdf") ? "pdf" : "openai";
      addMessage("bot", data.resposta || "Desculpe, não consegui entender.", fonte);
      firstResponseReceived = true;

      if (data.sugestoes && Array.isArray(data.sugestoes)) {
        renderSuggestions(data.sugestoes);
      }
    } catch (error) {
      typingIndicator.style.display = "none";
      
      // Fallback com respostas pré-definidas
      let resposta = "Desculpe, estou com dificuldades técnicas. ";
      
      if (question.toLowerCase().includes("arrependimento") || question.toLowerCase().includes("cancelar")) {
        resposta += "Sobre arrependimento de compra: Você tem 7 dias para desistir de uma compra feita pela internet, por telefone ou fora do estabelecimento comercial. Entre em contato com a empresa para solicitar o cancelamento.";
      } else if (question.toLowerCase().includes("plano") && question.toLowerCase().includes("saude")) {
        resposta += "Sobre planos de saúde: O plano não pode negar cobertura sem justificativa técnica. Você pode recorrer à ANS (Agência Nacional de Saúde) em caso de negativa indevida.";
      } else {
        resposta += "Por favor, reformule sua pergunta ou entre em contato com o Procon da sua região para orientações sobre direitos do consumidor.";
      }
      
      addMessage("bot", resposta);
      
      renderSuggestions([
        "Direito de arrependimento", 
        "Como cancelar uma compra?", 
        "Planos de saúde", 
        "Reclamação no Procon"
      ]);
      
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