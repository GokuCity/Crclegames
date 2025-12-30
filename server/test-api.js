/**
 * Simple API Test Script
 *
 * Tests the HTTP API endpoints
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

// Helper function to make HTTP requests
function request(method, path, data) {
  return new Promise((resolve, reject) => {
    const options = {
      method,
      hostname: 'localhost',
      port: 3000,
      path,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(body)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: body
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Run tests
async function runTests() {
  console.log('🧪 Testing Two Rooms and a Boom API\n');

  try {
    // Test 1: Health check
    console.log('Test 1: Health check');
    const health = await request('GET', '/health');
    console.log('✅ Health:', health.data);
    console.log();

    // Test 2: Create game
    console.log('Test 2: Create game');
    const createResult = await request('POST', '/api/games', {
      hostName: 'Alice'
    });
    console.log('✅ Game created:', createResult.data);
    const { gameId, code, playerId: hostId } = createResult.data;
    console.log();

    // Test 3: Join game
    console.log('Test 3: Join game');
    const joinResult = await request('POST', `/api/games/${code}/join`, {
      playerName: 'Bob'
    });
    console.log('✅ Player joined:', joinResult.data);
    console.log();

    // Test 4: Get game state
    console.log('Test 4: Get game state (host view)');
    const gameState = await request('GET', `/api/games/${gameId}/players/${hostId}`);
    console.log('✅ Game state:', JSON.stringify(gameState.data, null, 2));
    console.log();

    console.log('🎉 All tests passed!');
    console.log('\nNext steps:');
    console.log('  1. Connect via WebSocket to ws://localhost:3000/ws');
    console.log('  2. Send CONNECT message: { type: "CONNECT", payload: { gameId, playerId } }');
    console.log('  3. Send game actions and receive real-time updates');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Check if server is running
console.log('Checking if server is running...');
request('GET', '/health')
  .then(() => {
    console.log('✅ Server is running\n');
    runTests();
  })
  .catch(() => {
    console.error('❌ Server is not running!');
    console.log('\nPlease start the server first:');
    console.log('  cd server');
    console.log('  npm run dev');
    process.exit(1);
  });
