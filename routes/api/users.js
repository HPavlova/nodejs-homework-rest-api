const express = require("express");
const { BadRequest, Conflict, Unauthorized } = require("http-errors");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs/promises");
const gravatar = require("gravatar");
const Jimp = require("jimp");

const avatarsDir = path.join(__dirname, "../../public/avatars");

const {
  User,
  joiSchemaUser,
  joiSchemaUserSubscription,
} = require("../../model");

const { SECRET_KEY } = process.env;
const { authenticate, upload } = require("../../middlewares");

router.post("/signup", async (req, res, next) => {
  try {
    const { error } = joiSchemaUser.validate(req.body);
    if (error) {
      throw new BadRequest(error.message);
    }
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user) {
      throw new Conflict("Email in use");
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);
    const avatarURL = gravatar.url(email);

    const newUser = await User.create({
      email,
      password: hashPassword,
      avatarURL,
    });
    res.status(201).json({
      user: {
        email: newUser.email,
        subscription: newUser.subscription,
        avatarURL: newUser.avatarURL,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { error } = joiSchemaUser.validate(req.body);
    if (error) {
      throw new BadRequest(error.message);
    }
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      throw new Unauthorized("Email or password is wrong");
    }

    const passwordCompare = await bcrypt.compare(password, user.password);
    if (!passwordCompare) {
      throw new Unauthorized("Email or password is wrong");
    }

    const payload = {
      email: user.email,
    };

    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "1h" });
    await User.findByIdAndUpdate(user._id, { token });

    res.status(200).json({
      token,
      user: {
        email: user.email,
        subscription: user.subscription,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/logout", authenticate, async (req, res) => {
  const { _id } = req.user;

  const user = await User.findByIdAndUpdate(_id, { token: null });
  if (!user) {
    throw new Unauthorized("Not authorized");
  }
  res.status(204).send();
});

router.get("/current", authenticate, async (req, res) => {
  const { _id } = req.user;

  const user = await User.findByIdAndUpdate(_id);
  if (!user) {
    throw new Unauthorized("Not authorized");
  }

  res.status(200).json({
    user: {
      email: user.email,
      subscription: user.subscription,
    },
  });
});

router.patch("/", authenticate, async (req, res, next) => {
  try {
    const { error } = joiSchemaUserSubscription.validate(req.body);
    if (error) {
      throw new BadRequest(error.message);
    }

    const { _id } = req.user;
    const { subscription } = req.body;

    const updateSubscriptionUser = await User.findOneAndUpdate(
      { _id },
      { subscription },
      {
        new: true,
      }
    );

    res.json(updateSubscriptionUser);
  } catch (error) {
    next(error);
  }
});

router.patch(
  "/avatars",
  authenticate,
  upload.single("avatar"),
  async (req, res, next) => {
    try {
      const { path: tmpUpload, filename } = req.file;
      const [extension] = filename.split(".").reverse();
      const newFileName = `${req.user._id}.${extension}`;
      const fileUpload = path.join(avatarsDir, newFileName);
      await fs.rename(tmpUpload, fileUpload);

      const avatarURL = path.join("avatars", newFileName);

      try {
        const avatarNewSize = await Jimp.read(fileUpload);
        avatarNewSize.resize(250, 250);
        avatarNewSize.write(fileUpload);
      } catch (error) {
        throw new Error("Error resize avatar");
      }

      await User.findByIdAndUpdate(req.user._id, { avatarURL }, { new: true });

      res.json({ avatarURL });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
