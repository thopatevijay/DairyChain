# DairyChain – Blockchain-Enabled Dairy Supply Chain Simulation

## Overview

**DairyChain** is a simulation-based proof-of-concept that models an end-to-end dairy supply chain using a 3D simulation built using babylon.js. In our MVP, multiple autonomous AI agents (Milk Collector, Milk Inspector, Milk Processor, Production Manager, Production Dispatcher, Distributor, and Retailer) operate independently, interact with one another, and manage the supply chain through on-chain interactions via Ethereum smart contracts. Each agent is assigned a unique wallet, and tokenized rewards (ERC20-based) are automatically issued when tasks are successfully completed.

## Core Idea

The project demonstrates that autonomous agents in a complex supply chain can record events and receive on-chain incentives—without any human intervention—using blockchain-based tokenization and role-based access control. Although full DAO-based governance is planned for future releases, the current MVP focuses on secure token rewards.

## Objectives

-   **Simulate a Dairy Supply Chain:**  
    Model the journey of dairy products from collection at the farm through inspection, processing, production, dispatch, distribution, and retail.
-   **Blockchain Integration:**  
    Deploy smart contracts on Ethereum to log events and manage tokenized rewards.
-   **Tokenized Incentives:**  
    Assign each agent its own wallet and distribute rewards for operational performance (e.g., quality checks, efficient handling).
-   **Role & Access Management:**  
    Enforce that only authorized agents can update on-chain data via smart contract modifiers.

## Technologies Used

-   **Simulation Platform:**
    -   **babylon.js:**  
        A javascript library and 3D engine for displaying real time 3D graphics in a web browser via HTML5.
  
-   **Blockchain Platform:**
    -   **Ethereum (Testnet/Mainnet):**  
        Smart contracts deployed on Ethereum or a compatible L2 solution.
    -   **Solidity & ERC20 Token Standard:**  
        For writing smart contracts and implementing tokenized rewards.
-   **Smart Contract & Integration Tools:**
    -   **Viem**  
        For connecting the simulation with Ethereum.
    -   **Langchain:**  
        For autonomous agent interactions.
-   **Development Environment:**
    -   **Next.js (with the new `/src/app` structure):**  
        For the front-end and API routes.

## System Architecture and Flow

### Overall Architecture

-   **Digital Simulation Layer:**  
    The babylon.js simulation creates a 3D environment where autonomous agents represent the various roles in the dairy supply chain.
    
-   **Blockchain Layer:**  
    Ethereum smart contracts log supply chain events and issue tokenized rewards. Each agent’s unique wallet is tied to its on-chain identity, ensuring secure and transparent interactions.
    

### Data Flow

1.  **Event Generation:**  
    Agents in the simulation (e.g., the Milk Collector) perform tasks (e.g., collecting milk) and generate events.
2.  **Blockchain Interaction:**  
    Upon task completion, agents invoke corresponding smart contract functions (e.g., `collectMilk`, `createBatch`, etc.), which log events with timestamps, quality data, and agent IDs.
3.  **Reward Distribution:**  
    If tasks completed by Agent, the contract mints tokens to the agent’s wallet as an incentive.
4.  **Inter-Agent Communication:**  
    Agents communicate indirectly via on-chain events and via an event bus in the simulation, triggering the next steps in the supply chain workflow.

## Implementation Details

### Smart Contract Design

-   **Data Structures:**  
    Uses modular structs (e.g., `MilkQuality`, `FarmerMilkCollection`, `InspectionData`, etc.) and a unified `Batch` struct to record the full journey of a milk batch.
-   **Key Functions:**  
    Functions for each supply chain stage (collection, inspection, processing, production, dispatch, distribution, retailer confirmation) that update batch status and issue token rewards.
-   **Access Control:**  
    Role-specific modifiers ensure only authorized agents can update the chain.

### Tokenization

-   **ERC20 Integration:**  
    The DairyChain contract inherits from OpenZeppelin’s ERC20 to mint token rewards (set as a fixed reward amount per action).

### Simulation Logic in

-   **Agent Behavior:**  
    Each agent (implemented as a Babylon.js GameObject) performs its task based on dummy data and publishes events that trigger subsequent actions.
-   **Interactivity:**  
    The CollectionPoint and ProcessingPlant components update the scene with real-time data and interact with the blockchain interface.


## Installation and Usage

### Installation

1.  **Clone the repository:**
   
  
    `git clone https://github.com/your-username/dairychain.git
    cd dairychain` 
    
2.  **Install dependencies:**
 
    
    `npm install` 
    
3.  **Run the development server:**
    
    
    `npm run dev` 
    
4.  **Open your browser and navigate to:**
    

    `http://localhost:3000` 
    

### Using the Simulation

-   **Collection Point:**  
    In the simulation, click on each farmer box (or collection tank) to simulate milk collection. This triggers the Milk Collector agent to record the event and eventually create a milk batch.

## Future Enhancements

-   **DAO Governance:**  
    Implement decentralized decision-making where agents (or stakeholders) vote on operational parameters.
    
-   **Extended Simulation:**  
    Integrate more detailed models and potentially IoT sensor data to improve realism.