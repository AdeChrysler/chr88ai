import fs from 'fs/promises';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'members.json');

const ADMIN_EMAIL = 'ade@sixzenith.com';
const ADMIN_PASSWORD = 'zenith2026';

function verifyAuth(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
    const token = authHeader.split(' ')[1];
    const expected = Buffer.from(`${ADMIN_EMAIL}:${ADMIN_PASSWORD}`).toString('base64');
    return token === expected;
}

async function loadMembers() {
    try {
        const data = await fs.readFile(DB_PATH, 'utf8');
        return JSON.parse(data);
    } catch {
        return [];
    }
}

async function saveMembers(members) {
    await fs.writeFile(DB_PATH, JSON.stringify(members, null, 2));
}

export default async function handler(req, res) {
    if (!verifyAuth(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const method = req.method;

    // GET — list all members
    if (method === 'GET') {
        const members = await loadMembers();
        members.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        return res.status(200).json({ success: true, count: members.length, members });
    }

    // POST — add member(s)
    if (method === 'POST') {
        try {
            const members = await loadMembers();
            const body = req.body;

            // Support bulk import: { members: [...] } or single: { name, email, ... }
            const incoming = Array.isArray(body.members) ? body.members : [body];

            const added = [];
            for (const m of incoming) {
                if (!m.name || !m.email) continue;

                const id = `MBR-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
                const member = {
                    id,
                    name: m.name.trim(),
                    email: m.email.trim().toLowerCase(),
                    phone: (m.phone || '').trim(),
                    tier: m.tier || 'core',
                    status: m.status || 'active',
                    notes: m.notes || '',
                    source: m.source || 'import',
                    createdAt: m.createdAt || new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
                members.push(member);
                added.push(member);
            }

            await saveMembers(members);
            return res.status(201).json({ success: true, added: added.length, members: added });
        } catch (error) {
            return res.status(500).json({ error: 'Failed to add member', message: error.message });
        }
    }

    // PUT — update member
    if (method === 'PUT') {
        try {
            const members = await loadMembers();
            const { id, ...updates } = req.body;

            if (!id) return res.status(400).json({ error: 'Member ID required' });

            const idx = members.findIndex(m => m.id === id);
            if (idx === -1) return res.status(404).json({ error: 'Member not found' });

            // Only allow updating specific fields
            const allowed = ['name', 'email', 'phone', 'tier', 'status', 'notes'];
            for (const key of allowed) {
                if (updates[key] !== undefined) {
                    members[idx][key] = key === 'email' ? updates[key].trim().toLowerCase() : updates[key];
                }
            }
            members[idx].updatedAt = new Date().toISOString();

            await saveMembers(members);
            return res.status(200).json({ success: true, member: members[idx] });
        } catch (error) {
            return res.status(500).json({ error: 'Failed to update member', message: error.message });
        }
    }

    // DELETE — remove member
    if (method === 'DELETE') {
        try {
            const members = await loadMembers();
            const { id } = req.body;

            if (!id) return res.status(400).json({ error: 'Member ID required' });

            const filtered = members.filter(m => m.id !== id);
            if (filtered.length === members.length) {
                return res.status(404).json({ error: 'Member not found' });
            }

            await saveMembers(filtered);
            return res.status(200).json({ success: true, deleted: id });
        } catch (error) {
            return res.status(500).json({ error: 'Failed to delete member', message: error.message });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
