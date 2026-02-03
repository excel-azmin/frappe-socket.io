/**
 * Socket.IO Test Subscriber
 * Run this file to listen for Frappe realtime events.
 *
 * Usage: node app.js
 * Required: npm install socket.io-client
 */

const { io } = require('socket.io-client');

// Configuration
const BASE_URL = process.env.SOCKET_URL || 'https://arcpos.aninda.me';
const SITE_NAME = process.env.SITE_NAME || 'arcpos.aninda.me';
const BEARER_TOKEN = process.env.BEARER_TOKEN || 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjoiYXptaW5AZXhjZWxiZC5jb20iLCJleHAiOjE3NzAxMjk4MDgsImlhdCI6MTc3MDEyNjIwOCwidHlwZSI6ImFjY2VzcyJ9.8lnvrW5aVLRACT0yo9VN-1jgQbrZABid-9UcEh9GpM8';
const USER_EMAIL = process.env.USER_EMAIL || 'azmin@excelbd.com';

const NAMESPACE = `/${SITE_NAME}`;

console.log('='.repeat(60));
console.log('Socket.IO Test Subscriber - Frappe Events');
console.log('='.repeat(60));
console.log(`URL: ${BASE_URL}`);
console.log(`Namespace: ${NAMESPACE}`);
console.log(`User: ${USER_EMAIL}`);
console.log('='.repeat(60));
console.log();

let eventCount = 0;

function logEvent(eventName, data) {
    eventCount++;
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    console.log();
    console.log(`[${timestamp}] EVENT #${eventCount}: ${eventName}`);
    console.log('-'.repeat(50));
    if (typeof data === 'object' && data !== null) {
        for (const [key, value] of Object.entries(data)) {
            console.log(`  ${key}: ${JSON.stringify(value)}`);
        }
    } else {
        console.log(`  Data: ${data}`);
    }
    console.log('-'.repeat(50));
}

// Create socket connection
const socket = io(`${BASE_URL}${NAMESPACE}`, {
    path: '/socket.io',
    transports: ['polling', 'websocket'],
    extraHeaders: {
        'Authorization': `Bearer ${BEARER_TOKEN}`,
        'X-Frappe-Site-Name': SITE_NAME,
        'Origin': BASE_URL,
    },
    reconnection: true,
    timeout: 10000,
});

// Connection events
socket.on('connect', () => {
    console.log();
    console.log('[CONNECTED] Socket connected successfully!');
    console.log(`Session ID: ${socket.id}`);
    console.log();

    // Join user-specific room
    const userRoom = `${SITE_NAME}:user:${USER_EMAIL}`;
    console.log(`Joining room: ${userRoom}`);
    socket.emit('room:join', userRoom);

    // Join doctype rooms to receive list_update events
    const doctypesToWatch = ['Sales Invoice', 'POS Invoice', 'ToDo'];
    for (const doctype of doctypesToWatch) {
        const doctypeRoom = `${SITE_NAME}:doctype:${doctype}`;
        console.log(`Joining room: ${doctypeRoom}`);
        socket.emit('room:join', doctypeRoom);
    }

    console.log();
    console.log('Waiting for Frappe events...');
    console.log('Press Ctrl+C to disconnect');
    console.log();
});

socket.on('connect_error', (error) => {
    console.log(`[ERROR] Connection failed: ${error.message}`);
});

socket.on('disconnect', (reason) => {
    console.log(`[DISCONNECTED] Reason: ${reason}, Total events received: ${eventCount}`);
});

// Room confirmations
socket.on('room:joined', (data) => {
    console.log(`[ROOM] Joined: ${data}`);
});

socket.on('room:left', (data) => {
    console.log(`[ROOM] Left: ${data}`);
});

// Frappe document events
socket.on('doc_update', (data) => logEvent('doc_update', data));
socket.on('list_update', (data) => logEvent('list_update', data));

// Notification events
socket.on('new_notification', (data) => logEvent('new_notification', data));
socket.on('notification', (data) => logEvent('notification', data));

// Message events
socket.on('msgprint', (data) => logEvent('msgprint', data));
socket.on('eval_js', (data) => logEvent('eval_js', data));
socket.on('progress', (data) => logEvent('progress', data));
socket.on('pong', (data) => logEvent('pong', data));

// Catch-all for any other event (socket.io v4+)
socket.onAny((eventName, data) => {
    const knownEvents = [
        'connect', 'disconnect', 'connect_error',
        'room:joined', 'room:left',
        'doc_update', 'list_update',
        'new_notification', 'notification',
        'msgprint', 'eval_js', 'progress', 'pong'
    ];
    if (!knownEvents.includes(eventName)) {
        logEvent(`OTHER:${eventName}`, data);
    }
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\nInterrupted by user');
    socket.disconnect();
    process.exit(0);
});

console.log(`Connecting to ${BASE_URL} namespace ${NAMESPACE}...`);
console.log();
