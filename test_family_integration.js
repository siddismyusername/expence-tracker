const app = require('./src/server');
const http = require('http');
const serverConfig = require('./src/config/serverConfig');
const mongoose = require('mongoose');

// Mock fetch if not available (Node < 18)
const fetch = global.fetch || require('node-fetch'); 

async function testFamilyFlow() {
    const baseUrl = `http://127.0.0.1:${serverConfig.PORT}`;
    const email = `test${Date.now()}@example.com`;
    const password = 'password123';
    const name = 'Test User';

    console.log(`Testing with ${baseUrl}`);

    try {
        // 1. Register
        console.log('1. Registering user...');
        const regRes = await fetch(`${baseUrl}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, name })
        });
        const regData = await regRes.json();
        
        if (!regRes.ok) throw new Error(`Registration failed: ${JSON.stringify(regData)}`);
        console.log('Registration successful');

        // 2. Login
        console.log('2. Logging in...');
        const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const loginData = await loginRes.json();
        
        if (!loginRes.ok) throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
        const token = loginData.token;
        console.log('Login successful, token received');

        // 3. Create Family
        console.log('3. Creating family...');
        const famRes = await fetch(`${baseUrl}/api/family`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name: 'The Test Family' })
        });
        const famData = await famRes.json();

        if (!famRes.ok) throw new Error(`Family creation failed: ${JSON.stringify(famData)}`);
        console.log('Family creation successful:', JSON.stringify(famData, null, 2));

    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

const server = http.createServer(app);

server.listen(serverConfig.PORT, async () => {
    console.log(`Test Server running on port ${serverConfig.PORT}`);
    
    try {
        await testFamilyFlow();
    } catch (e) {
        console.error('Unexpected error:', e);
    } finally {
        console.log('Closing server...');
        server.close();
        // Force close mongoose connection if it was opened
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
        }
        process.exit(0);
    }
});
