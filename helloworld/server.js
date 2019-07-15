const express = require('express');
const app = express();
const exphbs = require('express-handlebars');
const Prometheus = require('prom-client');

// Constants
const PORT = 8080;
const HOST = '0.0.0.0';
const HOSTNAME = process.env.HOSTNAME;
const VERSION = process.env.VERSION;

app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');
const requestCount = {
  requestCounter: new Prometheus.Counter(
      {name: 'request_count_total', help: 'The number of requests served'})
};

// App
app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);

app.use((req, res, next) => {
  requestCount.requestCounter.inc();
  next()
})

app.get('/', (req, res) => {
  res.render('index', {hostname: HOSTNAME, version: VERSION});
});

app.get('/metrics', (req, res) => {
  res.set('Content-Type', Prometheus.register.contentType);
  res.end(Prometheus.register.metrics());
});
