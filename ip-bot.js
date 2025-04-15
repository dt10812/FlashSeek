// Node.js Express route
const dns = require('dns');
const express = require('express');
const app = express();

app.get('/check-bot', (req, res) => {
  const ip = req.query.ip;

  dns.reverse(ip, (err, hostnames) => {
    if (err || !hostnames.length) {
      return res.json({ isBot: false });
    }

    const hostname = hostnames[0];
    if (
      hostname.endsWith('.googlebot.com') ||
      hostname.endsWith('.search.msn.com')
    ) {
      // Double-check with forward lookup (optional but safer)
      dns.lookup(hostname, (err, address) => {
        if (!err && address === ip) {
          return res.json({ isBot: true });
        } else {
          return res.json({ isBot: false });
        }
      });
    } else {
      return res.json({ isBot: false });
    }
  });
});

app.listen(3000, () => console.log('Listening on port 3000'));
