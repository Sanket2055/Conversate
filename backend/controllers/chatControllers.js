const asyncHandler = require("express-async-handler");
const Chat = require("../models/chatModel");
const User = require("../models/userModel");
const accessChat = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  console.log(userId, "userId")
  if (!userId) {
    res.status(400);

    throw new Error("User not found");
  }

  var isChat = Chat.findOne({
    isGroupChat: false,
    $and: [
      { users: { $elemMatch: { $eq: req.user._id } } },
      { users: { $elemMatch: { $eq: userId } } },
    ],
  })
    .populate("users", "-password")
    .populate("latestMessage");
  isChat = await User.populate(isChat, {
    path: "latestMessage.sender",
    select: "name pic email",
  });

  if (isChat != null || isChat?.length > 0) {
    res.status(200).json(isChat);
  } else {
    try {
      const chat = await Chat.create({
        chatName: "sender",
        users: [req.user._id, userId],
        isGroupChat: false,
      });
      if (chat) {
        res.status(201).send(chat);
      } else {
        res.status(400);
        throw new Error("Invalid chat data");
      }
    } catch (err) {
      console.log(err);
    }
  }
});

const fetchChats = asyncHandler(async (req, res) => {
  try {
    Chat.find({
      users: { $elemMatch: { $eq: req.user._id } },
    })
      .populate("users", "-password")
      .populate("latestMessage")
      .populate("groupAdmin", "-password")
      .sort({ updatedAt: -1 })
      .then(async (chats) => {
        await User.populate(chats, {
          path: "latestMessage.sender",
          select: "name pic email",
        }).then((populatedChats) => {
          res.status(200).json(populatedChats);
        });
      });
  } catch (err) {
    console.log(err);
    throw new Error(err.message);
  }
});

const createGroupChat = asyncHandler(async (req, res) => {
  try {
    if (!req.body.name || !req.body.users) {
      res.status(400);
      throw new Error("Please fill all the fields");
    }
    let users = JSON.parse(req.body.users);
    if (users.length < 2) {
      res.status(400);
      throw new Error("Please add atleast 2 users");
    }
    // all users and the current user
    users.push(req.user._id);
    const groupChat = await Chat.create({
      chatName: req.body.name,
      users: users,
      isGroupChat: true,
      groupAdmin: req.user._id,
    });

    const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    res.status(201).json(fullGroupChat);
  } catch (err) {
    console.log(err);
    throw new Error(err.message);
  }
});

const renameGroup = asyncHandler(async (req, res) => {
  try {
    const { chatId, chatName } = req.body;
    if (!chatId || !chatName) {
      res.status(400);
      throw new Error("Please fill all the fields");
    }
    const updatedChat = await Chat.findOneAndUpdate(
      {
        _id: chatId,
      },
      {
        chatName: chatName,
      },
      {
        new: true,
      }
    )
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    if (!updatedChat) {
      res.status(400);
      throw new Error("Chat not found");
    }
    res.status(200).json(updatedChat);
  } catch (err) {
    console.log(err);
    throw new Error(err.message);
  }
});

const addToGroup = asyncHandler(async (req, res) => {
  try {
    const { chatId, userId } = req.body;
    if (!chatId || !userId) {
      res.status(400);
      throw new Error("Please fill all the fields");
    }
    const updatedChat = await Chat.findOneAndUpdate(
      {
        _id: chatId,
      },
      {
        $push: { users: userId },
      },
      {
        new: true,
      }
    )
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    if (!updatedChat) {
      res.status(400);
      throw new Error("Chat not found");
    }
    res.status(200).json(updatedChat);
  } catch (err) {
    console.log(err);
    throw new Error(err.message);
  }
});

const removeFromGroup = asyncHandler(async (req, res) => {
  try {
    const { chatId, userId } = req.body;
    if (!chatId || !userId) {
      res.status(400);
      throw new Error("Please fill all the fields");
    }
    const updatedChat = await Chat.findOneAndUpdate(
      {
        _id: chatId,
      },
      {
        $pull: { users: userId },
      },
      {
        new: true,
      }
    )
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    if (!updatedChat) {
      res.status(400);
      throw new Error("Chat not found");
    }
    res.status(200).json(updatedChat);
  } catch (err) {
    console.log(err);
    throw new Error(err.message);
  }
});

module.exports = {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
};
