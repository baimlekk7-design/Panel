export default async function handler(req, res) {
    try {
        const PTERO_URL = process.env.PTERO_URL;
        const API_KEY = process.env.PTERO_API_KEY;

        if (!PTERO_URL || !API_KEY) {
            return res.status(500).json({
                success: false,
                error: "Environment variable PTERO_URL atau PTERO_API_KEY belum diset."
            });
        }

        const response = await fetch(
            `${PTERO_URL.replace(/\/$/, "")}/api/application/nodes`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${API_KEY}`,
                    Accept: "Application/vnd.pterodactyl.v1+json"
                }
            }
        );

        const text = await response.text();

        let data;

        try {
            data = JSON.parse(text);
        } catch {
            data = {
                raw: text
            };
        }

        if (!response.ok) {
            return res.status(response.status).json({
                success: false,
                pterodactyl_status: response.status,
                error: data
            });
        }

        return res.status(200).json({
            success: true,
            message: "Vercel berhasil terhubung ke Pterodactyl.",
            nodes: data.data?.map(node => ({
                id: node.attributes.id,
                name: node.attributes.name,
                fqdn: node.attributes.fqdn,
                memory: node.attributes.memory,
                disk: node.attributes.disk
            })) || []
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}
