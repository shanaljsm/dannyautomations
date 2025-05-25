const axios = require('axios');

const CLIENT_ID = 'ne0KPBrtRnK3ejMdzsO9uw';
const CLIENT_SECRET = 'pgWL8dT4497Vjhi21QNdzjdwHg9AAG6M';
const ACCOUNT_ID = 'DaTVV21nRgK5eOOXVfA_tw';

async function getZoomInfo() {
    try {
        // Get access token using Server-to-Server OAuth
        const tokenResponse = await axios.post('https://zoom.us/oauth/token', null, {
            params: {
                grant_type: 'account_credentials',
                account_id: ACCOUNT_ID
            },
            headers: {
                'Authorization': `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`
            }
        });

        const accessToken = tokenResponse.data.access_token;

        // Get account information
        const accountResponse = await axios.get('https://api.zoom.us/v2/users/me', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        console.log('Account Information:');
        console.log('-------------------');
        console.log('Account ID:', accountResponse.data.account_id);
        console.log('Email:', accountResponse.data.email);
        console.log('Name:', accountResponse.data.first_name, accountResponse.data.last_name);
        console.log('\nPlease save these values in your .env file:');
        console.log('ZOOM_API_KEY=', CLIENT_ID);
        console.log('ZOOM_API_SECRET=', CLIENT_SECRET);
        console.log('ZOOM_ACCOUNT_ID=', ACCOUNT_ID);

    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
        console.log('\nTo get your Account ID:');
        console.log('1. Go to https://marketplace.zoom.us/');
        console.log('2. Sign in to your Zoom account');
        console.log('3. Click on "Develop" in the top right');
        console.log('4. Click on "Build App"');
        console.log('5. Select "Server-to-Server OAuth"');
        console.log('6. Your Account ID will be shown in the app configuration');
    }
}

getZoomInfo(); 