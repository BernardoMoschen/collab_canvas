export const USER_COLORS = [
  '#f43f5e', '#10b981', '#f59e0b', '#3b82f6',
  '#a855f7', '#06b6d4', '#ec4899', '#84cc16',
]

export const STICKY_COLORS = [
  '#fef08a', '#86efac', '#93c5fd', '#f9a8d4',
  '#fde68a', '#a5f3fc', '#ddd6fe', '#fbcfe8',
]

const NAMES = [
  'Alice', 'Bob', 'Charlie', 'Dana', 'Eve',
  'Frank', 'Grace', 'Hiro', 'Iris', 'Jules',
]

export function randomUserName() {
  return NAMES[Math.floor(Math.random() * NAMES.length)] + Math.floor(Math.random() * 100)
}

export function randomUserColor() {
  return USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)]!
}

export function randomStickyColor() {
  return STICKY_COLORS[Math.floor(Math.random() * STICKY_COLORS.length)]!
}
