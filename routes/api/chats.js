const express = require("express");
const User = require("../../schemas/UserSchema");
const Chat = require("../../schemas/ChatSchema");
const Message = require("../../schemas/MessageSchema");
const router = express.Router();

router.post("/", async (req, res, next) => {
  if (!req.body.users || JSON.parse(req.body.users).length === 0) {
    return res.sendStatus(400);
  }
  const users = [...JSON.parse(req.body.users), req.session.user];
  const chatData = {
    users: users,
    isGroupChat: true,
  };
  const result = await Chat.create(chatData);
  if (!result) res.sendStatus(400);
  res.status(200).send(result);
});
router.get("/", async (req, res, next) => {
  let results = await Chat.find({
    users: { $elemMatch: { $eq: req.session.user._id } },
  })
    .populate("users")
    .populate("latestMessage")
    .populate("latestMessage.sender")
    .sort({ updatedAt: -1 });
  if (req.query.unreadOnly !== undefined && req.query.unreadOnly == "true") {
    results = results.filter(
      (r) =>
        r.latestMessage &&
        !r.latestMessage?.readBy?.includes(req.session.user._id)
    );
  }
  const data = await User.populate(results, { path: "latestMessage.sender" });
  if (!data) {
    return res.sendStatus(400);
  }
  res.status(200).send(data);
});
router.get("/:chatId", async (req, res, next) => {
  const results = await Chat.findOne({
    _id: req.params.chatId,
    users: { $elemMatch: { $eq: req.session.user._id } },
  }).populate("users");
  if (!results) {
    return res.sendStatus(400);
  }
  res.status(200).send(results);
});
router.put("/:chatId", async (req, res, next) => {
  const results = await Chat.findByIdAndUpdate(req.params.chatId, req.body);
  if (!results) {
    return res.sendStatus(400);
  }
  res.sendStatus(204);
});
router.get("/:chatId/messages", async (req, res, next) => {
  const results = await Message.find({ chat: req.params.chatId }).populate(
    "sender"
  );
  if (!results) return res.sendStatus(400);
  res.status(200).send(results);
});
router.put("/:chatId/messages/markAsRead", async (req, res, next) => {
  const results = await Message.updateMany(
    {
      chat: req.params.chatId,
    },
    {
      $addToSet: { readBy: req.session.user._id },
    }
  );
  if (!results) return res.sendStatus(400);
  res.sendStatus(204);
});
module.exports = router;
