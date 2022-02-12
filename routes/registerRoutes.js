const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../schemas/UserSchema");
const router = express.Router();

router.get("/", (req, res, next) => {
  res.status(200).render("register");
});

router.post("/", async (req, res, next) => {
  const payload = req.body;
  const firstName = payload.firstName.trim();
  const lastName = payload.lastName.trim();
  const username = payload.username.trim();
  const email = payload.email.trim();
  const password = payload.password.trim();
  if (firstName && lastName && username && email && password) {
    const user = await User.findOne({
      $or: [{ username: username }, { email: email }],
    }).catch(() => {
      payload.errorMessage = "Something went wrong.";
      res.status(200).render("register", payload);
    });
    if (user) {
      if (email === user.email) {
        payload.errorMessage = "Email already in use.";
      } else {
        payload.errorMessage = "Username already in use.";
      }
      res.status(200).render("register", payload);
    } else {
      payload.password = await bcrypt.hash(password, 10);
      User.create(payload).then((user) => {
        req.session.user = user;
        return res.redirect("/");
      });
    }
  } else {
    payload.errorMessage = "Make sure each field has a valid value.";
    res.status(200).render("register", payload);
  }
});

module.exports = router;
