<script lang="ts">
import { SetupContext } from '@vue/runtime-core';

export default {
  setup(props : {}, {emit} : SetupContext) {
    function propagateChange (event : Event) {
        emit('eventChanged', (event.target as HTMLSelectElement).value);
    }

    return {propagateChange};
  }
}
</script>

<template>
  <header>
    <img alt="Vue logo" class="logo" src="@/assets/gdq-logo.png" width="125" height="125" />
    <select @change="propagateChange($event)">
      <option value="AGDQ2020">AGDQ2020</option>
      <option value="SGDQ2020">SGDQ2020</option>
      <option value="AGDQ2021">AGDQ2021</option>
      <option value="SGDQ2021">SGDQ2021</option>
      <option value="AGDQ2022">AGDQ2022</option>
    </select>
  </header>
</template>

<style lang="scss" scoped>
    header
    {
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        background-color: var(--color-primary);
    }

    img
    {
        height: 48pt;
        width: 48pt;
    }
</style>