# Code Review: 尋找潛在漏洞

**Date**: May 18, 2026 at 09:16 PM
**Turns**: 3
**Source**: [Gemini Chat](https://gemini.google.com/u/1/app/2b6a200485aaf67e?hl=zh-TW&pageId=none)

---

## Turn 1

### 👤 User

我寫了一段程式碼如下：'use client';
import React, { useState, Suspense } from 'react';
import ChartWidget from '@/components/ChartWidget';
import EmptyState from '@/components/EmptyState';
import DashboardTabs from '@/components/DashboardTabs';
import ChartToolbar from '@/components/ChartToolbar';
import { useDashboards } from '@/hooks/useDashboards';
import { useCharts } from '@/hooks/useCharts';
function DashboardContent() {
const {
dashboards,
currentDbId,
currentDb,
isLoading,
createDashboard,
deleteDashboard,
selectDashboard,
} = useDashboards();
const { displayCharts, addChart, deleteChart } = useCharts(currentDbId);
const [newDbName, setNewDbName] = useState('');
const [selectedDevice, setSelectedDevice] = useState('BESS-01');
const [selectedAttribute, setSelectedAttribute] = useState('voltage');
const handleCreateDashboard = async (e: React.FormEvent) => {
e.preventDefault();
const success = await createDashboard(newDbName);
if (success) setNewDbName('');
};
if (isLoading) {
return (
<div className="min-h-screen flex items-center justify-center text-xl text-gray-500">
系統載入中...
</div>
);
}
return (
<main className="p-8 bg-gray-50 min-h-screen">
<div className="max-w-7xl mx-auto">
<DashboardTabs
dashboards={dashboards}
currentDbId={currentDbId}
newDbName={newDbName}
onSelectDashboard={selectDashboard}
onNewDbNameChange={setNewDbName}
onCreateDashboard={handleCreateDashboard}
/>
{dashboards.length === 0 ? (
<EmptyState
title="目前沒有任何監控儀表板"
description="請利用右上角的輸入框建立一個場域（例如：「AUO 場域」）來開始體驗！"
/>
) : (
<>
<div className="flex items-center justify-between mb-8">
<h1 className="text-3xl font-bold text-gray-900">
{currentDb?.name || '未命名儀表板'}{' '}
<span className="text-sm font-normal text-gray-400 ml-2">即時數據中心</span>
</h1>
<button
onClick={deleteDashboard}
className="text-sm text-red-500 hover:text-red-700 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-100 transition-colors"
>
🗑️ 刪除此儀表板
</button>
</div>
<ChartToolbar
selectedDevice={selectedDevice}
selectedAttribute={selectedAttribute}
onDeviceChange={setSelectedDevice}
onAttributeChange={setSelectedAttribute}
onAddChart={() => addChart(selectedDevice, selectedAttribute)}
/>
{displayCharts.length === 0 ? (
<EmptyState
title={`「${currentDb?.name}」目前尚無圖表`}
description="請從上方選單挑選設備與屬性，點擊「新增圖表」組裝您的畫面。"
/>
) : (
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
{displayCharts.map((chart) => (
<ChartWidget
key={chart.id}
id={chart.id}
deviceId={chart.deviceId}
attribute={chart.attribute}
onDelete={deleteChart}
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
<Suspense
fallback={
<div className="min-h-screen flex items-center justify-center text-xl text-gray-500">
監控中心載入中...
</div>
}
>
<DashboardContent />
</Suspense>
);
}
請你啟動左右互博模式，分成兩個角色對這段程式碼進行 Code Review：
角色 A（原創作者）： 護短、自信，認為這段程式碼很完美，沒有記憶體洩漏（Memory Leak）或競態條件（Race Condition）的問題。
角色 B（資深靠北型 QA/檢查員）： 極度挑剔、雞蛋裡挑骨頭，專門尋找極端狀況（例如：使用者狂點按鈕、網路極慢、元件突然被 unmount、State 非同步更新打架等）。
請讓 B 先發制人提出 3 個潛在漏洞，再讓 A 嘗試反駁或修補。最後請整理出一份「最終修復版程式碼」。

### 🤖 Assistant

這是一場發生在 Code Review 會議室裡的激烈交鋒。

---

### 🥊 第一回合：角色 B（資深靠北型 QA）先發制人
**B（眉頭一皺，推了一下粗框眼鏡）：**
「這段 code 是你寫的？看起來很乾淨嘛，但根本是個『快樂路徑（Happy Path）』的產物。你完全沒考慮到真實世界的使用者有多失控、網路有多雷。我隨便看一眼就抓出三個潛在漏洞：」

1. **「瘋狂連點」與「空值轟炸」的競態條件（Race Condition）**
「你的 `handleCreateDashboard` 裡面，完全沒有防止重複提交的機制。要是使用者網路很慢，按鈕按下去沒反應，你猜他會怎麼做？他會**狂點十次**！你的 `createDashboard` 就會被觸發十次。更扯的是，你連 `newDbName` 是不是空字串都沒檢查，直接送出？後端要是沒擋好，資料庫直接塞滿無名屍！」
2. **非同步回呼造成的狀態覆蓋（State Overwrite）**
「看看這行：`const success = await createDashboard(newDbName); if (success) setNewDbName('');`。假設網路超級慢，Request 去了 3 秒才回來。這 3 秒內，急性子的使用者已經在 input 框裡開始打下一個 Dashboard 的名字了。結果你 API 一成功，直接 `setNewDbName('')`，把人家剛打好的字清空？使用者會氣到砸鍵盤的。」
3. **刪除按鈕是「核彈級地雷」，沒有鎖也沒有確認**
「刪除按鈕竟然只綁了個 `onClick={deleteDashboard}`？沒有防連點機制就算了，連個 `window.confirm` 確認對話框都沒有？要是使用者手抖不小心點到，或者正在滑動螢幕誤觸，他的儀表板就這樣灰飛煙滅了？而且如果 `deleteDashboard` 是非同步的，狂點刪除一樣會引發一連串的 API 報錯。」

---

### 🛡️ 第二回合：角色 A（原創作者）的強力反擊與妥協
**A（雙手抱胸，不甘示弱）：**
「咳，你說得也太誇張了吧！我的架構理念是『職責分離』好嗎？」

1. **關於連點與空值：**
「空值跟連點的問題，我原本的設計是讓 `useDashboards` 這個 Hook 去負責阻擋的！Hook 裡面應該要有防呆跟 debounce 呀！不過算了，你說的對，**UI 層確實應該要有視覺上的回饋（Loading 狀態）** 並且 disabled 按鈕，這樣 UX 比較好。我會在表單加上 `isSubmitting` 的狀態，並且加上 `newDbName.trim()` 的檢查。」
2. **關於非同步狀態覆蓋：**
「這個……（冒冷汗），好啦我承認這是一個 Edge Case。以前 React 17 還有 Memory Leak 警告，雖然 React 18 移除了 unmounted 警告，但在 Pending 期間使用者改了 input 確實會被打亂。解決辦法很簡單：**在送出表單的期間，直接把 Input 框給 disabled 掉**。這樣使用者在等待時就不能打字，自然不會有被清空的問題。」
3. **關於刪除按鈕的核彈地雷：**
「誰會沒事去點那個紅色的垃圾桶啦！但既然你這個 QA 這麼愛挑剔，我就加個 `window.confirm` 防呆，再順手給刪除動作加上一個暫停鎖（`isDeleting`），確保刪除 API 執行時按鈕會反灰，這樣滿意了吧？」

---

### 🛠️ 最終回合：融合兩方意見的「最終修復版程式碼」
經過雙方激烈的爭辯，A 摸摸鼻子，把缺乏防護機制的地方全部補上了狀態鎖、防呆驗證以及防止非同步競態條件的處理。

```typescript
'use client';

import React, { useState, Suspense } from 'react';
import ChartWidget from '@/components/ChartWidget';
import EmptyState from '@/components/EmptyState';
import DashboardTabs from '@/components/DashboardTabs';
import ChartToolbar from '@/components/ChartToolbar';

import { useDashboards } from '@/hooks/useDashboards';
import { useCharts } from '@/hooks/useCharts';

function DashboardContent() {
  const {
    dashboards,
    currentDbId,
    currentDb,
    isLoading: isDashboardsLoading,
    createDashboard,
    deleteDashboard,
    selectDashboard,
  } = useDashboards();

  const { displayCharts, addChart, deleteChart } = useCharts(currentDbId);

  const [newDbName, setNewDbName] = useState('');
  const [selectedDevice, setSelectedDevice] = useState('BESS-01');
  const [selectedAttribute, setSelectedAttribute] = useState('voltage');
  
  // 新增：UI 狀態鎖，防止狂點與非同步問題
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreateDashboard = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 防呆 1：阻擋空值提交
    const trimmedName = newDbName.trim();
    if (!trimmedName || isCreating) return;

    setIsCreating(true);
    try {
      const success = await createDashboard(trimmedName);
      // 防呆 2：只有在成功時才清空，且因為 input 期間被 disabled，不會覆蓋使用者新打的字
      if (success) {
        setNewDbName('');
      }
    } catch (error) {
      console.error('建立儀表板失敗:', error);
      // 可以在這裡加入 Toast 提示
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteDashboard = async () => {
    if (isDeleting) return;
    
    // 防呆 3：危險操作的二次確認
    if (!window.confirm(`確定要刪除「${currentDb?.name || '此儀表板'}」嗎？此動作無法復原。`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteDashboard();
    } catch (error) {
      console.error('刪除儀表板失敗:', error);
    } finally {
      // 若刪除後元件被 unmount，React 18 會自動處理，但若留在原頁面則解鎖
      setIsDeleting(false); 
    }
  };

  // 統一載入狀態命名，避免與其他 loading 混淆
  if (isDashboardsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl text-gray-500">
        系統載入中...
      </div>
    );
  }

  return (
    <main className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <DashboardTabs
          dashboards={dashboards}
          currentDbId={currentDbId}
          newDbName={newDbName}
          onSelectDashboard={selectDashboard}
          onNewDbNameChange={setNewDbName}
          onCreateDashboard={handleCreateDashboard}
          // 傳入 disabled 狀態給 Tabs 內的 input 和 button，防止非同步輸入打架
          isCreating={isCreating} 
        />

        {dashboards.length === 0 ? (
          <EmptyState
            title="目前沒有任何監控儀表板"
            description="請利用右上角的輸入框建立一個場域（例如：「AUO 場域」）來開始體驗！"
          />
        ) : (
          <>
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                {currentDb?.name || '未命名儀表板'}{' '}
                <span className="text-sm font-normal text-gray-400 ml-2">即時數據中心</span>
              </h1>
              <button
                onClick={handleDeleteDashboard}
                disabled={isDeleting}
                className={`text-sm font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                  isDeleting 
                    ? 'text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed' 
                    : 'text-red-500 hover:text-red-700 hover:bg-red-50 border-transparent hover:border-red-100'
                }`}
              >
                {isDeleting ? '🗑️ 刪除中...' : '🗑️ 刪除此儀表板'}
              </button>
            </div>

            <ChartToolbar
              selectedDevice={selectedDevice}
              selectedAttribute={selectedAttribute}
              onDeviceChange={setSelectedDevice}
              onAttributeChange={setSelectedAttribute}
              onAddChart={() => addChart(selectedDevice, selectedAttribute)}
            />

            {displayCharts.length === 0 ? (
              <EmptyState
                title={`「${currentDb?.name}」目前尚無圖表`}
                description="請從上方選單挑選設備與屬性，點擊「新增圖表」組裝您的畫面。"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {displayCharts.map((chart) => (
                  <ChartWidget
                    key={chart.id}
                    id={chart.id}
                    deviceId={chart.deviceId}
                    attribute={chart.attribute}
                    onDelete={deleteChart}
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
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-xl text-gray-500">
          監控中心載入中...
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}

```

## Turn 2

### 👤 User

現在如果同時加入100個圖表就會出現明顯的卡頓情況 是為什麼？ 要怎麼修改？

### 🤖 Assistant

同時加入 100 個圖表會產生明顯的卡頓，在前端開發中是非常經典的效能瓶頸。這不是你的程式碼寫錯了，而是瀏覽器與硬體的物理限制。
以下為你剖析「為什麼會卡」以及「該怎麼修改」的具體方案：

### 🚨 為什麼會卡？（四大效能殺手）

1. **DOM 節點與渲染超載 (DOM Overload)**
圖表（如 ECharts, Chart.js, Recharts）底層通常是由極其複雜的 SVG 節點或 Canvas 畫布組成。當你瞬間要求瀏覽器計算 100 個圖表的佈局 (Layout) 並繪製 (Paint) 到畫面上時，會瞬間塞爆瀏覽器的「主執行緒 (Main Thread)」，導致畫面凍結、無法點擊任何東西。
2. **網路請求塞車 (Network Congestion)**
如果你的 `<ChartWidget/>` 元件會在 `mount` 時自動去打 API 拿即時數據，同時掛載 100 個圖表等於瞬間發出 100 個 API 請求。現代瀏覽器對同一個網域通常有 **6 個併發請求的限制**，剩下的 94 個請求會在隊列中排隊乾等，這會拖垮整個應用程式的網路效能。
3. **記憶體飆升與事件監聽器氾濫**
每個圖表套件通常會綁定 `window.resize` 事件來達到 RWD 效果，甚至可能建立了 WebSocket 連線。100 個圖表等於 100 個 resize 監聽器和龐大的記憶體佔用。
4. **React 的 Reconciliation 負擔**
當父層的 state 更新（例如 `displayCharts` 陣列瞬間塞入 100 筆資料），React 需要去比對 (Diff) 這 100 個子元件的 Virtual DOM，這同樣會消耗極大的 CPU 資源。

---

### 🛠️ 要怎麼修改？（解決方案）
針對這個問題，我們需要從「產品邏輯」到「技術實作」來分層次解決。以下提供最有效的幾種修改方式：

#### 方案一：從產品面下手 —— 加入分頁或數量上限（最根本且最建議）
**人類的眼睛無法同時觀看 100 個圖表。**
如果這是一個監控儀表板，最合理的做法是限制一個 Dashboard 只能放 10~20 個圖表。如果超過，請使用者建立「第二個儀表板」或採用分頁。

- **實作：** 在 `addChart` 函式裡加上 `if (displayCharts.length >= 20) return alert('一個儀表板最多只能容納 20 個圖表');`

#### 方案二：懶加載 / 可視區域渲染 (Intersection Observer)
如果業務邏輯死活要求一定要在同一頁塞 100 個，那你**只應該渲染「出現在螢幕可視範圍內」的圖表**。看不見的圖表，只顯示一個空白的「骨架屏 (Skeleton)」，不要去畫圖，也不要去打 API。
你可以修改 `<ChartWidget/>`，加入 `IntersectionObserver` 機制：

```typescript
'use client';
import React, { useState, useEffect, useRef } from 'react';

// 假設這是你原本很耗效能的真實圖表元件
import HeavyChartComponent from './HeavyChartComponent'; 

export default function ChartWidget({ id, deviceId, attribute, onDelete }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 建立一個觀察者，監聽這個元件是否進入螢幕畫面
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // 一旦看見了，就停止觀察，保持圖表渲染 (或依需求保留觀察)
          observer.disconnect(); 
        }
      },
      { threshold: 0.1 } // 只要元件露出 10% 就觸發
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="h-64 border rounded-lg p-4 bg-white shadow-sm relative">
      {/* 刪除按鈕等 UI 可以先渲染 */}
      <button onClick={() => onDelete(id)} className="absolute top-2 right-2 z-10">❌</button>

      {/* 關鍵：只有進入畫面時，才去渲染真正的圖表與發送 API */}
      {isVisible ? (
        <HeavyChartComponent deviceId={deviceId} attribute={attribute} />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-50 animate-pulse">
          <span className="text-gray-400">圖表載入中...</span>
        </div>
      )}
    </div>
  );
}

```

#### 方案三：虛擬列表 (Virtualization / Windowing)
如果你用的是 Grid 或 List，且圖表數量可能高達幾百個，這時單純用方案二還是會讓 DOM 節點不斷增加。這時候需要引入「虛擬列表」技術，**真正存在 DOM 樹上的節點永遠只有螢幕上的那 6~8 個**，滑動時動態替換內容。

- **推薦套件：**`@tanstack/react-virtual` 或 `react-window`。
- **適用情境：** 你的圖表高度是固定的，且排列呈現規則的網格 (Grid) 或列表。

#### 方案四：分批非同步掛載 (Time Slicing / Chunking)
如果你的情境是「一鍵載入之前儲存的 100 個圖表配置」，瞬間 `setCharts(100個)` 會卡死。你可以把 100 個圖表切成小塊，利用 `setTimeout` 或 `requestAnimationFrame` 分批塞入畫面，讓瀏覽器有喘息的空間。

```typescript
// 示意寫法：不要一次 setState 100 個，分批渲染
const loadChartsInBatches = async (allCharts) => {
  const batchSize = 10;
  for (let i = 0; i < allCharts.length; i += batchSize) {
    const batch = allCharts.slice(i, i + batchSize);
    setDisplayCharts(prev => [...prev, ...batch]);
    
    // 等待下一次瀏覽器重繪，讓出主執行緒
    await new Promise(resolve => requestAnimationFrame(resolve));
  }
};

```

### 🎯 總結建議

1. **首選：** 和 PM/企劃討論，直接在介面上**限制數量**（例如上限 20 個）。
2. **次選：** 在 `ChartWidget` 中實作 **Intersection Observer** (方案二)，畫面外的圖表只顯示骨架屏，不抓資料、不繪圖。這能用最少的程式碼變動解決 90% 的卡頓感。

## Turn 3

### 👤 User

'use client';
import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useTelemetry } from '@/hooks/useTelemetry';
interface ChartWidgetProps {
id: string;
deviceId: string;
attribute: string;
onDelete: (id: string) => void;
}
const ATTRIBUTE_COLORS: Record<string, string> = {
voltage: '#3b82f6', // 藍色
power: '#10b981', // 綠色
current: '#f59e0b', // 橘色
};
const DEFAULT_COLOR = '#6366f1'; // 預設紫色
export default function ChartWidget({ id, deviceId, attribute, onDelete }: ChartWidgetProps) {
const chartData = useTelemetry(deviceId, attribute);
const chartOption = useMemo(() => {
const times = chartData.map((d) => d.timeLabel);
const values = chartData.map((d) => d.value);
const themeColor = ATTRIBUTE_COLORS[attribute] ?? DEFAULT_COLOR;
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
color: themeColor,
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
<ReactECharts option={chartOption} style={{ height: '260px', width: '100%' }} />
</div>
);
}
現在在 1920*1080 的畫面上 一次看到最多的是6張圖表 但我就是想要壓力測試 讓他一次有很多圖表 又不要讓他卡頓 可以嗎 要怎麼改？

### 🤖 Assistant

既然你想要正面對決，做真正的「壓力測試」挑戰前端極限，那我們就用技術來解決。
在 1920*1080 的螢幕上，既然最多只能同時看見 6 張圖表，剩下的 94 張圖表其實在螢幕外「空轉」。ECharts 是基於 Canvas 繪圖的，非常吃 CPU 和記憶體。
為了讓畫面絲滑不卡頓，我們必須引入 **「Intersection Observer（可視區域觀測器）」**，搭配 **「固定高度佔位符（Skeleton）」**。

### 核心改造邏輯：

1. **螢幕外的圖表「不要畫」**：只渲染一個灰色的佔位區塊。
2. **提前預載（rootMargin）**：設定在快要滑動到該圖表的前 `200px` 時，就提早開始繪製，這樣使用者滑動時就不會看到破綻。
3. **跳過運算**：如果圖表不在畫面上，連 `useMemo` 裡面的資料 map 迴圈都省下來不跑。
4. **⚠️ 絕對關鍵：固定外層容器高度**：因為圖表會在「渲染」與「不渲染」之間切換，如果外層容器沒有固定高度，你的卷軸（Scrollbar）會瘋狂亂跳。

### 改造後的 `ChartWidget.tsx`：

```typescript
'use client';

import React, { useMemo, useRef, useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { useTelemetry } from '@/hooks/useTelemetry';

interface ChartWidgetProps {
  id: string;
  deviceId: string;
  attribute: string;
  onDelete: (id: string) => void;
}

const ATTRIBUTE_COLORS: Record<string, string> = {
  voltage: '#3b82f6', // 藍色
  power: '#10b981',   // 綠色
  current: '#f59e0b', // 橘色
};
const DEFAULT_COLOR = '#6366f1'; // 預設紫色

export default function ChartWidget({ id, deviceId, attribute, onDelete }: ChartWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 紀錄此元件是否在螢幕可視範圍內（或即將進入可視範圍）
  const [isVisible, setIsVisible] = useState(false);
  
  // Hook 必須放在頂層，不能寫在 if 裡面
  const chartData = useTelemetry(deviceId, attribute);

  // 1. 建立 Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // 當元件進入螢幕範圍，或離開螢幕範圍時，更新狀態
        setIsVisible(entry.isIntersecting);
      },
      { 
        // rootMargin 很重要：在距離螢幕邊緣 200px 的時候就提早觸發，讓 ECharts 有時間渲染，使用者就不會看到白畫面
        rootMargin: '200px',
        threshold: 0 
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // 2. 只有在 isVisible = true 的時候，才去執行耗時的資料整理
  const chartOption = useMemo(() => {
    if (!isVisible || !chartData) return {};

    const times = chartData.map((d) => d.timeLabel);
    const values = chartData.map((d) => d.value);
    const themeColor = ATTRIBUTE_COLORS[attribute] ?? DEFAULT_COLOR;

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
          color: themeColor,
          lineStyle: { width: 2.5 },
        },
      ],
    };
  }, [chartData, deviceId, attribute, isVisible]);

  return (
    {/* 3. 關鍵：設定固定的 min-height (padding 24*2 + chart 260 = 308px)，防止畫面滾動時抖動 */}
    <div 
      ref={containerRef} 
      className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative hover:shadow-md transition-shadow min-h-[308px]"
    >
      <button
        onClick={() => onDelete(id)}
        className="absolute top-4 right-4 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all w-8 h-8 flex items-center justify-center rounded-full z-10"
      >
        ✕
      </button>

      {/* 4. 根據 isVisible 決定要渲染 ECharts 還是骨架屏 (Skeleton) */}
      {isVisible ? (
        <ReactECharts 
          option={chartOption} 
          style={{ height: '260px', width: '100%' }} 
          notMerge={true} 
          lazyUpdate={true} 
        />
      ) : (
        <div className="h-[260px] w-full flex items-center justify-center bg-gray-50/50 rounded-lg animate-pulse">
          <span className="text-gray-400 text-sm">Waiting to render...</span>
        </div>
      )}
    </div>
  );
}

```

### 💡 壓力測試進階建議（網路層面）
這段程式碼解決了**瀏覽器渲染（繪圖）的卡頓**。但如果你一次掛載 100 個元件，`useTelemetry` 這個 Hook 如果裡面有打 API 或建立 WebSocket，**它仍然會同時發起 100 個連線**，這會把瀏覽器的網路請求塞爆。
如果你有權限修改 `useTelemetry`，強烈建議把 `isVisible` 當作參數傳給它。如果圖表不在畫面上，連 API 都不要去打（暫停 Polling）：

```typescript
// 假設你能修改 useTelemetry，讓它支援暫停功能
const chartData = useTelemetry(deviceId, attribute, { pause: !isVisible });

```
這樣一來，你的 100 張圖表儀表板就會變成一個真正的效能怪獸：**只有滑到螢幕上的 6 張圖表會消耗 CPU 繪圖並發送網路請求**，剩下的 94 張全部在冬眠，保證順暢。

---

*Exported from [Voyager](https://github.com/Nagi-ovo/gemini-voyager)*  
*Generated on May 18, 2026 at 09:16 PM*