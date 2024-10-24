const express = require("express");
const path = require("path");
const fs = require("fs");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// 데이터 파일 경로
const postsFilePath = path.join(__dirname, "../data/posts.json");

// 게시글 데이터 읽기
function getPosts() {
  if (!fs.existsSync(postsFilePath)) {
    fs.writeFileSync(postsFilePath, JSON.stringify([]));
  }
  const postsData = fs.readFileSync(postsFilePath);
  return JSON.parse(postsData);
}

// 게시글 데이터 쓰기
function savePosts(posts) {
  fs.writeFileSync(postsFilePath, JSON.stringify(posts, null, 2));
}

// 게시글 목록
router.get("/", (req, res) => {
  const posts = getPosts();
  res.render("index", { posts, user: req.session.user || null });
});

// 게시글 작성 폼
router.get("/new", authMiddleware, (req, res) => {
  res.render("newpost", { user: req.session.username || null });
});

// 게시글 작성 처리
router.post("/new", authMiddleware, (req, res) => {
  const { title, content } = req.body;
  const posts = getPosts();

  const newPost = {
    id: Date.now(),
    title,
    content,
    author: req.session.user,
    createAt: new Date().toISOString(),
  };

  posts.push(newPost);
  savePosts(posts);

  res.redirect("/posts");
});

// 게시글 상세 보기
router.get("/:id", (req, res) => {
  const postId = parseInt(req.params.id);
  const posts = getPosts();
  const post = posts.find((p) => p.id === postId);

  if (!post) {
    return res.status(404).send("게시글을 찾을 수 없습니다.");
  }

  res.render("post", { post, user: req.session.user });
});

// 게시글 수정 폼
router.get("/:id/edit", authMiddleware, (req, res) => {
  const postId = parseInt(req.params.id);
  const posts = getPosts();
  const post = posts.find((p) => p.id === postId);

  if (!post) {
    return res.status(404).send("게시글을 찾을 수 없습니다.");
  }

  if (post.author !== req.session.user) {
    return res.status(403).send("수정 권한이 없습니다.");
  }

  res.render("editPost", { post, user: req.session.user || null });
});

// 게시글 수정 처리
router.post("/:id/edit", authMiddleware, (req, res) => {
  const postId = parseInt(req.params.id);
  const { title, content } = req.body;
  const posts = getPosts();
  const postIndex = post.findIndex((p) => p.id === postId);

  if (postIndex === -1) {
    return res.status(404).send("게시글을 찾을 수 없습니다.");
  }

  if (posts[postIndex].author !== req.session.user) {
    return res.status(403).send("수정 권한이 없습니다.");
  }

  posts[postIndex].title = title;
  posts[postIndex].content = content;
  savePosts(posts);

  res.redirect(`/posts/${postId}`);
});

// 게시글 삭제
router.post("/:id/delete", authMiddleware, (req, res) => {
  const postId = parseInt(req.params.id);
  let posts = getPosts();
  const post = posts.find((p) => p.id === postId);

  if (!post) {
    return res.status(404).send("게시글을 찾을 수 없습니다.");
  }

  if (post.author !== req.session.user) {
    return res.status(403).send("삭제 권한이 없습니다.");
  }

  posts = posts.filter((p) => p.id === postId);
  savePosts(posts);

  res.redirect("/posts");
});

module.exports = router;
