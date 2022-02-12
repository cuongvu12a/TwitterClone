const express = require("express");
const User = require("../../schemas/UserSchema");
const Chat = require("../../schemas/ChatSchema");
const Message = require("../../schemas/MessageSchema");
const Notification = require("../../schemas/notificationSchema");
const router = express.Router();

router.post("/", async (req, res, next) => {
  if (!req.body.content || !req.body.chatId) {
    console.log("Invalid data passed into request");
    return res.sendStatus(400);
  }
  const newMessage = {
    sender: req.session.user._id,
    content: req.body.content,
    chat: req.body.chatId,
  };
  const createMessage = await Message.create(newMessage);
  const messageSender = await User.populate(createMessage, { path: "sender" });
  const messageChat = await Chat.populate(messageSender, { path: "chat" });
  const message = await User.populate(messageChat, { path: "chat.users" });
  const chat = await Chat.findByIdAndUpdate(req.body.chatId, {
    latestMessage: message,
  });
  insertNotifications(chat, message);
  if (!message) {
    return res.sendStatus(400);
  }
  res.status(201).send(message);
});

function insertNotifications(chat, message) {
  chat?.users?.forEach((userId) => {
    if (userId == message.sender._id.toString()) return;
    Notification.insertNotification(
      userId,
      message.sender._id,
      "newMessage",
      message.chat._id
    );
  });
}

module.exports = router;
