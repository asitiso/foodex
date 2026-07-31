import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SHOP_PRODUCTS } from '../../domain/shopCatalog'
import { CosmeticShop } from './CosmeticShop'

describe('CosmeticShop', () => {
  afterEach(cleanup)

  it('previews a product before purchasing it', async () => {
    const onPurchase = vi.fn().mockResolvedValue(undefined)
    render(<CosmeticShop balance={30} ownedIds={[]} online onPurchase={onPurchase} />)

    await userEvent.click(screen.getByRole('button', { name: `${SHOP_PRODUCTS[0].title} 미리보기` }))

    expect(screen.getByRole('dialog', { name: SHOP_PRODUCTS[0].title })).toBeInTheDocument()
    expect(onPurchase).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: '20코인으로 구매' }))
    expect(onPurchase).toHaveBeenCalledWith(SHOP_PRODUCTS[0])
  })

  it('explains insufficient balance and blocks offline purchases', async () => {
    const onPurchase = vi.fn()
    const { rerender } = render(
      <CosmeticShop balance={0} ownedIds={[]} online onPurchase={onPurchase} />,
    )
    await userEvent.click(screen.getByRole('button', { name: `${SHOP_PRODUCTS[0].title} 미리보기` }))
    expect(screen.getByRole('button', { name: '20코인 부족' })).toBeDisabled()

    rerender(<CosmeticShop balance={30} ownedIds={[]} online={false} onPurchase={onPurchase} />)
    expect(screen.getByText('인터넷에 연결하면 안전하게 구매할 수 있어요.')).toBeInTheDocument()
  })

  it('omits only the outer heading in compact mode', () => {
    const { container } = render(<CosmeticShop compact balance={30} ownedIds={[]} online onPurchase={vi.fn()} />)

    expect(container.querySelector('.shop-heading')).not.toBeInTheDocument()
    expect(screen.getByLabelText('보유 코인 30개')).toBeInTheDocument()
    expect(container.querySelector('.shop-product')).toBeInTheDocument()
  })
})
