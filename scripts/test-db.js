
const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:Mnsy%4019950125026426@db.iylwvacjbxdmyoruoxqf.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
});

async function testConnection() {
    try {
        console.log('Attempting to connect to Supabase...');
        await client.connect();
        console.log('Connected successfully!');
        const res = await client.query('SELECT NOW()');
        console.log('Database time:', res.rows[0]);
        await client.end();
    } catch (err) {
        console.error('Connection error details:', err);
    }
}

testConnection();
