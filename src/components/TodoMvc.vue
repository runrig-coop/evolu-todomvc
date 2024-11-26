<!--
  Closely based on TodoMVC example from Vue docs (retrieved: 2024-09-18)
  https://vuejs.org/examples/#todomvc
 -->

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { Effect, Exit } from 'effect';
import * as S from '@effect/schema/Schema';
import { NonEmptyString1000, parseMnemonic, SqliteBoolean } from '@evolu/common';
import { cast, NotNull } from '@evolu/common/public';
import { createEvolu } from '@evolu/common-web';
import { Database, TodoId } from '../database';

const evolu = createEvolu(Database);
const owner = evolu.getOwner();
const mnemonicShown = ref(false);

interface TodoItem {
  id: TodoId;
  title: NonEmptyString1000;
  completed: SqliteBoolean;
  isDeleted: SqliteBoolean|null;
}

enum FilterKeys {
  All = 'all',
  Active = 'active',
  Completed = 'completed',
}

type FilterPredicate = (todos: TodoItem[]) => TodoItem[];
const filters: { [k in FilterKeys]: FilterPredicate } = {
  all: (todos) => todos,
  active: (todos) => todos.filter((todo) => todo.completed === 0),
  completed: (todos) => todos.filter((todo) => todo.completed === 1),
};

// state
const todos = ref<TodoItem[]>([]);
const visibility = ref<FilterKeys>(FilterKeys.All);
const selected = ref<TodoItem|null>(null);
const index = computed(() => todos.value.findIndex(t => t.id === selected.value?.id));

onMounted(() => {
  const query = evolu.createQuery(db =>
    db.selectFrom('todo')
      .select(['id', 'title', 'completed', 'isDeleted'])
      .where('title', 'is not', null)
      .where('completed', 'is not', null)
      .where('isDeleted', 'is not', cast(true))
      .$narrowType<{ title: NotNull, completed: NotNull, isDeleted: NotNull }>()
      .orderBy('createdAt')
  );

  evolu.loadQuery(query).then((result) => {
    result.rows.forEach((row) => {
      const i = todos.value.findIndex(td => td.id === row.id);
      if (i < 0) todos.value.push(row);
      else todos.value[i] = row;
    })
  });
});

// derived state
const filteredTodos = computed(() => filters[visibility.value](todos.value));
const remaining = computed(() => filters.active(todos.value).length);

// handle routing
window.addEventListener('hashchange', onHashChange);
onHashChange();

function toggleAll(e: Event) {
  const target = e && e.target as HTMLInputElement;
  const checked = target !== null && target.checked;
  const completed = cast(checked);
  for (let i = 0; i < todos.value.length; i += 1) {
    const todo = { ...todos.value[i], completed };
    todos.value[i] = todo;
    evolu.update('todo', { id: todo.id, completed });
  }
}

function toggleOne(todo: TodoItem) {
  const i = todos.value.findIndex(t => t.id === todo.id);
  if (i > -1) {
    const completed = cast(todo.completed < 1);
    todos.value[i] = { ...todo, completed };
    evolu.update('todo', { id: todo.id, completed });
  }
}

function addTodo(e: Event) {
  const target = e && e.target as HTMLInputElement;
  const value = target ? target.value.trim() : '';
  if (value) {
    const init = {
      title: S.decodeSync(NonEmptyString1000)(value),
      completed: S.decodeSync(SqliteBoolean)(0),
      isDeleted: S.decodeSync(SqliteBoolean)(0),
    };
    const { id } = evolu.create('todo', init);
    todos.value.push({ ...init, id });
    target.value = '';
  }
}

function removeTodo(todo: TodoItem) {
  const i = todos.value.findIndex(t => t.id === todo.id);
  todos.value.splice(i, 1);
  evolu.update('todo', { ...todo, isDeleted: true });
}

function editTodo(todo: TodoItem) {
  selected.value = todo;
}

function cancelEdit() {
  selected.value = null;
}

function doneEdit(e: Event|InputEvent) {
  if (selected.value) {
    const target = e && e.target as HTMLInputElement;
    const title = S.decodeSync(NonEmptyString1000)(target.value.trim());
    if (title) {
      const todo: TodoItem = { ...selected.value, title };
      todos.value[index.value] = todo;
      evolu.update('todo', { id: todo.id, title });
    } else removeTodo(selected.value);
  }
}

function removeCompleted() {
  todos.value = filters.active(todos.value);
}

function onHashChange() {
  const route = window.location.hash.replace(/#\/?/, '');
  if (route in filters) {
    visibility.value = route as FilterKeys;
  } else {
    window.location.hash = '';
    visibility.value = FilterKeys.All;
  }
}

function showMnemonic () {
  const mnemonic = owner?.mnemonic;
  if (mnemonic) mnemonicShown.value = !mnemonicShown.value;
}

function restoreOwner() {
  const mnemonic = prompt('Your Mnemonic');
  if (mnemonic === null) return;
  parseMnemonic(mnemonic)
    .pipe(Effect.runPromiseExit)
    .then(
      Exit.match({
        onFailure: (error) => {
          alert(JSON.stringify(error, null, 2));
        },
        onSuccess: (mnemonic) => {
          evolu.restoreOwner(mnemonic);
        },
      }),
    );
}

function resetOwner() {
  if (confirm("Are you sure? It will delete all your local data.")) {
    evolu.resetOwner();
  }
}
</script>

<template>
  <section class="todoapp">
    <header class="header">
      <h1>Todos</h1>
      <input
        class="new-todo"
        autofocus
        placeholder="What needs to be done?"
        @keyup.enter="addTodo"
      >
    </header>
    <section class="main" v-show="todos.length">
      <input
        id="toggle-all"
        class="toggle-all"
        type="checkbox"
        :checked="remaining === 0"
        @change="toggleAll"
      >
      <label for="toggle-all">Mark all as complete</label>
      <ul class="todo-list">
        <li
          v-for="todo in filteredTodos"
          class="todo"
          :key="todo.id"
          :class="{
            completed: todo.completed > 0,
            editing: todo.id === selected?.id,
          }"
        >
          <div class="view">
            <input
              class="toggle"
              type="checkbox"
              :checked="todo.completed > 0"
              @change="toggleOne(todo)"
            >
            <label @dblclick="editTodo(todo)">{{ todo.title }}</label>
            <button class="destroy" @click="removeTodo(todo)"></button>
          </div>
          <input
            v-if="todo.id === selected?.id"
            class="edit"
            type="text"
            @blur="doneEdit"
            @keyup.enter="doneEdit"
            @keyup.escape="cancelEdit()"
          >
        </li>
      </ul>
    </section>
    <footer class="footer" v-show="todos.length">
      <span class="todo-count">
        <strong>{{ remaining }}</strong>
        <span>{{ remaining === 1 ? ' item' : ' items' }} left</span>
      </span>
      <ul class="filters">
        <li>
          <a href="#/all" :class="{ selected: visibility === 'all' }">All</a>
        </li>
        <li>
          <a href="#/active" :class="{ selected: visibility === 'active' }">Active</a>
        </li>
        <li>
          <a href="#/completed" :class="{ selected: visibility === 'completed' }">Completed</a>
        </li>
      </ul>
      <button class="clear-completed" @click="removeCompleted" v-show="todos.length > remaining">
        Clear completed
      </button>
    </footer>
  </section>
  <div class="owner-actions">
    <p>
      <button class="erase" @click="resetOwner" >
        Erase All Data
      </button>
    </p>
    <p>
      <button @click="restoreOwner" >
        Restore Owner & Sync
      </button>
    </p>
    <p>
      <button type="button" @click="showMnemonic" >
        {{ `${mnemonicShown ? 'Hide' : 'Show'} Mnemonic` }}
      </button>
    </p>
    <p
      class="mnemonic"
      :class="{ shown: owner && owner.mnemonic && mnemonicShown }"
    >
      {{ owner?.mnemonic }}
    </p>
  </div>
</template>

<style>
@import "https://unpkg.com/todomvc-app-css@2.4.1/index.css";

.owner-actions {
  right: 0;
  margin: 65px auto 0;
  line-height: 1em;
  color: #4d4d4d;
  font-size: 11px;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.5);
  text-align: center;
}
.owner-actions button {
  border: none;
  color: inherit;
  text-decoration: none;
}
.owner-actions button:hover {
  text-decoration: underline;
  cursor: pointer;
}
.owner-actions button:focus {
  box-shadow: 0 0 2px 2px #CF7D7D;
  outline: 0;
}
.owner-actions button.erase {
  color: #b83f45;
  font-weight: 700;
}
.mnemonic:not(.shown) {
  filter: blur(.375em);
}
</style>
