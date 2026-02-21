import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// API handlers
import checkStatus from './api/check-status.js';
import createTransaction from './api/create-transaction.js';
import ipaymuWebhook from './api/ipaymu-webhook.js';
import verifyPurchase from './api/verify-purchase.js';
import trackEvent from './api/track-event.js';
import getStats from './api/get-stats.js';
import getPurchases from './api/get-purchases.js';
import auth from './api/auth.js';
import testWebhook from './api/test-webhook.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// API routes
app.all('/api/check-status', checkStatus);
app.all('/api/create-transaction', createTransaction);
app.all('/api/ipaymu-webhook', ipaymuWebhook);
app.all('/api/verify-purchase', verifyPurchase);
app.all('/api/track-event', trackEvent);
app.all('/api/get-stats', getStats);
app.all('/api/get-purchases', getPurchases);
app.all('/api/auth', auth);
app.all('/api/test-webhook', testWebhook);

// Self-hosted video files
app.use('/videos', express.static(path.join(__dirname, 'public', 'videos'), {
    maxAge: '30d',
    setHeaders(res) {
        res.set('Access-Control-Allow-Origin', '*');
    },
}));

// Vite-built static files
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback — serve index.html for unmatched routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
