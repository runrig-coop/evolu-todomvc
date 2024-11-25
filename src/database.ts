import {
  NonEmptyString1000,
  SqliteBoolean,
  id,
  table,
  database,
} from '@evolu/common';

export const TodoId = id('todo');
export type TodoId = typeof TodoId.Type;

export const TodoTable = table({
  id: TodoId,
  title: NonEmptyString1000,
  completed: SqliteBoolean,
});
export type TodoTable = typeof TodoTable.Type;

export const Database = database({
  todo: TodoTable,
});
export type Database = typeof Database.Type;
