const bcrypt = require("bcrypt")
const pool = require("../config/db");

// 프로필 조회
exports.getProfile = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, username, email, profile_image, bio, location FROM users WHERE id = ?",
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
    const { username, bio, location } = req.body;

    const fields = [];
    const values = [];

    if (username !== undefined) {
      fields.push("username = ?");
      values.push(username);
    }
    if (bio !== undefined) {
      fields.push("bio = ?");
      values.push(bio);
    }
    if (location !== undefined) {
      fields.push("location = ?");
      values.push(location);
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: "수정할 정보가 없습니다." });
    }

    values.push(req.user.id);

    await pool.query(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`, values);

    res.json({ message: "프로필이 수정 되었습니다." });
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

// 비밀번호 변경
exports.changePassword = async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [userId]);
    if (rows.length === 0) return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });

    const user = rows[0];
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: "현재 비밀번호가 일치하지 않습니다." });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, userId]);

    res.json({ message: "비밀번호가 성공적으로 변경되었습니다." });
  } catch (err) {
    console.error("changePassword Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// 회원 탈퇴
exports.deleteAccount = async (req, res) => {
  const userId = req.user.id;

  try {
    await pool.query("DELETE FROM users WHERE id = ?", [userId]);
    res.json({message: "회원 탈퇴가 완료되었습니다."});
  }catch (err) {
    console.error("deleteAccount Error:", err);
    res.status(500).json({ error: err.message});
  }
};  
