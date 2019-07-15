const express = require('express');
const app = express();
const bodyParser = require("body-parser");
const exphbs = require('express-handlebars');
const Prometheus = require('prom-client');

// Constants
const PORT = 8080;
const HOST = '0.0.0.0';
const HOSTNAME = process.env.HOSTNAME;
const VERSION = process.env.VERSION;

app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
const requestCount = {
  requestCounter: new Prometheus.Counter(
      {name: 'request_count_total', help: 'The number of requests served'})
};

// App
const chartTokenStore = new Set();
let releasedApps = [];
app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);

app.use((req, res, next) => {
  requestCount.requestCounter.inc();
  next()
});

app.get('/', (req, res) => {
  res.render('index',
      {hostname: HOSTNAME, version: VERSION, releasedApps: releasedApps});
});

app.get('/metrics', (req, res) => {
  res.set('Content-Type', Prometheus.register.contentType);
  res.end(Prometheus.register.metrics());
});

app.post('/release-approvals/clear', (req, res) => {
  chartTokenStore.clear();
  res.redirect('/');
});

app.post('/release-approvals', (req, res) => {
  const charName = req.body.chartName;
  const version = req.body.version;
  chartTokenStore.add(generateTokenName(charName, version));
  res.redirect('/');
});

app.post('/release-approvals/check', (req, res) => {
  // Expected payload
  // {
  //   "name": "podinfo",
  //     "namespace": "test",
  //     "phase": "Progressing",
  //     "metadata": {
  //   "test":  "all",
  //       "token":  "16688eb5e9f289f1991c"
  // }
  // }
  const charName = req.body.name;
  const version = req.body.metadata.token;
  if (chartTokenStore.has(generateTokenName(charName, version))) {
    return res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

app.post('/released-apps', (req, res) => {
  const charName = req.body.name;
  const version = req.body.metadata.token;
  releasedApps.push(generateTokenName(charName, version));
  res.sendStatus(200);
});

app.post('/released-apps/clear', (req, res) => {
  releasedApps = [];
  res.redirect('/');
});

function generateTokenName(chartName, version) {
  return `${chartName}-${version}`;
}