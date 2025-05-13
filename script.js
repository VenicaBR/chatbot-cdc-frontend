const sendBtn = document.getElementById("send-btn");
const userInput = document.getElementById("user-input");
const chatHistory = document.getElementById("chat-history");
const typingIndicator = document.getElementById("typing");

sendBtn.addEventListener("click", () => {
  const message = userInput.value.trim();
  if (message) {
    addMessage(message, "user");
    userInput.value = "";

    // Simula a resposta do chatbot
    typingIndicator.style.display = "block";
    setTimeout(() => {
      typingIndicator.style.display = "none";
      addMessage("Esta é uma resposta simulada sobre " + message, "bot");
    }, 1500);
  }
});

function addMessage(message, sender) {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message", sender);
  messageDiv.textContent = message;
  chatHistory.appendChild(messageDiv);
  chatHistory.scrollTop = chatHistory.scrollHeight; // rolar para a última mensagem
}

// Função para interagir com as sugestões
const suggestionButtons = document.querySelectorAll(".suggestion-btn");
suggestionButtons.forEach(button => {
  button.addEventListener("click", () => {
    addMessage(button.textContent, "user");

    // Resposta do bot para a sugestão
    typingIndicator.style.display = "block";
    setTimeout(() => {
      typingIndicator.style.display = "none";
      addMessage("Aqui está uma resposta simulada sobre: " + button.textContent, "bot");
    }, 1500);
  });
});
