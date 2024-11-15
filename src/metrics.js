const config = require('./config');

// app.use(metrics.requestTracker);

class Metrics {
  constructor() {
    this.totalRequests = 0;
    this.postRequests = 0;
    this.putRequests = 0;
    this.getRequests = 0;
    this.deleteRequests = 0;

    this.activeUser = 0;

    this.authSuccess = 0;
    this.authFailure = 0;

    this.pizzaSold = 0;
    this.pizzaFail = 0;
    this.revenue = 0;

    this.pizzaLatency = 0;
    this.pizzaCount = 0;
    this.serviceLatency = 0;
    this.serviceCount = 0;

    // This will periodically sent metrics to Grafana
    const timer = setInterval(() => {
      this.sendMetricToGrafana('request', 'all', 'total', this.totalRequests);
      this.sendMetricToGrafana('request', 'put', 'total', this.putRequests);
      this.sendMetricToGrafana('request', 'get', 'total', this.getRequests);
      this.sendMetricToGrafana('request', 'post', 'total', this.postRequests);
      this.sendMetricToGrafana('request', 'delete', 'total', this.deleteRequests);

      this.sendMetricToGrafana('active_user', 'users', 'total', this.activeUser);

      this.sendMetricToGrafana('auth', 'success', 'total', this.authSuccess);
      this.sendMetricToGrafana('auth', 'failure', 'total', this.authFailure);

      let cpu = getCpuUsagePercentage();
      this.sendMetricToGrafana('cpu', 'cpu', 'percent', cpu);
      let mem = getMemoryUsagePercentage();
      this.sendMetricToGrafana('memory', 'mem', 'percent', mem);

      this.sendMetricToGrafana('pizza', 'pass', 'total', this.pizzaSold);
      this.sendMetricToGrafana('pizza', 'fail', 'total', this.pizzaFail);
      this.sendMetricToGrafana('revenue', 'rev', 'total', this.revenue);

      this.sendMetricToGrafana('latency', 'pizza', 'total', this.pizzaLatency / this.pizzaCount);
      this.sendMetricToGrafana('latency', 'service', 'total', this.serviceLatency / this.serviceCount);
      
    }, 10000);
    timer.unref();
  }

  latency(req, start, end) {
    this.serviceLatency += (end - start);
    this.serviceCount++;
    if (req == "pizza") {
        this.pizzaCount++;
        this.pizzaLatency += (end - start);
    }
  }

  pizzabuys(req, money) {
    if (req == "fail") {
        this.pizzaFail++;
    } else if (req == "sold") {
        this.pizzaSold++;
        this.revenue += money.items[0].price;
    }
  }

  authentications(req) {
    if (req == "success") {
        this.authSuccess++;
    } else if (req == "failure") {
        this.authFailure++;
    }
  }

  activeUsers(req) {
    if (req == "add") {
        this.activeUser++;
    } else if (req == "delete") {
        this.activeUser--;
    }

  }

  incrementRequests(req) {
    this.totalRequests++;
    if (req == "post") {
        this.postRequests++;
    }
    if (req == "put") {
        this.putRequests++;
    }
    if (req == "get") {
        this.getRequests++;
    }
    if (req == "delete") {
        this.deleteRequests++;
    }
  }

  sendMetricToGrafana(metricPrefix, httpMethod, metricName, metricValue) {
    const metric = `${metricPrefix},source=${config.metrics.source},method=${httpMethod} ${metricName}=${metricValue}`;

    fetch(`${config.metrics.url}`, {
      method: 'post',
      body: metric,
      headers: { Authorization: `Bearer ${config.metrics.userId}:${config.metrics.apiKey}` },
    })
      .then((response) => {
        if (!response.ok) {
          console.error('Failed to push metrics data to Grafana');
        } else {
          console.log(`Pushed ${metric}`);
        }
      })
      .catch((error) => {
        console.error('Error pushing metrics:', error);
      });
  }
}

const os = require('os');

function getCpuUsagePercentage() {
  const cpuUsage = os.loadavg()[0] / os.cpus().length;
  return cpuUsage.toFixed(2) * 100;
}

function getMemoryUsagePercentage() {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const memoryUsage = (usedMemory / totalMemory) * 100;
  return memoryUsage.toFixed(2);
}

// function sendMetricsPeriodically(period) {
//     const timer = setInterval(() => {
//       try {
//         const buf = new MetricBuilder();
//         httpMetrics(buf);
//         systemMetrics(buf);
//         userMetrics(buf);
//         purchaseMetrics(buf);
//         authMetrics(buf);
  
//         const metrics = buf.toString('\n');
//         this.sendMetricToGrafana(metrics);
//       } catch (error) {
//         console.log('Error sending metrics', error);
//       }
//     }, period);
// }

const metrics = new Metrics();
module.exports = metrics;