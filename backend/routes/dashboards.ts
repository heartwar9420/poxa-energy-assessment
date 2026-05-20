import { Router } from 'express';
import { db } from '../db';
import { dashboards, charts } from '../db/schema';
import { eq, count } from 'drizzle-orm';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const allDashboards = await db.select().from(dashboards);
    res.json(allDashboards);
  } catch (err) {
    res.status(500).json({ error: '無法取得dashboards資料' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string') return res.status(400).json({ error: 'name 格式錯誤' });
    const newDb = await db.insert(dashboards).values({ name }).returning();
    res.json(newDb[0]);
  } catch (err) {
    res.status(500).json({ error: '無法建立dashboard' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'id格式錯誤' });

    await db.delete(dashboards).where(eq(dashboards.id, id));
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '無法刪除dashboard' });
  }
});

router.patch('/:id', async (req, res) => {
  console.log('====== 收到前端 Rename 請求了！ ======', { id: req.params.id, body: req.body });
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!id) return res.status(400).json({ error: '缺少 id 參數' });
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'name 格式錯誤或為空字串' });
    }

    const updatedDb = await db
      .update(dashboards)
      .set({ name: name.trim() })
      .where(eq(dashboards.id, id))
      .returning();

    if (updatedDb.length === 0) {
      return res.status(404).json({ error: '找不到該監控場域' });
    }

    res.json(updatedDb[0]);
  } catch (err) {
    console.error('重命名 dashboard 失敗:', err);
    res.status(500).json({ error: '無法重命名 dashboard' });
  }
});

router.get('/:dashboardId/summary', async (req, res) => {
  try {
    const { dashboardId } = req.params;

    if (!dashboardId) {
      return res.status(400).json({ error: '缺少 dashboardId 參數' });
    }

    const dashboardsCountResult = await db.select({ value: count() }).from(dashboards);

    const totalSites = dashboardsCountResult[0]?.value ?? 0;

    const chartsCountResult = await db
      .select({ value: count() })
      .from(charts)
      .where(eq(charts.dashboardId, dashboardId));

    const totalWidgets = chartsCountResult[0]?.value ?? 0;

    res.json({
      totalSites,
      totalWidgets,
    });
  } catch (err) {
    console.error('後端動態計算摘要失敗:', err);
    res.status(500).json({ error: '無法取得摘要資料' });
  }
});

export default router;
