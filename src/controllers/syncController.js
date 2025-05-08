const {syncAllPosts, syncAllUsers} = require('../services/sync_service');
const logger = require('../utils/logger');
const syncAllUsersController = async(req, res) => {
    try {
        const result = await syncAllUsers();
        logger.info(`User synchronization completed: ${result.synced} users synced, ${result.errors} errors`);
        logger.info(`Post synchronization completed: ${result.syncedCount} posts synced, ${result.errorCount} errors`);        res.status(200).json({
            message: 'user synchronizatin completed',
            synced: result.synced,
            errors: result.errors
        });
    } catch (error) {
        logger.error(`Error synchronizing users: ${error.message}`);
        res.status(500).json({ message: error.message });
        
    }
};

const syncAllPostsController = async (req,res)=>{
    try {
        const result = await syncAllPosts();
        logger.info(`Post synchronization completed: ${result.syncedCount} posts synced, ${result.errorCount} errors`);        res.status(200).json({
            message: 'post synchronizatin completed',
            synced: result.syncedCount,
            errors: result.errorCount
        });
    } catch (error) {
        logger.error(`Error synchronizing posts: ${error.message}`);
        res.status(500).json({ message: error.message });
        
    }
};
module.exports = {
    syncAllUsersController,
    syncAllPostsController
};