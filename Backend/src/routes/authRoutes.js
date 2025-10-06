const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const verifyToken = require("../middlewares/jwt");
const { register, login } = require("../controllers/auth");

router.post("/register", register);
router.post("/login", login);

router.get("/me", verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, username, email, location FROM users WHERE id = ?",
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: "사용자 없음" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
