# Blockchain-PBFT: A Practical Byzantine Fault Tolerant Investment Platform

A Node.js implementation of a blockchain-based investment platform using the Practical Byzantine Fault Tolerance (PBFT) consensus mechanism. This project serves as the reference implementation accompanying my doctoral research and peer-reviewed publications at Université Gustave Eiffel.

---

## Research Background

This implementation is the practical foundation of two peer-reviewed publications:

- **"Understanding Blockchain Technology and Its Application in the Emerging Fintech Industry"** — Springer Nature
- **"Design and Implementation of a Secure and Efficient Blockchain-Based Investment Platform with PBFT Consensus"** — Springer Nature

My research addresses a specific problem in regulated financial systems: existing blockchain consensus mechanisms, including Proof of Work and Proof of Stake, are poorly suited to the latency and determinism requirements of investment platforms operating under regulatory frameworks such as MiFID II. PBFT provides finality guarantees and deterministic consensus that these environments require, but its standard formulation assumes a static validator set — a constraint that does not hold in practice for fund management platforms where institutional participants join and leave dynamically.

This repository explores the core PBFT implementation and its adaptation for financial transaction contexts.

---

## Architecture

The system models a network of validator nodes that reach consensus on investment transactions (fund subscriptions, redemptions, transfers) using the three-phase PBFT protocol.

```
Client
  │
  ▼
Primary Node (Leader)
  │
  ├──[PRE-PREPARE]──► Replica Node 1
  ├──[PRE-PREPARE]──► Replica Node 2
  └──[PRE-PREPARE]──► Replica Node 3
           │
           ▼
      [PREPARE phase]
      Replicas broadcast prepare messages
           │
           ▼
      [COMMIT phase]
      Replicas broadcast commit messages
           │
           ▼
      [REPLY]──► Client
```

### Core Components

**`pbft.js`** — PBFT consensus engine implementing the three-phase protocol (pre-prepare, prepare, commit) with view-change support for primary failure recovery. Handles message validation, quorum calculation (2f+1 where f is the maximum number of faulty nodes), and state transitions.

**`block.js`** — Block structure for investment transactions. Each block contains a payload of financial transactions, a cryptographic hash of the previous block, a timestamp, and the sequence number used by PBFT for ordering.

**`blockchain.js`** — Chain management and validation. Maintains the ledger of committed blocks and enforces integrity constraints on the chain structure.

**`app.js`** — Node bootstrapping and P2P network setup. Each node instance runs an HTTP server for client interaction and a WebSocket server for inter-node PBFT message exchange.

---

## Why PBFT for Investment Platforms

The choice of PBFT over alternative consensus mechanisms is deliberate and research-driven:

| Property | PoW | PoS | PBFT |
|---|---|---|---|
| Finality | Probabilistic | Probabilistic | Deterministic |
| Latency | High (minutes) | Medium | Low (seconds) |
| Energy cost | Very high | Low | Low |
| Byzantine tolerance | Limited | Limited | Up to f < n/3 |
| Regulatory auditability | Poor | Poor | Strong |

For a regulated investment platform, deterministic finality is non-negotiable. A fund subscription that is "probably" confirmed is not legally valid under MiFID II. PBFT's guarantee that a committed transaction will never be reversed is the core property that makes it suitable for this domain.

The trade-off is scalability: PBFT's O(n²) message complexity limits practical validator set sizes to tens of nodes rather than thousands. For a permissioned investment platform with a known set of institutional validators, this is an acceptable constraint.

---

## Getting Started

### Prerequisites

- Node.js v16+
- npm

### Installation

```bash
git clone https://github.com/Atiqur12/blockchain-pbft.git
cd blockchain-pbft
npm install
```

### Running a Network

Start the primary node:

```bash
SECRET="NODE1" P2P_PORT=5001 HTTP_PORT=3001 node app
```

Start replica nodes:

```bash
SECRET="NODE2" P2P_PORT=5002 HTTP_PORT=3002 PEERS=ws://localhost:5001 node app
SECRET="NODE3" P2P_PORT=5003 HTTP_PORT=3003 PEERS=ws://localhost:5001,ws://localhost:5002 node app
SECRET="NODE4" P2P_PORT=5004 HTTP_PORT=3004 PEERS=ws://localhost:5001,ws://localhost:5002,ws://localhost:5003 node app
```

### Submitting a Transaction

```bash
curl -X POST http://localhost:3001/transact \
  -H "Content-Type: application/json" \
  -d '{
    "type": "FUND_SUBSCRIPTION",
    "investorId": "INV-001",
    "fundId": "FUND-EUR-001",
    "amount": 50000,
    "currency": "EUR"
  }'
```

### Viewing the Chain

```bash
curl http://localhost:3001/blockchain
```

---

## Fault Tolerance

With n nodes, the network tolerates up to f = ⌊(n-1)/3⌋ Byzantine (malicious or faulty) nodes:

| Total nodes (n) | Faulty nodes tolerated (f) | Quorum required |
|---|---|---|
| 4 | 1 | 3 |
| 7 | 2 | 5 |
| 10 | 3 | 7 |

A network of 4 nodes (1 primary + 3 replicas) is the minimum configuration for Byzantine fault tolerance and is the recommended starting point for local development.

---

## Research Extensions (In Progress)

The following extensions are being developed as part of ongoing doctoral research:

- **Dynamic validator set management** — allowing institutional participants to join and leave the validator network without full restart, addressing the static validator set limitation identified in the original Castro-Liskov paper
- **Regulatory audit trail** — append-only log of all PBFT message exchanges for compliance reporting
- **Performance benchmarking** — throughput and latency measurements under varying network sizes and fault scenarios

---

## Academic Context

This work is conducted within the DICEN-IDF laboratory at Université Gustave Eiffel under the supervision of Dr. Karim Fraoua and Professor David Amos. The research was presented at the DICEN seminar on "Data · Document · Mediation" at the Conservatoire National des Arts et Métiers (CNAM), Paris, February 2025.

---

## References

- Castro, M., & Liskov, B. (1999). *Practical Byzantine fault tolerance*. OSDI.
- Rehman, A. et al. *Understanding Blockchain Technology and Its Application in the Emerging Fintech Industry*. Springer Nature.
- Rehman, A. et al. *Design and Implementation of a Secure and Efficient Blockchain-Based Investment Platform with PBFT Consensus*. Springer Nature.

---

## Author

**Atiqur Rehman**
PhD Candidate, Sciences de l'information et de la communication
Université Gustave Eiffel | DICEN-IDF Laboratory

Senior Software Engineer, Alcatel Submarine Networks

---

## License

MIT
