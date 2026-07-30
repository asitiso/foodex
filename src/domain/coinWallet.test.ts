import { describe, expect, it } from 'vitest'
import type { MealRecord } from './types'
import {
  coinsForMeal,
  mealCoinKey,
  validatePurchase,
  walletBalance,
  type CoinTransaction,
} from './coinWallet'
import { SHOP_PRODUCTS } from './shopCatalog'

const meal = (id: string, recordedAt: number): MealRecord => ({
  id,
  imageData: null,
  foodType: 'rice',
  foodName: '밥',
  amount: 'almostAll',
  recordedAt,
})

describe('coin wallet rules', () => {
  it('awards 5 coins for the first meal and 8 from the second meal on the same local day', () => {
    const first = meal('meal-1', new Date(2026, 6, 30, 8).getTime())
    const second = meal('meal-2', new Date(2026, 6, 30, 12).getTime())
    const previousDay = meal('meal-0', new Date(2026, 6, 29, 20).getTime())

    expect(coinsForMeal(first, [previousDay])).toBe(5)
    expect(coinsForMeal(second, [previousDay, first])).toBe(8)
  })

  it('uses a stable meal earning key', () => {
    expect(mealCoinKey('meal-1')).toBe('meal:meal-1:coins')
  })

  it('deduplicates transaction keys and includes debits in the balance', () => {
    const transactions: CoinTransaction[] = [
      {
        id: '1',
        key: 'meal:meal-1:coins',
        kind: 'meal-earned',
        amount: 5,
        mealId: 'meal-1',
        createdAt: 1,
      },
      {
        id: 'duplicate',
        key: 'meal:meal-1:coins',
        kind: 'meal-earned',
        amount: 5,
        mealId: 'meal-1',
        createdAt: 2,
      },
      {
        id: '2',
        key: 'shop:purchase-1',
        kind: 'shop-spent',
        amount: -3,
        productId: 'shop-star-pin',
        createdAt: 3,
      },
    ]

    expect(walletBalance(transactions)).toBe(2)
  })

  it('blocks owned products and reports the exact missing coin amount', () => {
    const product = SHOP_PRODUCTS[0]

    expect(validatePurchase(100, product, new Set([product.id]))).toEqual({
      ok: false,
      reason: 'owned',
    })
    expect(validatePurchase(product.price - 4, product, new Set())).toEqual({
      ok: false,
      reason: 'insufficient',
      missingCoins: 4,
    })
    expect(validatePurchase(product.price, product, new Set())).toEqual({ ok: true })
  })
})
