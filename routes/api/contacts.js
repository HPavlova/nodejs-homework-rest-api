const express = require("express");
const { NotFound, BadRequest } = require("http-errors");
const router = express.Router();
const { Contact, joiSchemaContact } = require("../../model");
const authenticate = require("../../middlewares/authenticate");

router.get("/", authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const { _id } = req.user;
    const skip = (page - 1) * limit;

    const contacts = await Contact.find(
      { owner: _id, ...req.query },
      {},
      { skip, limit: +limit }
    );
    res.json(contacts);
  } catch (error) {
    next(error);
  }
});

router.get("/:contactId", authenticate, async (req, res, next) => {
  const { contactId } = req.params;
  try {
    const contact = await Contact.findById(contactId);
    if (!contact) {
      throw new NotFound();
    }
    res.json(contact);
  } catch (error) {
    if (error.message.includes("Cast to ObjectId failed")) {
      error.status = 404;
    }
    next(error);
  }
});

router.post("/", authenticate, async (req, res, next) => {
  try {
    const { error } = joiSchemaContact.validate(req.body);
    if (error) {
      throw new BadRequest(error.message);
    }
    const { _id } = req.user;
    const newContact = await Contact.create({ ...req.body, owner: _id });
    res.status(201).json(newContact);
  } catch (error) {
    if (error.message.includes("validation failed")) {
      error.status = 400;
    }
    next(error);
  }
});

router.delete("/:contactId", authenticate, async (req, res, next) => {
  try {
    const { contactId, _id } = req.params;
    const deleteContact = await Contact.findByIdAndRemove({
      _id: contactId,
      owner: _id,
    });

    if (!deleteContact) {
      throw new NotFound();
    }
    res.json({ message: "contact deleted" });
  } catch (error) {
    next(error);
  }
});

router.put("/:contactId", authenticate, async (req, res, next) => {
  try {
    const { error } = joiSchemaContact.validate(req.body);
    if (error) {
      throw new BadRequest(error.message);
    }
    const { contactId, _id } = req.params;

    const updateContact = await Contact.findByIdAndUpdate(
      { _id: contactId, owner: _id },
      req.body,
      {
        new: true,
      }
    );

    if (!updateContact) {
      throw new NotFound();
    }
    res.json(updateContact);
  } catch (error) {
    if (error.message.includes("validation failed")) {
      error.status = 400;
    }
    next(error);
  }
});

router.patch("/:contactId/favorite", authenticate, async (req, res, next) => {
  try {
    const { contactId, _id } = req.params;
    const { favorite } = req.body;

    if (!favorite) {
      res.status(400).json({ message: "missing field favorite" });
    }

    const updateStatusContact = await Contact.findByIdAndUpdate(
      { _id: contactId, owner: _id },
      { favorite },
      {
        new: true,
      }
    );

    if (!updateStatusContact) {
      throw new NotFound();
    }

    res.json(updateStatusContact);
  } catch (error) {
    if (error.message.includes("validation failed")) {
      error.status = 400;
    }
    next(error);
  }
});

module.exports = router;
