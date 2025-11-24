# Function Declaration Specification

This document provides clear guidelines for function declarations in the project to ensure code consistency and maintainability.

## 1. Function Export Specification

### 1.1 Basic Principles

- All exported functions must be declared using the `export function xxx() {}` format
- Do not use `export const functionName = () => {}` to export functions

### 1.2 Correct Examples

```tsx
// Correct: Use export function to declare exported functions
export function calculateTotal(price: number, quantity: number): number {
  return price * quantity
}
```

### 1.3 Incorrect Examples

```tsx
// Incorrect: Use export const to export functions
export const calculateTotal = (price: number, quantity: number): number => {
  return price * quantity
}
```

## 2. React Component Function Specification

### 2.1 Page Components

- Page components use default export: `export default function PageName()`

```tsx
export default function NotificationTestPage() {
  const { show } = useNotification()

  // Component internal function for handling button click events
  function handleShowNotification() {
    show('This is a notification')
  }

  return <button onClick={handleShowNotification}>Show Notification</button>
}
```

### 2.2 Reusable Components

- Reusable components use named export: `export function ComponentName()`

```tsx
// Correct example
function formatMessage(message: string): string {
  return message.trim().toUpperCase()
}

export function NotificationItem({ message }: { message: string }) {
  const formattedMessage = formatMessage(message)

  return <div>{formattedMessage}</div>
}
```

## 3. Custom Hook Specification

### 3.1 Basic Requirements

- All custom Hooks must be declared using `export function useXxx() {}`
- Do not use `export const useXxx = () => {}` to declare Hooks
- Hook return values should maintain a flat structure, avoiding nested object levels

### 3.2 Correct Examples

```tsx
// Correct: Use export function useXxx() format
export function useCounter(initialValue: number = 0) {
  const [count, setCount] = useState(initialValue)

  function increment() {
    setCount((c) => c + 1)
  }

  function decrement() {
    setCount((c) => c - 1)
  }

  return {
    count,
    increment,
    decrement,
  }
}
```

### 3.3 Incorrect Examples

```tsx
// Incorrect: Use export const to declare Hook
export const useCounter = (initialValue: number = 0) => {
  // ...
}

// Incorrect: Return value is too deeply nested
export function useApi() {
  // ...
  return {
    actions: {
      fetch: () => {}, // Should be flat, directly return fetch
      update: () => {},
    },
  }
}
```

## 4. Utility Function Specification

### 4.1 Export Principles

- Utility functions should be placed in dedicated directories (e.g. `utils/`)
- Reusable utility functions use `export function`

### 4.2 Correct Examples

```tsx
// utils/format.ts

// Correct: Export reusable utility functions
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

// Correct: Internal helper functions are not exported
function padZero(num: number): string {
  return num.toString().padStart(2, '0')
}

export function formatTime(date: Date): string {
  const hours = padZero(date.getHours())
  const minutes = padZero(date.getMinutes())
  return `${hours}:${minutes}`
}
```

### 4.3 Incorrect Examples

```tsx
// Incorrect: Use export const to export functions
export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0]
}
```

## 5. Best Practices

### 5.1 Function Naming

- Use descriptive function names
- Verb-first, such as `handleClick`, `calculateTotal`, `isValid`
- Hook functions start with `use`

### 5.2 Parameter Handling

- Clearly define parameter types
- Reasonably use optional parameters and default values
- Consider using object destructuring for complex parameters

### 5.3 Return Values

- Maintain consistent return value types
- Hook return values maintain a flat structure
- Avoid returning overly complex nested objects

## 6. Common Error Avoidance

1. **Avoid using `export const` to export functions**: All function exports must use `export function` syntax
2. **Avoid duplicate exports**: Do not use both default export and named export with the same name in the same file
3. **Avoid over-exporting**: Only export functions that truly need to be used by other modules
4. **Avoid naming conflicts**: Ensure exported function names do not conflict between modules
5. **Avoid complex nesting**: Hook and utility function return values should remain简洁 flat

---

_This document will be continuously updated based on project development and team feedback._
