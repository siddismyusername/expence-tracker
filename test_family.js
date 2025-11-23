const serverConfig = require('./src/config/serverConfig');

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
        console.log('Family creation successful:', famData);

    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

// Run if server is already running, otherwise this script needs to be run while server is up
testFamilyFlow();
