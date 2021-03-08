import cleanup from 'node-cleanup';
import dotenv from 'dotenv';
import ArimaClient from './lib/client/ArimaClient';
import Logger from './lib/utils/Logger';
import './lib/extensions';

dotenv.config();
const client = new ArimaClient();

// this function will trigger on manual exits (^C and the like), as well as
// errors. It's easier for pm2 to more seamlessly restart if we exit out of db
// and other connections
cleanup((exitCode, signal) => {
  (async () => {
    Logger.info(
      `Received cleanup request with ${exitCode ? `exit code` : `signal`} ${
        signal || exitCode
      }`
    );

    client.destroy();
    await client.db.disconnect();

    process.kill(process.pid, signal || undefined);
  })();
});

client.start();
