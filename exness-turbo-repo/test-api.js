const express = require('express');
const app = express();
const PORT = 4001;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Test API is running' });
});

app.get('/api/v1/state', (req, res) => {
  res.json({ 
    balances: { USD: 10000, SOL: 0 },
    positions: []
  });
});

app.listen(PORT, () => {
  console.log(`Test API started on port ${PORT}`);
});
