const http = require('http');

async function testApi() {
    console.log("Fetching API...");
    try {
        const fetch = (await import('node-fetch')).default;
        const res = await fetch('http://localhost:3001/api/reports/movement?startDate=2026-03-01&endDate=2026-03-08');
        const text = await res.text();
        console.log("Status:", res.status);
        console.log(text);
    } catch (e) {
        console.error(e);
    }
}

testApi();
