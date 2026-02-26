// Vercel Serverless Function - Create iPaymu Direct Payment
import crypto from 'crypto';
import { sendCAPIEvent } from './_lib/capi.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { amount, product, customerEmail, customerName, customerPhone, paymentMethod, paymentChannel, fbc, fbp } = req.body;

        if (!amount || !product || !paymentMethod || !paymentChannel) {
            return res.status(400).json({ error: 'Amount, product, paymentMethod, and paymentChannel are required' });
        }

        const orderId = `AAB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const va = process.env.IPAYMU_VA;
        const apiKey = process.env.IPAYMU_API_KEY;
        const isProduction = process.env.IPAYMU_IS_PRODUCTION === 'true';

        if (!va || !apiKey) {
            return res.status(500).json({ error: 'Server configuration error: Missing iPaymu credentials' });
        }

        const ipaymuUrl = isProduction
            ? 'https://my.ipaymu.com/api/v2/payment/direct'
            : 'https://sandbox.ipaymu.com/api/v2/payment/direct';

        // Always use production URL for notifyUrl (iPaymu rejects localhost)
        const notifyUrl = 'https://chr88.zenova.id/api/ipaymu-webhook';

        const body = {
            name: customerName || 'Customer',
            phone: customerPhone || '',
            email: customerEmail || '',
            amount: amount,
            comments: `SixZenith - ${product}`,
            description: 'SixZenith',
            referenceId: orderId,
            paymentMethod: paymentMethod,
            paymentChannel: paymentChannel,
            notifyUrl: notifyUrl,
            product: ['SixZenith - ' + product],
            qty: [1],
            price: [amount],
        };

        // Generate signature
        const bodyString = JSON.stringify(body);
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

        console.log('=== IPAYMU DIRECT PAYMENT ===');
        console.log('Order:', orderId, '|', paymentMethod, paymentChannel, '| Rp', amount);
        console.log('URL:', ipaymuUrl);
        console.log('Body:', bodyString);
        console.log('Signature:', signature);
        console.log('Timestamp:', timestamp);
        console.log('=== END ===');

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

        if (!response.ok || data.Status !== 200) {
            console.error('iPaymu error:', data);
            return res.status(response.status === 200 ? 400 : response.status).json({
                error: 'Failed to create transaction',
                details: data
            });
        }

        console.log('iPaymu direct response:', JSON.stringify(data, null, 2));

        // Fire server-side CAPI InitiateCheckout — works even if browser blocks pixel
        const clientIp = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || '';
        const clientUserAgent = req.headers['user-agent'] || '';
        sendCAPIEvent({
            eventName: 'InitiateCheckout',
            eventId: 'IC_' + orderId,
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
                value: amount,
                content_name: 'AI Arbitrage Blueprint - Batch 8',
                content_category: 'Course',
            },
        }).catch(err => console.error('CAPI InitiateCheckout error:', err));

        // Direct payment returns payment number (VA number, QRIS url, etc.)
        return res.status(200).json({
            order_id: orderId,
            transaction_id: data.Data.TransactionId,
            payment_no: data.Data.PaymentNo,
            payment_name: data.Data.PaymentName,
            expired: data.Data.Expired,
            qris_url: data.Data.QrImage || data.Data.QrTemplate || data.Data.QrUrl || null,
            qr_string: data.Data.QrString || null,
            total: data.Data.Total,
        });

    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}
