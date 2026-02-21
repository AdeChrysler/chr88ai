import crypto from 'crypto';
import { sendCAPIEvent } from './_lib/capi.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const {
            transactionId,
            orderId,
            customerName,
            customerEmail,
            customerPhone,
            fbc,
            fbp,
        } = req.body;

        if (!transactionId) {
            return res.status(400).json({ error: 'transactionId is required' });
        }

        const va = process.env.IPAYMU_VA;
        const apiKey = process.env.IPAYMU_API_KEY;
        const isProduction = process.env.IPAYMU_IS_PRODUCTION === 'true';

        if (!va || !apiKey) {
            return res.status(500).json({ error: 'Missing credentials' });
        }

        const ipaymuUrl = isProduction
            ? 'https://my.ipaymu.com/api/v2/transaction'
            : 'https://sandbox.ipaymu.com/api/v2/transaction';

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

        const response = await fetch(ipaymuUrl, {
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

        const data = await response.json();

        console.log('=== CHECK STATUS ===');
        console.log('TransactionId:', transactionId);
        console.log('iPaymu response:', JSON.stringify(data, null, 2));
        console.log('=== END CHECK STATUS ===');

        if (data.Status === 200 && data.Data) {
            const status = data.Data.Status;
            const statusCode = data.Data.StatusCode;
            // status 1 = berhasil (settled), status 6 = berhasil unsettled (paid but not yet settled to merchant)
            const isPaid = [1, '1', 6, '6'].includes(status) || [1, '1', 6, '6'].includes(statusCode);

            if (isPaid && orderId) {
                // Fire CAPI Purchase — this is the primary server-side tracking point.
                // Meta deduplicates via event_id (orderId), so if the webhook also fires, only one counts.
                const clientIp = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || '';
                const clientUserAgent = req.headers['user-agent'] || '';

                const capiResult = await sendCAPIEvent({
                    eventName: 'Purchase',
                    eventId: orderId,
                    sourceUrl: 'https://chr88.zenova.id/checkout.html',
                    customerEmail,
                    customerPhone,
                    customerName,
                    fbc,
                    fbp,
                    clientIp,
                    clientUserAgent,
                    customData: {
                        currency: 'IDR',
                        value: parseFloat(data.Data.Total || data.Data.Amount || 96000),
                        content_name: 'AI Arbitrage Blueprint - Batch 8',
                        content_category: 'Course',
                    },
                });

                console.log('CAPI Purchase result:', JSON.stringify(capiResult));
            }

            return res.status(200).json({
                paid: isPaid,
                status: data.Data.StatusDesc || (isPaid ? 'berhasil' : 'pending'),
                debug: { status, statusCode, statusDesc: data.Data.StatusDesc },
            });
        }

        return res.status(200).json({ paid: false, status: 'pending', debug: { rawStatus: data.Status, hasData: !!data.Data } });

    } catch (error) {
        console.error('Check status error:', error.message);
        return res.status(200).json({ paid: false, status: 'error' });
    }
}
