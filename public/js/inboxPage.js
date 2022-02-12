$("document").ready(() => {
  $.get("/api/chats", (data, status, xhr) => {
    if (xhr.status === 400) {
      return console.log("Could not get chat list.");
    }
    outputChatList(data, $(".resultsContainer"));
  });
});

function outputChatList(chatList, container) {
  if (chatList.length === 0) {
    container.append("<span class='noResults'>Nothing to show.</span>");
  }
  chatList.forEach((chat) => {
    const html = createChatHtml(chat);
    container.append(html);
  });
}

