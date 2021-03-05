import { createServer, Server } from 'http';
import { Counter, register, Gauge } from 'prom-client';

export default class PromClient {
  public metrics = {
    commandCounter: new Counter({
      name: 'arima_command_counter',
      help: 'Command Counter',
      labelNames: ['name'],
    }),
    matchStarted: new Gauge({
      name: 'arima_matches_started',
      help: 'Matches created',
    }),
    errorCounter: new Counter({
      name: 'arima_error_counter',
      help: 'Number of errors occurred',
    }),
    serversJoined: new Gauge({
      name: 'arima_joined_servers',
      help: 'Servers that Arima joined',
    }),
    ramUsage: new Gauge({
      name: 'arima_ram_usage',
      help: 'RAM usage.',
    }),
    cpuUsage: new Gauge({
      name: 'arima_cpu_usage',
      help: 'CPU Usage',
    }),
    ping: new Gauge({
      name: 'arima_ping',
      help: 'Arima Ping',
    }),
    register,
  };

  public init(): void {
    this.createServer().listen(process.env.PORT);
  }

  public createServer(): Server {
    return createServer((req, res) => {
      (async () => {
        if (req.url === '/metrics') {
          res.writeHead(200, {
            'Content-Type': this.metrics.register.contentType,
          });
          res.write(await this.metrics.register.metrics());
        }
        res.end();
      })();
    });
  }
}
