/**
 * Agent Messaging System
 * Integrates with existing WebSocket infrastructure to provide real-time updates
 */

import WebSocket from 'ws';
import { spawn } from 'child_process';

export class AgentMessaging {
    constructor(agentId) {
        this.agentId = agentId;
        this.ws = null;
        this.serverUrl = 'ws://localhost:8080';
        this.connected = false;
        this.messageQueue = [];
        this.heartbeatInterval = null;
    }

    /**
     * Initialize messaging connection
     */
    async initialize() {
        try {
            await this.connectToServer();
            await this.registerAgent();
            this.startHeartbeat();
            this.log('Messaging initialized');
        } catch (error) {
            this.log(`Failed to initialize messaging: ${error.message}`);
            // Continue without messaging - don't block agent work
        }
    }

    /**
     * Connect to Decision Tapestry server
     */
    async connectToServer() {
        return new Promise((resolve, reject) => {
            try {
                this.ws = new WebSocket(this.serverUrl);
                
                this.ws.on('open', () => {
                    this.connected = true;
                    this.log('Connected to server');
                    
                    // Send queued messages
                    this.processMessageQueue();
                    
                    resolve();
                });
                
                this.ws.on('close', () => {
                    this.connected = false;
                    this.log('Connection closed');
                    
                    // Attempt to reconnect
                    setTimeout(() => this.reconnect(), 5000);
                });
                
                this.ws.on('error', (error) => {
                    this.connected = false;
                    this.log(`WebSocket error: ${error.message}`);
                    reject(error);
                });
                
                this.ws.on('message', (data) => {
                    try {
                        const message = JSON.parse(data);
                        this.handleMessage(message);
                    } catch (error) {
                        this.log(`Failed to parse message: ${error.message}`);
                    }
                });
                
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Reconnect to server
     */
    async reconnect() {
        if (this.connected) return;
        
        try {
            await this.connectToServer();
            await this.registerAgent();
        } catch (error) {
            this.log(`Reconnection failed: ${error.message}`);
            // Try again in 10 seconds
            setTimeout(() => this.reconnect(), 10000);
        }
    }

    /**
     * Register agent with server
     */
    async registerAgent() {
        const message = {
            type: 'agent_register',
            agentId: this.agentId,
            timestamp: new Date().toISOString()
        };
        
        await this.sendMessage(message);
    }

    /**
     * Start heartbeat to keep connection alive
     */
    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            if (this.connected) {
                this.sendMessage({
                    type: 'agent_heartbeat',
                    agentId: this.agentId,
                    timestamp: new Date().toISOString()
                });
            }
        }, 30000); // Every 30 seconds
    }

    /**
     * Broadcast agent status update
     */
    async broadcastStatus(statusData) {
        const message = {
            type: 'agent_status',
            agentId: this.agentId,
            ...statusData,
            timestamp: new Date().toISOString()
        };
        
        await this.sendMessage(message);
        
        // Also output to console for CLI users
        this.logStatus(statusData);
    }

    /**
     * Broadcast decision update
     */
    async broadcastDecisionUpdate(decisionData) {
        const message = {
            type: 'decision_update',
            agentId: this.agentId,
            ...decisionData,
            timestamp: new Date().toISOString()
        };
        
        await this.sendMessage(message);
    }

    /**
     * Broadcast task completion
     */
    async broadcastTaskCompletion(taskData) {
        const message = {
            type: 'task_completion',
            agentId: this.agentId,
            ...taskData,
            timestamp: new Date().toISOString()
        };
        
        await this.sendMessage(message);
    }

    /**
     * Broadcast error
     */
    async broadcastError(errorData) {
        const message = {
            type: 'agent_error',
            agentId: this.agentId,
            ...errorData,
            timestamp: new Date().toISOString()
        };
        
        await this.sendMessage(message);
    }

    /**
     * Send message to server
     */
    async sendMessage(message) {
        if (!this.connected || !this.ws) {
            // Queue message for later
            this.messageQueue.push(message);
            return;
        }
        
        try {
            this.ws.send(JSON.stringify(message));
        } catch (error) {
            this.log(`Failed to send message: ${error.message}`);
            // Queue message for retry
            this.messageQueue.push(message);
        }
    }

    /**
     * Process queued messages
     */
    processMessageQueue() {
        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            this.sendMessage(message);
        }
    }

    /**
     * Handle incoming messages
     */
    handleMessage(message) {
        switch (message.type) {
            case 'agent_command':
                this.handleAgentCommand(message);
                break;
            case 'coordinator_update':
                this.handleCoordinatorUpdate(message);
                break;
            case 'server_notification':
                this.handleServerNotification(message);
                break;
            default:
                this.log(`Unknown message type: ${message.type}`);
        }
    }

    /**
     * Handle agent command from coordinator
     */
    handleAgentCommand(message) {
        this.log(`Received command: ${message.command}`);
        
        // Commands could include: pause, resume, stop, update_priority, etc.
        switch (message.command) {
            case 'pause':
                this.log('Agent paused by coordinator');
                break;
            case 'resume':
                this.log('Agent resumed by coordinator');
                break;
            case 'stop':
                this.log('Agent stopped by coordinator');
                process.exit(0);
                break;
            default:
                this.log(`Unknown command: ${message.command}`);
        }
    }

    /**
     * Handle coordinator update
     */
    handleCoordinatorUpdate(message) {
        this.log(`Coordinator update: ${message.message}`);
    }

    /**
     * Handle server notification
     */
    handleServerNotification(message) {
        this.log(`Server notification: ${message.message}`);
    }

    /**
     * Log status in CLI-friendly format
     */
    logStatus(statusData) {
        const timestamp = new Date().toLocaleTimeString();
        const prefix = `[${timestamp}] [Agent-${this.agentId}]`;
        
        console.log(`${prefix} ${statusData.message}`);
        
        if (statusData.currentTask) {
            console.log(`${prefix} Current Task: ${statusData.currentTask}`);
        }
        
        if (statusData.status) {
            console.log(`${prefix} Status: ${statusData.status}`);
        }
    }

    /**
     * Log message
     */
    log(message) {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[${timestamp}] [Agent-${this.agentId}] ${message}`);
    }

    /**
     * Cleanup messaging
     */
    cleanup() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        
        if (this.ws) {
            this.ws.close();
        }
        
        this.connected = false;
        this.log('Messaging cleanup completed');
    }

    /**
     * Get messaging status
     */
    getStatus() {
        return {
            connected: this.connected,
            serverUrl: this.serverUrl,
            queuedMessages: this.messageQueue.length,
            agentId: this.agentId
        };
    }
}