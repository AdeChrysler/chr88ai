/**
 * Admin Authentication API
 */
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { email, password } = req.body;

        // Hardcoded credentials for monitoring
        const ADMIN_EMAIL = 'ade@sixzenith.com';
        const ADMIN_PASSWORD = 'zenith2026';

        // Check credentials
        const isValid = email === ADMIN_EMAIL && password === ADMIN_PASSWORD;

        if (!isValid) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        // Generate token (base64 encoded credentials)
        const token = Buffer.from(`${email}:${password}`).toString('base64');

        console.log('Authentication successful');
        return res.status(200).json({
            success: true,
            token
        });

    } catch (error) {
        console.error('Auth error:', error);
        return res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
}
