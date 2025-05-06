const express = require("express");
const router = express.Router();
const { createPost,getAllPosts ,getPostsByUserId,getPostsByTag,getPostById,updatedPost,deletePost,searchPosts} = require("../controllers/postController");
const authMiddleware = require("../middlewares/authMiddleware");
const { postValidator } = require('../middlewares/validator');

// post routes
router.post("/create", authMiddleware, postValidator, createPost);
router.get("/search",searchPosts);
router.get("/", getAllPosts);
router.get("/user/:id", getPostsByUserId);
router.get("/tag/:tag", getPostsByTag);
router.get("/:id", getPostById);
router.put("/:id", authMiddleware,postValidator, updatedPost);
router.delete("/:id", authMiddleware, deletePost);
 module.exports= router;