const express = require("express");
const router = express.Router();

router.get("/", (req, res, next) => {
  const payload = {
    pageTitle: "Notifications",
    userLoggedIn: req.session.user,
    userLoggedInJs: JSON.stringify(req.session.user),
  };
  res.status(200).render("notificationsPage", payload);
});

module.exports = router;
