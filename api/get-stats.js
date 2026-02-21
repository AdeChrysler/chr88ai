import fs from 'fs/promises';
import path from 'path';

/**
 * Get real-time statistics
 */
export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Check Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const token = authHeader.split(' ')[1];

        // Verify admin credentials
        const ADMIN_EMAIL = 'ade@sixzenith.com';
        const ADMIN_PASSWORD = 'zenith2026';

        const expectedToken = Buffer.from(
            `${ADMIN_EMAIL}:${ADMIN_PASSWORD}`
        ).toString('base64');

        if (token !== expectedToken) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const eventsPath = path.join(process.cwd(), 'data', 'events.json');

        // Load events
        let events = {
            visitors: [],
            checkouts: [],
            purchases: []
        };

        try {
            const data = await fs.readFile(eventsPath, 'utf8');
            events = JSON.parse(data);
        } catch (error) {
            // File doesn't exist, return zeros
        }

        // Calculate stats for different time periods
        const now = Date.now();
        const oneHourAgo = new Date(now - 60 * 60 * 1000).toISOString();
        const sixHoursAgo = new Date(now - 6 * 60 * 60 * 1000).toISOString();
        const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();

        const stats = {
            realtime: {
                visitors: events.visitors.filter(e => e.timestamp > oneHourAgo).length,
                checkouts: events.checkouts.filter(e => e.timestamp > oneHourAgo).length,
                purchases: events.purchases.filter(e => e.timestamp > oneHourAgo).length,
            },
            last6Hours: {
                visitors: events.visitors.filter(e => e.timestamp > sixHoursAgo).length,
                checkouts: events.checkouts.filter(e => e.timestamp > sixHoursAgo).length,
                purchases: events.purchases.filter(e => e.timestamp > sixHoursAgo).length,
            },
            last24Hours: {
                visitors: events.visitors.filter(e => e.timestamp > oneDayAgo).length,
                checkouts: events.checkouts.filter(e => e.timestamp > oneDayAgo).length,
                purchases: events.purchases.filter(e => e.timestamp > oneDayAgo).length,
            }
        };

        return res.status(200).json({
            success: true,
            stats
        });

    } catch (error) {
        console.error('Get stats error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
}
