require('dotenv').config();
const axios = require('axios');
const moment = require('moment');
const express = require('express');
const crypto = require('crypto');
const qs = require('querystring');
const { MongoClient } = require('mongodb');
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
const GHL_REFRESH_TOKEN = process.env.GHL_REFRESH_TOKEN || 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRoQ2xhc3MiOiJDb21wYW55IiwiYXV0aENsYXNzSWQiOiJBYWx3ejQyblBIeld1c1NsZUxUOCIsInNvdXJjZSI6IklOVEVHUkFUSU9OIiwic291cmNlSWQiOiI2NzI4Zjc1OWJjOWY5ZjhhOTcyMzQ3YWEtbWI0OXM3cXQiLCJjaGFubmVsIjoiT0FVVEgiLCJwcmltYXJ5QXV0aENsYXNzSWQiOiJBYWx3ejQyblBIeld1c1NsZUxUOCIsIm9hdXRoTWV0YSI6eyJzY29wZXMiOlsic2Fhcy9jb21wYW55LnJlYWQiLCJzYWFzL2NvbXBhbnkud3JpdGUiLCJsb2NhdGlvbnMud3JpdGUiLCJsb2NhdGlvbnMucmVhZG9ubHkiLCJidXNpbmVzc2VzLndyaXRlIiwiYnVzaW5lc3Nlcy5yZWFkb25seSIsImNvbXBhbmllcy5yZWFkb25seSIsImNhbGVuZGFycy5yZWFkb25seSIsImNhbGVuZGFycy53cml0ZSIsImNhbGVuZGFycy9ldmVudHMucmVhZG9ubHkiLCJjYWxlbmRhcnMvZXZlbnRzLndyaXRlIiwiY2FsZW5kYXJzL2dyb3Vwcy5yZWFkb25seSIsImNhbGVuZGFycy9ncm91cHMud3JpdGUiLCJzb2NpYWxwbGFubmVyL3RhZy53cml0ZSIsInNvY2lhbHBsYW5uZXIvY2F0ZWdvcnkud3JpdGUiLCJibG9ncy9hdXRob3IucmVhZG9ubHkiLCJibG9ncy9jYXRlZ29yeS5yZWFkb25seSIsImJsb2dzL2NoZWNrLXNsdWcucmVhZG9ubHkiLCJibG9ncy9wb3N0LndyaXRlIiwiYmxvZ3MvcG9zdC11cGRhdGUud3JpdGUiLCJ3b3JkcHJlc3Muc2l0ZS5yZWFkb25seSIsIndvcmtmbG93cy5yZWFkb25seSIsInVzZXJzLndyaXRlIiwidXNlcnMucmVhZG9ubHkiLCJzdXJ2ZXlzLnJlYWRvbmx5Iiwic3RvcmUvc2V0dGluZy53cml0ZSIsInN0b3JlL3NldHRpbmcucmVhZG9ubHkiLCJzdG9yZS9zaGlwcGluZy53cml0ZSIsInN0b3JlL3NoaXBwaW5nLnJlYWRvbmx5Iiwic29jaWFscGxhbm5lci90YWcucmVhZG9ubHkiLCJzb2NpYWxwbGFubmVyL2NhdGVnb3J5LnJlYWRvbmx5Iiwic29jaWFscGxhbm5lci9jc3Yud3JpdGUiLCJzb2NpYWxwbGFubmVyL2Nzdi5yZWFkb25seSIsInNvY2lhbHBsYW5uZXIvYWNjb3VudC53cml0ZSIsInNvY2lhbHBsYW5uZXIvYWNjb3VudC5yZWFkb25seSIsInNvY2lhbHBsYW5uZXIvcG9zdC53cml0ZSIsInNvY2lhbHBsYW5uZXIvcG9zdC5yZWFkb25seSIsInNvY2lhbHBsYW5uZXIvb2F1dGgud3JpdGUiLCJzb2NpYWxwbGFubmVyL29hdXRoLnJlYWRvbmx5Iiwic25hcHNob3RzLndyaXRlIiwic25hcHNob3RzLnJlYWRvbmx5Iiwic2Fhcy9sb2NhdGlvbi53cml0ZSIsInNhYXMvbG9jYXRpb24ucmVhZCIsInByb2R1Y3RzL2NvbGxlY3Rpb24ud3JpdGUiLCJwcm9kdWN0cy9jb2xsZWN0aW9uLnJlYWRvbmx5IiwicHJvZHVjdHMvcHJpY2VzLndyaXRlIiwicHJvZHVjdHMvcHJpY2VzLnJlYWRvbmx5IiwicHJvZHVjdHMud3JpdGUiLCJwcm9kdWN0cy5yZWFkb25seSIsInBheW1lbnRzL2N1c3RvbS1wcm92aWRlci53cml0ZSIsInBheW1lbnRzL2N1c3RvbS1wcm92aWRlci5yZWFkb25seSIsInBheW1lbnRzL3N1YnNjcmlwdGlvbnMucmVhZG9ubHkiLCJwYXltZW50cy90cmFuc2FjdGlvbnMucmVhZG9ubHkiLCJwYXltZW50cy9pbnRlZ3JhdGlvbi53cml0ZSIsInBheW1lbnRzL2ludGVncmF0aW9uLnJlYWRvbmx5IiwicGF5bWVudHMvb3JkZXJzLndyaXRlIiwicGF5bWVudHMvb3JkZXJzLnJlYWRvbmx5Iiwib3Bwb3J0dW5pdGllcy53cml0ZSIsIm9wcG9ydHVuaXRpZXMucmVhZG9ubHkiLCJvYXV0aC5yZWFkb25seSIsIm9hdXRoLndyaXRlIiwiZnVubmVscy9yZWRpcmVjdC53cml0ZSIsImZ1bm5lbHMvcGFnZWNvdW50LnJlYWRvbmx5IiwiZnVubmVscy9mdW5uZWwucmVhZG9ubHkiLCJmdW5uZWxzL3BhZ2UucmVhZG9ubHkiLCJmdW5uZWxzL3JlZGlyZWN0LnJlYWRvbmx5IiwibWVkaWFzLndyaXRlIiwibWVkaWFzLnJlYWRvbmx5IiwibG9jYXRpb25zL3RlbXBsYXRlcy5yZWFkb25seSIsImxvY2F0aW9ucy90YWdzLndyaXRlIiwibG9jYXRpb25zL3RhZ3MucmVhZG9ubHkiLCJsb2NhdGlvbnMvdGFza3Mud3JpdGUiLCJsb2NhdGlvbnMvY3VzdG9tRmllbGRzLndyaXRlIiwibG9jYXRpb25zL3Rhc2tzLnJlYWRvbmx5IiwibG9jYXRpb25zL2N1c3RvbUZpZWxkcy5yZWFkb25seSIsImxvY2F0aW9ucy9jdXN0b21WYWx1ZXMud3JpdGUiLCJsb2NhdGlvbnMvY3VzdG9tVmFsdWVzLnJlYWRvbmx5IiwibGlua3Mud3JpdGUiLCJsYy1lbWFpbC5yZWFkb25seSIsImxpbmtzLnJlYWRvbmx5IiwiaW52b2ljZXMvdGVtcGxhdGUud3JpdGUiLCJpbnZvaWNlcy90ZW1wbGF0ZS5yZWFkb25seSIsImludm9pY2VzL3NjaGVkdWxlLndyaXRlIiwiaW52b2ljZXMvc2NoZWR1bGUucmVhZG9ubHkiLCJpbnZvaWNlcy53cml0ZSIsImludm9pY2VzLnJlYWRvbmx5IiwiZm9ybXMud3JpdGUiLCJmb3Jtcy5yZWFkb25seSIsImNvdXJzZXMucmVhZG9ubHkiLCJjb3Vyc2VzLndyaXRlIiwib2JqZWN0cy9yZWNvcmQud3JpdGUiLCJvYmplY3RzL3JlY29yZC5yZWFkb25seSIsIm9iamVjdHMvc2NoZW1hLndyaXRlIiwib2JqZWN0cy9zY2hlbWEucmVhZG9ubHkiLCJjb250YWN0cy53cml0ZSIsImNvbnRhY3RzLnJlYWRvbmx5IiwiY29udmVyc2F0aW9ucy9yZXBvcnRzLnJlYWRvbmx5IiwiY29udmVyc2F0aW9ucy9tZXNzYWdlLndyaXRlIiwiY29udmVyc2F0aW9ucy9tZXNzYWdlLnJlYWRvbmx5IiwiY29udmVyc2F0aW9ucy53cml0ZSIsImNvbnZlcnNhdGlvbnMucmVhZG9ubHkiLCJjYW1wYWlnbnMucmVhZG9ubHkiLCJjYWxlbmRhcnMvcmVzb3VyY2VzLndyaXRlIiwiY2FsZW5kYXJzL3Jlc291cmNlcy5yZWFkb25seSJdLCJjbGllbnQiOiI2NzI4Zjc1OWJjOWY5ZjhhOTcyMzQ3YWEiLCJ2ZXJzaW9uSWQiOiI2NzI4Zjc1OWJjOWY5ZjhhOTcyMzQ3YWEiLCJjbGllbnRLZXkiOiI2NzI4Zjc1OWJjOWY5ZjhhOTcyMzQ3YWEtbWI0OXM3cXQifSwiaWF0IjoxNzQ4MjE1Nzc3LjIwMiwiZXhwIjoxNzc5NzUxNzc3LjIwMiwidW5pcXVlSWQiOiIwODlmNTQ1NC1hM2Q3LTQxMGEtYjlhZS1iM2QxMTY2YjYyMDgiLCJ2IjoiMiJ9.RpHj2COLVVnb_YA0PPhKywa9Srqp2W7l8VQy-ZbCEATkdbyuuuV3sJjph2Z_ziM8n8xxoS8BvsEIlvI5Ebocda8cFycpeo-HiVHx7bl2VPkuMgtlqcD5F_INgudgYUmH3V8u0NlrtfuEIxnK_JEai_7YnrbgNH-UqW_2ryP6TPh1ChKLP1w6S_0yz2mQkX5qLZlFdHKGBQEmH-fYzuKny_qw30VzCvXfaHmGHoXv2wMNBu3Z7L9QJxtIpeacdW62mIJKAoamwKluyz14tD_SgopGofUiamkpfK9OVkDxbyGiFFuuDvBzouHdRIsWegKQiN9RBsH6QOvVnZ0NY4TKB7Xt4Rzam2lL14y_LVyzshvkpYZJSz1-8zon_suamyDV8V8SwQ5JlXP3uNwH2wtOCmAqTbSFFI93njTq71TmRWJJmFLKr6_PjJepC9uE5nSujnI-OczTtqUIFKf1ptgxnvejyT0-gVYOyXqYIgEV-8VUq-YKHEjHNiKfgw5zMn_y9AGLFv2X85wMDvQnyenD6FzMhdjp83iDkuGKZyZ6SpkgcyWFnZ3CUla46VKPHh_zhDQpZCGM-Zlue0c1q8_uWuI7EsOEfAHYOvueK3GnzJVDbCnfF-zSk8tn7Qoq3iwYQ_XWgtOPXXxILEKZdN92iKbnIo8htAQBxJDkn3ze-A0';
const GHL_COMPANY_ID = process.env.GHL_COMPANY_ID;
const GHL_API_URL = 'https://services.leadconnectorhq.com';

// GHL Token Management
let ghlAccessToken = null;
let ghlTokenExpiry = null;

// MongoDB Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'dannyautomation';
const TOKENS_COLLECTION = 'tokens';

let db;
let tokensCollection;

// Initialize MongoDB connection
async function initMongoDB() {
    try {
        const client = await MongoClient.connect(MONGODB_URI);
        db = client.db(DB_NAME);
        tokensCollection = db.collection(TOKENS_COLLECTION);
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
}

// Function to get the stored refresh token
async function getStoredRefreshToken() {
    try {
        const tokenDoc = await tokensCollection.findOne({ type: 'ghl_refresh_token' });
        return tokenDoc ? tokenDoc.token : null;
    } catch (error) {
        console.error('Error getting stored refresh token:', error);
        return null;
    }
}

// Function to store the refresh token
async function storeRefreshToken(token) {
    try {
        await tokensCollection.updateOne(
            { type: 'ghl_refresh_token' },
            { $set: { token, updatedAt: new Date() } },
            { upsert: true }
        );
        console.log('Successfully stored new refresh token');
    } catch (error) {
        console.error('Error storing refresh token:', error);
        throw error;
    }
}

async function refreshGHLToken() {
    try {
        console.log('Attempting to refresh GHL token...');
        
        // Get the stored refresh token from the database
        const storedToken = await getStoredRefreshToken();
        const refreshToken = storedToken || GHL_REFRESH_TOKEN;
        
        console.log('Using refresh token:', refreshToken.substring(0, 10) + '...');
        
        const response = await axios.post(
            'https://services.leadconnectorhq.com/oauth/token',
            qs.stringify({
                client_id: GHL_CLIENT_ID,
                client_secret: GHL_CLIENT_SECRET,
                refresh_token: refreshToken,
                grant_type: 'refresh_token'
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        // Store the new refresh token in the database
        const newRefreshToken = response.data.refresh_token;
        console.log('Received new refresh token:', newRefreshToken.substring(0, 10) + '...');
        
        await storeRefreshToken(newRefreshToken);

        ghlAccessToken = response.data.access_token;
        // Set token expiry to 19 hours (to refresh before the 20-hour limit)
        ghlTokenExpiry = Date.now() + (19 * 60 * 60 * 1000);
        
        console.log('Successfully refreshed GHL token');
        return ghlAccessToken;
    } catch (error) {
        if (error.response && error.response.data && error.response.data.error === 'invalid_grant') {
            console.error('Invalid refresh token. Please update the GHL_REFRESH_TOKEN in your environment variables.');
            // You might want to implement a notification system here to alert about invalid token
        }
        console.error('Error refreshing GHL token:', error.message);
        console.error('Error details:', error.response ? error.response.data : 'No response data');
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
        // Convert seconds to minutes when adding to the map
        attendanceMap.set(email, currentDuration + Math.floor(duration / 60));
    });

    // Filter attendees who watched for 30 minutes or more
    const qualifiedAttendees = Array.from(attendanceMap.entries())
        .filter(([_, totalDuration]) => totalDuration >= 30)
        .map(([email, _]) => email);

    return qualifiedAttendees;
}

// Function to add contacts to GHL with tag
async function addContactsToGHL(contacts) {
    try {
        console.log('Adding contacts to GHL:', JSON.stringify(contacts, null, 2));
        const token = await refreshGHLToken();
        const results = [];

        for (const contact of contacts) {
            try {
                const response = await axios.post(
                    `https://rest.gohighlevel.com/v1/contacts/upsert/`,
                    contact,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                console.log(`Successfully added contact ${contact.email} to GHL:`, response.data);
                results.push({
                    email: contact.email,
                    success: true,
                    data: response.data
                });
            } catch (contactError) {
                console.error(`Error adding contact ${contact.email} to GHL:`, {
                    error: contactError.message,
                    response: contactError.response?.data,
                    status: contactError.response?.status,
                    headers: contactError.response?.headers
                });
                results.push({
                    email: contact.email,
                    success: false,
                    error: contactError.message
                });
            }
        }

        return results;
    } catch (error) {
        console.error('Error in addContactsToGHL:', {
            error: error.message,
            response: error.response?.data,
            status: error.response?.status,
            headers: error.response?.headers
        });
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
        const signature = req.headers['x-zoom-signature'];
        const timestamp = req.headers['x-zoom-timestamp'];
        const payload = req.body;

        // Verify webhook signature
        if (!verifyWebhookSignature(payload, signature, timestamp)) {
            console.error('Invalid webhook signature');
            return res.status(401).json({ error: 'Invalid signature' });
        }

        // Process the webhook
        console.log('Received webhook:', JSON.stringify(payload, null, 2));

        if (payload.event === 'webinar.ended') {
            const webinarId = payload.payload.object.id;
            console.log(`Processing ended webinar: ${webinarId}`);

            // Get attendance data
            const attendanceData = await getWebinarParticipants(webinarId);
            console.log('Attendance data:', JSON.stringify(attendanceData, null, 2));

            // Process attendance and add to GHL
            const qualifiedAttendees = await processWebinarAttendance(attendanceData);
            console.log('Qualified attendees:', qualifiedAttendees);

            const results = await addContactsToGHL(qualifiedAttendees.map(email => ({ 
                email,
                tags: [`webinar-gift-${moment().format('YYYY-MM-DD')}`],
                companyId: GHL_COMPANY_ID
            })));

            const successful = results.filter(r => r.success).length;
            const failed = results.filter(r => !r.success).length;

            console.log(`Successfully added ${successful} contacts to GHL`);
            if (failed > 0) {
                console.error(`Failed to add ${failed} contacts to GHL:`, 
                    results.filter(r => !r.success).map(r => r.email));
            }

            return res.json({ 
                message: 'Webhook processed successfully',
                results: {
                    total: results.length,
                    successful,
                    failed
                }
            });
        }

        res.json({ message: 'Webhook received' });
    } catch (error) {
        console.error('Error processing webhook:', {
            error: error.message,
            stack: error.stack,
            response: error.response?.data,
            status: error.response?.status
        });
        res.status(500).json({ 
            error: 'Error processing webhook',
            details: error.message
        });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
initMongoDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
});

// Export functions for testing
module.exports = {
    processWebinarAttendance,
    addContactsToGHL,
    getWebinarParticipants
}; 