cat > server.js <<'EOF'
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

const PTERO_URL = process.env.PTERO_URL.replace(/\/$/, '');
const API_KEY = process.env.PTERO_API_KEY;

if (!API_KEY) {
    console.error('PTERO_API_KEY belum diisi di .env');
    process.exit(1);
}

async function ptero(path, options = {}) {
    const response = await fetch(`${PTERO_URL}${path}`, {
        ...options,
        headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Accept': 'Application/vnd.pterodactyl.v1+json',
            'Content-Type': 'application/json',
            ...(options.headers || {})
        }
    });

    const text = await response.text();

    let data;

    try {
        data = JSON.parse(text);
    } catch {
        data = text;
    }

    if (!response.ok) {
        const error = new Error(`Pterodactyl HTTP ${response.status}`);
        error.status = response.status;
        error.data = data;
        throw error;
    }

    return data;
}

/*
 * TEST CONNECTION
 */
app.get('/api/ptero/test', async (req, res) => {
    try {
        const data = await ptero('/api/application/nodes');

        res.json({
            success: true,
            message: 'API Pterodactyl berhasil terhubung.',
            nodes: data.data.map(node => ({
                id: node.attributes.id,
                name: node.attributes.name,
                fqdn: node.attributes.fqdn,
                memory: node.attributes.memory,
                disk: node.attributes.disk
            }))
        });

    } catch (error) {
        console.error(error);

        res.status(error.status || 500).json({
            success: false,
            message: 'Gagal terhubung ke API Pterodactyl.',
            error: error.data || error.message
        });
    }
});

/*
 * LIST SERVERS
 */
app.get('/api/ptero/servers', async (req, res) => {
    try {
        const data = await ptero('/api/application/servers');

        res.json({
            success: true,
            servers: data.data.map(server => ({
                id: server.attributes.id,
                uuid: server.attributes.uuid,
                name: server.attributes.name,
                identifier: server.attributes.identifier,
                status: server.attributes.status,
                memory: server.attributes.limits.memory,
                disk: server.attributes.limits.disk,
                cpu: server.attributes.limits.cpu
            }))
        });

    } catch (error) {
        console.error(error);

        res.status(error.status || 500).json({
            success: false,
            message: 'Gagal mengambil server.',
            error: error.data || error.message
        });
    }
});

app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        service: 'BaiMarket API',
        pterodactyl: PTERO_URL
    });
});

app.listen(process.env.PORT || 3000, () => {
    console.log(`BaiMarket API berjalan di port ${process.env.PORT || 3000}`);
});
EOF
