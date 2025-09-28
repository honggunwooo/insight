const pool = require("../config/db");

// 프로필 조회
exports.getProfile = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, username, email, profile_image, bio FROM users WHERE id = ?",
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    const user = rows[0];
    if (user.profile_image) {
      user.profile_image = `${req.protocol}://${req.get("host")}${user.profile_image}`;
    }

    res.json(user);
  } catch (error) {
    console.error("getProfile Error:", error);
    res.status(500).json({ message: "서버 에러" });
  }
};

// 프로필 수정
exports.updateProfile = async (req, res) => {
  try {
    const { username, bio } = req.body;
    await pool.query(
      "UPDATE users SET username = ?, bio = ? WHERE id = ?",
      [username, bio, req.user.id]
    );

    res.json({ message: "프로필이 업데이트 되었습니다." });
  } catch (error) {
    console.error("updateProfile Error:", error);
    res.status(500).json({ message: "서버 에러" });
  }
};

// 프로필 이미지 업로드
exports.uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ message: "이미지 파일이 필요합니다." });
    }

    const imagePath = `/uploads/${req.file.filename}`;

    await pool.query(
      "UPDATE users SET profile_image = ? WHERE id = ?",
      [imagePath, req.user.id]
    );

    res.json({
      message: "프로필 사진이 업로드 되었습니다.",
      imageUrl: `${req.protocol}://${req.get("host")}${imagePath}`,
    });
  } catch (error) {
    console.error("uploadProfileImage Error:", error);
    res.status(500).json({ message: "서버 에러" });
  }
};