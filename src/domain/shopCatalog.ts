export type ShopProductType = 'background' | 'accessory'

export interface ShopProduct {
  id: string
  type: ShopProductType
  title: string
  description: string
  price: number
  previewClass: string
}

export const SHOP_PRODUCTS: readonly ShopProduct[] = [
  {
    id: 'shop-sunroom',
    type: 'background',
    title: '햇살 아침방',
    description: '포근한 햇살이 비치는 밝은 방',
    price: 20,
    previewClass: 'background-shop-sunroom',
  },
  {
    id: 'shop-moonroom',
    type: 'background',
    title: '달빛 저녁방',
    description: '별빛과 달빛이 머무는 차분한 방',
    price: 30,
    previewClass: 'background-shop-moonroom',
  },
  {
    id: 'shop-star-pin',
    type: 'accessory',
    title: '별빛 머리핀',
    description: '움직일 때마다 반짝이는 별 장식',
    price: 15,
    previewClass: 'accessory-shop-star-pin',
  },
  {
    id: 'shop-leaf-crown',
    type: 'accessory',
    title: '새싹 왕관',
    description: '건강한 모험가를 위한 초록 왕관',
    price: 25,
    previewClass: 'accessory-shop-leaf-crown',
  },
]

export function shopProductById(id: string): ShopProduct | undefined {
  return SHOP_PRODUCTS.find((product) => product.id === id)
}
