require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://shanal:A6EEBm2otHk07mjb@cluster0.dlzt6nn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const DB_NAME = 'dannyautomation';
const TOKENS_COLLECTION = 'tokens';

async function testConnection() {
    const client = new MongoClient(MONGODB_URI);
    
    try {
        console.log('Attempting to connect to MongoDB...');
        await client.connect();
        console.log('Successfully connected to MongoDB!');
        
        const db = client.db(DB_NAME);
        const collection = db.collection(TOKENS_COLLECTION);
        
        // Test writing to the database
        console.log('Testing write operation...');
        await collection.updateOne(
            { type: 'test' },
            { $set: { test: 'connection', timestamp: new Date() } },
            { upsert: true }
        );
        console.log('Successfully wrote test data to database');
        
        // Test reading from the database
        console.log('Testing read operation...');
        const result = await collection.findOne({ type: 'test' });
        console.log('Successfully read test data:', result);
        
    } catch (error) {
        console.error('Error testing MongoDB connection:', error);
    } finally {
        await client.close();
        console.log('MongoDB connection closed');
    }
}

testConnection(); 