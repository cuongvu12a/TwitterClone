let typing = false;
let lastTypingTime;
$(document).ready(() => {
  socket.emit("join room", chatId);
  socket.on("typing", () => $(".typingDots").show());
  socket.on("stop typing", () => $(".typingDots").hide());

  $.get(`/api/chats/${chatId}`, (data) =>
    $("#chatName").text(getChatName(data))
  );
  $.get(`/api/chats/${chatId}/messages`, (data) => {
    let latestSenderId = "";
    const messages = data.map((message, index) => {
      const html = createMessageHtml(message, data[index + 1], latestSenderId);
      latestSenderId = message.sender._id;
      return html;
    });
    addMessagesToPage(messages);
    scrollToBottom(false);
    markAllMessageAsRead();
    $(".loadingSpinnerContainer").remove();
    $(".chatContainer").css("visibility", "visible");
  });
});
$("#chatNameButton").click(() => {
  const name = $("#chatNameTextBox").val().trim();
  $.ajax({
    url: "/api/chats/" + chatId,
    type: "PUT",
    data: { chatName: name },
    success: (data, status, xhr) => {
      if (xhr.status != 204) {
        return console.log("Could not update.");
      }
      location.reload();
    },
  });
});
$(".sendMessageButton").click(() => {
  messageSubmitted();
});
$(".inputTextBox").keydown((event) => {
  updateTyping();
  if (event.which === 13) {
    messageSubmitted();
    return false;
  }
});
function updateTyping() {
  if (!connected) return;
  if (!typing) {
    typing = true;
    socket.emit("typing", chatId);
  }
  lastTypingTime = new Date().getTime();
  let timerLength = 3000;
  setTimeout(() => {
    const timeNow = new Date().getTime();
    const timeDiff = timeNow - lastTypingTime;
    if (timeDiff >= timerLength && typing) {
      typing = false;
      socket.emit("stop typing", chatId);
    }
  }, timerLength);
}
function addMessagesToPage(html) {
  $(".chatMessages").append(html);
}
function messageSubmitted() {
  const content = $(".inputTextBox").val().trim();
  if (content != "") {
    sendMessage(content);
    $(".inputTextBox").val("");
    typing = false;
    socket.emit("stop typing", chatId);
  }
}
function sendMessage(content) {
  $.post(
    "/api/messages",
    { content: content, chatId: chatId },
    (data, status, xhr) => {
      if (xhr.status !== 201) {
        $(".inputTextBox").val(content);
        return;
      }
      addChatMessageHtml(data);
      markAllMessageAsRead();
      if (connected) {
        socket.emit("new message", data);
      }
    }
  );
}
function addChatMessageHtml(message) {
  if (!message || !message._id) return;
  const messageDiv = createMessageHtml(message, null, "");
  addMessagesToPage(messageDiv);
  scrollToBottom(true);
}
function createMessageHtml(message, nextMessage, latestSenderId) {
  const sender = message.sender;
  const senderName = sender.firstName + " " + sender.lastName;
  const currentSenderId = sender._id;
  const nextSenderId = nextMessage != null ? nextMessage.sender._id : "";
  const isFirst = latestSenderId != currentSenderId;
  const isLast = nextSenderId != currentSenderId;
  const isMine = message.sender._id === userLoggedIn._id;
  let liClassName = isMine ? "mine" : "theirs";
  let nameElement = "";
  if (isFirst) {
    liClassName += " first";
    if (!isMine) {
      nameElement = `<span class="senderName">${senderName}</span>`;
    }
  }
  let profileImage = "";
  if (isLast) {
    liClassName += " last";
    profileImage = `<img src="${sender.profilePic}">`;
  }
  let imageContainer = "";
  if (!isMine) {
    imageContainer = `
    <div class="imageContainer">
      ${profileImage}
    </div>`;
  }
  return `
    <li class="message ${liClassName}">
      ${imageContainer}
      <div class="messageContainer">
        ${nameElement}
        <span class="messageBody">
          ${message.content}
        </span>
      </div>
    </li>
  `;
}
function scrollToBottom(animated) {
  const container = $(".chatMessages");
  const scrollHeight = container[0].scrollHeight;
  if (animated) {
    container.animate({ scrollTop: scrollHeight }, "slow");
  } else {
    container.scrollTop(scrollHeight);
  }
}
