const express = require("express");
const User = require("../../schemas/UserSchema");
const Post = require("../../schemas/PostSchema");
const Notification = require("../../schemas/notificationSchema");
const router = express.Router();

router.get("/", async (req, res, next) => {
  const searchObj = req.query;
  if (searchObj.search !== undefined) {
    searchObj.content = { $regex: searchObj.search, $options: "i" };
    delete searchObj.search;
  }
  if (searchObj.isReply !== undefined) {
    const isReply = searchObj.isReply == "true";
    searchObj.replyTo = { $exists: isReply };
    delete searchObj.isReply;
  }
  if (searchObj.followingOnly !== undefined) {
    const followingOnly = searchObj.followingOnly == "true";
    if (followingOnly) {
      const objectIds = [...req.session.user.following, req.session.user._id];
      searchObj.postedBy = { $in: objectIds };
    }
    delete searchObj.followingOnly;
  }
  const results = await getPosts(searchObj);
  res.status(200).send(results);
});
router.get("/:id", async (req, res, next) => {
  const postId = req.params.id;
  let postData = await getPosts({ _id: postId });
  postData = postData[0];
  const results = {
    postData: postData,
  };
  if (postData.replyTo !== undefined) {
    results.replyTo = postData.replyTo;
  }
  results.replies = await getPosts({ replyTo: postId });
  res.status(200).send(results);
});
router.post("/", async (req, res, next) => {
  if (!req.body.content) {
    console.log("Content params not sent with request");
    res.sendStatus(400);
  }
  const postData = {
    content: req.body.content,
    postedBy: req.session.user,
  };
  if (req.body.replyTo) {
    postData.replyTo = req.body.replyTo;
  }
  let newPost = await Post.create(postData).catch((err) => {
    console.log(err);
    res.sendStatus(400);
  });
  if (newPost) {
    newPost = await User.populate(newPost, { path: "postedBy" });
    newPost = await Post.populate(newPost, { path: "replyTo" });
    if (newPost.replyTo !== undefined) {
      await Notification.insertNotification(
        newPost.replyTo.postedBy,
        req.session.user,
        "reply",
        newPost._id
      );
    }
    return res.status(201).send(newPost);
  }
  res.status(200).send("It worked");
});
router.put("/:id/like", async (req, res, next) => {
  const postId = req.params.id;
  const userId = req.session?.user?._id;
  const isLiked =
    req.session.user?.likes && req.session.user?.likes.includes(postId);
  const option = isLiked ? "$pull" : "$addToSet";
  const user = await User.findByIdAndUpdate(
    userId,
    { [option]: { likes: postId } },
    { new: true }
  ).catch((err) => {
    console.log(err);
    res.sendStatus(400);
  });
  if (user) {
    req.session.user = user;
  }
  const post = await Post.findByIdAndUpdate(
    postId,
    { [option]: { likes: userId } },
    { new: true }
  ).catch((err) => {
    console.log(err);
    res.sendStatus(400);
  });
  if (!isLiked) {
    await Notification.insertNotification(
      post.postedBy,
      userId,
      "postLike",
      post._id
    );
  }
  res.status(200).send(post);
});
router.post("/:id/retweet", async (req, res, next) => {
  const postId = req.params.id;
  const userId = req.session?.user?._id;

  const deletePost = await Post.findOneAndDelete({
    postedBy: userId,
    retweetData: postId,
  }).catch((err) => {
    console.log(err);
    res.sendStatus(400);
  });
  const option = deletePost !== null ? "$pull" : "$addToSet";
  let repost = deletePost;
  if (repost === null) {
    repost = await Post.create({ postedBy: userId, retweetData: postId }).catch(
      (err) => {
        console.log(err);
        res.sendStatus(400);
      }
    );
  }
  const user = await User.findByIdAndUpdate(
    userId,
    { [option]: { retweets: repost._id } },
    { new: true }
  ).catch((err) => {
    console.log(err);
    res.sendStatus(400);
  });
  if (user) {
    req.session.user = user;
  }
  const post = await Post.findByIdAndUpdate(
    postId,
    { [option]: { retweetUsers: userId } },
    { new: true }
  ).catch((err) => {
    console.log(err);
    res.sendStatus(400);
  });
  if (!deletePost) {
    await Notification.insertNotification(
      post.postedBy,
      userId,
      "retweet",
      post._id
    );
  }
  res.status(200).send(post);
});
router.delete("/:id", async (req, res, next) => {
  const data = await Post.findByIdAndDelete(req.params.id);
  if (data) {
    return res.sendStatus(202);
  }
  return res.sendStatus(400);
});
router.put("/:id", async (req, res, next) => {
  if (req.body.pinned !== undefined) {
    await Post.updateMany(
      { postedBy: req.session.user._id },
      { pinned: false }
    );
  }
  const data = await Post.findByIdAndUpdate(req.params.id, req.body);
  if (!data) {
    return res.sendStatus(400);
  }
  return res.sendStatus(204);
});

async function getPosts(filter) {
  const posts = await Post.find(filter)
    .populate("postedBy")
    .populate("retweetData")
    .populate("replyTo")
    .sort({ createdAt: -1 })
    .catch((err) => {
      console.log(err);
    });
  const results = await User.populate(posts, {
    path: "replyTo.postedBy",
  });
  return await User.populate(results, {
    path: "retweetData.postedBy",
  });
}

module.exports = router;
