<script lang="ts">
import { defineComponent, ref } from 'vue';
import { reflectColor } from '@/utilities/colorHelper';

export default defineComponent({
    setup() {
        const hidden = ref(false);
        const root = ref<HTMLDivElement>();
        const hide = () => {
            hidden.value = true;
        };
        const now = new Date();
        const month = now.getMonth();
        const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const isAgdq = month >= 0 && month <= 2 || month >= 9 && month <= 11;
        const isSgdq = !(month >= 0 && month <= 2 || month >= 9 && month <= 11);

        const generateClass = () => {
            return Object.entries({
                wrapper: true,
                hidden: hidden.value,
                agdq : isAgdq,
                sgdq : isSgdq,
            }).filter(([_, value]) => value).map(([key]) => key).join(' ');
        };

        reflectColor(isAgdq ? "AGDQ" : isSgdq ? "SGDQ" : "Other", isDarkMode);
        return {hide, root, generateClass};
    }
});
</script>
<template>
    <div ref="root" :class="generateClass()">
        <img src="@/assets/gdq-logo.png" class="logo" >
    </div>
</template>
<style lang="scss">
    .wrapper
    {
        pointer-events: none;
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        background-color: var(--md-sys-surface);
        color: var(--md-sys-on-surface);
        opacity: 1;

        transition: opacity .5s cubic-bezier(0.64, 0, 0.78, 0);

        &.hidden
        {
            opacity: 0;
        }
    }


    .logo {
        width: 100px;
        height: 100px;
    }
</style>