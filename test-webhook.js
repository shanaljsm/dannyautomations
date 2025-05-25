require('dotenv').config();
const crypto = require('crypto');
const axios = require('axios');

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'YWVdUTYxRuS22FUARuUjug';
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://dannyautomations.onrender.com/webhook/zoom';

// Create test payload
const payload = {
    event: 'webinar.ended',
    payload: {
        account_id: '123456789',
        object: {
            id: '88909202515',
            uuid: 'test-uuid',
            host_id: 'test-host-id',
            topic: 'Test Webinar',
            type: 5,
            start_time: '2025-05-25T22:42:02.902Z',
            duration: 60,
            timezone: 'UTC',
            created_at: '2025-05-25T22:42:02.902Z',
            join_url: 'https://us02web.zoom.us/j/88909202515'
        },
        participants: [
            {
                id: 'test-participant-1',
                user_id: 'test-user-1',
                name: 'Test User One',
                user_email: 'test.attendee.1@example.com',
                join_time: '2025-05-25T22:42:02.902Z',
                leave_time: '2025-05-25T23:42:02.902Z',
                duration: 60
            },
            {
                id: 'test-participant-2',
                user_id: 'test-user-2',
                name: 'Test User Two',
                user_email: 'test.attendee.2@example.com',
                join_time: '2025-05-25T22:42:02.902Z',
                leave_time: '2025-05-25T23:42:02.902Z',
                duration: 60
            },
            {
                id: 'test-participant-3',
                user_id: 'test-user-3',
                name: 'Test User Three',
                user_email: 'test.attendee.3@example.com',
                join_time: '2025-05-25T22:42:02.902Z',
                leave_time: '2025-05-25T23:42:02.902Z',
                duration: 60
            },
            {
                id: 'test-participant-4',
                user_id: 'test-user-4',
                name: 'Test User Four',
                user_email: 'test.attendee.4@example.com',
                join_time: '2025-05-25T22:42:02.902Z',
                leave_time: '2025-05-25T23:42:02.902Z',
                duration: 60
            },
            {
                id: 'test-participant-5',
                user_id: 'test-user-5',
                name: 'Test User Five',
                user_email: 'test.attendee.5@example.com',
                join_time: '2025-05-25T22:42:02.902Z',
                leave_time: '2025-05-25T23:42:02.902Z',
                duration: 60
            },
            {
                id: 'test-participant-6',
                user_id: 'test-user-6',
                name: 'Test User Six',
                user_email: 'test.attendee.6@example.com',
                join_time: '2025-05-25T22:42:02.902Z',
                leave_time: '2025-05-25T23:42:02.902Z',
                duration: 60
            },
            {
                id: 'test-participant-7',
                user_id: 'test-user-7',
                name: 'Test User Seven',
                user_email: 'test.attendee.7@example.com',
                join_time: '2025-05-25T22:42:02.902Z',
                leave_time: '2025-05-25T23:42:02.902Z',
                duration: 60
            },
            {
                id: 'test-participant-8',
                user_id: 'test-user-8',
                name: 'Test User Eight',
                user_email: 'test.attendee.8@example.com',
                join_time: '2025-05-25T22:42:02.902Z',
                leave_time: '2025-05-25T23:42:02.902Z',
                duration: 60
            },
            {
                id: 'test-participant-9',
                user_id: 'test-user-9',
                name: 'Test User Nine',
                user_email: 'test.attendee.9@example.com',
                join_time: '2025-05-25T22:42:02.902Z',
                leave_time: '2025-05-25T23:42:02.902Z',
                duration: 60
            },
            {
                id: 'test-participant-10',
                user_id: 'test-user-10',
                name: 'Test User Ten',
                user_email: 'test.attendee.10@example.com',
                join_time: '2025-05-25T22:42:02.902Z',
                leave_time: '2025-05-25T23:42:02.902Z',
                duration: 60
            }
        ]
    }
};

// Create signature
const timestamp = Date.now();
const message = `v0:${timestamp}:${JSON.stringify(payload)}`;
const signature = `v0=${crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(message)
    .digest('hex')}`;

// Send webhook
async function sendTestWebhook() {
    try {
        console.log('Sending test webhook with payload:', JSON.stringify(payload, null, 2));
        console.log('Message:', message);
        console.log('Signature:', signature);
        console.log('Timestamp:', timestamp);

        const response = await axios.post(WEBHOOK_URL, payload, {
            headers: {
                'Content-Type': 'application/json',
                'x-zoom-signature': signature,
                'x-zoom-timestamp': timestamp
            }
        });

        console.log('Test webhook sent successfully!');
        console.log('Response:', response.data);
    } catch (error) {
        console.error('Error sending test webhook:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response headers:', error.response.headers);
            console.error('Response data:', error.response.data);
        }
    }
}

sendTestWebhook(); 