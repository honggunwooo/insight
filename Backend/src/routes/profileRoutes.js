const express = require("express");
const router = express.Router();
const verifyToken = require("../middlewares/jwt");
const upload = require("../middlewares/uploads");
const { getProfile, updateProfile, uploadProfileImage } = require("../controllers/profile");

router.get("/me", verifyToken, getProfile);
router.put("/me", verifyToken, updateProfile);
router.post("/me/avatar", verifyToken, upload.single("profileImage"), uploadProfileImage);

module.exports = router;
