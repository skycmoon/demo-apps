const express = require('express');
const app = express();
const exphbs = require('express-handlebars');
const Prometheus = require('prom-client');

// Constants
const PORT = 8080;
const HOST = '0.0.0.0';
const VERSION = process.env.VERSION;
const HOSTNAME = process.env.HOSTNAME;
const CLUSTER = process.env.CLUSTER;
const ENVIRONMENT = process.env.ENVIRONMENT;
const REGION = process.env.REGION;

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

app.get('/app', (req, res) => {
  res.json({
    version: VERSION,
    hostname: HOSTNAME,
    cluster: CLUSTER,
    environment: ENVIRONMENT,
    region: REGION
  })
});

// app.get('/app', (req, res) => {
//   res.render('index', {
//     hostname: HOSTNAME,
//     version: VERSION,
//     environment: ENVIRONMENT,
//     region: REGION
//   });
// });

app.get('/app/metrics', (req, res) => {
  res.set('Content-Type', Prometheus.register.contentType);
  res.end(Prometheus.register.metrics());
});
