<script setup lang="ts">
import { createEvolu } from '@evolu/common-web';
import { Database } from './database';
import TodoMvc from './components/TodoMvc.vue';

createEvolu(Database);

</script>

<template>
  <TodoMvc :todos="[]" />
</template>

<style>
@import "https://unpkg.com/todomvc-app-css@2.4.1/index.css";
</style>
