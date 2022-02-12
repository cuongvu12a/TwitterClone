const express = require('express');
const User = require('../schemas/UserSchema');
const Chat = require('../schemas/ChatSchema');
const mongoose = require('mongoose');

const app = express();
const router = express.Router();

app.set('view engine', 'pug');
app.set('views', 'views');

router.get('/', (req, res, next) => {
  const payload = {
    pageTitle: 'Inbox',
    userLoggedIn: req.session.user,
    userLoggedInJs: JSON.stringify(req.session.user),
  };
  res.status(200).render('inboxPage', payload);
});

router.get('/new', (req, res, next) => {
  const payload = {
    pageTitle: 'New Message',
    userLoggedIn: req.session.user,
    userLoggedInJs: JSON.stringify(req.session.user),
  };
  res.status(200).render('newMessage', payload);
});

router.get('/:chatId', async (req, res, next) => {
  const chatId = req.params.chatId;
  const userId = req.session.user._id;
  let payload = {
    pageTitle: 'Chat',
    userLoggedIn: req.session.user,
    userLoggedInJs: JSON.stringify(req.session.user),
  };
  const isValidChatId = mongoose.isValidObjectId(chatId);
  if (!isValidChatId) {
    payload.errorMessage = 'Not found';
    return res.status(200).render('chatPage', payload);
  }
  let chat = await Chat.findOne({
    _id: chatId,
    users: { $elemMatch: { $eq: userId } },
  }).populate('users');

  if (chat == null) {
    const userFound = await User.findById(chatId);
    if (userFound != null) {
      chat = await getChatByUserId(userId, userFound._id);
      console.log(chat);
      payload.chat = chat;
    }
  } else {
    payload.chat = chat;
  }

  res.status(200).render('chatPage', payload);
});

function getChatByUserId(userLoggedInId, otherUserId) {
  return Chat.findOneAndUpdate(
    {
      isGroupChat: false,
      $or: [
        {
          users: [{ _id: userLoggedInId }, { _id: otherUserId }],
        },
        {
          users: [{ _id: otherUserId }, { _id: userLoggedInId }],
        },
      ],
    },
    {
      $setOnInsert: {
        users: [userLoggedInId, otherUserId],
      },
    },
    {
      new: true,
      upsert: true,
    }
  ).populate('users');
}

module.exports = router;
