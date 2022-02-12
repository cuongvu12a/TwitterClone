const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../schemas/UserSchema");
const router = express.Router();

router.get("/", (req, res, next) => {
  res.status(200).render("login");
});

router.post("/", async (req, res, next) => {
  const payload = req.body;
  const { logUsername, logPassword } = payload;

  if (logUsername && logPassword) {
    const user = await User.findOne({
      $or: [{ username: logUsername }, { email: logUsername }],
    }).catch(() => {
      payload.errorMessage = "Something went wrong.";
      res.status(200).render("login", payload);
    });
    if (user) {
      const isValidPassword = await bcrypt.compare(logPassword, user.password);
      if (isValidPassword) {
        req.session.user = user;
        return res.redirect("/");
      }
    }
    payload.errorMessage = "Login credentials incorrect.";
    res.status(200).render("register", payload);
  } else {
    payload.errorMessage = "Make sure each field has a valid value.";
    res.status(200).render("register", payload);
  }
});

module.exports = router;
