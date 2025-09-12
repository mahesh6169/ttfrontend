const testApiEndpoints = async () => {
  const baseUrl = 'http://192.168.168.41:5020/api';
  const validKey = 'eba0a5dae3b0d121d974b79983e19f1b463b6e63bb8ef833b931d6dad30197b1';
  
  const endpoints = [
    { path: '/users/validate', auth: true },
    { path: '/events', auth: true },
    { path: '/health', auth: false }, // Should work without key
    { path: '/stripe/webhook', auth: false }, // Should work without key
    { path: '/mailersend/webhook', auth: false }, // Should work without key
  ];

  console.log('1. Testing API Endpoints:');
  for (const endpoint of endpoints) {
    console.log(`\nTesting ${endpoint.path}:`);
    
    // Test without key
    try {
      const res1 = await fetch(`${baseUrl}${endpoint.path}`);
      console.log(`  Without key: ${res1.status} ${endpoint.auth ? '❌' : '✓'}`);
    } catch (e) {
      console.log(`  Without key: Failed ${endpoint.auth ? '✓' : '❌'}`);
    }

    // Test with key
    try {
      const res2 = await fetch(`${baseUrl}${endpoint.path}`, {
        headers: { 'x-api-key': validKey }
      });
      console.log(`  With key: ${res2.status} ✓`);
    } catch (e) {
      console.log(`  With key: Failed ❌`);
    }
  }

  // Test Socket.io connections
  console.log('\n2. Testing Socket.io Connections:');
  const io = require('socket.io-client');
  
  // Test seat/event socket
  console.log('\n  Testing Event Socket:');
  const eventSocket = io('http://192.168.168.41:5020', {
    transports: ['websocket'],
    auth: { apiKey: validKey },
    extraHeaders: { 'x-api-key': validKey }
  });
  
  eventSocket.on('connect', () => {
    console.log('    Event socket connected ✓');
    eventSocket.disconnect();
  });
  
  eventSocket.on('connect_error', (err) => {
    console.log('    Event socket failed ❌', err.message);
  });

  // Test thread/chat socket
  console.log('\n  Testing Thread/Chat Socket:');
  const threadSocket = io('http://192.168.168.41:5020', {
    transports: ['websocket'],
    auth: { apiKey: validKey },
    extraHeaders: { 'x-api-key': validKey }
  });
  
  threadSocket.on('connect', () => {
    console.log('    Thread socket connected ✓');
    threadSocket.disconnect();
  });
  
  threadSocket.on('connect_error', (err) => {
    console.log('    Thread socket failed ❌', err.message);
  });
};

// Run: node scripts/testApiKey.js
testApiEndpoints().catch(console.error);