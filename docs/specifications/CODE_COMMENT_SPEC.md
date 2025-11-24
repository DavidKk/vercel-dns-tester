# Code Comment Specification

This document provides clear guidelines for code comments in the project to ensure code readability and maintainability.

## 1. Comment Language Specification

### 1.1 Basic Principles

- All code comments must be in English
- Do not use Chinese or other languages for comments

### 1.2 Correct Examples

```tsx
/**
 * Calculate total price of products
 * @param price Product unit price
 * @param quantity Product quantity
 * @returns Total price of products
 */
export function calculateTotal(price: number, quantity: number): number {
  return price * quantity
}
```

### 1.3 Incorrect Examples

```tsx
// Incorrect: Use Chinese comments
// 计算商品总价
export function calculateTotal(price: number, quantity: number): number {
  return price * quantity;
}

<!-- Incorrect: Use other languages -->
<!-- 计算价格 -->
function calculatePrice() { }
```

## 2. Comment Syntax Specification

### 2.1 Basic Principles

- Comments for functions, property names, variable names, etc. should be placed above
- Use `/** */` format for comments
- Use single-line format for single-line comments, multi-line format for multi-line comments

### 2.2 Correct Examples

```tsx
/** Format date to YYYY-MM-DD string */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

/** User name */
const userName: string = 'John'

/**
 * Calculate discount based on quantity
 * @param quantity Product quantity
 * @returns Discount percentage
 */
function calculateDiscount(quantity: number): number {
  if (quantity > 100) return 0.1
  if (quantity > 50) return 0.05
  return 0
}
```

### 2.3 Incorrect Examples

```tsx
// Incorrect: Comment position is wrong
const userId: number = 123 // User ID

/*
 * Incorrect: Use /* * / instead of /* * /
 */
function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`
}

/**
 *Incorrect: Multi-line comments are not properly line-wrapped
 *This makes comments hard to read
 */
export function processData(data: any[]) {}
```

## 3. Function Comment Specification

### 3.1 Basic Principles

- All exported functions must include complete JSDoc comments
- Comments should include function description, parameter description, and return value description
- Use standard JSDoc tags such as @param and @returns

### 3.2 Correct Examples

```tsx
/**
 * Calculate the total price with tax
 * @param price Base price of the item
 * @param taxRate Tax rate as a decimal (e.g., 0.08 for 8%)
 * @param quantity Number of items
 * @returns Total price including tax
 */
export function calculateTotalWithTax(price: number, taxRate: number, quantity: number = 1): number {
  const subtotal = price * quantity
  return subtotal * (1 + taxRate)
}
```

### 3.3 Incorrect Examples

```tsx
// Incorrect: Missing JSDoc comments
export function calculateArea(width: number, height: number): number {
  return width * height
}

/**
 * Incorrect: Parameter and return value descriptions are incomplete
 * @param data
 * @returns
 */
export function processUserData(data: any) {
  // ...
}
```

## 4. Variable and Property Comment Specification

### 4.1 Basic Principles

- Complex or non-self-explanatory variables and properties should be commented
- Simple, self-explanatory variables may not need comments
- Constants should be commented to explain their purpose

### 4.2 Correct Examples

```tsx
/** Maximum number of retry attempts for API calls */
const MAX_RETRY_ATTEMPTS = 3

/** User authentication token */
let authToken: string | null = null

/**
 * Configuration object for API requests
 */
const apiConfig = {
  baseUrl: 'https://api.example.com',
  timeout: 5000,
  retries: MAX_RETRY_ATTEMPTS,
}
```

### 4.3 Incorrect Examples

```tsx
/**  */ // Incorrect: Empty comment
const userName = 'John'

// Incorrect: Unnecessary comments for simple variables
/** The user's name */
const name = 'John' // The name variable is already clear enough to express its meaning

/*
 * Incorrect: Inconsistent comment format
 * This is a configuration object
 */
const config = {}
```

## 5. Class and Interface Comment Specification

### 5.1 Basic Principles

- All exported classes and interfaces must include descriptive comments
- Public methods of classes should be commented
- Properties of interfaces should be commented

### 5.2 Correct Examples

```tsx
/**
 * User service for managing user data
 * Provides methods for user authentication and profile management
 */
export class UserService {
  /**
   * Authenticate user with email and password
   * @param email User's email address
   * @param password User's password
   * @returns Promise that resolves to authentication token
   */
  async authenticate(email: string, password: string): Promise<string> {
    // ...
  }
}

/**
 * User profile information
 */
export interface UserProfile {
  /** Unique user identifier */
  id: string

  /** User's email address */
  email: string

  /** User's full name */
  name: string
}
```

## 6. Comment Maintenance Specification

### 6.1 Basic Principles

- Comments should be kept in sync with code updates
- Remove outdated or useless comments
- Avoid adding obvious comments

### 6.2 Correct Examples

```tsx
/**
 * Format currency value for display
 * @param amount Amount in cents
 * @returns Formatted currency string (e.g., "$12.99")
 */
export function formatCurrency(amount: number): string {
  // Convert cents to dollars and format
  return `$${(amount / 100).toFixed(2)}`
}
```

### 6.3 Incorrect Examples

```tsx
/**
 * This function adds two numbers
 * @param a first number
 * @param b second number
 * @returns sum of a and b
 */
// Incorrect: Comment description is too obvious
function add(a: number, b: number): number {
  return a + b // Return the sum of a and b
}

// TODO: This feature needs to be implemented later
// Incorrect: Outdated comments should be removed
function deprecatedFunction() {}
```

---

_This document will be continuously updated based on project development and team feedback._
