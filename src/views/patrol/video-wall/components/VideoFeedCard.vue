<template>
  <article class="video-feed" :class="feed.tone">
    <video
      v-if="feed.streamUrl"
      class="feed-video"
      :src="feed.streamUrl"
      muted
      autoplay
      playsinline
    ></video>
    <div v-else class="feed-waiting">
      <div class="signal-orbit">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <strong>{{ feed.waitingText }}</strong>
      <small>REALTIME STREAM STANDBY</small>
    </div>
    <div class="feed-top">
      <strong>{{ sequence }} {{ feed.name }}</strong>
      <span>{{ timestamp }}</span>
    </div>
    <div class="feed-bottom">
      <span>{{ feed.location }}</span>
      <b>{{ feed.state }}</b>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { VideoWallFeed } from '../types';

defineProps<{
  feed: VideoWallFeed;
  sequence: string;
  timestamp: string;
}>();
</script>

<style scoped lang="scss">
.video-feed {
  position: relative;
  z-index: 1;
  overflow: hidden;
  min-height: 0;
  border: 1px solid rgba(0, 164, 255, 0.72);
  background:
    radial-gradient(circle at 50% 42%, rgba(22, 142, 255, 0.2), transparent 34%),
    repeating-linear-gradient(0deg, rgba(113, 211, 255, 0.07) 0 1px, transparent 1px 8px),
    linear-gradient(180deg, #0b2d4b 0%, #06182f 54%, #031024 100%);
  box-shadow: inset 0 0 18px rgba(0, 163, 255, 0.14);
}

.video-feed::before {
  content: none;
}

.feed-video,
.feed-waiting {
  position: absolute;
  inset: 0;
}

.feed-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: #020617;
}

.feed-waiting {
  display: grid;
  place-content: center;
  justify-items: center;
  gap: clamp(5px, 0.52vw, 8px);
  text-align: center;
  color: #dff7ff;
  background:
    radial-gradient(circle at 50% 48%, rgba(24, 200, 255, 0.2), transparent 26%),
    linear-gradient(90deg, transparent 0 18%, rgba(125, 211, 252, 0.08) 18.4% 18.8%, transparent 19.2% 51%, rgba(125, 211, 252, 0.08) 51.4% 51.8%, transparent 52.2% 100%),
    repeating-linear-gradient(0deg, rgba(191, 219, 254, 0.055) 0 1px, transparent 1px 7px),
    linear-gradient(145deg, rgba(8, 47, 73, 0.8), rgba(2, 8, 23, 0.95));
}

.feed-waiting::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, transparent 0%, rgba(34, 211, 238, 0.12) 48%, transparent 54%) 0 0 / 100% 46px,
    radial-gradient(circle at 50% 50%, transparent 0 42%, rgba(0, 8, 22, 0.24) 100%);
  animation: scan-line 4.8s linear infinite;
}

.feed-waiting strong,
.feed-waiting small,
.signal-orbit {
  position: relative;
  z-index: 1;
}

.feed-waiting strong {
  font-size: clamp(13px, 1vw, 16px);
  letter-spacing: 0;
  color: #ecfeff;
  text-shadow: 0 0 12px rgba(34, 211, 238, 0.75);
}

.feed-waiting small {
  color: rgba(147, 197, 253, 0.78);
  font-size: clamp(8px, 0.65vw, 10px);
}

.signal-orbit {
  width: clamp(46px, 4.3vw, 66px);
  aspect-ratio: 1;
  border-radius: 50%;
  border: 1px solid rgba(34, 211, 238, 0.68);
  box-shadow: inset 0 0 18px rgba(34, 211, 238, 0.18), 0 0 18px rgba(34, 211, 238, 0.25);
  display: grid;
  place-items: center;
}

.signal-orbit::before {
  content: '';
  width: 32%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: radial-gradient(circle, #dff7ff, #22d3ee 58%, rgba(34, 211, 238, 0.16) 60%);
  box-shadow: 0 0 18px rgba(34, 211, 238, 0.85);
}

.signal-orbit span {
  position: absolute;
  inset: 12%;
  border-radius: 50%;
  border: 1px solid rgba(96, 165, 250, 0.32);
}

.signal-orbit span:nth-child(2) {
  inset: 24%;
}

.signal-orbit span:nth-child(3) {
  inset: 36%;
}

@keyframes scan-line {
  from {
    background-position: 0 -46px, center;
  }
  to {
    background-position: 0 100%, center;
  }
}

.feed-top,
.feed-bottom {
  position: absolute;
  z-index: 3;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: clamp(7px, 0.65vw, 10px) clamp(8px, 0.78vw, 12px);
  color: #eff6ff;
  background: linear-gradient(180deg, rgba(2, 6, 23, 0.62), transparent);
  font-size: var(--feed-info-size);
  min-width: 0;
}

.feed-top span,
.feed-top strong,
.feed-bottom span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.feed-bottom {
  top: auto;
  bottom: 0;
  background: linear-gradient(0deg, rgba(2, 6, 23, 0.72), transparent);
}

.feed-bottom b {
  color: #22d3ee;
}
</style>
