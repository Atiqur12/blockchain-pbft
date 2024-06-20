const EventEmitter = require('events');
const Block = require('./block');

class PBFT extends EventEmitter {
    constructor(blockchain) {
        super();
        this.blockchain = blockchain;
        this.state = 'pre-prepare';
        this.view = 0;
        this.sequenceNumber = 0;
        this.messageLog = [];
        this.commitMessages = [];
    }

    prePrepare(transaction) {
        const message = {
            type: 'pre-prepare',
            view: this.view,
            sequenceNumber: this.sequenceNumber,
            transaction
        };
        this.messageLog.push(message);
        this.state = 'prepare';
        this.emit('message', message);
    }

    prepare(message) {
        if (this.state !== 'prepare') return;

        const prepareMessage = {
            type: 'prepare',
            view: message.view,
            sequenceNumber: message.sequenceNumber,
            transaction: message.transaction
        };
        this.messageLog.push(prepareMessage);

        const prepareCount = this.messageLog.filter(msg => msg.type === 'prepare').length;

        if (prepareCount >= 2 * this.blockchain.getNodes().length / 3) {
            this.state = 'commit';
            this.emit('message', prepareMessage);
        }
    }

    commit(message) {
        if (this.state !== 'commit') return;

        const commitMessage = {
            type: 'commit',
            view: message.view,
            sequenceNumber: message.sequenceNumber,
            transaction: message.transaction
        };
        this.commitMessages.push(commitMessage);

        const commitCount = this.commitMessages.filter(msg => msg.type === 'commit').length;

        if (commitCount >= 2 * this.blockchain.getNodes().length / 3) {
            this.blockchain.addBlock(new Block(
                this.sequenceNumber,
                new Date().toISOString(),
                message.transaction,
                this.blockchain.getLatestBlock().hash
            ));
            this.state = 'pre-prepare';
            this.sequenceNumber++;
            this.commitMessages = [];
        }
    }
}

module.exports = PBFT;