const fs = require("fs/promises");
const { v4: uuidv4 } = require("uuid");
const contactsPath = require("./contactsPath");

const listContacts = async () => {
  const data = await fs.readFile(contactsPath);
  const contacts = JSON.parse(data);
  return contacts;
};

const getContactById = async (contactId) => {
  const contacts = await listContacts();
  const contact = contacts.find((item) => item.id === contactId);
  if (!contact) {
    return null;
  }
  return contact;
};

const removeContact = async (contactId) => {
  const contacts = await listContacts();
  const idx = contacts.findIndex((item) => item.id === contactId);
  if (idx === -1) {
    return null;
  }
  const newContacts = contacts.filter((_, index) => index !== idx);
  // const newContacts = contacts.filter(({ id }) => id !== contactId);
  // const removeContact = contacts.find((item) => item.id === contactId);
  await updateContact(newContacts);
  return "contact deleted";
};

const addContact = async (body) => {
  const contacts = await listContacts();
  const newContact = { ...body, id: uuidv4() };
  contacts.push(newContact);
  await updateContact(contacts);
  return newContact;
};

const updateContact = async (contactId, body) => {
  const contacts = await listContacts();

  const idx = contacts.findIndex((item) => item.id === contactId);
  console.log(idx);
  if (idx === -1) {
    return null;
  }
  contacts[idx] = { id: contactId, ...body };

  await fs.writeFile(contactsPath, JSON.stringify(contacts, null, 2));

  return contacts[idx];
};

module.exports = {
  listContacts,
  getContactById,
  removeContact,
  addContact,
  updateContact,
};
