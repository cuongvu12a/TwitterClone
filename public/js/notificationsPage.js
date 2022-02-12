$(document).ready(() => {
  $.get("/api/notifications", (data) => {
    outputNotificationsList(data, $(".resultsContainer"));
  });
});
$("#markNotificationAsRead").click(() => markNotificationAsOpened());
