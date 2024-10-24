const express = require("express");
const bcrypt = require("bcryptjs");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// 데이터 파일 경로
const usersFilePath = path.join(__dirname, "../data/users.json");

// 사용자 데이터 읽기
function getUsers() {
  if (!fs.existsSync(usersFilePath)) {
    fs.writeFileSync(usersFilePath, JSON.stringify([]));
  }
  const usersData = fs.readFileSync(usersFilePath);
  return JSON.parse(usersData);
}

// 사용자 데이터 쓰기
function saveUsers(users) {
  fs.writeFileSync(usersFilePath, JSOM.stringify(users, null, 2));
}

// 회원가입 폼
router.get("/register", (req, res) => {
  res.render("register", { user: req.session.username || null });
});

// 회원가입 처리
router.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const users = getUsers();

  const existingUser = users.find((user) => user.username === username);
  if (existingUser) {
    return res.send("이미 존재하는 사용자입니다.");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  users.push({ username, password: hashedPassword });
  saveUsers(users);

  res.redirect("/login");
});

// 로그인 폼
router.get("/login", (req, res) => {
  res.render("login", { user: req.session.user || null });
});

// 로그인 처리
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const users = getUsers();

  const user = users.find((user) => user.username === username);
  if (!user) {
    return res.send("사용자를 찾을 수 없습니다.");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.send("비밀번호가 일치하지 않습니다.");
  }

  req.session.user = user.username;
  res.redirect("/posts");
});

// 로그아웃
router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.send("로그아웃 중 오류가 발생했습니다.");
    }

    res.redirect("/login");
  });
});

module.exports = router;
