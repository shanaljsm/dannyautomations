const axios = require('axios');
const crypto = require('crypto');

// Configuration
const ZOOM_WEBHOOK_SECRET = 'YWVdUTYxRuS22FUARuUjug';
const WEBHOOK_URL = 'https://dannyautomations.onrender.com/webhook/zoom';

// Create validation payload
const plainToken = 'test_token_' + Date.now();
const payload = {
    event: 'endpoint.url_validation',
    payload: {
        plainToken: plainToken
    }
};

// Send validation request
async function testValidation() {
    try {
        const response = await axios.post(WEBHOOK_URL, payload, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        console.log('Validation request sent successfully!');
        console.log('Response:', response.data);
        
        // Verify the response
        const expectedHash = crypto
            .createHmac('sha256', ZOOM_WEBHOOK_SECRET)
            .update(plainToken)
            .digest('hex');
            
        if (response.data.encryptedToken === expectedHash) {
            console.log('✅ Validation successful! The encrypted token matches.');
        } else {
            console.log('❌ Validation failed! The encrypted token does not match.');
            console.log('Expected:', expectedHash);
            console.log('Received:', response.data.encryptedToken);
        }
    } catch (error) {
        console.error('Error sending validation request:', error.response?.data || error.message);
    }
}

testValidation(); 