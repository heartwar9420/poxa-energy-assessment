import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import dashboardRouter from './routes/dashboards';
import chartRouter from './routes/charts';
import telemetryRouter from './routes/telemetry';
import { startBackgroundTasks } from './services/backgroundTasks';

const allowedOrigins = [
  'http://localhost:3000',
  'https://poxa-energy-assessment-eqrz7m8xt-heartwar9420s-projects.vercel.app',
  'https://poxa-energy-assessment.vercel.app',
];
const app = express();

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  }),
);
app.use(express.json());

app.use('/api/dashboards', dashboardRouter);
app.use('/api/charts', chartRouter);
app.use('/api/telemetry', telemetryRouter);

const server = createServer(app);
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('Client connected');
  ws.on('close', () => console.log('Client disconnected'));
});

startBackgroundTasks(wss);

server.listen(8080, () => {
  console.log('伺服器已啟動，正在監聽 Port 8080...');
});
