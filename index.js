require('dotenv').config();
const axios = require('axios');
const moment = require('moment');
const express = require('express');
const crypto = require('crypto');
const app = express();

// Configuration
const ZOOM_API_KEY = process.env.ZOOM_API_KEY;
const ZOOM_API_SECRET = process.env.ZOOM_API_SECRET;
const ZOOM_ACCOUNT_ID = process.env.ZOOM_ACCOUNT_ID;
const ZOOM_WEBHOOK_SECRET = process.env.ZOOM_WEBHOOK_SECRET;
const ZOOM_VERIFICATION_TOKEN = process.env.ZOOM_VERIFICATION_TOKEN;
const ZOOM_API_URL = 'https://api.zoom.us/v2';
const GHL_API_KEY = process.env.GHL_API_KEY;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;
const GHL_API_URL = 'https://rest.gohighlevel.com/v1';

// Express middleware
app.use(express.json());

// Function to verify Zoom webhook signature
function verifyWebhookSignature(payload, signature, timestamp) {
    const message = `v0:${timestamp}:${JSON.stringify(payload)}`;
    const hash = crypto
        .createHmac('sha256', ZOOM_WEBHOOK_SECRET)
        .update(message)
        .digest('hex');
    return `v0=${hash}` === signature;
}

// Function to get Zoom access token
async function getZoomAccessToken() {
    try {
        const response = await axios.post('https://zoom.us/oauth/token', null, {
            params: {
                grant_type: 'account_credentials',
                account_id: ZOOM_ACCOUNT_ID
            },
            headers: {
                'Authorization': `Basic ${Buffer.from(`${ZOOM_API_KEY}:${ZOOM_API_SECRET}`).toString('base64')}`
            }
        });
        return response.data.access_token;
    } catch (error) {
        console.error('Error getting Zoom access token:', error.message);
        throw error;
    }
}

// Function to get webinar participants
async function getWebinarParticipants(webinarId) {
    try {
        const accessToken = await getZoomAccessToken();
        const response = await axios.get(`${ZOOM_API_URL}/report/webinars/${webinarId}/participants`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        // Process the participants data
        const attendanceData = response.data.participants.map(participant => ({
            email: participant.user_email,
            duration: Math.floor(participant.duration / 60) // Convert seconds to minutes
        }));

        return attendanceData;
    } catch (error) {
        console.error('Error getting webinar participants:', error.message);
        throw error;
    }
}

// Function to process webinar attendance data
async function processWebinarAttendance(attendanceData) {
    // Group attendance by email and sum durations
    const attendanceMap = new Map();
    
    attendanceData.forEach(entry => {
        const { email, duration } = entry;
        const currentDuration = attendanceMap.get(email) || 0;
        attendanceMap.set(email, currentDuration + duration);
    });

    // Filter attendees who watched for 30 minutes or more
    const qualifiedAttendees = Array.from(attendanceMap.entries())
        .filter(([_, totalDuration]) => totalDuration >= 30)
        .map(([email, _]) => email);

    return qualifiedAttendees;
}

// Function to add contacts to GHL with tag
async function addContactsToGHL(emails) {
    const currentDate = moment().format('YYYY-MM-DD');
    const tag = `webinar-gift-${currentDate}`;

    try {
        // First, ensure the tag exists
        await axios.post(
            `${GHL_API_URL}/tags/`,
            { name: tag },
            {
                headers: {
                    'Authorization': `Bearer ${GHL_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        // Add contacts with the tag
        for (const email of emails) {
            await axios.post(
                `${GHL_API_URL}/contacts/`,
                {
                    email,
                    tags: [tag],
                    locationId: GHL_LOCATION_ID
                },
                {
                    headers: {
                        'Authorization': `Bearer ${GHL_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
        }

        console.log(`Successfully added ${emails.length} contacts to GHL with tag: ${tag}`);
    } catch (error) {
        console.error('Error adding contacts to GHL:', error.message);
        throw error;
    }
}

// Health check endpoint
app.get('/', (req, res) => {
    res.send('Webhook service is running');
});

// Webhook endpoint for Zoom events
app.post('/webhook/zoom', async (req, res) => {
    try {
        // Verify webhook signature
        const signature = req.headers['x-zoom-signature'];
        const timestamp = req.headers['x-zoom-timestamp'];
        
        if (!verifyWebhookSignature(req.body, signature, timestamp)) {
            console.error('Invalid webhook signature');
            return res.status(401).send('Invalid signature');
        }

        const { event, payload } = req.body;

        // Handle webhook verification
        if (event === 'endpoint.url_validation') {
            const plainToken = payload.plainToken;
            const encryptedToken = crypto
                .createHmac('sha256', ZOOM_WEBHOOK_SECRET)
                .update(plainToken)
                .digest('hex');
            
            return res.json({
                plainToken,
                encryptedToken
            });
        }

        // Check if this is a webinar ended event
        if (event === 'webinar.ended') {
            const webinarId = payload.object.id;
            console.log(`Webinar ${webinarId} has ended. Processing attendance...`);

            // Get participants data
            const attendanceData = await getWebinarParticipants(webinarId);
            
            // Process attendance and add to GHL
            const qualifiedAttendees = await processWebinarAttendance(attendanceData);
            await addContactsToGHL(qualifiedAttendees);
            
            console.log(`Successfully processed ${qualifiedAttendees.length} qualified attendees`);
        }

        res.status(200).send('Webhook processed successfully');
    } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).send('Error processing webhook');
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Export functions for testing
module.exports = {
    processWebinarAttendance,
    addContactsToGHL,
    getWebinarParticipants
}; 