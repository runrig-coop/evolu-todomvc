<script setup lang="ts">
import {
  NonEmptyString1000,
  SqliteBoolean,
  id,
  table,
  database,
} from '@evolu/common';
import { createEvolu } from '@evolu/common-web';
import HelloWorld from './components/HelloWorld.vue';

const TodoId = id('todo');
type TodoId = typeof TodoId.Type;

const TodoTable = table({
  id: TodoId,
  title: NonEmptyString1000,
  isCompleted: SqliteBoolean,
});
type TodoTable = typeof TodoTable.Type;

const Database = database({
  todo: TodoTable,
});
type Database = typeof Database.Type;

createEvolu(Database);
</script>

<template>
  <div>
    <a href="https://vitejs.dev" target="_blank">
      <img src="/vite.svg" class="logo" alt="Vite logo" />
    </a>
    <a href="https://vuejs.org/" target="_blank">
      <img src="./assets/vue.svg" class="logo vue" alt="Vue logo" />
    </a>
  </div>
  <HelloWorld msg="Vite + Vue" />
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
