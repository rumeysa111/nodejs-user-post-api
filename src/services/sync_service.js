const User = require('../models/userModel');
const Post = require('../models/postModel');
const { elasticClient } = require('../config/elastic_search');

const logger = require("../utils/logger");
const cron = require('node-cron');

const syncAllUsers = async  ()=> {
    try {
        logger.info("starting sync all users");
        const users= await User.find({});
        let syncedCount=0;
        let errorCount=0;
        for(const user of users){
            try {
                await elasticClient.index({
                    index: "users",
                    id: user._id.toString(),
                    body: {
                        username: user.username,
                        email: user.email,
                        role: user.role,
                        userId: user._id.toString(),
                        createdAt: user.createdAt,
                        updatedAt: user.updatedAt,
                        syncedAt: new Date()
                    }
                });
                syncedCount++;
                logger.debug(`Synced user ${user._id} to elasticsearch`);
            } catch (error) {
                errorCount++;
                logger.error(`Error syncing user ${user._id} to Elasticsearch: ${error.message}`);
                
            }
        }
        logger.info(`user sync completed: ${syncedCount} synced, ${errorCount} errors`);        return { synced: syncedCount, errors: errorCount };
        } catch (error) {
        logger.error(`Error syncing all users: ${error.message}`);
        throw new Error(error.message);
    }
};
//mongo dbden eastic searche senkronize ediyoruz postları

const syncAllPosts = async () => {
    try {
        logger.info('Starting full post synchronization from MongoDB to Elasticsearch');
        const posts = await Post.find({});
        let syncedCount = 0;
        let errorCount = 0;
        
        for (const post of posts) {
            try {
                await elasticClient.index({
                    index: "posts",
                    id: post._id.toString(),
                    body: {
                        title: post.title,
                        content: post.content,
                        tags: post.tags,
                        userId: post.userId.toString(),
                        postId: post._id.toString(),
                        createdAt: post.createdAt,
                        updatedAt: post.updatedAt || post.createdAt,
                        syncedAt: new Date()
                    }
                });
                syncedCount++;
                logger.debug(`Synced post: ${post._id}`);
            } catch (error) {
                errorCount++;
                logger.error(`Error syncing post ${post._id}: ${error.message}`);
            }
        }
        
        logger.info(`Post synchronization completed: ${syncedCount} posts synced, ${errorCount} failed`);
        return { syncedCount, errorCount };
    } catch (error) {
        logger.error(`Error in full post synchronization: ${error.message}`);
        throw error;
    }
};


const startUserSyncCron = (schedule = '0 */4 * * *') => {
    logger.info(`Starting user sync cron job with schedule: ${schedule}`);
    cron.schedule(schedule, async () => {
        logger.info('Running scheduled user sync job');
        try {
            const result = await syncAllUsers();
            logger.info(`Scheduled user sync completed: ${result.synced} users synced, ${result.errors} errors`);
        } catch (error) {
            logger.error(`Scheduled user sync failed: ${error.message}`);
        }
    });
};


const startPostSyncCron = (schedule = '0 */2 * * *') => {
    logger.info(`Starting post sync cron job with schedule: ${schedule}`);
    cron.schedule(schedule, async () => {
        logger.info('Running scheduled post sync job');
        try {
            const result = await syncAllPosts();
            logger.info(`Scheduled post sync completed: ${result.syncedCount} posts synced, ${result.errorCount} errors`);
        } catch (error) {
            logger.error(`Scheduled post sync failed: ${error.message}`);
        }
    });
};
module.exports={
    syncAllUsers,
    syncAllPosts,
    startUserSyncCron,
    startPostSyncCron
};
