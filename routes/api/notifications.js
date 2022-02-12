const express = require("express");
const User = require("../../schemas/UserSchema");
const Chat = require("../../schemas/ChatSchema");
const Message = require("../../schemas/MessageSchema");
const Notification = require("../../schemas/notificationSchema");
const router = express.Router();

router.get("/", async (req, res, next) => {
  let searchObj = {
    userTo: req.session.user._id,
    notificationType: { $ne: "newMessage" },
  };
  if (req.query.unreadOnly !== undefined && req.query.unreadOnly == "true") {
    searchObj.opened = false;
  }
  const results = await Notification.find(searchObj)
    .populate("userTo")
    .populate("userFrom")
    .sort({ createdAt: -1 });
  if (!results) return res.sendStatus(400);
  res.status(200).send(results);
});

router.put("/:id/maskAsOpened", async (req, res, next) => {
  const results = await Notification.findByIdAndUpdate(req.params.id, {
    opened: true,
  });
  if (!results) return res.sendStatus(400);
  res.sendStatus(204);
});

router.put("/maskAsOpened", async (req, res, next) => {
  const results = await Notification.updateMany(
    { userTo: req.session.user._id },
    { opened: true }
  );
  if (!results) return res.sendStatus(400);
  res.sendStatus(204);
});

router.get("/latest", async (req, res, next) => {
  const results = await Notification.findOne({ userTo: req.session.user._id })
    .populate("userTo")
    .populate("userFrom")
    .sort({ createdAt: -1 });
  if (!results) return res.sendStatus(400);
  res.status(200).send(results);
});

router.put("/:id/maskAsOpened", async (req, res, next) => {
  const results = await Notification.findByIdAndUpdate(req.params.id, {
    opened: true,
  });
  if (!results) return res.sendStatus(400);
  res.sendStatus(204);
});

module.exports = router;
