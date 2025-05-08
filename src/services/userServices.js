const User = require("../models/userModel");
const Post = require("../models/postModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const logger = require("../utils/logger");
const { default: mongoose } = require("mongoose");
const  { elasticClient } = require("../config/elastic_search");

const registerUser = async (username, email, password, role) => {
    try {
        // Gerekli parametrelerin kontrolü
        if (!username || !email || !password) {
            logger.error("Missing required parameters for registration");
            throw new Error("Missing required parameters: username, email, and password are required");
        }
        
        // Email formatının basit kontrolü
        const emailRegex = /\S+@\S+\.\S+/;
        if (!emailRegex.test(email)) {
            logger.error(`Invalid email format: ${email}`);
            throw new Error("Invalid email format");
        }
        
        logger.debug(`Checking if email exists: ${email}`);
        const existingUser = await User.findOne({ email });
        
        if (existingUser) {
            logger.warn(`Registration failed: Email already exists: ${email}`);
            throw new Error("This email already exists");
        }
        
        // Kullanıcı rolü yoksa varsayılan olarak "user" ata
        const userRole = role || "user";
        
        const newUser = new User({ 
            username, 
            email, 
            password, 
            role: userRole 
        });
        
        logger.debug("Saving user to MongoDB");
        await newUser.save();
        
        // Elasticsearch'e kaydet
        try {
            logger.debug("Indexing user in Elasticsearch");
            await elasticClient.index({
                index: "users",
                id: newUser._id.toString(),
                body: {
                    username,
                    email,
                    role: userRole,
                    userId: newUser._id.toString(),
                    createdAt: new Date(),
                }
            });
        } catch (elasticError) {
            // Elasticsearch hatası durumunda işlemi durdurmak yerine loglayalım
            logger.error(`Elasticsearch indexing error: ${elasticError.message}`);
            // MongoDB'ye kaydedildi ama Elasticsearch'e kaydedilemedi, bunu da loglayabiliriz
        }
        
        logger.info(`New user registered successfully: ${username}, ${email}, ${userRole}`);

        return {
            success: true,
            message: "User created successfully",
            userId: newUser._id,
        };

    } catch (error) {
        logger.error(`Error in registerUser: ${error.message}`);
        // Orijinal hata mesajını koru
        throw error;
    }
};
const loginUser = async (email, password) => {
    try {
        logger.debug(`login attempt for: ${email}`);
        const user = await User.findOne({ email });
        if (!user) {
            logger.warn(`Login failed: User with email ${email} not found`);
            throw new Error("User not found");
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) throw new Error("Invalid credentials"); // şifre kontrolü yapıyoruz eğer eşleşmiyorsa hata fırlatıyoruz.  
        logger.info(`Login successful for user: ${user._id}`);
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" }); // token oluşturuyoruz.
        logger.debug(`Generated token for user: ${user._id}`);
        return {
            token,
            userId: user._id,

        };

    } catch (error) {
        logger.error(`Error: ${error.message}`);
        throw new Error(error.message);

    }
};
const getAllUsers = async () => {
    try {
        // tüm kullanıcıları al daha sonra kullanıcıları döndür
        const users = await User.find({});
        return users;
    } catch (error) {
        logger.error(`Error: ${error.message}`);
        throw new Error(error.message);

    }
}
const getUserById = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) throw new Error("User not found");
        return user;
    } catch (error) {
        logger.error(`Error: ${error.message}`);
        throw new Error(error.message);

    }
}
const updateUser = async (userId, updateData) => {
    try {
        // user var mı kontrol ediyoruz.
        const user = await User.findById(userId);
        if (!user) throw new Error("User not found");
        if (updateData.email && updateData.email !== user.email) {
            const existingUser = await User.findOne({
                email: updateData.email,
            }); // email adresi ile kayıtlı kullanıcı var mı kontrol ediyoruz.
            if (existingUser) throw new Error("This email already exists"); // eğer varsa hata fırlatıyoruz.
        }
        if (updateData.username && updateData.username !== user.username) {
            const existingUser = await User.findOne({
                username: updateData.username,

            });
            if (existingUser) throw new Error("This username already exists");
        }
        if (updateData.password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(updateData.password, salt);
        }
        // kullanıcıyı güncelle yeni verilerle 
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select("-password");
        // elastic search güncelleme işlemi yapıyoruz.
        await elasticClient.update({
            index: "users",
            id: userId,
            body: {  // 'document' yerine 'body' kullanın
                doc: {  // Elasticsearch update API için 'doc' içinde gönderin
                    username: updateData.username || user.username,
                    email: updateData.email || user.email,
                    role: updateData.role || user.role,
                    updatedAt: new Date()
                }
            }
        });
        logger.info(`User updated in MongoDB and Elasticsearch: ${userId}`);
    


        return updatedUser;
    } catch (error) {
        logger.error(`Error: ${error.message}`);
        throw new Error(error.message);

    }

};
const deleteUser = async (userId) => {
    try {
        // Önce kullanıcıyı bul ve sil
        const user = await User.findByIdAndDelete(userId);
        if (!user) throw new Error("User not found");

        // Kullanıcıya ait tüm postları sil
        const deletedPosts = await Post.deleteMany({ userId: userId });
        // Elasticsearch'den kullanıcı ve postlarını sil
        await Promise.all([
            elasticClient.delete({
                index: 'users',
                id: userId
            }),
            elasticClient.deleteByQuery({
                index: 'posts',
                body: {
                    query: {
                        term: { userId: userId }
                    }
                }
            })
        ]);
        return {
            user: user,
            deletedPostsCount: deletedPosts.deletedCount
        };
    } catch (error) {
        logger.error(`Error: ${error.message}`);
        throw new Error(error.message);
    }
};

const searchUsers = async (query) => {
    try {
        const result = await elasticClient.search({
            index: 'users',
            body: {
                query: {
                    multi_match: {
                        query: query,
                        fields: ['username', 'email'],
                    
                    }
                }
            }
        });
        logger.info('search perfomed with query: ${query}');
        return result.hits.hits.map(hit => ({
            ...hit._source,
            score: hit._score,
        }));
    } catch (error) {
        logger.error(`Error: ${error.message}`);
        throw new Error(error.message);
    }
};

module.exports = {
    registerUser,
    loginUser,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    searchUsers,
}