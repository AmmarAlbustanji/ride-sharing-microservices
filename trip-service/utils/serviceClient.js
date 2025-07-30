const fetch = require('node-fetch');

async function callService(url, token) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Service call failed: ${response.status} ${errText}`);
  }

  return response.json();
}

module.exports = { callService };const fetch = require('node-fetch');

async function callService(url, token) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Service call failed: ${response.status} ${errText}`);
  }

  return response.json();
}

module.exports = { callService };