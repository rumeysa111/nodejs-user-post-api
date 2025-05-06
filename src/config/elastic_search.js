const Client = require('@elastic/elasticsearch').Client;
const logger = require('../utils/logger'); //logger dosyasını içe aktar

const elasticClient = new Client({
    node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
    maxRetries: 5,
    requestTimeout: 60000,
    sniffOnStart: true,
});

const initializeElasticSearch = async () => {
    try {
        await elasticClient.indices.create({
            index: "posts",
            body: {
                mappings: {
                    properties: {
                        title: { type: 'text' },
                        content: { type: 'text' },
                        tags: { type: 'keyword' },
                        userId: { type: 'keyword' },
                        createdAt: { type: 'date' }
                    }
                }
            }
        }, { ignore: [400] }); // Ignore 400 error if index already exists

        // Users index initialization
        await elasticClient.indices.create({
            index: "users",
            body: {
                mappings: {
                    properties: {
                        username: { type: 'text' },
                        email: { type: 'keyword' },
                        role: { type: 'keyword' },
                        createdAt: { type: 'date' },
                        updatedAt: { type: 'date' }
                    }
                }
            }
        }, { ignore: [400] });
        logger.info('Elasticsearch index created successfully');


    }
    catch (error) {
        logger.error('Error creating Elasticsearch index:', error);

    }
};

const checkIndices = async () => {
    try {
        const postExists = await elasticClient.indices.exists({ index: 'posts' });
        const userExists = await elasticClient.indices.exists({ index: 'users' });
        logger.info(`Elasticsearch indices status - Posts: ${postsExists}, Users: ${usersExists}`);
        return { postExists, userExists };
    } catch (error) {
        logger.error('Error checking Elasticsearch indices:', error);
        throw error;
        
    }
};
module.exports = {
    elasticClient,
    initializeElasticSearch,
    checkIndices
};