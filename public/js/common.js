let cropper; //using crop image
let timer; //using setTimeout
let selectedUsers = []; //using add to group chat
$("document").ready(() => {
  refreshMessagesBadge();
  refreshNotificationsBadge();
});
//handle typing textarea
$("#postTextarea, #replyTextarea").keyup((event) => {
  const textbox = $(event.target);
  const value = textbox.val().trim();
  const isModal = textbox.parents(".modal").length === 1;
  const button = isModal ? $("#submitReplyButton") : $("#submitPostButton");
  if (button.length == 0) return alert("No submit button found.");
  if (value === "") {
    button.prop("disabled", true);
    return;
  }
  button.prop("disabled", false);
});
//handle submit create post
$("#submitPostButton, #submitReplyButton").click((event) => {
  const button = $(event.target);
  const isModal = button.parents(".modal").length === 1;
  const textbox = isModal ? $("#replyTextarea") : $("#postTextarea");
  const data = {
    content: textbox.val(),
  };
  if (isModal) {
    const id = button.data().id;
    if (id === null) return alert("Id is null.");
    data.replyTo = id;
  }

  $.post("/api/posts", data, (postData, status, xhr) => {
    if (postData.replyTo) {
      emitNotification(postData.replyTo.postedBy);
      location.reload();
    } else {
      $(".noResults").remove();
      const html = createPostHtml(postData);
      $(".postsContainer").prepend(html);
      textbox.val("");
      button.prop("disable", true);
    }
  });
});
//handle click reply button
$("#replyModal").on("show.bs.modal", (event) => {
  const button = $(event.relatedTarget);
  const postId = getPostIdElement(button);
  $("#submitReplyButton").data("id", postId);
  $.get("/api/posts/" + postId, (result) => {
    outputPosts(result.postData, $("#originalPostContainer"));
  });
});
$("#replyModal").on("hidden.bs.modal", (event) => {
  $("#originalPostContainer").html("");
  $("#replyTextarea").val("");
});
//handle click delete  button
$("#deletePostModal").on("show.bs.modal", (event) => {
  const button = $(event.relatedTarget);
  const postId = getPostIdElement(button);
  $("#deletePostButton").data("id", postId);
});
$("#deletePostButton").click((event) => {
  const postId = $(event.target).data("id");
  $.ajax({
    url: `/api/posts/${postId}`,
    type: "DELETE",
    success: (data, status, xhr) => {
      if (xhr.status != 202) {
        return alert("Cloud not delete post.");
      }
      location.reload();
    },
  });
});
//handle click pin  button
$("#confirmPinModal").on("show.bs.modal", (event) => {
  const button = $(event.relatedTarget);
  const postId = getPostIdElement(button);
  $("#pinPostButton").data("id", postId);
});
$("#pinPostButton").click((event) => {
  const postId = $(event.target).data("id");
  $.ajax({
    url: `/api/posts/${postId}`,
    type: "PUT",
    data: { pinned: true },
    success: (data, status, xhr) => {
      if (xhr.status != 204) {
        return alert("Cloud not pin post.");
      }
      location.reload();
    },
  });
});
//handle click unpin  button
$("#unpinModal").on("show.bs.modal", (event) => {
  const button = $(event.relatedTarget);
  const postId = getPostIdElement(button);
  $("#unpinPostButton").data("id", postId);
});
$("#unpinPostButton").click((event) => {
  const postId = $(event.target).data("id");
  $.ajax({
    url: `/api/posts/${postId}`,
    type: "PUT",
    data: { pinned: false },
    success: (data, status, xhr) => {
      if (xhr.status != 204) {
        return alert("Cloud not unpin post.");
      }
      location.reload();
    },
  });
});
//handle create chat group
$("#createChatButton").click((event) => {
  const data = JSON.stringify(selectedUsers);
  $.post("/api/chats", { users: data }, (chat) => {
    if (!chat || !chat._id) return console.log("Invalid response form server.");
    window.location.href = `/messages/${chat._id}`;
  });
});
//handle search user add group chat
$("#userSearchTextBox").keydown((event) => {
  clearTimeout(timer);
  const textbox = $(event.target);
  let value = textbox.val();
  if (value === "" && (event.keycode == 8 || event.which == 8)) {
    //8 = backspace
    //remove user from selection
    selectedUsers.pop();
    updateSelectedUsersHtml();
    $(".resultsContainer").html();
    if (selectedUsers.length === 0) {
      $("#createChatButton").prop("disabled", true);
    }
    return;
  }
  timer = setTimeout(() => {
    value = textbox.val().trim();
    if (value === "") {
      $(".resultsContainer").html();
    } else {
      searchUsers(value);
    }
  }, 1000);
});
//handle click like button
$(document).on("click", ".likeButton", (event) => {
  const button = $(event.target);
  const postId = getPostIdElement(button);
  if (postId === undefined) return;
  $.ajax({
    url: `/api/posts/${postId}/like`,
    type: "PUT",
    success: (postData) => {
      button.find("span").text(postData.likes.length || "");
      if (postData.likes.includes(userLoggedIn._id)) {
        button.addClass("active");
        emitNotification(postData.postedBy);
      } else {
        button.removeClass("active");
      }
    },
  });
});
//handle click retweet button
$(document).on("click", ".retweetButton", (event) => {
  const button = $(event.target);
  const postId = getPostIdElement(button);
  if (postId === undefined) return;
  $.ajax({
    url: `/api/posts/${postId}/retweet`,
    type: "POST",
    success: (postData) => {
      button.find("span").text(postData.retweetUsers.length || "");
      if (postData.retweetUsers.includes(userLoggedIn._id)) {
        button.addClass("active");
        emitNotification(postData.postedBy);
      } else {
        button.removeClass("active");
      }
    },
  });
});
//handle click view post
$(document).on("click", ".post", (event) => {
  const element = $(event.target);
  const postId = getPostIdElement(element);
  if (postId !== undefined && !element.is("button") && !element.is("a")) {
    window.location.href = "/posts/" + postId;
  }
});
//handle click follow & unFollow
$(document).on("click", ".followButton", (event) => {
  const button = $(event.target);
  const userId = button.data().user;
  $.ajax({
    url: `/api/users/${userId}/follow`,
    type: "PUT",
    success: (data, status, xhr) => {
      if (xhr.status !== 200) {
        return;
      }
      let difference = 1;
      if (data.following && data.following.includes(userId)) {
        button.addClass("following");
        button.text("Following");
        emitNotification(userId);
      } else {
        difference = -1;
        button.removeClass("following");
        button.text("Follow");
      }
      const followersLabel = $("#followersValue");
      if (followersLabel.length !== 0) {
        const followersText = parseInt(followersLabel.text());
        followersLabel.text(followersText + difference);
      }
    },
  });
});
//handle upload profile picture
$("#filePhoto").change(function () {
  if (this.files && this.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const image = document.getElementById("imagePreview");
      image.src = e.target.result;
      if (cropper !== undefined) {
        cropper.destroy();
      }
      cropper = new Cropper(image, {
        aspectRatio: 1 / 1,
        background: false,
      });
    };
    reader.readAsDataURL(this.files[0]);
  } else {
    console.log("nope");
  }
});
//handle upload cover photo
$("#coverPhoto").change(function () {
  if (this.files && this.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const image = document.getElementById("coverPreview");
      image.src = e.target.result;
      if (cropper !== undefined) {
        cropper.destroy();
      }
      cropper = new Cropper(image, {
        aspectRatio: 16 / 9,
        background: false,
      });
    };
    reader.readAsDataURL(this.files[0]);
  } else {
    console.log("nope");
  }
});
//handle submit upload profile picture
$("#imageUploadButton").click(() => {
  const canvas = cropper.getCroppedCanvas();
  if (canvas == null) {
    return console.log(
      "Could not upload image. Make sure it is an image file."
    );
  }
  canvas.toBlob((blob) => {
    const formData = new FormData();
    formData.append("croppedImage", blob);
    $.ajax({
      url: "/api/users/profilePicture",
      type: "POST",
      data: formData,
      processData: false,
      contentType: false,
      success: () => location.reload(),
    });
  });
});
//handle submit cover photo
$("#coverPhotoButton").click(() => {
  const canvas = cropper.getCroppedCanvas();
  if (canvas == null) {
    return console.log(
      "Could not upload image. Make sure it is an image file."
    );
  }
  canvas.toBlob((blob) => {
    const formData = new FormData();
    formData.append("croppedImage", blob);
    $.ajax({
      url: "/api/users/coverPhoto",
      type: "POST",
      data: formData,
      processData: false,
      contentType: false,
      success: () => location.reload(),
    });
  });
});
$(document).on("click", ".notification.active", (event) => {
  const container = $(event.target);
  const notificationId = container.data().id;
  const href = container.attr("href");
  event.preventDefault();
  const callback = () => (window.location = href);
  markNotificationAsOpened(notificationId, callback);
});

function getPostIdElement(element) {
  const isRoot = element.hasClass("post");
  const rootElement = isRoot ? element : element.closest(".post");
  const id = rootElement.data().id;
  if (id === undefined) {
    console.log("Post id undefined");
  }
  return id;
}
function createPostHtml(postData, isLargeFont = false) {
  if (postData === null) return console.log("Object is null.");
  const isRetweet = postData.retweetData !== undefined;
  const retweetBy = isRetweet ? postData.postedBy.username : null;
  const retweetText = isRetweet
    ? `<span>
          <i class="fas fa-retweet"></i>
          Retweeted by <a href="/profile/${retweetBy}">@${retweetBy}</a>
        </span>`
    : "";
  let replyFlag = "";
  if (postData.replyTo && postData.replyTo._id) {
    if (!postData.replyTo._id) {
      return console.log("Reply to is nots populated");
    } else if (!postData.replyTo.postedBy._id) {
      return console.log("Posted by is nots populated");
    }
    replyFlag = `<div class="replyFlag">
                  Replying to <a href="/profile/${postData.replyTo.postedBy.username}">@${postData.replyTo.postedBy.username}</a>
                </div>`;
  }
  postData = isRetweet ? postData.retweetData : postData;
  const postedBy = postData.postedBy;
  if (postedBy._id === undefined) {
    return console.log("User object not populated");
  }
  const displayName = postedBy.firstName + " " + postedBy.lastName;
  const timestamp = timeDifference(new Date(), new Date(postData.createdAt));
  const likeButtonActiveClass = postData.likes.includes(userLoggedIn._id)
    ? "active"
    : "";
  const retweetButtonActiveClass = postData.retweetUsers.includes(
    userLoggedIn._id
  )
    ? "active"
    : "";
  if (postedBy._id === undefined) {
    return console.log("User object not populated.");
  }
  const largeFontClass = isLargeFont ? "largeFont" : "";
  let buttons = "";
  let pinnedPostText = "";
  if (postData.postedBy._id === userLoggedIn._id) {
    let pinClass = "";
    let dataTarget = "#confirmPinModal";
    if (postData.pinned === true) {
      pinClass = "active";
      dataTarget = "#unpinModal";
      pinnedPostText =
        '<i class="fas fa-thumbtack"></i> <span>Pinned post</span>';
    }
    buttons = `
      <button class="pinButton ${pinClass}" data-id="${postData._id}" data-toggle="modal" data-target="${dataTarget}"><i class="fas fa-thumbtack"></i></button>
      <button data-id="${postData._id}" data-toggle="modal" data-target="#deletePostModal"><i class="fas fa-times"></i></button>`;
  }
  return `<div class="post ${largeFontClass}" data-id="${postData._id}">
            <div class="postActionContainer">
              ${retweetText}
            </div>
            <div class="mainContentContainer">
              <div class="userImageContainer">
                <img src="${postedBy.profilePic}">
              </div>
              <div class="postContentContainer">
                <div class="pinnedPostText">${pinnedPostText}</div>
                <div class="header">
                  <a href="/profile/${
                    postedBy.username
                  }" class="displayName">${displayName}</a>
                  <span class="username">@${postedBy.username}</span>
                  <span class="date">${timestamp}</span>
                  ${buttons}
                </div>
                ${replyFlag}
                <div class="postBody">
                  <span>${postData.content}</span>
                </div>
                <div class="postFooter">
                  <div class="postButtonContainer">
                    <button data-toggle="modal" data-target="#replyModal" >
                      <i class="far fa-comment"></i>
                    </button>
                  </div>
                  <div class="postButtonContainer green">
                    <button class="retweetButton ${retweetButtonActiveClass}">
                      <i class="fas fa-retweet"></i>
                      <span>${postData.retweetUsers.length || ""}</span>
                    </button>
                  </div>
                  <div class="postButtonContainer red">
                    <button class="likeButton ${likeButtonActiveClass}">
                      <i class="far fa-heart"></i>
                      <span>${postData.likes.length || ""}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>`;
}
function timeDifference(current, previous) {
  var msPerMinute = 60 * 1000;
  var msPerHour = msPerMinute * 60;
  var msPerDay = msPerHour * 24;
  var msPerMonth = msPerDay * 30;
  var msPerYear = msPerDay * 365;

  var elapsed = current - previous;

  if (elapsed < msPerMinute) {
    if (elapsed / 1000 < 30) return "Just now";
    return Math.round(elapsed / 1000) + " seconds ago";
  } else if (elapsed < msPerHour) {
    return Math.round(elapsed / msPerMinute) + " minutes ago";
  } else if (elapsed < msPerDay) {
    return Math.round(elapsed / msPerHour) + " hours ago";
  } else if (elapsed < msPerMonth) {
    return Math.round(elapsed / msPerDay) + " days ago";
  } else if (elapsed < msPerYear) {
    return Math.round(elapsed / msPerMonth) + " months ago";
  } else {
    return Math.round(elapsed / msPerYear) + " years ago";
  }
}
function outputPosts(results, container) {
  container.html("");
  if (!Array.isArray(results)) {
    results = [results];
  }
  results.forEach((result) => {
    const html = createPostHtml(result);
    container.append(html);
  });
  if (results.length === 0) {
    container.append("<span class='noResults'>No results found</span>");
  }
}
function outputPostsWithReplies(results, container) {
  container.html("");
  if (results.replyTo !== undefined && results.replyTo._id !== undefined) {
    const html = createPostHtml(results.replyTo);
    container.append(html);
  }
  const mainPostHtml = createPostHtml(results.postData, true);
  container.append(mainPostHtml);
  results?.replies?.forEach((result) => {
    const html = createPostHtml(result);
    container.append(html);
  });
}
function outputUsers(results, container) {
  container.html("");
  if (results.length === 0) {
    container.append("<span class='noResults'>No results found</span>");
    return;
  }
  results.forEach((user) => {
    const html = createUserHtml(user, true);
    container.append(html);
  });
}
function createUserHtml(userData, showFollowButton) {
  const displayName = userData.firstName + " " + userData.lastName;
  const isFollowing =
    userLoggedIn.following && userLoggedIn.following.includes(userData._id);
  const text = isFollowing ? "Following" : "Follow";
  const buttonClass = isFollowing ? "followButton following" : "followButton";
  let followButton = "";
  if (showFollowButton && userLoggedIn._id != userData._id) {
    followButton = `
      <div class="followButtonContainer">
        <button class="${buttonClass}" data-user="${userData._id}">${text}</button>
      </div>
    `;
  }
  return `
    <div class="user">
      <div class="userImageContainer">
        <img src="${userData.profilePic}"/>
      </div>
      <div class="userDetailsContainer">
        <div class="header">
          <a href="/profile/${userData.username}">${displayName}</a>
          <span class="username">@${userData.username}</span>
        </div>
      </div>
      ${followButton}
    </div>
  `;
}
function searchUsers(searchTerm) {
  $.get("/api/users", { search: searchTerm }, (results) => {
    outputSelectableUsers(results, $(".resultsContainer"));
  });
}
function outputSelectableUsers(results, container) {
  container.html("");
  if (results.length === 0) {
    container.append("<span class='noResults'>No results found</span>");
    return;
  }
  results.forEach((user) => {
    if (
      user._id === userLoggedIn._id ||
      selectedUsers.some((u) => u._id === user._id)
    )
      return;
    const html = createUserHtml(user, false);
    const element = $(html);

    element.click(() => userSelected(user));
    container.append(element);
  });
}
function userSelected(user) {
  selectedUsers.push(user);
  updateSelectedUsersHtml(user);
  $("#userSearchTextBox").val("").focus();
  $(".resultsContainer").html("");
  $("#createChatButton").prop("disabled", false);
}
function updateSelectedUsersHtml() {
  const elements = [];
  selectedUsers.forEach((user) => {
    const displayName = user.firstName + " " + user.lastName;
    const userElement = `<span class="selectedUser">${displayName}</span>`;
    elements.push(userElement);
  });
  $(".selectedUser").remove();
  $("#selectedUsers").prepend(elements);
}
function getChatName(chatData) {
  let chatName = chatData.chatName;
  if (!chatName) {
    const otherChatUsers = getOtherChatUsers(chatData.users);
    const namesArray = otherChatUsers.map(
      (u) => u.firstName + " " + u.lastName
    );
    chatName = namesArray.join(", ");
  }
  return chatName;
}
function getOtherChatUsers(users) {
  if (users.length === 1) return user;
  return users.filter((u) => u._id !== userLoggedIn._id);
}
function messageReceived(newMessage) {
  if ($(`[data-room="${newMessage.chat._id}"]`).length == 0) {
    const element = $(`[href="/messages/${newMessage.chat._id}"]`);
    if (element.length != 0) {
      const parent = element.parent();
      element.hide();
      const newChat = {
        ...newMessage.chat,
        latestMessage: newMessage,
      };
      parent.html(`${createChatHtml(newChat)} ${parent.html()}`)
    } else {
      showMessagePopup(newMessage);
    }
  } else {
    addChatMessageHtml(newMessage);
    markAllMessageAsRead();
  }
  refreshMessagesBadge();
}
function markNotificationAsOpened(notificationId = null, callback = null) {
  if (callback === null) callback = () => location.reload();
  const url =
    notificationId != null
      ? `/api/notifications/${notificationId}/maskAsOpened`
      : `/api/notifications/maskAsOpened`;
  $.ajax({
    url: url,
    type: "PUT",
    success: () => callback(),
  });
}
function refreshMessagesBadge() {
  $.get("/api/chats", { unreadOnly: true }, (data) => {
    const numResults = data.length;
    if (numResults > 0) {
      $("#messagesBadge").text(numResults).addClass("active");
    } else {
      $("#messagesBadge").text("").removeClass("active");
    }
  });
}
function refreshNotificationsBadge() {
  $.get("/api/notifications", { unreadOnly: true }, (data) => {
    const numResults = data.length;
    if (numResults > 0) {
      $("#notificationBadge").text(numResults).addClass("active");
    } else {
      $("#notificationBadge").text("").removeClass("active");
    }
  });
}
function showNotificationPopup(data) {
  const html = createNotificationHtml(data);
  const element = $(html);
  element.hide().prependTo("#notificationList").slideDown("fast");
  setTimeout(() => element.fadeOut(400), 5000);
}
function showMessagePopup(data) {
  if (!data?.chat?.latestMessage?._id) {
    data.chat.latestMessage = data;
  }
  const html = createChatHtml(data.chat);
  const element = $(html);
  element.hide().prependTo("#notificationList").slideDown("fast");
  setTimeout(() => element.fadeOut(400), 5000);
}
function outputNotificationsList(notifications, container) {
  if (notifications.length === 0) {
    container.append("<span class='noResults'>No results found</span>");
    return;
  }
  notifications.forEach((notification) => {
    const html = createNotificationHtml(notification);
    container.append(html);
  });
}
function createNotificationHtml(notification) {
  const userFrom = notification.userFrom;
  const text = getNotificationText(notification);
  const href = getNotificationUrl(notification);
  const className = notification.opened ? "" : "active";
  return `
    <a href="${href}" class="resultListItem notification ${className}" data-id="${notification._id}">
      <div class="resultsImageContainer">
        <img src="${userFrom.profilePic}">
      </div>
      <div class="resultsDetailsContainer ellipsis">
        <span class="ellipsis">${text}</span>
      </div>
    </a>
  `;
}
function getNotificationText(notification) {
  const userFrom = notification.userFrom;
  if (!userFrom?.firstName || !userFrom?.lastName) return "";
  const userFromName = userFrom?.firstName + " " + userFrom?.lastName;
  let text = "";
  if (notification.notificationType == "retweet") {
    text = `${userFromName} retweeted one of your posts`;
  } else if (notification.notificationType == "postLike") {
    text = `${userFromName} like one of your posts`;
  } else if (notification.notificationType == "reply") {
    text = `${userFromName} reply to one of your posts`;
  } else if (notification.notificationType == "follow") {
    text = `${userFromName} follow you`;
  }
  return `<span class="ellipsis">${text}</span>`;
}
function getNotificationUrl(notification) {
  let url = "#";
  if (
    notification.notificationType == "retweet" ||
    notification.notificationType == "postLike" ||
    notification.notificationType == "reply"
  ) {
    url = `/posts/${notification.entityId}`;
  } else if (notification.notificationType == "follow") {
    url = `/profile/${notification.entityId}`;
  }
  return url;
}
function createChatHtml(chatData) {
  const chatName = getChatName(chatData);
  const image = getChatImageElements(chatData);
  const latestMessage = getLatestMessage(chatData.latestMessage);
  const activeClass =
    !chatData.latestMessage ||
    chatData.latestMessage.readBy.includes(userLoggedIn._id)
      ? ""
      : "active";
  return `
    <a href="/messages/${chatData._id}" class="resultListItem ${activeClass}">
      ${image}
      <div class="resultsDetailsContainer ellipsis">
        <span class="heading ellipsis">${chatName}</span>
        <span class="subText ellipsis">${latestMessage}</span>
      </div>
    </a>
  `;
}
function getLatestMessage(lastMessage) {
  if (lastMessage != null) {
    const sender = lastMessage.sender;
    return `${sender.firstName} ${sender.lastName}: ${lastMessage.content}`;
  }
  return "New chat";
}
function getChatImageElements(chatData) {
  const otherChatUsers = getOtherChatUsers(chatData.users);
  let groupChatClass = "";
  let chatImage = getUserChatImageElement(otherChatUsers[0]);
  if (otherChatUsers.length > 1) {
    groupChatClass = "groupChatImage";
    chatImage += getUserChatImageElement(otherChatUsers[1]);
  }
  return `
    <div class="resultsImageContainer ${groupChatClass}">${chatImage}</div>
  `;
}
function getUserChatImageElement(user) {
  if (!user || !user.profilePic) return;
  return `<img src="${user.profilePic}" alt="user's profile picture">`;
}
function markAllMessageAsRead() {
  $.ajax({
    url: `/api/chats/${chatId}/messages/markAsRead`,
    type: "PUT",
    success: () => refreshMessagesBadge(),
  });
}
