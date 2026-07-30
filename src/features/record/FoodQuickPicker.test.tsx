import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { FoodDefinition } from '../../domain/foodCatalog'
import { FoodQuickPicker } from './FoodQuickPicker'

const kimchiRice: FoodDefinition = {
  id: 'kimchi-fried-rice',
  name: '김치볶음밥',
  aliases: ['김치 볶음밥'],
  foodType: 'rice',
  flavor: 'spicy',
  periods: ['lunch', 'dinner'],
}

describe('FoodQuickPicker', () => {
  afterEach(cleanup)

  it('selects a suggested food in one tap', async () => {
    const onSelect = vi.fn()
    render(<FoodQuickPicker suggestions={[kimchiRice]} onSelect={onSelect} />)

    await userEvent.click(screen.getByRole('button', { name: '김치볶음밥' }))

    expect(onSelect).toHaveBeenCalledWith(kimchiRice)
  })

  it('finds and selects a food typed by alias', async () => {
    const onSelect = vi.fn()
    render(<FoodQuickPicker suggestions={[]} onSelect={onSelect} />)

    await userEvent.type(screen.getByRole('searchbox', { name: '음식 검색' }), '돈까스')
    await userEvent.click(screen.getByRole('button', { name: '돈가스' }))

    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ name: '돈가스' }))
  })
})
