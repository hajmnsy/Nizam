async function testApi() {
    try {
        console.log("Fetching GET /api/settings...");
        const resGet = await fetch('https://nizam-ruddy.vercel.app/api/settings', {
            cache: 'no-store',
            headers: { 'Cookie': 'session_token=debug_token' }
        });
        console.log("GET Status:", resGet.status);
        const textGet = await resGet.text();
        console.log("GET Response:", textGet.substring(0, 500) + "...");

        try {
            const jsonGet = JSON.parse(textGet);
            console.log("Settings length of logo:", jsonGet.logoUrl ? jsonGet.logoUrl.length : 0);
            console.log("Name:", jsonGet.companyName);
            console.log("Balance:", jsonGet.initialBalance);
        } catch (e) { console.log("Failed to parse JSON") }

        console.log("\nTesting POST /api/settings/balance...");
        const resPost = await fetch('https://nizam-ruddy.vercel.app/api/settings/balance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': 'session_token=debug_token'
            },
            body: JSON.stringify({ initialBalance: 51434900, initialBalanceDate: '2026-02-21' })
        });
        console.log("POST Status:", resPost.status);
        const textPost = await resPost.text();
        console.log("POST Response:", textPost);

    } catch (e) {
        console.error(e);
    }
}

testApi();
