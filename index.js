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
const GHL_REFRESH_TOKEN = process.env.GHL_REFRESH_TOKEN || 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRoQ2xhc3MiOiJDb21wYW55IiwiYXV0aENsYXNzSWQiOiJBYWx3ejQyblBIeld1c1NsZUxUOCIsInNvdXJjZSI6IklOVEVHUkFUSU9OIiwic291cmNlSWQiOiI2NzI4Zjc1OWJjOWY5ZjhhOTcyMzQ3YWEtbWI0OXM3cXQiLCJjaGFubmVsIjoiT0FVVEgiLCJwcmltYXJ5QXV0aENsYXNzSWQiOiJBYWx3ejQyblBIeld1c1NsZUxUOCIsIm9hdXRoTWV0YSI6eyJzY29wZXMiOlsic2Fhcy9jb21wYW55LnJlYWQiLCJzYWFzL2NvbXBhbnkud3JpdGUiLCJsb2NhdGlvbnMud3JpdGUiLCJsb2NhdGlvbnMucmVhZG9ubHkiLCJidXNpbmVzc2VzLndyaXRlIiwiYnVzaW5lc3Nlcy5yZWFkb25seSIsImNvbXBhbmllcy5yZWFkb25seSIsImNhbGVuZGFycy5yZWFkb25seSIsImNhbGVuZGFycy53cml0ZSIsImNhbGVuZGFycy9ldmVudHMucmVhZG9ubHkiLCJjYWxlbmRhcnMvZXZlbnRzLndyaXRlIiwiY2FsZW5kYXJzL2dyb3Vwcy5yZWFkb25seSIsImNhbGVuZGFycy9ncm91cHMud3JpdGUiLCJzb2NpYWxwbGFubmVyL3RhZy53cml0ZSIsInNvY2lhbHBsYW5uZXIvY2F0ZWdvcnkud3JpdGUiLCJibG9ncy9hdXRob3IucmVhZG9ubHkiLCJibG9ncy9jYXRlZ29yeS5yZWFkb25seSIsImJsb2dzL2NoZWNrLXNsdWcucmVhZG9ubHkiLCJibG9ncy9wb3N0LndyaXRlIiwiYmxvZ3MvcG9zdC11cGRhdGUud3JpdGUiLCJ3b3JkcHJlc3Muc2l0ZS5yZWFkb25seSIsIndvcmtmbG93cy5yZWFkb25seSIsInVzZXJzLndyaXRlIiwidXNlcnMucmVhZG9ubHkiLCJzdXJ2ZXlzLnJlYWRvbmx5Iiwic3RvcmUvc2V0dGluZy53cml0ZSIsInN0b3JlL3NldHRpbmcucmVhZG9ubHkiLCJzdG9yZS9zaGlwcGluZy53cml0ZSIsInN0b3JlL3NoaXBwaW5nLnJlYWRvbmx5Iiwic29jaWFscGxhbm5lci90YWcucmVhZG9ubHkiLCJzb2NpYWxwbGFubmVyL2NhdGVnb3J5LnJlYWRvbmx5Iiwic29jaWFscGxhbm5lci9jc3Yud3JpdGUiLCJzb2NpYWxwbGFubmVyL2Nzdi5yZWFkb25seSIsInNvY2lhbHBsYW5uZXIvYWNjb3VudC53cml0ZSIsInNvY2lhbHBsYW5uZXIvYWNjb3VudC5yZWFkb25seSIsInNvY2lhbHBsYW5uZXIvcG9zdC53cml0ZSIsInNvY2lhbHBsYW5uZXIvcG9zdC5yZWFkb25seSIsInNvY2lhbHBsYW5uZXIvb2F1dGgud3JpdGUiLCJzb2NpYWxwbGFubmVyL29hdXRoLnJlYWRvbmx5Iiwic25hcHNob3RzLndyaXRlIiwic25hcHNob3RzLnJlYWRvbmx5Iiwic2Fhcy9sb2NhdGlvbi53cml0ZSIsInNhYXMvbG9jYXRpb24ucmVhZCIsInByb2R1Y3RzL2NvbGxlY3Rpb24ud3JpdGUiLCJwcm9kdWN0cy9jb2xsZWN0aW9uLnJlYWRvbmx5IiwicHJvZHVjdHMvcHJpY2VzLndyaXRlIiwicHJvZHVjdHMvcHJpY2VzLnJlYWRvbmx5IiwicHJvZHVjdHMud3JpdGUiLCJwcm9kdWN0cy5yZWFkb25seSIsInBheW1lbnRzL2N1c3RvbS1wcm92aWRlci53cml0ZSIsInBheW1lbnRzL2N1c3RvbS1wcm92aWRlci5yZWFkb25seSIsInBheW1lbnRzL3N1YnNjcmlwdGlvbnMucmVhZG9ubHkiLCJwYXltZW50cy90cmFuc2FjdGlvbnMucmVhZG9ubHkiLCJwYXltZW50cy9pbnRlZ3JhdGlvbi53cml0ZSIsInBheW1lbnRzL2ludGVncmF0aW9uLnJlYWRvbmx5IiwicGF5bWVudHMvb3JkZXJzLndyaXRlIiwicGF5bWVudHMvb3JkZXJzLnJlYWRvbmx5Iiwib3Bwb3J0dW5pdGllcy53cml0ZSIsIm9wcG9ydHVuaXRpZXMucmVhZG9ubHkiLCJvYXV0aC5yZWFkb25seSIsIm9hdXRoLndyaXRlIiwiZnVubmVscy9yZWRpcmVjdC53cml0ZSIsImZ1bm5lbHMvcGFnZWNvdW50LnJlYWRvbmx5IiwiZnVubmVscy9mdW5uZWwucmVhZG9ubHkiLCJmdW5uZWxzL3BhZ2UucmVhZG9ubHkiLCJmdW5uZWxzL3JlZGlyZWN0LnJlYWRvbmx5IiwibWVkaWFzLndyaXRlIiwibWVkaWFzLnJlYWRvbmx5IiwibG9jYXRpb25zL3RlbXBsYXRlcy5yZWFkb25seSIsImxvY2F0aW9ucy90YWdzLndyaXRlIiwibG9jYXRpb25zL3RhZ3MucmVhZG9ubHkiLCJsb2NhdGlvbnMvdGFza3Mud3JpdGUiLCJsb2NhdGlvbnMvY3VzdG9tRmllbGRzLndyaXRlIiwibG9jYXRpb25zL3Rhc2tzLnJlYWRvbmx5IiwibG9jYXRpb25zL2N1c3RvbUZpZWxkcy5yZWFkb25seSIsImxvY2F0aW9ucy9jdXN0b21WYWx1ZXMud3JpdGUiLCJsb2NhdGlvbnMvY3VzdG9tVmFsdWVzLnJlYWRvbmx5IiwibGlua3Mud3JpdGUiLCJsYy1lbWFpbC5yZWFkb25seSIsImxpbmtzLnJlYWRvbmx5IiwiaW52b2ljZXMvdGVtcGxhdGUud3JpdGUiLCJpbnZvaWNlcy90ZW1wbGF0ZS5yZWFkb25seSIsImludm9pY2VzL3NjaGVkdWxlLndyaXRlIiwiaW52b2ljZXMvc2NoZWR1bGUucmVhZG9ubHkiLCJpbnZvaWNlcy53cml0ZSIsImludm9pY2VzLnJlYWRvbmx5IiwiZm9ybXMud3JpdGUiLCJmb3Jtcy5yZWFkb25seSIsImNvdXJzZXMucmVhZG9ubHkiLCJjb3Vyc2VzLndyaXRlIiwib2JqZWN0cy9yZWNvcmQud3JpdGUiLCJvYmplY3RzL3JlY29yZC5yZWFkb25seSIsIm9iamVjdHMvc2NoZW1hLndyaXRlIiwib2JqZWN0cy9zY2hlbWEucmVhZG9ubHkiLCJjb250YWN0cy53cml0ZSIsImNvbnRhY3RzLnJlYWRvbmx5IiwiY29udmVyc2F0aW9ucy9yZXBvcnRzLnJlYWRvbmx5IiwiY29udmVyc2F0aW9ucy9tZXNzYWdlLndyaXRlIiwiY29udmVyc2F0aW9ucy9tZXNzYWdlLnJlYWRvbmx5IiwiY29udmVyc2F0aW9ucy53cml0ZSIsImNvbnZlcnNhdGlvbnMucmVhZG9ubHkiLCJjYW1wYWlnbnMucmVhZG9ubHkiLCJjYWxlbmRhcnMvcmVzb3VyY2VzLndyaXRlIiwiY2FsZW5kYXJzL3Jlc291cmNlcy5yZWFkb25seSJdLCJjbGllbnQiOiI2NzI4Zjc1OWJjOWY5ZjhhOTcyMzQ3YWEiLCJ2ZXJzaW9uSWQiOiI2NzI4Zjc1OWJjOWY5ZjhhOTcyMzQ3YWEiLCJjbGllbnRLZXkiOiI2NzI4Zjc1OWJjOWY5ZjhhOTcyMzQ3YWEtbWI0OXM3cXQifSwiaWF0IjoxNzQ4MjE0NjU1LjM2NywiZXhwIjoxNzc5NzUwNjU1LjM2NywidW5pcXVlSWQiOiIxZWJhNTk2Yy1jMjQyLTQxNTYtOTQzNS04ZTFmNmRjOWEyYTIiLCJ2IjoiMiJ9.eBKT6PyZG0c2O_RIiccJZijphbKRxdTLmuNiSdD32nrxvM1-bmazFfKSe8SBMXVcSFHyNOef_LT00vvCVMzHqxRFk29hVmX8pbXcwCYkDzFt4kldrMAKiRJacnt_nc06XAZVR4t8XqOOC94ZWk1pr9SHdkDV8ppf7-KrL9cMpCQ4CZqulu1Q4qXma9i5faJdIC9l13ZVVqhcQGRWF8TEW18NXTJFksOqgZiu2entVBUF6KvmsDaw82ITdDSzztpgci6d6vJKFQjKc6KQ5qAs12klJlMJHmdFAKk1uAk5pDOXRc2KI9VAlTPHShA3HpfumoIFfSuFmObyw32S08Vz9OXb9s9ulSC9Zn43Dyf2jW6HRQVeVETLIMW12yCpfCZBFdpehmh57V3eJWao3aNGGRpmZ9Flp-esPCVwC5QkUvwCzzq5g_Av9aGUW6qE_mxDqAxxVnW7omddBGXHvjnDYgCRr0BWPONcmYRJWdJpOsMDTg_2sboAgdXm8vcoNBcVqzn86Suo9kQeHxsCuF7MEstLSn1LhP1Rogp6t_lAFztioY-xPWDbuy2HLFUa4H0-T7svfBJltPgybPci53obXXTM98oK1ctL6OKVRcBWJW06AVj7yC19lYcp25Xe14VfyR4wWRkpaPD2vbkDJvepSRz5HGSbubnnBfJMwPJ5uno';
const GHL_COMPANY_ID = process.env.GHL_COMPANY_ID;
const GHL_API_URL = 'https://services.leadconnectorhq.com';

// GHL Token Management
let ghlAccessToken = null;
let ghlTokenExpiry = null;

async function refreshGHLToken() {
    try {
        console.log('Attempting to refresh GHL token...');
        console.log('Using refresh token:', GHL_REFRESH_TOKEN.substring(0, 10) + '...');
        
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
        const newRefreshToken = response.data.refresh_token;
        console.log('Received new refresh token:', newRefreshToken.substring(0, 10) + '...');
        
        GHL_REFRESH_TOKEN = newRefreshToken;
        process.env.GHL_REFRESH_TOKEN = newRefreshToken;

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