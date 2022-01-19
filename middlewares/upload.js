const multer = require("multer");
const path = require("path");

const tmpDir = path.join(__dirname, "../", "tmp");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tmpDir);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
  limits: {
    fileSize: 2048,
  },
});

const upload = multer({ storage: storage });

module.exports = upload;
