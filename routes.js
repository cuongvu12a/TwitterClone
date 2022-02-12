const middleware = require('./middleware');
const loginRoute = require('./routes/loginRoutes');
const registerRoute = require('./routes/registerRoutes');
const logoutRoute = require('./routes/logoutRoutes');
const postRoute = require('./routes/postRoutes');
const profileRoute = require('./routes/profileRoutes');
const searchRoute = require('./routes/searchRoutes');
const messagesRoute = require('./routes/messagesRoutes');
const notificationsRoute = require('./routes/notificationRoutes');
const apiPostsRoute = require('./routes/api/posts');
const apiUsersRoute = require('./routes/api/users');
const apiChatsRoute = require('./routes/api/chats');
const apiMessagesRoute = require('./routes/api/messages');
const apiNotificationsRoute = require('./routes/api/notifications');
const uploadRoute = require('./routes/uploadRoutes');

function useRoutes(app) {
  app.use('/login', loginRoute);
  app.use('/register', registerRoute);
  app.use('/logout', logoutRoute);
  app.use('/posts', middleware.requireLogin, postRoute);
  app.use('/profile', middleware.requireLogin, profileRoute);
  app.use('/search', middleware.requireLogin, searchRoute);
  app.use('/messages', middleware.requireLogin, messagesRoute);
  app.use('/notifications', middleware.requireLogin, notificationsRoute);
  app.use('/api/posts', apiPostsRoute);
  app.use('/api/users', apiUsersRoute);
  app.use('/api/chats', apiChatsRoute);
  app.use('/api/messages', apiMessagesRoute);
  app.use('/api/notifications', apiNotificationsRoute);
  app.use('/uploads', uploadRoute);
  //home
  app.get('/', middleware.requireLogin, (req, res, next) => {
    const payload = {
      pageTitle: 'Home',
      userLoggedIn: req.session.user,
      userLoggedInJs: JSON.stringify(req.session.user),
    };
    res.status(200).render('home', payload);
  });
}

module.exports = { useRoutes };
