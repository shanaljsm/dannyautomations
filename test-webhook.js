const axios = require('axios');
const crypto = require('crypto');

// Configuration
const ZOOM_WEBHOOK_SECRET = 'YWVdUTYxRuS22FUARuUjug';
const WEBHOOK_URL = 'https://dannyautomations.onrender.com/webhook/zoom';

// Use the real webinar ID provided by the user
const webinarId = '88909202515';

// Create test payload
const payload = {
    event: 'webinar.ended',
    payload: {
        account_id: '123456789', // This can be any string for test, not validated
        object: {
            id: webinarId,
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
                name: 'Test User 1',
                user_email: 'test1@example.com',
                join_time: '2025-05-25T22:42:02.902Z',
                leave_time: '2025-05-25T23:42:02.902Z',
                duration: 60
            },
            {
                id: 'test-participant-2',
                user_id: 'test-user-2',
                name: 'Test User 2',
                user_email: 'test2@example.com',
                join_time: '2025-05-25T22:42:02.902Z',
                leave_time: '2025-05-25T23:42:02.902Z',
                duration: 60
            }
        ]
    }
};

// Generate signature
const timestamp = Date.now().toString();
const message = `v0:${timestamp}:${JSON.stringify(payload)}`;
const hash = crypto
    .createHmac('sha256', ZOOM_WEBHOOK_SECRET)
    .update(message)
    .digest('hex');
const signature = `v0=${hash}`;

// Send test webhook
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
        console.error('Error sending test webhook:', error.response?.data || error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response headers:', error.response.headers);
            console.error('Response data:', error.response.data);
        }
    }
}

sendTestWebhook(); 