import { Router } from 'express';
import { db } from '../db';
import { telemetry } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';

const router = Router();

router.get('/history', async (req, res) => {
  const { deviceId, attribute } = req.query;
  if (!deviceId || !attribute) {
    return res.status(400).json({ error: '缺少必要參數' });
  }

  try {
    const historyData = await db
      .select()
      .from(telemetry)
      .where(
        and(
          eq(telemetry.deviceId, deviceId as string),
          eq(telemetry.attribute, attribute as string),
        ),
      )
      .orderBy(desc(telemetry.timestamp))
      .limit(30);

    res.json(historyData.reverse());
  } catch (err) {
    console.error('讀取歷史資料失敗:', err);
    res.status(500).json({ error: '資料庫讀取失敗' });
  }
});

export default router;
