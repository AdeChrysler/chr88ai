import crypto from 'crypto';

/**
 * Shared Meta Conversions API (CAPI) helper.
 * Used by check-status.js (primary) and ipaymu-webhook.js (backup).
 */

function hashSHA256(value) {
    if (!value) return null;
    return crypto.createHash('sha256').update(value.toLowerCase().trim()).digest('hex');
}

/**
 * Send an event to Meta Conversions API.
 *
 * @param {Object} options
 * @param {string} options.eventName       - e.g. 'Purchase'
 * @param {string} options.eventId         - dedup key (orderId)
 * @param {string} options.sourceUrl       - page URL that triggered the event
 * @param {string} [options.customerEmail]
 * @param {string} [options.customerPhone]
 * @param {string} [options.customerName]
 * @param {string} [options.fbc]           - Meta click ID cookie (_fbc)
 * @param {string} [options.fbp]           - Meta browser ID cookie (_fbp)
 * @param {string} [options.clientIp]      - user IP for matching
 * @param {string} [options.clientUserAgent] - user UA for matching
 * @param {Object} [options.customData]    - e.g. { currency, value, content_name }
 * @returns {Promise<Object>} Graph API response body
 */
export async function sendCAPIEvent({
    eventName,
    eventId,
    sourceUrl,
    customerEmail,
    customerPhone,
    customerName,
    fbc,
    fbp,
    clientIp,
    clientUserAgent,
    customData = {},
}) {
    const pixelId = process.env.FB_PIXEL_ID;
    const accessToken = process.env.FB_CAPI_ACCESS_TOKEN;

    if (!pixelId || !accessToken) {
        console.error('CAPI: Missing FB_PIXEL_ID or FB_CAPI_ACCESS_TOKEN');
        return { error: 'missing_credentials' };
    }

    const userData = {};
    if (customerEmail) userData.em = [hashSHA256(customerEmail)];
    if (customerPhone) userData.ph = [hashSHA256(customerPhone)];
    if (customerName) userData.fn = [hashSHA256(customerName)];
    if (fbc) userData.fbc = fbc;
    if (fbp) userData.fbp = fbp;
    if (clientIp) userData.client_ip_address = clientIp;
    if (clientUserAgent) userData.client_user_agent = clientUserAgent;

    const payload = {
        data: [{
            event_name: eventName,
            event_time: Math.floor(Date.now() / 1000),
            event_id: eventId,
            event_source_url: sourceUrl,
            action_source: 'website',
            user_data: userData,
            custom_data: customData,
        }],
        access_token: accessToken,
    };

    try {
        const response = await fetch(
            `https://graph.facebook.com/v21.0/${pixelId}/events`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            }
        );

        const result = await response.json();

        if (!response.ok) {
            console.error(`CAPI ${eventName} error:`, result);
        } else {
            console.log(`CAPI ${eventName} sent — event_id: ${eventId}`);
        }

        return result;
    } catch (err) {
        console.error(`CAPI ${eventName} fetch failed:`, err.message);
        return { error: err.message };
    }
}
