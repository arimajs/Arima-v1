import cleanup from 'node-cleanup';
import dotenv from 'dotenv';
import ArimaClient from './lib/client/ArimaClient';
import Logger from './lib/utils/Logger';
import './lib/extensions';

dotenv.config();
const client = new ArimaClient();

cleanup(
  (exitCode, signal) =>
    void (async () => {
      Logger.info(
        `Received cleanup request with ${exitCode ? `exit code` : `signal`} ${
          signal || exitCode
        }`
      );

      client.destroy();
      await client.db.disconnect();

      process.kill(process.pid, signal || undefined);
    })()
);

void client.start();
