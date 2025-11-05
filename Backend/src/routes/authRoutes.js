const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

exports.register = async (req, res) => {
  // console.log("req.body:",req.body);
  const { username, email, password, location } = req.body;
  try {
    const [user] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (user.length > 0) {
      return res.status(400).json({ message: "이미 가입된 이메일입니다." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO users (username, email, password, location) VALUES (?, ?, ?, ?)",
      [username, email, hashedPassword, location || null]
    );

    res.status(201).json({ message: "회원가입 성공", userId: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0) {
      return res.status(400).json({ message: "이메일이 존재하지 않습니다." });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "비밀번호가 일치하지 않습니다." });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET이 설정되지 않았습니다!");
      return res.status(500).json({ error: "서버 환경변수 설정 오류" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ message: "로그인 성공", token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};