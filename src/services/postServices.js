const { elasticClient } = require("../config/elastic_search");
const Post = require("../models/postModel");
const User = require("../models/userModel");  // Bu satırı ekleyin
const logger = require("../utils/logger");
const createPost = async (title, content, tags, userId) => {
    try {
        // Kullanıcının var olup olmadığını kontrol et
        const user = await User.findById(userId);
        if (!user) {
            logger.warn(`Post creation attempted with invalid user ID: ${userId}`);

            throw new Error("User not found");
        }
        const newPost = new Post({ title, content, tags, userId });
        await newPost.save();
        await elasticClient.index({
            index: "posts",
            id: newPost._id.toString(),
            body: {
                title,
                content,
                tags,
                userId,
                postId: newPost._id.toString(),
                createdAt: new Date()
            }


        });

        logger.info(`New post created: ${newPost._id} by user ${userId}`);

        return {
            message: "Post created",
            postId: newPost._id,
        };
    } catch (error) {
        logger.error(`Error in createPost: ${error.message}`);

        throw new Error(error.message);
    }
};
// searchPosts fonksiyonu elastic search ile arama yapıyor.
const searchPosts = async (query) => {
    try {
        const result = await elasticClient.search({
            index: "posts",
            body: {
                query: {
                    multi_match: {
                        query: query,
                        fields: ["title", "content", "tags"]
                    }
                }
            }
        });
        const hits = result.body ? result.body.hits : (result.hits || { hits: [] });

        return result.hits.hits.map(hit => ({
            ...hit._source,
            _id: hit._id // ElasticSearch'den dönen her postun _id'sini ekliyoruz
        }));
    } catch (error) {
        logger.error(`Error in searchPosts: ${error.message}`);
        throw new Error(error.message);

    }
};
const getAllPosts = async () => {
    try {
        const posts = await Post.find({}).populate("userId", "username email").sort({ createdAt: -1 });
        
        // Değişken adı: elasticResponse
        const elasticResponse = await elasticClient.search({
            index: "posts",
            size: 10000
        });
        
        // Aynı değişken adını kullanın
        const elasticHits = elasticResponse.body ? 
            elasticResponse.body.hits : 
            (elasticResponse.hits || { hits: [] });
        
        logger.debug(`Retrieved ${posts.length} posts from MongoDB and ${elasticHits.hits.length} from Elasticsearch`);

        return posts;
    } catch (error) {
        logger.error(`Error in getAllPosts: ${error.message}`);
        throw new Error(error.message);
    }
};

const getPostsByUserId = async (userId) => {
    try {
        // MongoDB'den kullanıcıya ait gönderileri al (bu satır eksikti)
        const posts = await Post.find({ userId }).populate("userId", "username email").sort({ createdAt: -1 });
        
        // Elasticsearch'ten de verileri al
        const elasticResponse = await elasticClient.search({
            index: "posts",
            body: {
                query: {
                    match: {
                        userId: userId
                    }
                }
            }
        });
        
        // Elasticsearch yanıt yapısı kontrolü
        const elasticHits = elasticResponse.body ? 
            elasticResponse.body.hits : 
            (elasticResponse.hits || { hits: [] });
        
        logger.debug(`Retrieved ${posts.length} posts for user ${userId}`);

        return posts;
    } catch (error) {
        logger.error(`Error in getPostsByUserId: ${error.message}`);
        throw new Error(error.message);
    }
};

const getPostsByTag = async (tag) => {
    try {
        const posts = await Post.find({ tags: tag }).populate("userId", "username email").sort({ createdAt: -1 });
        logger.debug(`Retrieved ${posts.length} posts with tag: ${tag}`);
        // elastic search den de tag'e göre postları getiriyoruz
        const elasticResponse = await elasticClient.search({
            index: 'posts',
            body: {
                query: {
                    term: {
                        tags: tag
                    }
                }
            }
        });
               // Elasticsearch 7.x yanıt yapısı kontrolü
               const elasticHits = elasticResponse.body ? 
               elasticResponse.body.hits : 
               (elasticResponse.hits || { hits: [] });
        return posts;
    } catch (error) {
        logger.error(`Error in getPostsByTag: ${error.message}`);
        throw new Error(error.message);

    }
};
const getPostById = async (postId) => {
    try {
        const post = await Post.findById(postId).populate("userId", "username email");
        if (!post) {
            // Elasticsearch'den de kontrol et
            const elasticPost = await elasticClient.get({
                index: 'posts',
                id: postId
            });

            if (!elasticPost.found) {
                logger.warn(`Post not found with ID: ${postId}`);
                throw new Error("Post not found");
            }
        }
        logger.debug(`Retrieved post: ${postId}`);

        return post;
    } catch (error) {
        logger.error(`Error in getPostById: ${error.message}`);
        throw new Error(error.message);

    }
};
const updatePost = async (postId, userId, updateData) => {
    try {
        // Önce kullanıcının var olup olmadığını kontrol et
        const user = await User.findById(userId);
        if (!user) {
            logger.warn(`Post update attempted with invalid user ID: ${userId}`);

            throw new Error("User not found");
        }
        const post = await Post.findById(postId);
        if (!post) {
            logger.warn(`Update attempted on non-existent post: ${postId}`);
            throw new Error("Post not found");
        }

        if (post.userId.toString() !== userId) {
            logger.warn(`Unauthorized post update attempt: ${userId} tried to update post ${postId}`);
            throw new Error("You are not authorized to update this post");
        }
        const updatedPost = await Post.findByIdAndUpdate(postId, { $set: updateData }, { new: true, runValidators: true }).populate("userId", "username email");
        logger.info(`Post updated: ${postId} by user ${userId}`);
        // elastic search güncelleme işlemi
        await elasticClient.update({
            index: 'posts',
            id: postId,
            body:{
            doc: {
                title: updateData.title,
                content: updateData.content,
                tags: updateData.tags,
                updatedAt: new Date()
            }}
        });
        logger.info(`Post updated in MongoDB and Elasticsearch: ${postId} by user ${userId}`);
        return updatedPost;
    } catch (error) {
        logger.error(`Error in updatePost: ${error.message}`);
        throw new Error(error.message);

    }
};
const deletePost = async (postId, userId) => {
    try {
        // Önce kullanıcının var olup olmadığını kontrol et
        const user = await User.findById(userId);
        if (!user) {
            logger.warn(`Post deletion attempted with invalid user ID: ${userId}`);
            throw new Error("User not found");
        }
        const post = await Post.findById(postId);
        if (!post) {
            logger.warn(`Deletion attempted on non-existent post: ${postId}`);
            throw new Error("Post not found");
        }

        await Post.findByIdAndDelete(postId);
        logger.info(`Post deleted: ${postId} by user ${userId}`);
        // elastic search den silme işlemi
        await elasticClient.delete({
            index: "posts",
            id: post._id.toString()
        });
        logger.info(`Post deleted from MongoDB and Elasticsearch: ${postId} by user ${userId}`);

        return { message: "Post deleted successfully", postId: postId };
    } catch (error) {

        logger.error(`Error in deletePost: ${error.message}`);
        throw new Error(error.message);
    }

};
module.exports = {
    createPost,
    getAllPosts,
    getPostsByUserId,
    getPostsByTag,
    getPostById,
    updatePost,
    deletePost,
    searchPosts
};