import fs from 'fs/promises';
import path from 'path';

/**
 * Track real-time events API
 * Tracks: visitor (page view), checkout, purchase
 */
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { eventType } = req.body;

        if (!eventType || !['visitor', 'checkout', 'purchase'].includes(eventType)) {
            return res.status(400).json({ error: 'Invalid event type' });
        }

        const dbPath = path.join(process.cwd(), 'data', 'events.json');

        // Load existing events
        let events = {
            visitors: [],
            checkouts: [],
            purchases: []
        };

        try {
            const data = await fs.readFile(dbPath, 'utf8');
            events = JSON.parse(data);
        } catch (error) {
            // File doesn't exist yet, use default
        }

        // Add new event with timestamp
        const timestamp = new Date().toISOString();

        if (eventType === 'visitor') {
            events.visitors.push({ timestamp });
        } else if (eventType === 'checkout') {
            events.checkouts.push({ timestamp });
        } else if (eventType === 'purchase') {
            events.purchases.push({ timestamp });
        }

        // Keep only last 24 hours of events
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        events.visitors = events.visitors.filter(e => e.timestamp > oneDayAgo);
        events.checkouts = events.checkouts.filter(e => e.timestamp > oneDayAgo);
        events.purchases = events.purchases.filter(e => e.timestamp > oneDayAgo);

        // Save updated events
        await fs.writeFile(dbPath, JSON.stringify(events, null, 2));

        return res.status(200).json({ success: true });

    } catch (error) {
        console.error('Track event error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
}
