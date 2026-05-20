import { WebSocket } from 'ws';
import { db } from '../db';
import { telemetry } from '../db/schema';
import { lte } from 'drizzle-orm';

const DEVICES = ['BESS-01', 'BESS-02', 'Solar-01'];
const ATTRIBUTES = ['voltage', 'power', 'soc'];

export const startBackgroundTasks = (wss: any) => {
  const generateData = async () => {
    try {
      const timestampObj = new Date();
      const timestampISO = timestampObj.toISOString();
      const telemetryData: any[] = [];
      const wsMessages: any[] = [];

      for (const device of DEVICES) {
        for (const attribute of ATTRIBUTES) {
          const baseValue = attribute === 'voltage' ? 220 : attribute === 'power' ? 50 : 85;
          const random = attribute === 'power' ? Math.random() * 15 : Math.random() * 5;
          const finalValue = (baseValue + random).toFixed(2);

          telemetryData.push({
            deviceId: device,
            attribute,
            value: finalValue,
            timestamp: timestampObj,
          });
          wsMessages.push({
            deviceId: device,
            attribute,
            value: finalValue,
            timestamp: timestampISO,
          });
        }
      }

      if (telemetryData.length > 0) await db.insert(telemetry).values(telemetryData);

      if (wss.clients.size > 0) {
        const messageString = JSON.stringify(wsMessages);
        wss.clients.forEach((client: any) => {
          if (client.readyState === WebSocket.OPEN) client.send(messageString);
        });
      }
    } catch (err) {
      console.error('模擬資料失敗:', err);
    } finally {
      setTimeout(generateData, 1000);
    }
  };

  const cleanOldData = async () => {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      await db.delete(telemetry).where(lte(telemetry.timestamp, fiveMinutesAgo));
    } catch (err) {
      console.error('清理舊資料失敗:', err);
    } finally {
      setTimeout(cleanOldData, 60 * 1000);
    }
  };

  setTimeout(generateData, 1000);
  setTimeout(cleanOldData, 60 * 1000);
};
