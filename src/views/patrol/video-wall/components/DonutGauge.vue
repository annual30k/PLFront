<template>
  <div class="donut" :class="className">
    <div ref="chartRef" class="donut-chart"></div>
    <div class="donut-center">
      <strong>{{ value }}</strong>
      <span>{{ label }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import * as echarts from 'echarts';

const props = withDefaults(defineProps<{
  value: string | number;
  label: string;
  percent?: number;
  className?: string;
}>(), {
  percent: 68,
  className: ''
});

const chartRef = ref<HTMLDivElement>();
let chart: ReturnType<typeof echarts.init> | undefined;
let resizeObserver: ResizeObserver | undefined;

const normalizedPercent = computed(() => Math.min(100, Math.max(0, Number(props.percent) || 0)));

const renderChart = () => {
  if (!chart) return;
  const isStorage = props.className.includes('storage');
  const activeColor = isStorage
    ? new echarts.graphic.LinearGradient(0, 0, 1, 1, [
      { offset: 0, color: '#38d9ff' },
      { offset: 1, color: '#1769ff' }
    ])
    : new echarts.graphic.LinearGradient(0, 0, 1, 1, [
      { offset: 0, color: '#20dfff' },
      { offset: 0.45, color: '#1597ff' },
      { offset: 1, color: '#ff6b78' }
    ]);

  chart.setOption({
    animation: false,
    tooltip: { show: false },
    series: [
      {
        type: 'pie',
        radius: ['70%', '92%'],
        center: ['50%', '50%'],
        startAngle: 90,
        clockwise: true,
        silent: true,
        label: { show: false },
        labelLine: { show: false },
        data: [
          {
            value: normalizedPercent.value,
            itemStyle: {
              color: activeColor,
              shadowBlur: 12,
              shadowColor: 'rgba(34, 211, 238, .55)'
            }
          },
          {
            value: Math.max(0, 100 - normalizedPercent.value),
            itemStyle: {
              color: 'rgba(18, 43, 83, .86)'
            }
          }
        ]
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

watch(() => [props.percent, props.className], renderChart);

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  window.removeEventListener('resize', resizeChart);
  chart?.dispose();
});
</script>

<style scoped lang="scss">
.donut {
  width: var(--donut-size);
  aspect-ratio: 1;
  border-radius: 50%;
  position: relative;
  flex: 0 0 var(--donut-size);
  text-align: center;
  background:
    radial-gradient(circle at center, rgba(6, 18, 42, 0.98) 0 52%, rgba(5, 19, 45, 0.62) 53% 100%),
    radial-gradient(circle at 50% 50%, rgba(34, 211, 238, 0.15), transparent 70%);
  box-shadow:
    0 0 26px rgba(14, 165, 233, 0.32),
    inset 0 0 19px rgba(0, 145, 255, 0.2);
}

.donut-chart,
.donut-center {
  position: absolute;
  inset: 0;
}

.donut-center {
  inset: 18%;
  border-radius: 50%;
  display: grid;
  place-items: center;
  align-content: center;
  background: radial-gradient(circle, rgba(5, 18, 39, 0.98), rgba(1, 8, 21, 0.96));
  box-shadow:
    inset 0 0 16px rgba(34, 211, 238, 0.16),
    0 0 13px rgba(2, 8, 23, 0.28);
}

strong {
  font-size: clamp(20px, 1.72vw, 34px);
  line-height: 1;
  color: #eff6ff;
  font-weight: 800;
}

span {
  margin-top: clamp(2px, 0.25vw, 5px);
  color: #bfdbfe;
  font-size: clamp(9px, 0.78vw, 15px);
  white-space: nowrap;
}
</style>
