// Status Checker
// Endpoint: /api/status

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    return res.status(200).json({
        status: 'online',
        platform: 'Vercel Edge Network',
        capabilities: {
            maxDuration: '60 seconds',
            maxThreads: 50,
            supportedMethods: ['get', 'post', 'mixed'],
            multiTarget: true
        },
        usage: {
            single: '/api/ddos?target=url&duration=30&method=get&threads=20',
            multi: '/api/attack?targets=url1,url2&duration=30&method=mixed'
        }
    });
}
