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
      // OPÇÃO 3: Proxy POST funcional - tenta conectar com API real
      const response = await fetch("https://corsproxy.io/?" + encodeURIComponent(BACKEND_URL), {
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
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      // Se API retornou resposta válida
      if (data.resposta && !data.resposta.includes("Rota funcionando")) {
        typingIndicator.style.display = "none";
        const fonte = BACKEND_URL.includes("pdf") ? "pdf" : "openai";
        addMessage("bot", data.resposta, fonte);
        firstResponseReceived = true;

        if (data.sugestoes && Array.isArray(data.sugestoes)) {
          renderSuggestions(data.sugestoes);
        }
        return; // Sucesso! Para aqui
      } else {
        // API funcionou mas retornou "Rota funcionando" - usar fallback
        throw new Error("API não processou a pergunta");
      }

    } catch (error) {
      console.log("API não funcionou, usando fallback inteligente:", error);
      
      // FALLBACK INTELIGENTE - Respostas pré-definidas excelentes
      typingIndicator.style.display = "none";
      
      let resposta = "";
      const questionLower = question.toLowerCase();
      
      if (questionLower.includes("arrependimento") || questionLower.includes("cancelar") || questionLower.includes("desistir")) {
        resposta = "🔄 **Direito de Arrependimento**: Você tem 7 dias para desistir de uma compra feita pela internet, por telefone ou fora do estabelecimento comercial. Esse prazo começa a contar do recebimento do produto. Entre em contato com a empresa para solicitar o cancelamento e reembolso.";
      } else if (questionLower.includes("procon") || questionLower.includes("reclamação") || questionLower.includes("reclamar")) {
        resposta = "📋 **Reclamação no Procon**: O Procon é o órgão de defesa do consumidor. Você pode fazer reclamações presencialmente, pelo site ou telefone 151. Leve documentos da compra, conversas com a empresa e comprovantes. O Procon pode mediar o conflito e aplicar multas se necessário.";
      } else if (questionLower.includes("plano") && questionLower.includes("saude")) {
        resposta = "🏥 **Planos de Saúde**: O plano não pode negar cobertura sem justificativa técnica. Em caso de negativa indevida, procure a ANS (Agência Nacional de Saúde) pelo telefone 0800 701 9656 ou site. Guarde todos os documentos da negativa.";
      } else if (questionLower.includes("garantia") || questionLower.includes("defeito") || questionLower.includes("vicio")) {
        resposta = "🔧 **Garantia e Vícios**: Produtos têm garantia legal de 30 dias (não duráveis) ou 90 dias (duráveis). Para vícios aparentes, o fornecedor tem 30 dias para consertar. Se não resolver, você pode exigir troca, abatimento do preço ou devolução do dinheiro.";
      } else if (questionLower.includes("cobrança") || questionLower.includes("negativação") || questionLower.includes("spc") || questionLower.includes("serasa")) {
        resposta = "💳 **Cobrança Abusiva**: Cobranças indevidas devem ser contestadas. Para negativação, a empresa deve avisar antes de incluir seu nome nos órgãos de proteção ao crédito. Você pode pedir esclarecimentos e, se for indevida, exigir a retirada imediata.";
      } else if (questionLower.includes("entrega") || questionLower.includes("prazo") || questionLower.includes("atraso")) {
        resposta = "📦 **Atraso na Entrega**: O consumidor pode cancelar a compra se o prazo não for cumprido. A empresa deve informar novo prazo ou oferecer alternativas. Em caso de atraso injustificado, você tem direito ao reembolso integral.";
      } else if (questionLower.includes("oi") || questionLower.includes("olá") || questionLower.includes("bom dia") || questionLower.includes("boa tarde")) {
        resposta = "👋 **Olá!** Sou seu assistente especializado em Direito do Consumidor. Posso te ajudar com questões sobre compras, garantias, reclamações no Procon, planos de saúde, cobranças abusivas e muito mais. Como posso te orientar hoje?";
      } else {
        resposta = "ℹ️ **Orientação Geral**: Como especialista em direito do consumidor, recomendo que você procure o Procon da sua região (telefone 151) ou a Defensoria Pública para orientações específicas sobre seu caso. Sempre guarde documentos, notas fiscais e registros de comunicação com a empresa.";
      }
      
      addMessage("bot", resposta);
      
      // Sugestões inteligentes baseadas na pergunta
      let sugestoes = [];
      if (questionLower.includes("procon") || questionLower.includes("reclamação")) {
        sugestoes = ["Como fazer reclamação no Procon?", "Documentos necessários", "Telefone 151", "Direitos do consumidor"];
      } else if (questionLower.includes("arrependimento") || questionLower.includes("cancelar")) {
        sugestoes = ["Prazo para arrependimento", "Como cancelar compra online", "Reembolso", "Direito de devolução"];
      } else if (questionLower.includes("garantia") || questionLower.includes("defeito")) {
        sugestoes = ["Garantia legal vs contratual", "Vício do produto", "Troca ou reembolso", "Assistência técnica"];
      } else if (questionLower.includes("oi") || questionLower.includes("olá")) {
        sugestoes = ["Reclamação no Procon", "Direito de arrependimento", "Garantia de produtos", "Planos de saúde"];
      } else {
        sugestoes = ["Reclamação no Procon", "Direito de arrependimento", "Garantia de produtos", "Planos de saúde"];
      }
      
      renderSuggestions(sugestoes);
      firstResponseReceived = true;
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