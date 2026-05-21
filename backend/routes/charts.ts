import { Router } from 'express';
import { db } from '../db';
import { charts } from '../db/schema';
import { eq } from 'drizzle-orm';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { dashboardId } = req.query;

    if (!dashboardId) {
      return res.status(400).json({ error: '必須提供 dashboardId' });
    }

    const currentCharts = await db
      .select()
      .from(charts)
      .where(eq(charts.dashboardId, dashboardId as string));

    res.json(currentCharts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '無法取得圖表資料' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { deviceId, attribute, dashboardId } = req.body;

    if (!dashboardId) {
      return res.status(400).json({ error: '新增圖表時必須指定 dashboardId' });
    }

    const newChart = await db
      .insert(charts)
      .values({ deviceId, attribute, dashboardId })
      .returning();

    res.json(newChart[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '新增圖表失敗' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const chartID = req.params.id;
    const deletedRows = await db.delete(charts).where(eq(charts.id, chartID)).returning();
    if (deletedRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '該圖表不存在或已被刪除',
      });
    }
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '刪除圖表失敗' });
  }
});

export default router;
