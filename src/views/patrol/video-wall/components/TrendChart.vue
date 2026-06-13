<template>
  <div class="trend-chart-wrapper">
    <div ref="chartRef" class="trend-chart"></div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import * as echarts from 'echarts';

const props = withDefaults(defineProps<{
  bars: number[];
  labels?: string[];
}>(), {
  labels: () => []
});

const chartRef = ref<HTMLDivElement>();
let chart: ReturnType<typeof echarts.init> | undefined;
let resizeObserver: ResizeObserver | undefined;

const axisLabels = computed(() => {
  if (props.labels.length === props.bars.length) return props.labels;
  return props.bars.map((_, index) => {
    if (props.bars.length === 1) return '00:00';
    const hour = Math.round((index / (props.bars.length - 1)) * 24);
    return `${String(hour).padStart(2, '0')}:00`;
  });
});

const renderChart = () => {
  if (!chart) return;
  chart.setOption({
    animation: false,
    grid: {
      left: 28,
      right: 12,
      top: 10,
      bottom: 24
    },
    tooltip: { show: false },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: axisLabels.value,
      axisLine: { lineStyle: { color: 'rgba(96, 165, 250, .52)' } },
      axisTick: { show: false },
      axisLabel: {
        color: '#69b7ff',
        fontSize: 11,
        interval: Math.max(0, Math.floor(props.bars.length / 5))
      }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      splitNumber: 4,
      axisLabel: {
        color: '#69b7ff',
        fontSize: 11
      },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: {
        lineStyle: {
          color: 'rgba(56, 189, 248, .14)'
        }
      }
    },
    series: [
      {
        type: 'line',
        data: props.bars,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          width: 3,
          color: '#18c8ff',
          shadowBlur: 10,
          shadowColor: 'rgba(34, 211, 238, .6)'
        },
        itemStyle: {
          color: '#22d3ee',
          borderColor: '#dff7ff',
          borderWidth: 1
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(24, 200, 255, .5)' },
            { offset: 0.7, color: 'rgba(37, 99, 235, .16)' },
            { offset: 1, color: 'rgba(2, 6, 23, .02)' }
          ])
        }
      }
    ]
  }, true);
};

const resizeChart = () => {
  chart?.resize();
};

onMounted(async () => {
  await nextTick();
  if (!chartRef.value) return;
  chart = echarts.init(chartRef.value);
  renderChart();
  resizeObserver = new ResizeObserver(resizeChart);
  resizeObserver.observe(chartRef.value);
  window.addEventListener('resize', resizeChart);
});

watch(() => [props.bars, props.labels], renderChart, { deep: true });

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  window.removeEventListener('resize', resizeChart);
  chart?.dispose();
});
</script>

<style scoped lang="scss">
.trend-chart-wrapper {
  height: 100%;
  min-height: clamp(72px, 10vh, 110px);
  background:
    repeating-linear-gradient(0deg, rgba(56, 189, 248, 0.12) 0 1px, transparent 1px 24px),
    repeating-linear-gradient(90deg, rgba(37, 99, 235, 0.07) 0 1px, transparent 1px 56px),
    linear-gradient(180deg, rgba(7, 32, 67, 0.62), rgba(3, 17, 39, 0.88));
  border: 1px solid rgba(0, 149, 255, 0.28);
  box-shadow:
    inset 0 0 26px rgba(0, 154, 255, 0.13),
    inset 0 1px 0 rgba(125, 211, 252, 0.1);
}

.trend-chart {
  width: 100%;
  height: 100%;
  min-height: 0;
}
</style>
