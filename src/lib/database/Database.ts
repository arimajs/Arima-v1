import mongoose from 'mongoose';
import Logger from '../utils/Logger';

export default class Database {
  public constructor() {
    mongoose.connection.on('error', (err) =>
      Logger.error('The database encountered an error: ', err)
    );
  }

  public get connection(): mongoose.Connection {
    return mongoose.connection;
  }

  public async init(): Promise<void> {
    void mongoose
      .connect(process.env.MONGO_URI!, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })
      .catch((err) => Logger.fatal("The database couldn't connect: ", err));
    return new Promise((r) => mongoose.connection.on('open', r));
  }

  public disconnect(): Promise<void> {
    return mongoose.disconnect();
  }
}
