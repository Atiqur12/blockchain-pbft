const { MongoClient } = require('mongodb');
const Block = require('./block');

class Blockchain {
    constructor() {
        this.nodes = [];
        this.client = new MongoClient('mongodb+srv://atiqur:grECWRcGNkPvlAJJ@blockchainpbf.dnodfy4.mongodb.net/', { useNewUrlParser: true, useUnifiedTopology: true });
        this.chain = [];
        this.init();
    }

    async init() {
        try {
            await this.client.connect();
            console.log('Connected to MongoDB');
            this.db = this.client.db('blockchain'); // Replace with your database name
            this.blocksCollection = this.db.collection('blocks');
            await this.initDB();
        } catch (err) {
            console.error('Error connecting to MongoDB', err);
        }
    }

    async initDB() {
        const count = await this.blocksCollection.countDocuments({});
        if (count === 0) {
            await this.createGenesisBlock();
        } else {
            await this.loadChainFromDB();
        }
    }

    async createGenesisBlock() {
        const genesisBlock = new Block(0, '01/01/2021', 'Genesis Block', '0');
        await this.blocksCollection.insertOne({
            index: genesisBlock.index,
            timestamp: genesisBlock.timestamp,
            transactions: genesisBlock.transactions,
            previousHash: genesisBlock.previousHash,
            hash: genesisBlock.hash
        });
        this.chain.push(genesisBlock);
        console.log('Genesis block created:', genesisBlock);
    }

    async loadChainFromDB() {
        try {
            const cursor = this.blocksCollection.find().sort({ index: 1 });
            await cursor.forEach(block => {
                let transactions;
                if (block.index === 0) {
                    transactions = block.transactions; // Genesis block may not have transactions as JSON
                } else {
                    transactions = JSON.parse(block.transactions); // Parse transactions from JSON string
                }
                this.chain.push(new Block(block.index, block.timestamp, transactions, block.previousHash, block.hash));
            });
            console.log('Loaded blockchain from MongoDB:', this.chain);
        } catch (err) {
            console.error('Error loading blockchain from MongoDB', err);
        }
    }

    async saveBlockToDB(newBlock) {
        try {
            await this.blocksCollection.insertOne({
                index: newBlock.index,
                timestamp: newBlock.timestamp,
                transactions: JSON.stringify(newBlock.transactions), // Convert transactions to JSON string
                previousHash: newBlock.previousHash,
                hash: newBlock.hash
            });
            console.log('Block saved to MongoDB:', newBlock);
        } catch (err) {
            console.error('Error saving block to MongoDB', err);
        }
    }

    async addBlock(newBlock) {
        newBlock.previousHash = this.getLatestBlock().hash;
        newBlock.hash = newBlock.calculateHash();
        await this.saveBlockToDB(newBlock);
        this.chain.push(newBlock);
    }

    addNode(node) {
        this.nodes.push(node);
    }

    getNodes() {
        return this.nodes;
    }

    getLatestBlock() {
        if (this.chain.length > 0) {
            return this.chain[this.chain.length - 1];
        } else {
            return null; // Handle this case according to your application's logic
        }
    }

    isChainValid() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            if (currentBlock.hash !== currentBlock.calculateHash()) {
                return false;
            }

            if (currentBlock.previousHash !== previousBlock.hash) {
                return false;
            }
        }
        return true;
    }
}

module.exports = Blockchain;
