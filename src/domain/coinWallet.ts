import type { MealRecord } from './types'
import type { ShopProduct } from './shopCatalog'
import { hash } from './cardComposer'

export type CoinTransactionKind = 'meal-earned' | 'shop-spent' | 'box-earned'

export interface CoinTransaction {
  id: string
  key: string
  kind: CoinTransactionKind
  amount: number
  mealId?: string
  productId?: string
  createdAt: number
}

export type PurchaseValidation =
  | { ok: true }
  | { ok: false; reason: 'owned' }
  | { ok: false; reason: 'insufficient'; missingCoins: number }

function localDayKey(timestamp: number): string {
  const date = new Date(timestamp)
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

export function mealCoinKey(mealId: string): string {
  return `meal:${mealId}:coins`
}

export function coinsForMeal(meal: MealRecord, history: readonly MealRecord[]): 5 | 8 {
  const mealDay = localDayKey(meal.recordedAt)
  const earlierMealsToday = history.filter((item) => (
    item.id !== meal.id
    && item.recordedAt <= meal.recordedAt
    && localDayKey(item.recordedAt) === mealDay
  ))

  return earlierMealsToday.length === 0 ? 5 : 8
}

export function rewardBoxKey(day: string): string {
  return `box:${day}:coins`
}

const REWARD_BOX_AMOUNTS = [10, 15, 20, 25, 30] as const

export function rewardBoxCoinAmount(seed: string): number {
  return REWARD_BOX_AMOUNTS[hash(seed) % REWARD_BOX_AMOUNTS.length]
}

export function walletBalance(transactions: readonly CoinTransaction[]): number {
  const uniqueTransactions = new Map<string, CoinTransaction>()
  transactions.forEach((transaction) => uniqueTransactions.set(transaction.key, transaction))
  return [...uniqueTransactions.values()].reduce((total, transaction) => total + transaction.amount, 0)
}

export function validatePurchase(
  balance: number,
  product: ShopProduct,
  ownedIds: ReadonlySet<string>,
): PurchaseValidation {
  if (ownedIds.has(product.id)) {
    return { ok: false, reason: 'owned' }
  }

  if (balance < product.price) {
    return {
      ok: false,
      reason: 'insufficient',
      missingCoins: product.price - balance,
    }
  }

  return { ok: true }
}
