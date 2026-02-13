import cors from 'cors';
import express, { Application, Request, Response } from 'express';
import pinoHttp from 'pino-http';
import authRoutes from './routes/authRoutes';
import aircraftRoutes from './routes/aircraftRoutes';
import { config } from './config';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { logger } from './lib/logger';
import { verifyDatabaseConnection } from './lib/prisma';

const app: Application = express();

app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          method: req.method,
          url: req.url,
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  })
);

app.get(`${config.apiPrefix}/health`, (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

app.get(`${config.apiPrefix}/readiness`, async (_req: Request, res: Response) => {
  const dbReady = await verifyDatabaseConnection();

  if (!dbReady) {
    res.status(503).json({
      status: 'not_ready',
      checks: {
        database: 'down',
      },
    });
    return;
  }

  res.json({
    status: 'ready',
    checks: {
      database: 'up',
    },
  });
});

app.use(`${config.apiPrefix}/auth`, authRoutes);
app.use(config.apiPrefix, aircraftRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const startServer = () => {
  app.listen(config.port, () => {
    logger.info(
      {
        environment: config.nodeEnv,
        port: config.port,
      },
      'Aircraft dashboard API started'
    );
  });
};

if (require.main === module) {
  startServer();
}

export default app;
