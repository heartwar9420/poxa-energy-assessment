# React WebSocket 優化與重構

**Date**: May 18, 2026 at 09:19 PM
**Turns**: 2
**Source**: [Gemini Chat](https://gemini.google.com/u/1/app/ba2b0ca97ea5106c?hl=zh-TW&pageId=none)

---

## Turn 1

### 👤 User

你這份 code 其實已經比很多 AI 生成的 React code 好不少了，尤其：
有 cleanup
有 useMemo
有 mounted guard
有限制資料筆數
有把 ECharts option memo 化
有 TypeScript interface
這些都算是有觀念的寫法。
不過還是有幾個地方可以再優化，尤其是：
WebSocket 效能
React render 次數
ECharts 更新方式
型別安全
時間格式處理
可維護性
我幫你分成「值得改」跟「可選優化」。

1. 最大的問題：每個 Widget 都開一條 WebSocket
   你現在：
   const ws = new WebSocket('ws://localhost:8080');
   放在每個 ChartWidget 裡。
   意思是：
   如果畫面有：
   voltage
   current
   power
   temperature
   四個圖表。
   你就會建立：
   4 條 websocket
   這其實非常浪費。
   更好的做法
   建立：
   全域唯一 websocket
   例如：
   src/lib/socket.ts
   let socket: WebSocket | null = null;
   export const getSocket = () => {
   if (!socket) {
   socket = new WebSocket('ws://localhost:8080');
   }
   return socket;
   };
   然後 widget：
   const ws = getSocket();
   這樣：
   全站只會有一條 socket
   效能差很多
   後端壓力也小很多
   這是最值得優化的地方。
2. toLocaleTimeString 很耗效能
   你現在：
   date.toLocaleTimeString('zh-TW', { hour12: false });
   其實這個 API 很重。
   如果 telemetry 很頻繁：
   例如：
   每秒數十筆
   多個 widget
   會開始卡。
   更快的寫法
   直接自己 format：
   const formatTime = (isoString: string) => {
   const date = new Date(isoString);
   const h = String(date.getHours()).padStart(2, '0');
   const m = String(date.getMinutes()).padStart(2, '0');
   const s = String(date.getSeconds()).padStart(2, '0');
   return `${h}:${m}:${s}`;
   };
   效能會好很多。
3. shift() 會修改原陣列
   你現在：
   if (newData.length > 30) newData.shift();
   雖然可以用。
   但 React 比較推薦 immutable。
   更好的寫法
   return newData.slice(-30);
   完整：
   const newData = [
   ...prevData,
   {
   timeLabel: formatTime(data.timestamp),
   value: Number(data.value),
   },
   ];
   return newData.slice(-30);
   比較乾淨。
4. Number(data.value) 可能產生 NaN
   這是實戰常見問題。
   你現在：
   value: Number(data.value)
   但 backend 可能送：
   ''
   null
   undefined
   'N/A'
   就會出問題。
   建議保護一下
   const parsedValue = Number(data.value);
   if (Number.isNaN(parsedValue)) return prevData;
   或者：
   value: Number(data.value) || 0
   但這會把 0 跟錯誤混在一起。
   我比較推薦第一種。
5. WebSocket reconnect 機制
   現在：
   ws.close();
   如果 websocket：
   server 重啟
   network 斷線
   backend crash
   你的前端就永遠收不到資料了。
   建議增加 reconnect
   至少：
   ws.onclose = () => {
   setTimeout(connectWebSocket, 3000);
   };
   正式專案非常重要。
6. chartOption 其實還能再拆
   你現在：
   const chartOption = useMemo(() => {
   沒問題。
   但：
   每次資料更新都會建立完整 option object
   ECharts 其實支援：
   setOption({
   series: [{ data }]
   });
   只更新部分。
   更進階作法
   用：
   const chartRef = useRef<ReactECharts>(null);
   然後：
   chartRef.current?.getEchartsInstance().setOption(...)
   只更新 data。
   好處
   大量即時資料時：
   render 更少
   React 壓力更小
   chart 更順
7. 顏色 mapping 建議抽出去
   現在：
   attribute === 'voltage'
   ? '#3b82f6'
   : attribute === 'power'
   之後 attribute 一多會變很醜。
   建議
   const ATTRIBUTE_COLORS: Record<string, string> = {
   voltage: '#3b82f6',
   power: '#10b981',
   current: '#f59e0b',
   };
   然後：
   color: ATTRIBUTE_COLORS[attribute] ?? '#6366f1'
   可維護性高很多。
8. notMerge={true} 不一定是好事
   你現在：
   notMerge={true}
   代表：
   每次都重建整張 chart
   資料量大時：
   反而可能更卡。
   建議測試：
   先拿掉：
   notMerge={false}
   或直接不寫。
   很多時候會更順。
9. 歷史資料與即時資料可能重複
   這是實戰常見 bug。
   情境：
   fetch history
   websocket 已經開始送資料
   history 裡又包含最新資料
   就會：
   重複點
   建議
   加 timestamp 去重：
   const exists = prevData.some(
   d => d.timeLabel === formatTime(data.timestamp)
   );
   if (exists) return prevData;
   更好是 backend 提供唯一 id。
10. 建議抽 custom hook
現在 widget：
fetch history
websocket
資料管理
chart
全部混在一起。
其實：
telemetry 邏輯應該抽 hook
例如：
const telemetry = useTelemetry(deviceId, attribute);
Widget 專心畫圖。
如果是我會重構成：
hooks/
useTelemetry.ts
lib/
websocket.ts
components/
ChartWidget.tsx
這樣大型專案會舒服很多。
最重要的優化排名（實際效益）
我會這樣排序：
優化重要度單一 WebSocket⭐⭐⭐⭐⭐reconnect⭐⭐⭐⭐⭐避免 notMerge=true⭐⭐⭐⭐抽 hook⭐⭐⭐⭐setOption 部分更新⭐⭐⭐⭐formatTime 優化⭐⭐⭐immutable slice⭐⭐顏色 mapping⭐⭐NaN 保護⭐⭐⭐你這份 code 已經有：
「初級偏中階 React 開發者」
的水準了。
不像一般 AI code 常見：
沒 cleanup
狂 re-render
websocket memory leak
無限 setState
沒 memo
這份其實算蠻健康的架構。
這是一個ai給我的修改方案 ， 你能夠一步一步帶我優化我的方案嗎？
'use client';
import React, { useEffect, useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
interface ChartWidgetProps {
id: string;
deviceId: string;
attribute: string;
onDelete: (id: string) => void;
}
// 改變結構：直接儲存格式化好的時間，避免重複計算
interface TelemetryPoint {
timeLabel: string;
value: number;
}
interface BackendTelemetry {
id: string;
deviceId: string;
attribute: string;
value: string;
timestamp: string;
}
const formatTime = (isoString: string) => {
try {
const date = new Date(isoString);
return date.toLocaleTimeString('zh-TW', { hour12: false });
} catch {
return isoString;
}
};
export default function ChartWidget({ id, deviceId, attribute, onDelete }: ChartWidgetProps) {
const [chartData, setChartData] = useState<TelemetryPoint[]>([]);
useEffect(() => {
let isMounted = true;
// 1. 載入歷史資料
const loadHistory = async () => {
try {
const res = await fetch(
`http://localhost:8080/api/telemetry/history?deviceId=${deviceId}&attribute=${attribute}`,
);
if (res.ok) {
const history: BackendTelemetry[] = await res.json();
if (isMounted && Array.isArray(history)) {
setChartData(
history.map((h: BackendTelemetry) => ({
timeLabel: formatTime(h.timestamp), // 在這裡就先格式化
value: Number(h.value),
})),
);
}
}
} catch (err) {
console.error('歷史資料載入失敗', err);
}
};
loadHistory();
// 2. 建立 WebSocket 連線 (修正為 ws://)
const ws = new WebSocket('ws://localhost:8080');
ws.onmessage = (event) => {
try {
const data = JSON.parse(event.data);
// 驗證是否為當前 Widget 所需的資料
if (data.deviceId === deviceId && data.attribute === attribute) {
if (isMounted) {
setChartData((prevData) => {
const newData = [
...prevData,
{
timeLabel: formatTime(data.timestamp), // 收到即格式化
value: Number(data.value),
},
];
// 限制數量在 30 筆內
if (newData.length > 30) newData.shift();
return newData;
});
}
}
} catch (err) {
console.error('WebSocket 資料解析失敗', err);
}
};
return () => {
isMounted = false;
ws.close();
};
}, [deviceId, attribute]);
// 使用 useMemo 快取配置，只有在資料或屬性改變時才重新計算物件
const chartOption = useMemo(() => {
const times = chartData.map((d) => d.timeLabel);
const values = chartData.map((d) => d.value);
return {
title: {
text: `${deviceId} - ${attribute.toUpperCase()}`,
textStyle: { fontSize: 14, fontWeight: 'bold', color: '#1f2937' },
},
tooltip: { trigger: 'axis' },
xAxis: {
type: 'category',
data: times,
boundaryGap: false,
axisLine: { lineStyle: { color: '#e5e7eb' } },
axisLabel: { color: '#6b7280', fontSize: 11 },
},
yAxis: {
type: 'value',
scale: true,
axisLine: { lineStyle: { color: '#e5e7eb' } },
axisLabel: { color: '#6b7280', fontSize: 11 },
splitLine: { lineStyle: { color: '#f3f4f6' } },
},
series: [
{
name: attribute,
type: 'line',
data: values,
smooth: true,
showSymbol: false,
areaStyle: { opacity: 0.05 },
color:
attribute === 'voltage' ? '#3b82f6' : attribute === 'power' ? '#10b981' : '#f59e0b',
lineStyle: { width: 2.5 },
},
],
};
}, [chartData, deviceId, attribute]);
return (
<div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative hover:shadow-md transition-shadow">
<button
onClick={() => onDelete(id)}
className="absolute top-4 right-4 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all w-8 h-8 flex items-center justify-center rounded-full"
>
✕
</button>
{/* 加上 notMerge={true} 確保動態更新順暢 */}
<ReactECharts
option={chartOption}
notMerge={true}
style={{ height: '260px', width: '100%' }}
/>
</div>
);
}

### 🤖 Assistant

這份優化建議非常精準，切中了前端在處理「即時大數據（Telemetry Data）」時最常遇到的效能瓶頸。
為了不讓你一次面對過多程式碼修改而混亂，我們**分三個階段、一步一步來重構**。這樣做不僅能確保每一步都運作正常，也能讓你更清楚理解架構改變帶的好處。
以下是我為你規劃的優化藍圖：

- **第一階段（現在進行）：** 建立全域唯一的 WebSocket 管理器（解決問題 1、5）
- **第二階段：** 封裝 Custom Hook 與資料處理優化（解決問題 2、3、4、9、10）
- **第三階段：** 元件視覺化與 ECharts 效能調優（解決問題 6、7、8）

---

## 🚀 第一階段：建立全域唯一 WebSocket 管理器 (Pub/Sub 模式)

當畫面上有多個圖表時，原先的做法會讓每個圖表都跟後端建立一條連線。我們現在要建立一個**中心化的連線管理器**。
這個管理器會採用 **發佈-訂閱模式 (Pub/Sub)**：全站只有一條 WebSocket 連線，當收到後端資料時，管理器會負責把資料分發給「對該設備與屬性感興趣」的圖表。
請在你的專案中新增一個檔案 `src/lib/websocket.ts`（或是你習慣的工具函式路徑），並寫入以下程式碼：

```typescript
// src/lib/websocket.ts

export interface BackendTelemetry {
  id: string;
  deviceId: string;
  attribute: string;
  value: string;
  timestamp: string;
}

type MessageCallback = (data: BackendTelemetry) => void;

interface Listener {
  deviceId: string;
  attribute: string;
  callback: MessageCallback;
}

class TelemetrySocketManager {
  private url: string;
  private ws: WebSocket | null = null;
  // 儲存所有圖表元件的訂閱群
  private listeners = new Set<Listener>();
  private reconnectTimeout: number | null = null;

  constructor(url: string) {
    this.url = url;
  }

  // 建立連線
  private connect() {
    // 如果已經在連線中或已連線，就不重複觸發
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)
    ) {
      return;
    }

    this.ws = new WebSocket(this.url);

    this.ws.onmessage = (event) => {
      try {
        const data: BackendTelemetry = JSON.parse(event.data);

        // 走訪所有訂閱者，只有 deviceId 和 attribute 吻合的才丟資料給他
        this.listeners.forEach((listener) => {
          if (listener.deviceId === data.deviceId && listener.attribute === data.attribute) {
            listener.callback(data);
          }
        });
      } catch (err) {
        console.error('WebSocket 訊息解析失敗:', err);
      }
    };

    this.ws.onclose = () => {
      console.warn('WebSocket 連線中斷，3 秒後嘗試重新連線...');
      this.ws = null;

      // 自動重連機制
      if (!this.reconnectTimeout) {
        this.reconnectTimeout = window.setTimeout(() => {
          this.reconnectTimeout = null;
          this.connect();
        }, 3000);
      }
    };

    this.ws.onerror = (err) => {
      console.error('WebSocket 發生錯誤:', err);
    };
  }

  /**
   * 供元件訂閱即時資料的方法
   * @returns 回傳一個取消訂閱的函式 (正好可以用在 useEffect 的 cleanup)
   */
  subscribe(deviceId: string, attribute: string, callback: MessageCallback) {
    const listener: Listener = { deviceId, attribute, callback };
    this.listeners.add(listener);

    // 只要有人訂閱，就確保 WebSocket 是連線狀態
    this.connect();

    // 取消訂閱的清理邏輯
    return () => {
      this.listeners.delete(listener);

      // 進階優化：如果畫面上完全沒有圖表在聽資料了，就把 WebSocket 斷掉省資源
      if (this.listeners.size === 0 && this.ws) {
        this.ws.close();
      }
    };
  }
}

// 導出單例 (Singleton)，確保整個 App 不管 import 幾次都共用這一個實例
export const telemetrySocket = new TelemetrySocketManager('ws://localhost:8080');
```

### 💡 這個設計帶來的好處：

1. **單一連線：** 無論你開 4 個還是 40 個圖表，瀏覽器永遠只對後端發起 1 條 WebSocket 連線。
2. **自動重連 (Reconnect)：** 內建斷線監聽，每 3 秒自動嘗試重新連接，直到伺服器恢復。
3. **資源回收：** 當使用者離開圖表頁面、畫面上沒有任何訂閱者時，會主動切斷連線，不佔用後端併發（Concurrency）額度。

---

請問這個全域管理器的程式碼架構是否清楚？如果你建立好這個檔案了，我們可以進到第二階段：**把這套機制與歷史資料 Fetch 整合，抽成一個乾淨的 Custom Hook**。

## Turn 2

### 👤 User

而且：
這份比剛剛那份更適合重構
因為現在已經出現：
「頁面元件過胖」
的問題了。
你自己感覺「太冗長」其實是對的。
這份目前的問題
不是效能。
而是：
職責混亂（Responsibility 混在一起）
現在這個 component 同時負責：
功能類型Router 管理navigationURL statequery paramsdashboard APIdata fetchingchart APIdata fetchingform stateUI stateloading stateUI statedashboard tabs UIpresentationchart toolbar UIpresentationchart grid UIpresentationbusiness logicapplication logic這是典型：
God Component（上帝元件）
React 很容易長成這樣。
但你現在其實已經到：
「該開始學 component architecture」的階段
這很棒。
因為很多人會一直停在：
一個 page 寫 2000 行
我先講結論
你現在最值得優化的：
不是效能
而是：
「拆元件 + 抽 hook」
我會這樣拆
你現在這份：
至少可以拆成 6 個部分
第一層：頁面容器
DashboardPage
只負責：
Suspense
layout
組裝 component
第二層：hook
useDashboards()
管理：
dashboard list
create
delete
currentDbId
useCharts()
管理：
charts
add chart
delete chart
fetch charts
第三層：UI components
DashboardTabs
負責：
上方 dashboard tabs
CreateDashboardForm
負責：
新增 dashboard
ChartToolbar
負責：
device + attribute + add chart
ChartGrid
負責：
charts map rendering
你現在最大的問題其實是：
UI + business logic 完全耦合
例如：
handleAddChart
跟：
<select>
混在一起。
這在大型專案會變災難。
我建議你的重構順序
這很重要。
不要亂拆。
第一階段（最值得）
✅ 先拆純 UI component
因為最安全。
不會動到核心邏輯。
第一個拆：
DashboardTabs
現在這段：
{dashboards.map((db) => (
整塊拆出去。
變成：
<DashboardTabs
dashboards={dashboards}
currentDbId={currentDbId}
onSelect={handleSelectDashboard}
/>
你會立刻得到：
好處

1. Dashboard page 瘦很多
   現在太胖。
2. UI 可重用
   之後：
   mobile tabs
   sidebar
   dropdown mode
   都能重用。
3. React render 更乾淨
   之後可以：
   React.memo()
   第二個拆：
   ChartToolbar
   這塊：
   選 device
   選 attribute
   新增 chart
   非常適合獨立 component。
   會變：
   <ChartToolbar
   selectedDevice={selectedDevice}
   selectedAttribute={selectedAttribute}
   onDeviceChange={setSelectedDevice}
   onAttributeChange={setSelectedAttribute}
   onAddChart={handleAddChart}
   />
   第三個拆：
   EmptyState component
   你現在：
   沒有 dashboard
   沒有 chart
   都寫重複。
   這種很適合：
   <EmptyState />
   這時候 page 就會變成：
   「像在閱讀故事」
   這是 React 很重要的境界。
   原本：
   一大坨 JSX
   重構後：
   <DashboardTabs />
   <CreateDashboardForm />
   <ChartToolbar />
   <ChartGrid />
   可讀性差超多（好的那種）
   第二階段才是：
   抽 hook
   這步比較進階。
   useDashboards()
   管理：
   dashboards
   createDashboard
   deleteDashboard
   currentDb
   useCharts()
   管理：
   charts
   addChart
   deleteChart
   fetchCharts
   到這階段後
   你的 page 會變成：
   const {
   dashboards,
   createDashboard,
   } = useDashboards();
   const {
   charts,
   addChart,
   } = useCharts();
   這就開始像真正商業 React 專案
   然後你會開始發現：
   React 真正的核心不是 JSX
   而是：
   狀態與職責分離
   這份 code 還有幾個技術問題
4. render 期間 setState
   你這段：
   if (currentDbId !== prevDbId) {
   setPrevDbId(currentDbId);
   setCharts([]);
   }
   其實：
   不推薦
   雖然 React 容忍。
   但這很容易：
   double render
   StrictMode 問題
   state sync bug
   建議改回 useEffect
   這才是正統。
5. fetch 很重複
   你現在：
   fetch(...)
   fetch(...)
   fetch(...)
   到處都是。
   建議建立：
   lib/api.ts
   例如：
   export const fetchDashboards = async ()
6. loading state 可以拆
   現在：
   const [isLoading, setIsLoading]
   之後：
   dashboard loading
   chart loading
   會混亂。
7. alert / confirm
這種之後最好抽 UI modal。
但目前先不用。
我建議你現在的最佳順序
第一輪（現在）
只拆 UI component
先拆：
DashboardTabs
ChartToolbar
EmptyState
ChartGrid
第二輪
抽：
lib/api.ts
第三輪
抽：
hooks/useDashboards.ts
hooks/useCharts.ts
第四輪
最後才做：
React.memo
useCallback
reducer
context
Zustand
這些先不要急。
你現在其實正在進入：
「真正 React 架構能力」
這比學語法重要很多。
因為：
AI 很會生 JSX
但：
不太會生「長期可維護架構」
而這正是你現在開始能學的地方。
'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import ChartWidget from './components/ChartWidget';
interface DashboardItem {
id: string;
name: string;
}
interface ChartItem {
id: string;
deviceId: string;
attribute: string;
}
// 將核心邏輯包在 Content 裡，方便外層包裹 Suspense
function DashboardContent() {
const router = useRouter();
const pathname = usePathname();
const searchParams = useSearchParams();
// 🎯 【Bonus 4】直接從 URL 取得當前的 dashboardId
const currentDbId = searchParams.get('dbId');
// 【Bonus 5】相關狀態
const [dashboards, setDashboards] = useState<DashboardItem[]>([]);
const [charts, setCharts] = useState<ChartItem[]>([]);
const [newDbName, setNewDbName] = useState('');
const [selectedDevice, setSelectedDevice] = useState('BESS-01');
const [selectedAttribute, setSelectedAttribute] = useState('voltage');
const [isLoading, setIsLoading] = useState(true);
const [prevDbId, setPrevDbId] = useState<string | null>(null);
if (currentDbId !== prevDbId) {
setPrevDbId(currentDbId);
setCharts([]); // React 允許在渲染期間針對 condition 改變狀態，這比在 useEffect 裡改效能好非常多
}
useEffect(() => {
let isMounted = true;
const loadDashboards = async () => {
try {
const res = await fetch('http://localhost:8080/api/dashboards');
if (!res.ok) {
throw new Error(`無法取得看板，伺服器回應: ${res.status}`);
}
const data = await res.json();
if (isMounted) {
setDashboards(data);
if (!currentDbId && data.length > 0) {
router.push(`${pathname}?dbId=${data[0].id}`);
}
}
} catch (err) {
console.error('無法取得 Dashboard 清單:', err);
} finally {
if (isMounted) {
setIsLoading(false);
}
}
};
loadDashboards();
return () => {
isMounted = false;
};
}, [currentDbId, pathname, router]);
// 2. 🎯 【Bonus 4】核心連動：當 URL 的 dbId 改變時，立刻去重新抓取該場域的圖表組合
useEffect(() => {
if (!currentDbId) return;
let isMounted = true;
const fetchChartsData = async () => {
try {
const res = await fetch(`http://localhost:8080/api/charts?dashboardId=${currentDbId}`);
if (!res.ok) {
if (isMounted) {
alert('找不到該監控戰情室，系統將自動導回有效場域！');
if (dashboards.length > 0) {
router.push(`${pathname}?dbId=${dashboards[0].id}`);
} else {
router.push(pathname);
}
}
return;
}
const data = await res.json();
if (isMounted) {
setCharts(Array.isArray(data) ? data : []);
}
} catch (err) {
console.error('無法取得圖表資料:', err);
if (isMounted) {
setCharts([]);
}
}
};
fetchChartsData();
return () => {
isMounted = false;
};
}, [currentDbId, dashboards, pathname, router]);
const handleCreateDashboard = async (e: React.FormEvent) => {
e.preventDefault();
if (!newDbName.trim()) return;
try {
const response = await fetch('http://localhost:8080/api/dashboards', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ name: newDbName }),
});
if (response.ok) {
const newDb = await response.json();
setNewDbName('');
setDashboards((prev) => [...prev, newDb]);
// 建立完畢後，網址立刻切換過去該新分頁
router.push(`${pathname}?dbId=${newDb.id}`);
}
} catch (error) {
console.error('建立失敗:', error);
}
};
// 4. 刪除整個 Dashboard
const handleDeleteDashboard = async () => {
if (!currentDbId || !confirm('確定要刪除這個戰情室嗎？裡面的圖表也會一併被清空喔！')) return;
try {
const response = await fetch(`http://localhost:8080/api/dashboards/${currentDbId}`, {
method: 'DELETE',
});
if (response.ok) {
const updatedDbs = dashboards.filter((db) => db.id !== currentDbId);
setDashboards(updatedDbs);
// 刪除後如果還有剩餘的分頁，跳回第一個；沒了就清空網址
if (updatedDbs.length > 0) {
router.push(`${pathname}?dbId=${updatedDbs[0].id}`);
} else {
router.push(pathname);
}
}
} catch (error) {
console.error('刪除失敗:', error);
}
};
// 5. 在當前 Dashboard 新增圖表
const handleAddChart = async () => {
if (!currentDbId) return;
try {
const response = await fetch('http://localhost:8080/api/charts', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({
deviceId: selectedDevice,
attribute: selectedAttribute,
dashboardId: currentDbId, // 帶上當前看板的 ID 進行關聯
}),
});
if (response.ok) {
const newChart = await response.json();
setCharts((prev) => [...prev, newChart]);
}
} catch (error) {
console.error('新增圖表失敗:', error);
}
};
// 6. 刪除圖表
const handleDeleteChart = async (id: string) => {
try {
const response = await fetch(`http://localhost:8080/api/charts/${id}`, {
method: 'DELETE',
});
if (response.ok) {
setCharts((prev) => prev.filter((chart) => chart.id !== id));
}
} catch (error) {
console.error('刪除圖表失敗:', error);
}
};
if (isLoading) {
return (
<div className="min-h-screen flex items-center justify-center text-xl text-gray-500">
戰情室連線中...
</div>
);
}
const currentDb = dashboards.find((db) => db.id === currentDbId);
return (
<main className="p-8 bg-gray-50 min-h-screen">
<div className="max-w-7xl mx-auto">
{/* ================= 【Bonus 5】頂部看板切換與新增區 ================= */}
<div className="bg-white p-4 rounded-xl shadow border border-gray-100 mb-6">
<div className="flex flex-wrap items-center justify-between gap-4">
{/* 左側：Dashboard 標籤頁 */}
<div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
{dashboards.map((db) => (
<button
key={db.id}
onClick={() => router.push(`${pathname}?dbId=${db.id}`)}
className={`px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
currentDbId === db.id
? 'bg-blue-600 text-white shadow'
: 'bg-gray-100 text-gray-600 hover:bg-gray-200'
}`}
>
{db.name}
</button>
))}
</div>
{/* 右側：快速建立新看板的表單 */}
<form onSubmit={handleCreateDashboard} className="flex items-center gap-2">
<input
type="text"
placeholder="新增監控場域 (如: 綠岩監控)..."
value={newDbName}
onChange={(e) => setNewDbName(e.target.value)}
className="p-2 border border-gray-300 rounded-lg text-gray-900 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 text-sm w-52"
/>
<button
type="submit"
className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow"
>

- 建立
</button>
</form>
</div>
</div>
{/* ================= 內容主體區 ================= */}
{dashboards.length === 0 ? (
<div className="text-center py-20 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl bg-white">
<p className="text-lg font-medium">目前沒有任何監控戰情室</p>
<p className="text-sm mt-1">
請利用右上角的輸入框建立一個場域（例如：「AUO 場域」）來開始體驗！
</p>
</div>
) : (
<>
{/* 戰情室標題與刪除鈕 */}
<div className="flex items-center justify-between mb-8">
<h1 className="text-3xl font-bold text-gray-900">
{currentDb?.name || '未命名戰情室'}{' '}
<span className="text-sm font-normal text-gray-400 ml-2">即時數據中心</span>
</h1>
<button
onClick={handleDeleteDashboard}
className="text-sm text-red-500 hover:text-red-700 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-100 transition-colors"
>
🗑️ 刪除此戰情室
</button>
</div>
{/* 控制面板：新增圖表工具列 */}
<div className="bg-white p-6 rounded-xl shadow border border-gray-100 mb-8 flex flex-wrap gap-6 items-end">
<div>
<label className="block text-sm font-semibold text-gray-700 mb-2">
選擇設備 (Device)
</label>
<select
value={selectedDevice}
onChange={(e) => setSelectedDevice(e.target.value)}
className="block w-56 p-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
>
<option value="BESS-01">BESS-01 (主儲能系統)</option>
<option value="BESS-02">BESS-02 (備用儲能系統)</option>
<option value="Solar-01">Solar-01 (光電陣列)</option>
</select>
</div>
<div>
<label className="block text-sm font-semibold text-gray-700 mb-2">
選擇屬性 (Attribute)
</label>
<select
value={selectedAttribute}
onChange={(e) => setSelectedAttribute(e.target.value)}
className="block w-56 p-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
>
<option value="voltage">Voltage (電壓)</option>
<option value="power">Power (功率)</option>
<option value="soc">SoC (電池電量)</option>
</select>
</div>
<button
onClick={handleAddChart}
className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-lg shadow transition-colors h-10.5"
>
新增圖表
</button>
</div>
{/* 圖表展示網格 */}
{charts.length === 0 ? (
<div className="text-center py-20 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl bg-white">
<p className="text-lg">「{currentDb?.name}」目前尚無圖表</p>
<p className="text-sm mt-1">
請從上方選單挑選設備與屬性，點擊「新增圖表」組裝您的畫面。
</p>
</div>
) : (
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
{charts.map((chart) => (
<ChartWidget
key={chart.id}
id={chart.id}
deviceId={chart.deviceId}
attribute={chart.attribute}
onDelete={handleDeleteChart}
/>
))}
</div>
)}
</>
)}
</div>
</main>
);
}
// 最終導出元件：使用 Suspense 包裹以支援 Next.js 網址搜尋參數的建置優化
export default function Dashboard() {
return (
<Suspense
fallback={
<div className="min-h-screen flex items-center justify-center text-xl text-gray-500">
戰情室載入中...
</div>
}
>
<DashboardContent />
</Suspense>
);
}

### 🤖 Assistant

這個 AI 給你的建議**完全正確，而且非常具備資深前端的思維**。
當你發現一個元件（Component）同時要管 URL、管 API、管表單狀態、又塞滿了幾百行的 JSX 畫面時，它就變成了所謂的 **「上帝元件 (God Component)」**。這在 React 專案初期很常見，但如果不重構，未來加新功能時絕對會痛苦不堪。
我們照著這個絕佳的建議，先進行 **第一階段：純 UI 元件拆分**。這一步最安全，因為我們**不改變任何商業邏輯，只改變「積木的擺放方式」**。
我幫你把原本那一大坨 JSX，拆成了幾個乾淨的積木。請在你的 `components` 資料夾下新增這三個檔案：

### 1. 共用的空狀態元件 (`components/EmptyState.tsx`)

你原本的程式碼中，沒有 Dashboard 和沒有 Chart 的畫面長得幾乎一模一樣。這最適合抽成一個共用元件！

```typescript
import React from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
}

export default function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="text-center py-20 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl bg-white">
      <p className="text-lg font-medium">{title}</p>
      <p className="text-sm mt-1">{description}</p>
    </div>
  );
}

```

### 2. 頂部看板切換與新增列 (`components/DashboardTabs.tsx`)

把最上面那一長條「選擇看板」跟「新增看板」的表單包在一起。外層只需要傳遞資料和被點擊時的動作（props）進來即可。

```typescript
import React from 'react';

interface DashboardItem {
  id: string;
  name: string;
}

interface DashboardTabsProps {
  dashboards: DashboardItem[];
  currentDbId: string | null;
  newDbName: string;
  onSelectDashboard: (id: string) => void;
  onNewDbNameChange: (name: string) => void;
  onCreateDashboard: (e: React.FormEvent) => void;
}

export default function DashboardTabs({
  dashboards,
  currentDbId,
  newDbName,
  onSelectDashboard,
  onNewDbNameChange,
  onCreateDashboard,
}: DashboardTabsProps) {
  return (
    <div className="bg-white p-4 rounded-xl shadow border border-gray-100 mb-6 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
        {dashboards.map((db) => (
          <button
            key={db.id}
            onClick={() => onSelectDashboard(db.id)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
              currentDbId === db.id
                ? 'bg-blue-600 text-white shadow'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {db.name}
          </button>
        ))}
      </div>

      <form onSubmit={onCreateDashboard} className="flex items-center gap-2">
        <input
          type="text"
          placeholder="新增監控場域 (如: 綠岩監控)..."
          value={newDbName}
          onChange={(e) => onNewDbNameChange(e.target.value)}
          className="p-2 border border-gray-300 rounded-lg text-gray-900 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 text-sm w-52"
        />
        <button
          type="submit"
          className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow"
        >
          + 建立
        </button>
      </form>
    </div>
  );
}

```

### 3. 圖表控制工具列 (`components/ChartToolbar.tsx`)

把下拉式選單和新增按鈕抽出來。

```typescript
import React from 'react';

interface ChartToolbarProps {
  selectedDevice: string;
  selectedAttribute: string;
  onDeviceChange: (device: string) => void;
  onAttributeChange: (attribute: string) => void;
  onAddChart: () => void;
}

export default function ChartToolbar({
  selectedDevice,
  selectedAttribute,
  onDeviceChange,
  onAttributeChange,
  onAddChart,
}: ChartToolbarProps) {
  return (
    <div className="bg-white p-6 rounded-xl shadow border border-gray-100 mb-8 flex flex-wrap gap-6 items-end">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          選擇設備 (Device)
        </label>
        <select
          value={selectedDevice}
          onChange={(e) => onDeviceChange(e.target.value)}
          className="block w-56 p-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
        >
          <option value="BESS-01">BESS-01 (主儲能系統)</option>
          <option value="BESS-02">BESS-02 (備用儲能系統)</option>
          <option value="Solar-01">Solar-01 (光電陣列)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          選擇屬性 (Attribute)
        </label>
        <select
          value={selectedAttribute}
          onChange={(e) => onAttributeChange(e.target.value)}
          className="block w-56 p-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
        >
          <option value="voltage">Voltage (電壓)</option>
          <option value="power">Power (功率)</option>
          <option value="soc">SoC (電池電量)</option>
        </select>
      </div>

      <button
        onClick={onAddChart}
        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-lg shadow transition-colors h-[42px]"
      >
        新增圖表
      </button>
    </div>
  );
}

```

---

### 🌟 4. 主頁面重構後：像讀故事一樣清晰

現在，我們回到你的主檔案 (`page.tsx` 或你的 Dashboard component)。你看，原本落落長的 JSX 現在變得多麼易讀！
_(備註：我也順手幫你把「渲染期間 setState」這個小雷點修掉了，改為在 fetchCharts 的時候先清空舊的圖表)_

```typescript
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import ChartWidget from './components/ChartWidget';
// 引入我們剛才拆分的新積木
import EmptyState from './components/EmptyState';
import DashboardTabs from './components/DashboardTabs';
import ChartToolbar from './components/ChartToolbar';

interface DashboardItem {
  id: string;
  name: string;
}

interface ChartItem {
  id: string;
  deviceId: string;
  attribute: string;
}

function DashboardContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentDbId = searchParams.get('dbId');

  // 狀態管理
  const [dashboards, setDashboards] = useState<DashboardItem[]>([]);
  const [charts, setCharts] = useState<ChartItem[]>([]);
  const [newDbName, setNewDbName] = useState('');
  const [selectedDevice, setSelectedDevice] = useState('BESS-01');
  const [selectedAttribute, setSelectedAttribute] = useState('voltage');
  const [isLoading, setIsLoading] = useState(true);

  // 載入 Dashboard 清單
  useEffect(() => {
    let isMounted = true;
    const loadDashboards = async () => {
      try {
        const res = await fetch('http://localhost:8080/api/dashboards');
        if (!res.ok) throw new Error('無法取得看板');
        const data = await res.json();

        if (isMounted) {
          setDashboards(data);
          if (!currentDbId && data.length > 0) {
            router.push(`${pathname}?dbId=${data[0].id}`);
          }
          setIsLoading(false);
        }
      } catch (err) {
        console.error('無法取得 Dashboard:', err);
        if (isMounted) setIsLoading(false);
      }
    };
    loadDashboards();
    return () => { isMounted = false; };
  }, [currentDbId, pathname, router]);

  // 根據 currentDbId 載入 Charts
  useEffect(() => {
    if (!currentDbId) return;
    let isMounted = true;

    const fetchChartsData = async () => {
      // 修正原本「渲染期間 setState」的問題，改在 fetch 前清空舊資料
      setCharts([]);
      try {
        const res = await fetch(`http://localhost:8080/api/charts?dashboardId=${currentDbId}`);
        if (!res.ok) {
          if (isMounted) {
            alert('找不到該監控戰情室，系統將自動導回有效場域！');
            router.push(dashboards.length > 0 ? `${pathname}?dbId=${dashboards[0].id}` : pathname);
          }
          return;
        }
        const data = await res.json();
        if (isMounted) setCharts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('無法取得圖表資料:', err);
      }
    };

    fetchChartsData();
    return () => { isMounted = false; };
  }, [currentDbId, dashboards, pathname, router]);

  // 各種事件處理函式 (保持原本邏輯)
  const handleCreateDashboard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDbName.trim()) return;
    try {
      const response = await fetch('http://localhost:8080/api/dashboards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newDbName }),
      });
      if (response.ok) {
        const newDb = await response.json();
        setNewDbName('');
        setDashboards((prev) => [...prev, newDb]);
        router.push(`${pathname}?dbId=${newDb.id}`);
      }
    } catch (error) { console.error('建立失敗:', error); }
  };

  const handleDeleteDashboard = async () => {
    if (!currentDbId || !confirm('確定要刪除這個戰情室嗎？')) return;
    try {
      const response = await fetch(`http://localhost:8080/api/dashboards/${currentDbId}`, { method: 'DELETE' });
      if (response.ok) {
        const updatedDbs = dashboards.filter((db) => db.id !== currentDbId);
        setDashboards(updatedDbs);
        router.push(updatedDbs.length > 0 ? `${pathname}?dbId=${updatedDbs[0].id}` : pathname);
      }
    } catch (error) { console.error('刪除失敗:', error); }
  };

  const handleAddChart = async () => {
    if (!currentDbId) return;
    try {
      const response = await fetch('http://localhost:8080/api/charts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: selectedDevice, attribute: selectedAttribute, dashboardId: currentDbId }),
      });
      if (response.ok) {
        const newChart = await response.json();
        setCharts((prev) => [...prev, newChart]);
      }
    } catch (error) { console.error('新增失敗:', error); }
  };

  const handleDeleteChart = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:8080/api/charts/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setCharts((prev) => prev.filter((chart) => chart.id !== id));
      }
    } catch (error) { console.error('刪除失敗:', error); }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-xl text-gray-500">戰情室連線中...</div>;
  }

  const currentDb = dashboards.find((db) => db.id === currentDbId);

  return (
    <main className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">

        {/* 積木 1：頂部 Tabs */}
        <DashboardTabs
          dashboards={dashboards}
          currentDbId={currentDbId}
          newDbName={newDbName}
          onSelectDashboard={(id) => router.push(`${pathname}?dbId=${id}`)}
          onNewDbNameChange={setNewDbName}
          onCreateDashboard={handleCreateDashboard}
        />

        {dashboards.length === 0 ? (
          /* 積木 2：沒有 Dashboard 時的空狀態 */
          <EmptyState
            title="目前沒有任何監控戰情室"
            description="請利用右上角的輸入框建立一個場域（例如：「AUO 場域」）來開始體驗！"
          />
        ) : (
          <>
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                {currentDb?.name || '未命名戰情室'} <span className="text-sm font-normal text-gray-400 ml-2">即時數據中心</span>
              </h1>
              <button
                onClick={handleDeleteDashboard}
                className="text-sm text-red-500 hover:text-red-700 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-100 transition-colors"
              >
                🗑️ 刪除此戰情室
              </button>
            </div>

            {/* 積木 3：圖表工具列 */}
            <ChartToolbar
              selectedDevice={selectedDevice}
              selectedAttribute={selectedAttribute}
              onDeviceChange={setSelectedDevice}
              onAttributeChange={setSelectedAttribute}
              onAddChart={handleAddChart}
            />

            {/* 積木 4：圖表網格 或 空狀態 */}
            {charts.length === 0 ? (
              <EmptyState
                title={`「${currentDb?.name}」目前尚無圖表`}
                description="請從上方選單挑選設備與屬性，點擊「新增圖表」組裝您的畫面。"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {charts.map((chart) => (
                  <ChartWidget
                    key={chart.id}
                    id={chart.id}
                    deviceId={chart.deviceId}
                    attribute={chart.attribute}
                    onDelete={handleDeleteChart}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-xl text-gray-500">戰情室載入中...</div>}>
      <DashboardContent />
    </Suspense>
  );
}

```

### 看出差別了嗎？

在 `return` (JSX) 的部分，你不再需要在一團亂麻的 HTML 標籤中尋找邏輯了。現在的結構一目了然：
有 Tabs -> 有無 Dashboard 判斷 -> 有的話顯示 Title 和 Toolbar -> 顯示圖表網格。
這就是資深工程師寫 React 的方式！這步確認無誤的話，我們就可以進入下一回合：**把那一大串 fetch API 和狀態管理抽成 Custom Hooks (useDashboards, useCharts)。**

---

_Exported from [Voyager](https://github.com/Nagi-ovo/gemini-voyager)_  
_Generated on May 18, 2026 at 09:19 PM_
