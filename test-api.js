const http = require('http');

// Test function
function testAPI() {
  const options = {
    hostname: 'localhost',
    port: 4000,
    path: '/api/v1/state',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('✅ API Response:', JSON.parse(data));
    });
  });

  req.on('error', (err) => {
    console.log('❌ API Error:', err.message);
  });

  req.end();
}

// Test position creation
function testOpenPosition() {
  const postData = JSON.stringify({
    margin: 1000,
    asset: 'SOL',
    type: 'long',
    leverage: 2,
    slippage: 0.1,
    currentPrice: 150
  });

  const options = {
    hostname: 'localhost',
    port: 4000,
    path: '/api/v1/positions/open',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': postData.length
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('✅ Open Position Response:', JSON.parse(data));
    });
  });

  req.on('error', (err) => {
    console.log('❌ Open Position Error:', err.message);
  });

  req.write(postData);
  req.end();
}

console.log('🧪 Testing Trading Engine APIs...');
console.log('Starting in 3 seconds...');

setTimeout(() => {
  console.log('\n1. Testing GET /api/v1/state');
  testAPI();
  
  setTimeout(() => {
    console.log('\n2. Testing POST /api/v1/positions/open');
    testOpenPosition();
    
    setTimeout(() => {
      console.log('\n3. Testing GET /api/v1/state again (should show new position)');
      testAPI();
    }, 2000);
  }, 2000);
}, 3000);
