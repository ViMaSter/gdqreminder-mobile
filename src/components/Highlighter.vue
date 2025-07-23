<script setup lang="ts">
import { ref } from 'vue';

const animationDuration = 500;

const highlight = ref(null);
const highlightStyle = ref({
    top: "0px",
    left: "0px",
    width: "0px",
    height: "0px",
});
const isOn = ref(false);

function highlightElement(els: (HTMLElement | null)[] | HTMLElement | null) {
    let elements: HTMLElement[] = [];
    if (Array.isArray(els)) {
        elements = els.filter((el): el is HTMLElement => !!el);
    } else if (els instanceof HTMLElement) {
        elements = [els];
    }
    if (elements.length === 0) return;

    let minTop = Infinity, minLeft = Infinity, maxBottom = -Infinity, maxRight = -Infinity;
    elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        const top = rect.top + scrollTop;
        const left = rect.left + scrollLeft;
        const bottom = top + rect.height;
        const right = left + rect.width;
        if (top < minTop) minTop = top;
        if (left < minLeft) minLeft = left;
        if (bottom > maxBottom) maxBottom = bottom;
        if (right > maxRight) maxRight = right;
    });

    highlightStyle.value = {
        top: `${minTop}px`,
        left: `${minLeft}px`,
        width: `${maxRight - minLeft}px`,
        height: `${maxBottom - minTop}px`,
    };
    isOn.value = true;
    setTimeout(() => {
        isOn.value = false;
    }, animationDuration); // Duration of the highlight effect
}

// Expose method to parent if needed
defineExpose({ highlightElement });
</script>
<template>
    <div
        ref="highlight"
        :class="['highlight', { on: isOn }]"
        :style="highlightStyle"
    ></div>
</template>
<style scoped>
.highlight {
    position: absolute;
    top: 0px;
    left: 0px;
    width: 0px;
    height: 0px;
    z-index: 10000000;
    background: rgba(255, 255, 255, 0.125);
    opacity: 0;
    mix-blend-mode: exclusion;
    pointer-events: none;
    transition: none;
}

.on {
    animation: pulse calc(v-bind('animationDuration') * 0.5ms) cubic-bezier(0.55, 0.01, 0.45, 1) 2;
}

@keyframes pulse {
    0% { opacity: 0; }
    50% { opacity: 1; }
    100% { opacity: 0; }
}
</style>
