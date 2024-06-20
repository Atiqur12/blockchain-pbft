const Blockchain = require('./blockchain');
const PBFT = require('./pbft');

async function main() {
    const myBlockchain = new Blockchain();
    await myBlockchain.init(); // Initialize blockchain and connect to MongoDB

    const pbft = new PBFT(myBlockchain);

    pbft.on('message', (message) => {
        if (message.type === 'pre-prepare') {
            pbft.prepare(message);
        } else if (message.type === 'prepare') {
            pbft.commit(message);
        }
    });

    // Example usage - initiating transaction
    const transaction = { from: 'Alice', to: 'Bob', amount: 10 };
    pbft.prePrepare(transaction);

    setTimeout(() => {
        // Log specific properties or values from myBlockchain
        console.log('Latest Block:', myBlockchain.getLatestBlock());
        console.log('Chain length:', myBlockchain.chain.length);
        myBlockchain.client.close(); // Close MongoDB connection when done
    }, 1000);
}

main();
