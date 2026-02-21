import fs from 'fs/promises';
import path from 'path';
import { sendCAPIEvent } from './_lib/capi.js';

/**
 * iPaymu Payment Notification Webhook (notifyUrl callback)
 * Fires Meta CAPI Purchase as a backup — Meta deduplicates via event_id (orderId)
 * with the primary event fired by check-status.js polling.
 */
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const notification = req.body;

        console.log('iPaymu notification received:', notification);

        const trxId = notification.trx_id;
        const referenceId = notification.reference_id;
        const status = notification.status;
        const statusCode = notification.status_code;
        const total = notification.total;

        const orderId = referenceId || trxId;

        if (!orderId) {
            console.error('No order/reference ID in notification');
            return res.status(400).json({ error: 'Missing reference_id' });
        }

        // iPaymu status: "berhasil" = success, status_code: "1" = success
        const isSuccess = status === 'berhasil' || statusCode === '1' || statusCode === 1;

        if (!isSuccess) {
            console.log(`Transaction status: ${status} (code: ${statusCode}) — not tracking`);
            return res.status(200).json({
                status: 'ok',
                tracked: false,
                reason: 'not_settled',
            });
        }

        console.log('Payment successful, sending CAPI Purchase (backup)...');

        const customerEmail = notification.buyer_email || notification.buyerEmail || '';
        const customerPhone = notification.buyer_phone || notification.buyerPhone || '';
        const customerName = notification.buyer_name || notification.buyerName || '';
        const grossAmount = parseFloat(total || notification.amount || 0);

        // Fire CAPI Purchase — same event_id as check-status.js so Meta deduplicates
        const capiResult = await sendCAPIEvent({
            eventName: 'Purchase',
            eventId: orderId,
            sourceUrl: 'https://chr88.zenova.id/checkout.html',
            customerEmail,
            customerPhone,
            customerName,
            customData: {
                currency: 'IDR',
                value: grossAmount,
                content_name: 'AI Arbitrage Blueprint - Batch 8',
                content_category: 'Course',
            },
        });

        // Save to purchases.json for admin dashboard data
        const dbPath = path.join(process.cwd(), 'data', 'purchases.json');

        let purchases = [];
        try {
            const data = await fs.readFile(dbPath, 'utf8');
            purchases = JSON.parse(data);
        } catch (error) {
            purchases = [];
        }

        purchases.push({
            orderId,
            transactionId: trxId || '',
            sessionId: notification.sid || '',
            customerName: customerName || 'Unknown',
            customerEmail,
            customerPhone,
            amount: grossAmount,
            status,
            paymentType: notification.via || notification.channel || 'ipaymu',
            trackedAt: new Date().toISOString(),
            capiResponse: capiResult,
            source: 'webhook',
        });

        await fs.writeFile(dbPath, JSON.stringify(purchases, null, 2));

        console.log('Purchase saved to database');

        return res.status(200).json({
            status: 'ok',
            tracked: true,
            message: 'Purchase tracked via webhook',
        });

    } catch (error) {
        console.error('Webhook error:', error);
        return res.status(500).json({
            status: 'error',
            message: error.message,
        });
    }
}
