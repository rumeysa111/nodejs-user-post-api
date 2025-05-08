const express = require('express');
const router = express.Router();
const syncController = require('../controllers/syncController');
const authMiddleware = require('../middlewares/authMiddleware');

// Senkronizasyon route'ları - admin yetkilendirmesi eklenebilir
router.post('/users', authMiddleware, syncController.syncAllUsersController);
router.post('/posts', authMiddleware, syncController.syncAllPostsController);

module.exports = router;