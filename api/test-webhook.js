import crypto from 'crypto';

/**
 * Test endpoint for debugging iPaymu webhook
 * Returns detailed step-by-step execution info
 */
export default async function handler(req, res) {
    const logs = [];
    const logStep = (step, data) => {
        logs.push({ step, data, timestamp: new Date().toISOString() });
        console.log(`[${step}]`, data);
    };

    try {
        logStep('START', 'Webhook test started');

        if (req.method !== 'POST') {
            return res.status(200).json({
                error: 'Please use POST method',
                logs
            });
        }

        const notification = req.body;
        logStep('PAYLOAD_RECEIVED', {
            trx_id: notification.trx_id,
            reference_id: notification.reference_id,
            status: notification.status,
            status_code: notification.status_code,
            total: notification.total,
            via: notification.via,
        });

        // Step 1: Check env vars
        logStep('ENV_CHECK', {
            hasVA: !!process.env.IPAYMU_VA,
            hasApiKey: !!process.env.IPAYMU_API_KEY,
            hasPixelId: !!process.env.FB_PIXEL_ID,
            hasCAPIToken: !!process.env.FB_CAPI_ACCESS_TOKEN,
            isProduction: process.env.IPAYMU_IS_PRODUCTION
        });

        // Step 2: Check payment status
        const status = notification.status;
        const statusCode = notification.status_code;
        const isSuccess = status === 'berhasil' || statusCode === '1' || statusCode === 1;

        logStep('STATUS_CHECK', {
            status,
            status_code: statusCode,
            is_success: isSuccess
        });

        // Step 3: Test CAPI payload construction
        const testCAPIPayload = {
            data: [{
                event_name: 'Purchase',
                event_time: Math.floor(Date.now() / 1000),
                event_id: notification.reference_id || notification.trx_id,
                event_source_url: 'https://chr88ai.vercel.app/thank-you.html',
                action_source: 'website',
                user_data: {
                    em: 'test',
                    ph: 'test',
                    fn: 'test',
                },
                custom_data: {
                    currency: 'IDR',
                    value: parseFloat(notification.total || 0),
                    content_name: 'AI Arbitrage Blueprint - Batch 8',
                    content_category: 'Course',
                }
            }],
            access_token: process.env.FB_CAPI_ACCESS_TOKEN ? 'present' : 'missing'
        };

        logStep('CAPI_PAYLOAD_TEST', {
            payload_constructed: true,
            value: testCAPIPayload.data[0].custom_data.value
        });

        logStep('SUCCESS', 'All steps completed');

        return res.status(200).json({
            success: true,
            logs,
            message: 'Test completed - check logs for details'
        });

    } catch (error) {
        logStep('ERROR', {
            message: error.message,
            stack: error.stack
        });

        return res.status(200).json({
            success: false,
            error: error.message,
            logs
        });
    }
}
