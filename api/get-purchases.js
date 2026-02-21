import fs from 'fs/promises';
import path from 'path';

/**
 * Admin API - Get all tracked purchases
 */
export default async function handler(req, res) {
    // Only allow GET
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

        // Verify admin credentials (simple base64 check)
        // Hardcoded credentials must match auth.js
        const ADMIN_EMAIL = 'ade@sixzenith.com';
        const ADMIN_PASSWORD = 'zenith2026';

        const expectedToken = Buffer.from(
            `${ADMIN_EMAIL}:${ADMIN_PASSWORD}`
        ).toString('base64');

        if (token !== expectedToken) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Load purchases database
        const dbPath = path.join(process.cwd(), 'data', 'purchases.json');

        let purchases = [];
        try {
            const data = await fs.readFile(dbPath, 'utf8');
            purchases = JSON.parse(data);
        } catch (error) {
            purchases = [];
        }

        // Return purchases sorted by newest first
        purchases.sort((a, b) => new Date(b.trackedAt) - new Date(a.trackedAt));

        return res.status(200).json({
            success: true,
            count: purchases.length,
            purchases,
        });

    } catch (error) {
        console.error('Get purchases error:', error);
        return res.status(500).json({
            error: 'Server error',
            message: error.message
        });
    }
}
