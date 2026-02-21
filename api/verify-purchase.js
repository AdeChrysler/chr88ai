import crypto from 'crypto';

/**
 * DEPRECATED for tracking — Purchase CAPI is now fired by check-status.js (primary)
 * and ipaymu-webhook.js (backup).
 *
 * This endpoint is kept as an admin/debug tool to verify transaction status with iPaymu.
 */
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { orderId, transactionId } = req.body;

        if (!orderId) {
            return res.status(400).json({ error: 'Order ID is required' });
        }

        const va = process.env.IPAYMU_VA;
        const apiKey = process.env.IPAYMU_API_KEY;
        const isProduction = process.env.IPAYMU_IS_PRODUCTION === 'true';

        const ipaymuUrl = isProduction
            ? 'https://my.ipaymu.com/api/v2/transaction'
            : 'https://sandbox.ipaymu.com/api/v2/transaction';

        let transactionVerified = false;
        let transactionData = {};

        if (transactionId && va && apiKey) {
            const checkBody = { transactionId: parseInt(transactionId) };
            const bodyString = JSON.stringify(checkBody);
            const bodyHash = crypto.createHash('sha256').update(bodyString).digest('hex');
            const stringToSign = `POST:${va}:${bodyHash}:${apiKey}`;
            const signature = crypto.createHmac('sha256', apiKey).update(stringToSign).digest('hex');

            const now = new Date();
            const timestamp = now.getFullYear().toString()
                + String(now.getMonth() + 1).padStart(2, '0')
                + String(now.getDate()).padStart(2, '0')
                + String(now.getHours()).padStart(2, '0')
                + String(now.getMinutes()).padStart(2, '0')
                + String(now.getSeconds()).padStart(2, '0');

            try {
                const ipaymuResponse = await fetch(ipaymuUrl, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'va': va,
                        'signature': signature,
                        'timestamp': timestamp,
                    },
                    body: bodyString,
                });

                if (ipaymuResponse.ok) {
                    transactionData = await ipaymuResponse.json();
                    if (transactionData.Status === 200 && transactionData.Data) {
                        const trxStatus = transactionData.Data.Status;
                        transactionVerified = trxStatus === 1 || trxStatus === '1'
                            || trxStatus === 6 || trxStatus === '6';
                    }
                }
            } catch (apiError) {
                console.error('iPaymu API error:', apiError.message);
            }
        }

        return res.status(200).json({
            orderId,
            transactionId,
            verified: transactionVerified,
            ipaymuData: transactionData.Data || null,
        });

    } catch (error) {
        console.error('Verify purchase error:', error);
        return res.status(500).json({
            error: 'server_error',
            message: error.message,
        });
    }
}
