const postService = require('../services/postServices');
const logger = require('../utils/logger');

// new post created
const createPost = async (req, res) => {
    const userId = req.user.id;
    try {
        const newPost = await postService.createPost(req.body.title, req.body.content, req.body.tags, userId);
        logger.info(`Post created: ${JSON.stringify(newPost)}`);

        res.status(201).json(newPost);
    } catch (error) {
        logger.error(`Error creating post: ${error.message}`);

        res.status(500).json({ message: error.message });

    }

};
// get all posts 
const getAllPosts = async (req, res) => {
    try {
        const posts = await postService.getAllPosts();
        logger.info(`Retrieved ${posts.length} posts`);

        res.status(200).json(posts);
    } catch (error) {
        logger.error(`Error retrieving all posts: ${error.message}`);
        res.status(500).json({ message: error.message });

    }
};
const getPostsByUserId = async (req, res) => {

    try {
        const userId = req.params.id;
        const posts = await postService.getPostsByUserId(userId);
        logger.info(`Retrieved ${posts.length} posts for user ${userId}`);

        res.status(200).json(posts);
    } catch (error) {
        logger.error(`Error retrieving posts by user ${req.params.id}: ${error.message}`);
        res.status(500).json({ message: error.message });

    }

};
const getPostsByTag = async (req, res) => {
    try {
        const tag = req.params.tag;
        const posts = await postService.getPostsByTag(tag);
        logger.info(`Retrieved ${posts.length} posts with tag ${tag}`);

        res.status(200).json(posts);
    } catch (error) {
        logger.error(`Error retrieving posts by tag ${req.params.tag}: ${error.message}`);
        res.status(500).json({ message: error.message });

    }
};
const getPostById = async (req, res) => {
    try {
        const postId = req.params.id;
        const post = await postService.getPostById(postId);
        logger.info(`Retrieved post: ${postId}`);

        res.status(200).json(post);
    } catch (error) {
        logger.error(`Error retrieving post ${req.params.id}: ${error.message}`);
        if (error.message === "Post not found") {
            res.status(404).json({ message: error.message });
        }
        else {
            res.status(500).json({ message: error.message });

        }

    }
};
const updatedPost = async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user.id;
        const updateData = req.body;
        const updatedPost = await postService.updatePost(postId, userId, updateData);
        logger.info(`Post updated: ${postId} by user ${userId}`);

        res.status(200).json({
            message: "Post updated",
            post: updatedPost,
        });
    } catch (error) {
        logger.error(`Error updating post ${req.params.id}: ${error.message}`);
        if (error.message === "Post not found") {
            res.status(404).json({ message: error.message });
        } else if (error.message === "You are not authorized to update this post") {
            res.status(401).json({ message: error.message });
        } else {
            res.status(500).json({ message: error.message });
        }
    }
};
const deletePost = async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user.id;
        const deletedPost = await postService.deletePost(postId, userId);
        logger.info(`Post deleted: ${postId} by user ${userId}`);
        res.status(200).json({ message: "Post deleted" });

    } catch (error) {
        logger.error(`Error deleting post ${req.params.id}: ${error.message}`);
        if (error.message === "post not found") {
            res.status(404).json({ message: error.message });
        } else if (error.message === "You are not authorized to delete this post") {
            res.status(403).json({ message: error.message });
        } else {
            res.status(500).json({ message: error.message });
        }
    }
};
const searchPosts = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({ message: "Search query is required" });
        }

        const results = await postService.searchPosts(q);
        logger.info(`Search performed with query: ${q}`);
        res.json(results);
    } catch (error) {
        logger.error(`Error in search: ${error.message}`);
        res.status(500).json({ message: error.message });
    }
};
module.exports = {
    createPost,
    getAllPosts,
    getPostsByUserId,
    getPostsByTag,
    getPostById,
    updatedPost,
    deletePost,
    searchPosts,
};