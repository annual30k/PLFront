<template>
  <WallPanel title="告警统计" subtitle="ALARM STATISTICS">
    <div class="alarm-statistics">
      <div class="alarm-donut">
        <div ref="chartRef" class="alarm-donut-chart"></div>
        <div ref="coreRef" class="alarm-donut-core">
          <strong ref="valueRef" :style="{ fontSize: `${centerValueFontSize}px` }">{{ centerTotalText }}</strong>
          <span>告警总数</span>
        </div>
      </div>
      <div class="legend">
        <div v-for="item in legendItems" :key="item.label" class="legend-row">
          <i :style="{ background: item.color }"></i>
          <span>{{ item.label }}</span>
          <b>{{ item.value }}</b>
        </div>
      </div>
    </div>
  </WallPanel>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import * as echarts from 'echarts';
import WallPanel from './WallPanel.vue';
import type { AlarmSummaryMetrics } from '../types';

const props = defineProps<{
  metrics: AlarmSummaryMetrics;
}>();

const chartRef = ref<HTMLDivElement>();
const coreRef = ref<HTMLDivElement>();
const valueRef = ref<HTMLElement>();
const centerValueFontSize = ref(38);
let chart: ReturnType<typeof echarts.init> | undefined;
let resizeObserver: ResizeObserver | undefined;
let measureContext: CanvasRenderingContext2D | undefined;

const knownTotal = computed(() => props.metrics.critical + props.metrics.sos + props.metrics.media + props.metrics.pending);
const displayTotal = computed(() => Math.max(props.metrics.total, knownTotal.value, 1));
const centerTotalText = computed(() => {
  const value = displayTotal.value;
  if (value >= 100000000) return `${Number((value / 100000000).toFixed(value >= 1000000000 ? 0 : 1))}亿`;
  if (value >= 10000) return `${Number((value / 10000).toFixed(value >= 100000 ? 0 : 1))}万`;
  return String(value);
});

const legendItems = computed(() => {
  const other = Math.max(0, displayTotal.value - knownTotal.value);
  return [
    { label: '重点预警', value: props.metrics.critical, color: '#ff697f' },
    { label: 'SOS', value: props.metrics.sos, color: '#ff9f50' },
    { label: '媒体待核', value: props.metrics.media, color: '#23d6ee' },
    { label: '消息待达', value: props.metrics.pending, color: '#5ca8ff' },
    { label: '其他告警', value: other, color: '#1687ff' }
  ].map((item) => ({
    ...item,
    percent: Math.round((item.value / displayTotal.value) * 100)
  }));
});

const chartItems = computed(() => legendItems.value.filter((item) => item.value > 0));

const segmentColor = (color: string) => new echarts.graphic.LinearGradient(0, 0, 1, 1, [
  { offset: 0, color },
  { offset: 0.56, color },
  { offset: 1, color: '#1687ff' }
]);

const renderChart = () => {
  if (!chart) return;
  const data = chartItems.value.length ? chartItems.value : [{ label: '暂无告警', value: 1, color: 'rgba(18, 43, 83, 0.9)' }];
  chart.setOption({
    animation: false,
    tooltip: { show: false },
    series: [
      {
        type: 'pie',
        radius: ['58%', '82%'],
        center: ['50%', '50%'],
        startAngle: 90,
        clockwise: true,
        silent: true,
        avoidLabelOverlap: true,
        label: { show: false },
        labelLine: { show: false },
        itemStyle: {
          borderColor: '#06142f',
          borderWidth: 3,
          borderRadius: 8
        },
        emphasis: { disabled: true },
        data: data.map((item) => ({
          name: item.label,
          value: item.value,
          itemStyle: {
            color: typeof item.color === 'string' && item.color.startsWith('rgba') ? item.color : segmentColor(item.color),
            shadowBlur: 14,
            shadowColor: item.color
          }
        }))
      },
      {
        type: 'pie',
        radius: ['88%', '91%'],
        center: ['50%', '50%'],
        startAngle: 90,
        silent: true,
        label: { show: false },
        labelLine: { show: false },
        data: [
          {
            value: 100,
            itemStyle: {
              color: 'rgba(21, 96, 170, 0.28)'
            }
          }
        ]
      }
    ]
  }, true);
};

const resizeChart = () => {
  chart?.resize();
  fitCenterValue();
};

const getMeasureContext = () => {
  if (measureContext || typeof document === 'undefined') return measureContext;
  measureContext = document.createElement('canvas').getContext('2d') || undefined;
  return measureContext;
};

const fitCenterValue = () => {
  void nextTick(() => {
    const core = coreRef.value;
    const value = valueRef.value;
    const context = getMeasureContext();
    if (!core || !value || !context) return;

    const rect = core.getBoundingClientRect();
    const text = centerTotalText.value;
    const maxFontSize = Math.min(38, Math.max(22, rect.width * 0.52));
    const minFontSize = 11;
    const maxTextWidth = rect.width * 0.86;
    const maxTextHeight = rect.height * 0.44;
    context.font = `800 ${maxFontSize}px "Microsoft YaHei", "PingFang SC", Arial, sans-serif`;
    const measuredWidth = Math.max(1, context.measureText(text).width);
    const widthFit = maxFontSize * (maxTextWidth / measuredWidth);
    centerValueFontSize.value = Math.floor(Math.max(minFontSize, Math.min(maxFontSize, widthFit, maxTextHeight)));
  });
};

onMounted(async () => {
  await nextTick();
  if (!chartRef.value) return;
  chart = echarts.init(chartRef.value);
  renderChart();
  resizeObserver = new ResizeObserver(resizeChart);
  resizeObserver.observe(chartRef.value);
  if (coreRef.value) resizeObserver.observe(coreRef.value);
  window.addEventListener('resize', resizeChart);
  fitCenterValue();
});

watch(() => legendItems.value.map((item) => `${item.label}:${item.value}:${item.percent}`).join('|'), () => {
  renderChart();
  fitCenterValue();
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  window.removeEventListener('resize', resizeChart);
  chart?.dispose();
});
</script>

<style scoped lang="scss">
.alarm-statistics {
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  gap: clamp(8px, 0.84vw, 12px);
  align-items: end;
  height: 100%;
  min-height: 0;
  padding: clamp(1px, 0.32vw, 6px) clamp(8px, 0.82vw, 14px) clamp(6px, 0.72vw, 11px);
  box-sizing: border-box;
}

.alarm-donut {
  width: min(100%, clamp(118px, 8.8vw, 156px));
  aspect-ratio: 1;
  justify-self: center;
  align-self: center;
  border-radius: 50%;
  position: relative;
  box-shadow:
    0 0 24px rgba(14, 165, 233, 0.34),
    inset 0 0 18px rgba(0, 0, 0, 0.35);
}

.alarm-donut-chart {
  position: absolute;
  inset: -6%;
  z-index: 1;
}

.alarm-donut::before,
.alarm-donut::after,
.alarm-donut-core {
  content: '';
  position: absolute;
  border-radius: 50%;
}

.alarm-donut::before {
  inset: -6%;
  background:
    radial-gradient(circle, transparent 58%, rgba(32, 223, 255, 0.16) 59%, transparent 72%),
    radial-gradient(circle, rgba(32, 223, 255, 0.18), transparent 66%);
  filter: blur(0.2px);
}

.alarm-donut::after {
  inset: 8%;
  background:
    radial-gradient(circle, transparent 58%, rgba(9, 54, 113, 0.68) 59%, rgba(6, 22, 50, 0.28) 78%, transparent 79%);
  box-shadow:
    inset 0 0 18px rgba(0, 168, 255, 0.13),
    0 0 12px rgba(2, 6, 23, 0.7);
  z-index: 0;
}

.alarm-donut-core {
  inset: 21%;
  z-index: 2;
  display: grid;
  place-items: center;
  align-content: center;
  text-align: center;
  background: radial-gradient(circle, rgba(5, 20, 45, 0.98), rgba(1, 7, 19, 0.98));
  box-shadow:
    inset 0 0 16px rgba(34, 211, 238, 0.14),
    0 0 18px rgba(2, 8, 23, 0.55);
}

.alarm-donut-core strong {
  color: #eff6ff;
  line-height: 0.98;
  font-weight: 800;
  max-width: 86%;
  overflow: hidden;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  text-shadow:
    0 0 8px rgba(255, 255, 255, 0.42),
    0 0 14px rgba(34, 211, 238, 0.38);
}

.alarm-donut-core span {
  margin-top: clamp(3px, 0.36vw, 6px);
  color: #cfe8ff;
  font-size: clamp(10px, 0.75vw, 13px);
  white-space: nowrap;
}

.legend {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(6px, 0.58vw, 9px) clamp(10px, 0.9vw, 14px);
  width: 100%;
  min-width: 0;
  color: #bfdbfe;
  align-self: end;
}

.legend-row {
  display: grid;
  grid-template-columns: 8px minmax(50px, 1fr) minmax(24px, auto);
  gap: clamp(5px, 0.44vw, 7px);
  align-items: center;
  min-width: 0;
  font-size: clamp(10px, 0.72vw, 13px);
  line-height: 1.1;
}

.legend-row i {
  display: inline-block;
  width: clamp(6px, 0.52vw, 8px);
  height: clamp(6px, 0.52vw, 8px);
  border-radius: 50%;
  box-shadow: 0 0 8px currentColor;
}

.legend-row span {
  min-width: 0;
  overflow: hidden;
  color: #c7defc;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.legend-row b {
  color: #9bd7ff;
  font-weight: 800;
  text-align: right;
}

@media (max-width: 1366px), (max-height: 760px) {
  .alarm-statistics {
    grid-template-rows: minmax(0, 1fr) auto;
    gap: 6px;
    padding: 1px 7px 7px;
  }

  .alarm-donut {
    width: min(100%, 124px);
  }

  .legend-row {
    grid-template-columns: 7px minmax(44px, 1fr) minmax(22px, auto);
    gap: 5px;
    font-size: 11px;
  }
}
</style>
