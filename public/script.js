document.getElementById('file-upload').addEventListener('change', handleFileUpload);

function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const uploadStatus = document.getElementById('upload-status');
  uploadStatus.className = 'visible'; // Show upload status

  const formData = new FormData();
  formData.append('file', file);

  fetch('/upload', {
    method: 'POST',
    body: formData
  })
  .then(response => response.text())
  .then(result => {
    uploadStatus.className = 'hidden'; // Hide upload status

    const chatMessages = document.getElementById('chat-messages');
    const messageElement = document.createElement('div');
    messageElement.className = 'message file';
    messageElement.textContent = result;
    chatMessages.appendChild(messageElement);

    chatMessages.scrollTop = chatMessages.scrollHeight;
  })
  .catch(error => {
    console.error('Error:', error);
    uploadStatus.className = 'hidden'; // Hide upload status
  });
}

function sendMessage() {
  const userInput = document.getElementById('user-input');
  const message = userInput.value.trim();
  if (message === '') return;

  const chatMessages = document.getElementById('chat-messages');
  const messageElement = document.createElement('div');
  messageElement.className = 'message user';
  messageElement.textContent = message;
  chatMessages.appendChild(messageElement);

  userInput.value = '';
  userInput.focus();
  chatMessages.scrollTop = chatMessages.scrollHeight;

  const waitingStatus = document.getElementById('waiting-status');
  waitingStatus.className = 'visible'; // Show waiting status
  fetch('/message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ message })
  })
  .then(response => response.json())
  .then(data => {
    waitingStatus.className = 'hidden'; // Hide waiting status

    const botMessageElement = document.createElement('div');
    botMessageElement.className = 'message bot';
    botMessageElement.textContent = data.response;
    chatMessages.appendChild(botMessageElement);

    chatMessages.scrollTop = chatMessages.scrollHeight;
  })
  .catch(error => {
    console.error('Error:', error);
    waitingStatus.className = 'hidden'; // Hide waiting status
  });
}
