<script lang="ts">
import { defineComponent, ref } from 'vue';

export default defineComponent({
    setup() {
        const hidden = ref(false);
        const root = ref<HTMLDivElement>();
        const hide = () => {
            hidden.value = true;
        };
        const generateClass = () => {
            const now = new Date();
            const month = now.getMonth();
            return Object.entries({
                wrapper: true,
                hidden: hidden.value,
                agdq: month >= 0 && month <= 2 || month >= 9 && month <= 11,
                sgdq: !(month >= 0 && month <= 2 || month >= 9 && month <= 11),
            }).filter(([_, value]) => value).map(([key]) => key).join(' ');
        };
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
        background-color: var(--mdc-theme-primary);
        opacity: 1;

        transition: all .5s cubic-bezier(0.64, 0, 0.78, 0);

        &.hidden
        {
            opacity: 0;
        }

        &.agdq
        {
            --mdc-theme-primary: white;
        }

        &.sgdq
        {
            --mdc-theme-primary: white;
        }

        .dark-mode &
        {
            &.agdq
            {
                --mdc-theme-primary: hsl(180deg 100% calc(15% * 0.35));
            }

            &.sgdq
            {
                --mdc-theme-primary: hsl(343deg 49% calc(19% * 0.35));
            }
        }
    }


    .logo {
        width: 100px;
        height: 100px;
    }
</style>