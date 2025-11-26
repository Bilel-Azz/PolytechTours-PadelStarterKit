const API_URL = 'http://localhost:8000/api/v1/auth';
const TEST_EMAIL = 'test@example.com';

async function testApi() {
    try {
        console.log('--- Testing API ---');

        // 1. Health Check
        try {
            const health = await fetch('http://localhost:8000/health');
            const data = await health.json();
            console.log('Health Check:', data);
        } catch (e) {
            console.error('Health Check Failed', e);
        }

        // 2. Login (Failure)
        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: TEST_EMAIL,
                    password: 'wrongpassword'
                })
            });
            console.log('Login Failure Test (Expected 401):', response.status);
        } catch (error) {
            console.log('Login Failure Test Error:', error);
        }

        console.log('Skipping Login Success test as we need a valid user in DB.');

    } catch (error) {
        console.error('Test Script Error:', error);
    }
}

testApi();
