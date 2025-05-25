require('dotenv').config();
const axios = require('axios');
const moment = require('moment');
const express = require('express');
const crypto = require('crypto');
const qs = require('querystring');
const app = express();
app.use(express.json());

// Configuration
const ZOOM_API_KEY = process.env.ZOOM_API_KEY;
const ZOOM_API_SECRET = process.env.ZOOM_API_SECRET;
const ZOOM_ACCOUNT_ID = process.env.ZOOM_ACCOUNT_ID;
const ZOOM_WEBHOOK_SECRET = process.env.ZOOM_WEBHOOK_SECRET;
const ZOOM_VERIFICATION_TOKEN = process.env.ZOOM_VERIFICATION_TOKEN;
const ZOOM_API_URL = 'https://api.zoom.us/v2';

// GHL Configuration
const GHL_CLIENT_ID = process.env.GHL_CLIENT_ID;
const GHL_CLIENT_SECRET = process.env.GHL_CLIENT_SECRET;
const GHL_REFRESH_TOKEN = process.env.GHL_REFRESH_TOKEN;
const GHL_COMPANY_ID = process.env.GHL_COMPANY_ID;
const GHL_API_URL = 'https://services.leadconnectorhq.com';

// GHL Token Management
let ghlAccessToken = null;
let ghlTokenExpiry = null;

async function refreshGHLToken() {
    try {
        const response = await axios.post(
            'https://services.leadconnectorhq.com/oauth/token',
            qs.stringify({
                client_id: GHL_CLIENT_ID,
                client_secret: GHL_CLIENT_SECRET,
                refresh_token: GHL_REFRESH_TOKEN,
                grant_type: 'refresh_token'
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        // Update the refresh token in memory
        GHL_REFRESH_TOKEN = response.data.refresh_token;
        
        // Store the new refresh token in the environment
        process.env.GHL_REFRESH_TOKEN = response.data.refresh_token;

        ghlAccessToken = response.data.access_token;
        // Set token expiry to 19 hours (to refresh before the 20-hour limit)
        ghlTokenExpiry = Date.now() + (19 * 60 * 60 * 1000);
        
        console.log('Successfully refreshed GHL token');
        return ghlAccessToken;
    } catch (error) {
        console.error('Error refreshing GHL token:', error.message);
        throw error;
    }
}

async function getGHLToken() {
    if (!ghlAccessToken || Date.now() >= ghlTokenExpiry) {
        await refreshGHLToken();
    }
    return ghlAccessToken;
}

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
        const token = await getGHLToken();

        // Add contacts with the tag using upsert
        for (const email of emails) {
            await axios.post(
                `${GHL_API_URL}/contacts/upsert`,
                {
                    email,
                    tags: [tag],
                    companyId: GHL_COMPANY_ID
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
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

async function addContactToGHL(email, name, webinarDate) {
    try {
        const token = await getGHLToken();
        const tag = `Webinar Attendee ${webinarDate}`;

        // Use upsert to create or update contact
        const response = await axios.post(
            `${GHL_API_URL}/contacts/upsert`,
            {
                email,
                name,
                tags: [tag],
                companyId: GHL_COMPANY_ID
            },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log(`Contact ${email} added/updated in GHL with tag: ${tag}`);
        return response.data.id;
    } catch (error) {
        console.error('Error adding contact to GHL:', error.message);
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
        // Handle webhook verification
        if (req.body.event === 'endpoint.url_validation') {
            const plainToken = req.body.payload.plainToken;
            const encryptedToken = crypto
                .createHmac('sha256', ZOOM_WEBHOOK_SECRET)
                .update(plainToken)
                .digest('hex');
            
            return res.json({
                plainToken,
                encryptedToken
            });
        }

        // Verify webhook signature for other events
        const signature = req.headers['x-zoom-signature'];
        const timestamp = req.headers['x-zoom-timestamp'];
        
        if (!verifyWebhookSignature(req.body, signature, timestamp)) {
            console.error('Invalid webhook signature');
            return res.status(401).send('Invalid signature');
        }

        const { event, payload } = req.body;

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
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            response: error.response ? {
                status: error.response.status,
                data: error.response.data
            } : null
        });
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