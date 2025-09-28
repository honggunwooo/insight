const express = require("express");
const { getProfile, updateProfile, uploadProfileImage } = require("../controllers/profile");
const jwt = require("../middlewares/jwt");
const upload = require("../middlewares/uploads");

const router = express.Router();

router.get("/", jwt, getProfile);
router.put("/", jwt, updateProfile);
router.post("/upload", jwt, upload.single("image"), uploadProfileImage);

module.exports = router;