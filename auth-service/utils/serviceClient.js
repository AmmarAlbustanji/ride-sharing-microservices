// utils/serviceClient.js
const fetch = require('node-fetch');

async function callService(url, token) {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  if (!res.ok) throw new Error(`Failed request to: ${url}`);
  return res.json();
}

module.exports = { callService };
