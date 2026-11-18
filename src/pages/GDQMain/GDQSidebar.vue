<script lang="ts">
import { computed, defineComponent, ref, toRef } from "vue";
import "@material/web/all.js";
import { GDQEventData } from "@/interfaces/GDQEvent";

// all distances in px; the list follows the finger at half its speed
const PULL_RESISTANCE = 0.5;
const REFRESH_THRESHOLD = 64;
const MAX_PULL = 96;
const TOUCH_SLOP = 8;
const INDICATOR_SIZE = 40;
// gap above the list from which on the indicator (plus its shadow) is shown at full size
const INDICATOR_FULL_SIZE_GAP = 56;

export default defineComponent({
  props: {
    eventsByIDs: {
      type: Object as () => { [id: number]: GDQEventData },
      required: true,
    },
    doneLoading: {
      type: Boolean,
      required: true,
    },
    refreshing: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["onUpdateCurrentEvent", "refresh"],
  async setup(props, { emit }) {
    const eventsByIDs = toRef(props, "eventsByIDs");

    const root = ref<HTMLElement>();
    const pullDistance = ref(0);
    const dragging = ref(false);
    let gesture: { identifier: number; startX: number; startY: number } | null = null;

    // the list scrolls inside mwc-drawer's shadow DOM, so walk up through slots and shadow hosts
    const isScrolledToTop = () => {
      let node: Element | null = root.value ?? null;
      while (node) {
        if (node.scrollTop > 0) {
          return false;
        }
        node =
          node.assignedSlot ??
          node.parentElement ??
          (node.getRootNode() as ShadowRoot).host ??
          null;
      }
      return true;
    };

    const trackedTouch = (touches: TouchList) =>
      gesture ? Array.from(touches).find((touch) => touch.identifier === gesture!.identifier) : undefined;

    const onTouchStart = (event: TouchEvent) => {
      gesture = null;
      if (props.refreshing || event.touches.length !== 1 || !isScrolledToTop()) {
        return;
      }
      const touch = event.touches[0];
      gesture = { identifier: touch.identifier, startX: touch.clientX, startY: touch.clientY };
    };

    const onTouchMove = (event: TouchEvent) => {
      const touch = trackedTouch(event.touches);
      if (!gesture || !touch) {
        return;
      }
      const dx = touch.clientX - gesture.startX;
      const dy = touch.clientY - gesture.startY;
      if (!dragging.value) {
        if (Math.abs(dx) < TOUCH_SLOP && Math.abs(dy) < TOUCH_SLOP) {
          return;
        }
        // scrolling the list or swiping the drawer shut: leave it to the browser and the drawer
        if (dy <= Math.abs(dx)) {
          gesture = null;
          return;
        }
        dragging.value = true;
      }
      if (event.cancelable) {
        event.preventDefault();
      }
      pullDistance.value = Math.min(MAX_PULL, Math.max(0, dy * PULL_RESISTANCE));
    };

    const onTouchEnd = (event: TouchEvent) => {
      if (!gesture || trackedTouch(event.touches)) {
        return;
      }
      const shouldRefresh =
        event.type === "touchend" && dragging.value && pullDistance.value >= REFRESH_THRESHOLD;
      gesture = null;
      dragging.value = false;
      pullDistance.value = 0;
      if (shouldRefresh) {
        emit("refresh");
      }
    };

    // how far the list is pushed down; while refreshing, it rests at the threshold until the parent is done
    const pullOffset = computed(() => (props.refreshing ? REFRESH_THRESHOLD : pullDistance.value));
    const pullProgress = computed(() => Math.min(1, pullDistance.value / REFRESH_THRESHOLD));
    // centered in the gap above the list, and only as large as the gap allows, so it is never clipped
    const indicatorTransform = computed(() => {
      const scale = Math.min(1, pullOffset.value / INDICATOR_FULL_SIZE_GAP);
      const centerY = pullOffset.value / 2 - INDICATOR_SIZE / 2;
      return `translateY(${centerY}px) scale(${scale}) rotate(${pullProgress.value * 270}deg)`;
    });

    return {
      eventsByIDs,
      root,
      dragging,
      pullOffset,
      pullProgress,
      indicatorTransform,
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    };
  },
});
</script>

<template>
  <div
    ref="root"
    class="pullToRefresh"
    @touchstart.passive="onTouchStart"
    @touchmove="onTouchMove"
    @touchend.passive="onTouchEnd"
    @touchcancel.passive="onTouchEnd"
  >
    <div
      :class="['pullIndicator', { dragging, visible: dragging || pullOffset > 0, armed: refreshing || pullProgress >= 1 }]"
      :style="{ transform: indicatorTransform }"
      data-test="pull-to-refresh-indicator"
    >
      <md-circular-progress
        :indeterminate="refreshing"
        :value="pullProgress * 0.8"
        :aria-label="$t('sidebar.refreshing')"
      ></md-circular-progress>
    </div>
    <md-list :class="{ dragging }" :style="{ transform: pullOffset > 0 ? `translateY(${pullOffset}px)` : '' }">
      <md-list-item
        v-for="event in Object.values(eventsByIDs).sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime())"
        :key="event.short"
        @click="$emit('onUpdateCurrentEvent', event)"
        >{{ event.short.toUpperCase() }}</md-list-item
      >
      <md-list-item v-if="!doneLoading" class="rotating">
        <md-icon>autorenew</md-icon>
      </md-list-item>
    </md-list>
  </div>
</template>

<style lang="scss">
.mdc-drawer__header {
  padding-top: var(--safe-area-inset-top);
}
</style>
<style lang="scss" scoped>
.pullToRefresh {
  position: relative;
  // let the empty space below a short list take part in the gesture, too
  min-height: 100%;
}

md-list {
  transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1);

  &.dragging {
    transition: none;
  }
}

// sits in the gap the list leaves behind; its transform keeps it centered there and scaled to fit
.pullIndicator {
  position: absolute;
  z-index: 1;
  top: 0;
  left: calc(50% - 20px);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--mdc-theme-surface);
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.3),
    0 4px 8px 3px rgba(0, 0, 0, 0.15);
  pointer-events: none;
  visibility: hidden;
  transition:
    transform 200ms cubic-bezier(0.4, 0, 0.2, 1),
    visibility 0s linear 200ms;

  &.visible {
    visibility: visible;
    transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  &.dragging {
    transition: none;
  }

  md-circular-progress {
    --md-circular-progress-size: 36px;
    --md-circular-progress-active-indicator-width: 10;
    opacity: 0.5;
  }

  &.armed md-circular-progress {
    opacity: 1;
  }
}

@-webkit-keyframes rotating {
  from {
    -webkit-transform: rotate(0deg);
    -o-transform: rotate(0deg);
    transform: rotate(0deg);
  }
  to {
    -webkit-transform: rotate(360deg);
    -o-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}
@keyframes rotating {
  from {
    -ms-transform: rotate(0deg);
    -moz-transform: rotate(0deg);
    -webkit-transform: rotate(0deg);
    -o-transform: rotate(0deg);
    transform: rotate(0deg);
  }
  to {
    -ms-transform: rotate(360deg);
    -moz-transform: rotate(360deg);
    -webkit-transform: rotate(360deg);
    -o-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}
.rotating md-icon {
  -webkit-animation: rotating 2s linear infinite;
  -moz-animation: rotating 2s linear infinite;
  -ms-animation: rotating 2s linear infinite;
  -o-animation: rotating 2s linear infinite;
  animation: rotating 2s linear infinite;
}
</style>
