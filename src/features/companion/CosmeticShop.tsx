import { useState } from 'react'
import { SHOP_PRODUCTS } from '../../domain/shopCatalog'
import type { ShopProduct } from '../../domain/shopCatalog'

export function CosmeticShop({
  balance,
  ownedIds,
  online,
  onPurchase,
  companionName = '푸디',
  appliedIds = [],
  onApply = () => undefined,
}: {
  balance: number
  ownedIds: readonly string[]
  online: boolean
  onPurchase: (product: ShopProduct) => Promise<void>
  companionName?: string
  appliedIds?: readonly string[]
  onApply?: (selection: { type: ShopProduct['type']; id?: string }) => void
}) {
  const [preview, setPreview] = useState<ShopProduct>()
  const [purchasing, setPurchasing] = useState(false)
  const [message, setMessage] = useState('')
  const owned = new Set(ownedIds)
  const personalize = (text: string) => text.replace(/푸디/g, companionName)
  const missingCoins = preview ? Math.max(0, preview.price - balance) : 0
  const canPurchase = Boolean(preview && online && !owned.has(preview.id) && missingCoins === 0)

  const purchase = async () => {
    if (!preview || !canPurchase || purchasing) return
    setPurchasing(true)
    setMessage('')
    try {
      await onPurchase(preview)
      setMessage(`${preview.title}을 내 방에 추가했어요!`)
      setPreview(undefined)
    } catch (error) {
      setMessage(error instanceof Error && error.message === 'shop-offline'
        ? '인터넷에 연결한 뒤 다시 시도해 주세요.'
        : '구매를 마치지 못했어요. 코인은 차감되지 않았어요.')
    } finally {
      setPurchasing(false)
    }
  }

  return (
    <section className="cosmetic-shop" aria-labelledby="cosmetic-shop-title">
      <div className="shop-heading">
        <div>
          <p className="eyebrow">FOODEX SHOP</p>
          <h2 id="cosmetic-shop-title">방 꾸미기 상점</h2>
        </div>
        <strong className="coin-balance" aria-label={`보유 코인 ${balance}개`}>◆ {balance}</strong>
      </div>
      <p className="shop-guide">{personalize(`식사를 기록해 모은 코인으로 ${companionName}의 방을 꾸며보세요.`)}</p>
      {!online && <p className="shop-offline-note">인터넷에 연결하면 안전하게 구매할 수 있어요.</p>}
      <div className="shop-product-grid">
        {SHOP_PRODUCTS.map((product) => {
          const isOwned = owned.has(product.id)
          const isApplied = appliedIds.includes(product.id)
          return (
            <article className={`shop-product ${isOwned ? 'owned' : ''}${isApplied ? ' applied' : ''}`} key={product.id}>
              <div className={`shop-product-preview ${product.previewClass}`} aria-hidden="true">
                <span>{product.type === 'background' ? '▧' : '✦'}</span>
              </div>
              <div>
                <small>{product.type === 'background' ? '방 배경' : '캐릭터 장식'}</small>
                <h3>{product.title}</h3>
                <p>{product.description}</p>
              </div>
              {isOwned ? (
                <button
                  type="button"
                  aria-label={isApplied ? `${product.title} 해제` : `${product.title} 적용`}
                  onClick={() => onApply({ type: product.type, id: isApplied ? undefined : product.id })}
                >
                  {isApplied ? '적용 중 · 해제' : '적용하기'}
                </button>
              ) : (
                <button
                  type="button"
                  aria-label={`${product.title} 미리보기`}
                  onClick={() => { setPreview(product); setMessage('') }}
                >
                  {`◆ ${product.price}`}
                </button>
              )}
            </article>
          )
        })}
      </div>
      {message && <p className="shop-message" role="status">{message}</p>}
      {preview && (
        <div className="shop-dialog-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setPreview(undefined)
        }}>
          <section className="shop-dialog" role="dialog" aria-modal="true" aria-labelledby="shop-preview-title">
            <button className="shop-dialog-close" type="button" aria-label="미리보기 닫기" onClick={() => setPreview(undefined)}>×</button>
            <div className={`shop-dialog-preview ${preview.previewClass}`} aria-hidden="true">
              <span>{preview.type === 'background' ? personalize(`${companionName}의 새 방`) : `✦ ${companionName} ✦`}</span>
            </div>
            <small>{preview.type === 'background' ? '방 배경' : '캐릭터 장식'}</small>
            <h3 id="shop-preview-title">{preview.title}</h3>
            <p>{preview.description}</p>
            <button
              className="shop-purchase-button"
              type="button"
              disabled={!canPurchase || purchasing}
              onClick={() => void purchase()}
            >
              {!online
                ? '연결 후 구매'
                : owned.has(preview.id)
                  ? '이미 보유 중'
                  : missingCoins > 0
                    ? `${missingCoins}코인 부족`
                    : purchasing
                      ? '구매 중…'
                      : `${preview.price}코인으로 구매`}
            </button>
          </section>
        </div>
      )}
    </section>
  )
}
