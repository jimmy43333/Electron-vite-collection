<template>
  <div v-if="total > 0" class="stepper-bar" :style="{ '--bg-color': bgColor }">
    <div class="stepper-circles">
      <template v-for="(tag, n) in tags" :key="n">
        <div class="stepper-item">
          <div
            class="stepper-circle"
            :class="{
              active: n < current && !isFailed(n),
              current: n === current,
              failed: isFailed(n)
            }"
          >
            <template v-if="n < current">
              <span v-if="isFailed(n)" class="stepper-fail">&#10007;</span>
              <span v-else class="stepper-check">&#10003;</span>
            </template>
            <template v-else-if="n === current">
              <span class="stepper-running">
                <span class="circle-loader"></span>
              </span>
            </template>
            <template v-else>
              {{ n + 1 }}
            </template>
          </div>
          <div class="stepper-label-under">{{ tag }}</div>
        </div>
        <div v-if="n < total - 1" class="stepper-line" :class="{ active: n < current }"></div>
      </template>
    </div>
  </div>
</template>
<script setup>
import { defineProps, computed } from 'vue'

const props = defineProps({
  tags: {
    type: Array,
    required: true
  },
  current: {
    type: Number,
    required: true
  },
  bgColor: {
    type: String,
    default: '#2590b0'
  },
  failedSteps: {
    type: Array,
    default: () => []
  }
})

const total = computed(() => props.tags.length)
const isFailed = (n) => props.failedSteps.includes(n)
</script>

<style lang="less" scoped>
.stepper-bar {
  margin: 20px 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.stepper-circles {
  display: flex;
  align-items: flex-end;
}
.stepper-item {
  width: 80px;
  height: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.stepper-circle {
  min-width: 25px;
  min-height: 25px;
  border-radius: 50%;
  background: #e0e0e0;
  color: #888;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 16px;
  transition:
    background 0.2s,
    color 0.2s,
    border 0.2s;
  overflow: hidden;
}
.stepper-circle.active {
  background: var(--bg-color);
  color: #fff;
  border-color: var(--bg-color);
}
.stepper-circle.current {
  box-shadow: 0 0 0 3px var(--bg-color);
}
.stepper-check {
  color: #fff;
  font-size: 15px;
  font-weight: bold;
}
.stepper-running {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.circle-loader {
  display: block;
  width: 16px;
  height: 16px;
  border: 2px solid #fff;
  border-top: 2px solid var(--bg-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  padding: 3px;
  margin: 0; // Remove any margin
}

@keyframes spin {
  100% {
    transform: rotate(360deg);
  }
}
.stepper-label-under {
  margin-top: 4px;
  font-size: 16px;
  font-weight: bold;
  color: var(--bg-color);
  text-align: center;
  min-width: 40px;
}

.stepper-line {
  width: 40px;
  height: 6px;
  background: #e0e0e0;
  margin: 0 2px 40px 2px;
  border-radius: 6px;
  align-self: flex-end;
}

.stepper-line.active {
  background: var(--bg-color);
}

.stepper-circle.active {
  background: var(--bg-color);
}

.stepper-circle.failed {
  background: #e53935;
  color: #fff;
  border-color: #e53935;
}
.stepper-fail {
  color: #fff;
  font-size: 15px;
  font-weight: bold;
}
</style>
