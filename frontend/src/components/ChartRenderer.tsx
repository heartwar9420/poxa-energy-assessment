'use client';

import React from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';

interface ChartRendererProps {
  option: echarts.EChartsOption;
  height?: string;
  notMerge?: boolean;
  renderer?: 'canvas' | 'svg';
}

const ChartRenderer = ({
  option,
  height = '350px',
  notMerge = true,
  renderer = 'canvas',
}: ChartRendererProps) => {
  return (
    <ReactECharts
      option={option}
      notMerge={notMerge}
      lazyUpdate={true}
      opts={{ renderer }}
      style={{ height, width: '100%' }}
    />
  );
};

export default React.memo(ChartRenderer);
