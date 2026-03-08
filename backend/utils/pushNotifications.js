const axios = require('axios');

/**
 * Sends a push notification to specific Expo push tokens.
 * @param {string|string[]} tokens - A single Expo push token or an array of tokens
 * @param {string} title - The notification title
 * @param {string} body - The notification body text
 * @param {object} data - Optional extra data payload
 */
const sendPushNotification = async (tokens, title, body, data = {}) => {
    if (!tokens) return;

    // Convert single token to array
    const tokenArray = Array.isArray(tokens) ? tokens : [tokens];

    // Filter out invalid or missing tokens
    const validTokens = tokenArray.filter(t => t && t.startsWith('ExponentPushToken['));

    if (validTokens.length === 0) return;

    const messages = validTokens.map(token => ({
        to: token,
        sound: 'default',
        title: title,
        body: body,
        data: data,
    }));

    try {
        await axios.post('https://exp.host/--/api/v2/push/send', messages, {
            headers: {
                'Accept': 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            }
        });
        console.log(`Push notification sent to ${validTokens.length} devices: ${title}`);
    } catch (error) {
        console.error('Error sending push notification:', error);
    }
};

module.exports = { sendPushNotification };
