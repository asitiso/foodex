# Foodex Coin Wallet and Shop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn meal coins into an idempotent local-first wallet that can purchase four cosmetic products and remain consistent with Supabase.

**Architecture:** Add a pure wallet domain module and a static shop catalog, then store stable-key coin transactions in IndexedDB beside meal/card writes. Mirror earned coins and purchases through narrowly scoped Supabase RPC functions backed by an RLS-protected ledger, and expose the shared balance through the existing home and companion screens.

**Tech Stack:** React 19, TypeScript, Vitest, Testing Library, IndexedDB/idb, Supabase Postgres/RPC/RLS, Vite, Vercel.

## Global Constraints

- Do not add a new route or top-level navigation destination.
- Award 5 coins for the first meal of a local day and 8 coins for the second and later meals.
- Never award the same `meal:<mealId>:coins` transaction twice.
- Keep the initial catalog to two backgrounds and two accessories.
- Do not grant coins retroactively for meals saved before this feature.
- Permit offline earning but require a live connection for purchases.
- Keep the cream, purple, and yellow visual system and one emphasized action per screen.
- Support 320px width and both OS and in-app reduced-motion settings.
- Never expose a service-role key or accept a caller-supplied user ID or coin amount.

---

## File Structure

- Create `src/domain/coinWallet.ts`: stable transaction keys, balance calculation, daily award rules, and purchase validation.
- Create `src/domain/coinWallet.test.ts`: pure wallet and edge-case tests.
- Create `src/domain/shopCatalog.ts`: four immutable product definitions and price lookup.
- Create `src/features/shop/CosmeticShop.tsx`: preview, purchase, owned, offline, and insufficient-balance UI.
- Create `src/features/shop/CosmeticShop.test.tsx`: user-visible shop behavior.
- Modify `src/data/foodexDb.ts`: IndexedDB coin store, atomic meal award, wallet queries, and atomic local purchase.
- Modify `src/data/syncRepository.ts`: upload queued coin claims and expose online purchase.
- Modify `src/data/supabaseRepository.ts`: wallet read, meal claim RPC, and purchase RPC.
- Modify `src/App.tsx`: shared wallet state and handlers.
- Modify `src/features/home/HomeScreen.tsx`: compact header balance.
- Modify `src/features/companion/CompanionScreen.tsx`: shop placement in the existing room tab.
- Modify `src/styles.css`: wallet and shop styling.
- Create one Supabase migration via `supabase migration new coin_wallet_shop`: ledger, constraints, policies, and RPC functions.
- Create `supabase/tests/foodex_coin_wallet.sql`: SQL idempotency, ownership, balance, and purchase assertions.

### Task 1: Pure Wallet Rules and Shop Catalog

**Files:**
- Create: `src/domain/coinWallet.ts`
- Create: `src/domain/coinWallet.test.ts`
- Create: `src/domain/shopCatalog.ts`

**Interfaces:**
- Produces:

```ts
export type CoinTransactionKind = 'meal-earned' | 'shop-spent'
export interface CoinTransaction {
  id: string
  key: string
  kind: CoinTransactionKind
  amount: number
  mealId?: string
  productId?: string
  createdAt: number
}
export function mealCoinKey(mealId: string): string
export function coinsForMeal(meal: MealRecord, history: readonly MealRecord[]): 5 | 8
export function walletBalance(transactions: readonly CoinTransaction[]): number
export function validatePurchase(balance: number, product: ShopProduct, ownedIds: ReadonlySet<string>):
  { ok: true } | { ok: false; reason: 'owned' | 'insufficient'; missingCoins?: number }
```

- [ ] **Step 1: Write failing wallet tests**

```ts
it('awards five coins for the first local-day meal and eight thereafter', () => {
  expect(coinsForMeal(lunch, [])).toBe(5)
  expect(coinsForMeal(dinner, [lunch])).toBe(8)
})

it('deduplicates stable keys when calculating a balance', () => {
  expect(walletBalance([earned, { ...earned, id: 'retry' }, spent])).toBe(2)
})

it('reports exactly how many coins a purchase lacks', () => {
  expect(validatePurchase(7, product, new Set())).toEqual({
    ok: false,
    reason: 'insufficient',
    missingCoins: product.price - 7,
  })
})
```

- [ ] **Step 2: Run the domain test and confirm RED**

Run: `npm.cmd run test:run -- src/domain/coinWallet.test.ts`

Expected: FAIL because `coinWallet.ts` does not exist.

- [ ] **Step 3: Implement the minimal pure rules**

```ts
export function mealCoinKey(mealId: string) {
  return `meal:${mealId}:coins`
}

export function coinsForMeal(meal: MealRecord, history: readonly MealRecord[]): 5 | 8 {
  const day = localDay(meal.recordedAt)
  return history.some((item) => localDay(item.recordedAt) === day) ? 8 : 5
}

export function walletBalance(transactions: readonly CoinTransaction[]) {
  const unique = new Map(transactions.map((item) => [item.key, item]))
  return Math.max(0, [...unique.values()].reduce((sum, item) => sum + item.amount, 0))
}
```

Define four products with literal IDs, prices, and existing-compatible reward types:

```ts
export const SHOP_PRODUCTS = [
  { id: 'shop-sunroom', type: 'background', title: '햇살 아침방', price: 20, previewClass: 'background-shop-sunroom' },
  { id: 'shop-moonroom', type: 'background', title: '달빛 저녁방', price: 30, previewClass: 'background-shop-moonroom' },
  { id: 'shop-star-pin', type: 'accessory', title: '별빛 머리핀', price: 15, previewClass: 'skin-shop-star-pin' },
  { id: 'shop-leaf-crown', type: 'accessory', title: '새싹 왕관', price: 25, previewClass: 'skin-shop-leaf-crown' },
] as const satisfies readonly ShopProduct[]
```

- [ ] **Step 4: Run domain tests**

Run: `npm.cmd run test:run -- src/domain/coinWallet.test.ts src/domain/integratedMealResult.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/domain/coinWallet.ts src/domain/coinWallet.test.ts src/domain/shopCatalog.ts
git commit -m "feat: define coin wallet and shop rules"
```

### Task 2: Atomic Local Wallet Persistence

**Files:**
- Modify: `src/data/foodexDb.ts`
- Modify: `src/data/foodexDb.test.ts`
- Modify: `src/domain/integratedMealResult.ts`
- Modify: `src/domain/integratedMealResult.test.ts`

**Interfaces:**
- Extend `SyncQueueItem` with `coinTransactionKey?: string`.
- Extend `FoodexRepository` with:

```ts
listCoinTransactions?(): Promise<CoinTransaction[]>
getCoinBalance?(): Promise<number>
purchaseProduct?(purchase: CoinTransaction, reward: UserReward): Promise<void>
```

- Extend `saveMealAndCard(meal, card, rewards, coinTransaction?)`.

- [ ] **Step 1: Write failing local atomicity tests**

```ts
it('stores one earned transaction when a meal save is retried', async () => {
  await repo.saveMealAndCard(meal, card, [], earned)
  await repo.saveMealAndCard(meal, card, [], { ...earned, id: 'retry' })
  expect(await repo.getCoinBalance()).toBe(5)
})

it('stores a purchase debit and reward together', async () => {
  await repo.saveMealAndCard(meal, card, [], earned20)
  await repo.purchaseProduct(spent15, shopReward)
  expect(await repo.getCoinBalance()).toBe(5)
  expect((await repo.listRewards()).map((item) => item.rewardId)).toContain(shopReward.rewardId)
})
```

- [ ] **Step 2: Run repository tests and confirm RED**

Run: `npm.cmd run test:run -- src/data/foodexDb.test.ts`

Expected: FAIL because wallet repository methods and the fifth IndexedDB store are absent.

- [ ] **Step 3: Upgrade IndexedDB and implement transactions**

Increase the database version from 3 to 4 and create:

```ts
coinTransactions: {
  key: string
  value: CoinTransaction
}
```

Include `coinTransactions` in the existing meal/card/reward read-write transaction:

```ts
const transaction = database.transaction(
  ['meals', 'cards', 'rewards', 'coinTransactions'],
  'readwrite',
)
await transaction.objectStore('coinTransactions').put(coinTransaction)
```

For purchases, check the current sum inside the same transaction, throw `insufficient-coins` when the debit would make it negative, then put both the debit and reward before `transaction.done`.

- [ ] **Step 4: Make integrated results use the same award rule**

Replace the current tag-derived coin value with `coinsForMeal(meal, history)` and add:

```ts
coinTransaction: {
  key: mealCoinKey(meal.id),
  amount: outcome.coins,
}
```

Pass this transaction to `saveMealAndCard` from `App.savePending`.

- [ ] **Step 5: Run local and integration tests**

Run: `npm.cmd run test:run -- src/data/foodexDb.test.ts src/domain/coinWallet.test.ts src/domain/integratedMealResult.test.ts src/App.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/data/foodexDb.ts src/data/foodexDb.test.ts src/domain/integratedMealResult.ts src/domain/integratedMealResult.test.ts src/App.tsx src/App.test.tsx
git commit -m "feat: persist meal coins atomically"
```

### Task 3: Supabase Coin Ledger and Secure RPC

**Files:**
- Create: `supabase/migrations/<generated>_coin_wallet_shop.sql`
- Create: `supabase/tests/foodex_coin_wallet.sql`
- Modify: `src/data/supabaseRepository.ts`
- Modify: `src/data/supabaseRepository.test.ts`

**Interfaces:**
- Produces remote methods:

```ts
getWallet(): Promise<{ balance: number; rewards: UserReward[] }>
claimMealCoins(mealId: string, transactionKey: string): Promise<{ awarded: number; balance: number }>
purchaseShopProduct(productId: string, transactionKey: string): Promise<{ spent: number; balance: number; reward: UserReward }>
```

- [ ] **Step 1: Verify current Supabase guidance and CLI**

Run:

```powershell
supabase --version
supabase migration new coin_wallet_shop
```

Before editing SQL, review the current Supabase changelog and official RLS/database-function documentation. Do not guess CLI flags.

- [ ] **Step 2: Write failing repository contract tests**

```ts
it('claims meal coins without sending an amount or user id', async () => {
  await repository.claimMealCoins(meal.id, `meal:${meal.id}:coins`)
  expect(client.rpc).toHaveBeenCalledWith('claim_meal_coins', {
    p_meal_id: meal.id,
    p_transaction_key: `meal:${meal.id}:coins`,
  })
})

it('purchases a server-priced product without sending a price', async () => {
  await repository.purchaseShopProduct('shop-star-pin', 'shop:purchase-1:coins')
  expect(client.rpc).toHaveBeenCalledWith('purchase_shop_product', {
    p_product_id: 'shop-star-pin',
    p_transaction_key: 'shop:purchase-1:coins',
  })
})
```

- [ ] **Step 3: Run Supabase repository tests and confirm RED**

Run: `npm.cmd run test:run -- src/data/supabaseRepository.test.ts`

- [ ] **Step 4: Implement the migration**

The migration must:

- create `public.coin_transactions` with `unique (user_id, transaction_key)`;
- constrain `kind` to `meal-earned` or `shop-spent`;
- enable RLS and grant only owner `select`;
- add `shop` to `user_rewards.source_type`;
- create a private server-side product lookup with the exact four catalog prices;
- create private definer functions with `set search_path = ''`, explicit `auth.uid()` checks, and no public execute grant;
- create public invoker RPC wrappers accepting only meal/product IDs and stable transaction keys;
- upsert a missing profile safely;
- use `insert ... on conflict do nothing` and increment only when a row was inserted;
- lock the profile row during purchase and reject insufficient balance;
- return JSON containing awarded/spent amount and final balance.

- [ ] **Step 5: Add SQL assertions**

`supabase/tests/foodex_coin_wallet.sql` must prove:

- two claims using one key produce one ledger row;
- a user cannot claim another user's meal;
- the RPC has no coin amount parameter;
- a purchase cannot make `profiles.coins` negative;
- a successful purchase creates one debit and one reward;
- RLS policies exist and no write policy exposes raw ledger inserts.

- [ ] **Step 6: Implement Supabase client methods**

Parse RPC rows explicitly and throw on missing data:

```ts
const result = await client.rpc('claim_meal_coins', {
  p_meal_id: mealId,
  p_transaction_key: transactionKey,
})
throwIfError(result)
return result.data as { awarded: number; balance: number }
```

- [ ] **Step 7: Run unit and local Supabase checks**

Run:

```powershell
npm.cmd run test:run -- src/data/supabaseRepository.test.ts
supabase db reset
```

Run the SQL assertion file through the locally linked test database using the CLI command discovered from `supabase db --help`.

- [ ] **Step 8: Run advisors and commit**

Run Supabase security and performance advisors using the available CLI or MCP tool. Fix findings introduced by this migration.

```powershell
git add supabase/migrations supabase/tests/foodex_coin_wallet.sql src/data/supabaseRepository.ts src/data/supabaseRepository.test.ts
git commit -m "feat: add secure coin ledger RPC"
```

### Task 4: Wallet Synchronization and App State

**Files:**
- Modify: `src/data/syncRepository.ts`
- Modify: `src/data/syncRepository.test.ts`
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`

**Interfaces:**
- `syncItem` calls `upsertMealBundle` before `claimMealCoins`.
- `App` owns `coinBalance`, loads it in `refresh`, and passes it to home and companion.
- Purchases call remote first, then persist the returned local debit and reward.

- [ ] **Step 1: Write failing synchronization tests**

```ts
it('claims coins after the remote meal exists and retries without duplication', async () => {
  await repository.saveMealAndCard(meal, card, [], earned)
  await repository.syncPending()
  expect(remote.upsertMealBundle.mock.invocationCallOrder[0])
    .toBeLessThan(remote.claimMealCoins.mock.invocationCallOrder[0])
  expect(remote.claimMealCoins).toHaveBeenCalledWith(meal.id, earned.key)
})
```

Add an App test that saves one meal, reloads from the same local repository, and still displays 5 coins.

- [ ] **Step 2: Run sync and App tests and confirm RED**

Run: `npm.cmd run test:run -- src/data/syncRepository.test.ts src/App.test.tsx`

- [ ] **Step 3: Implement queue and shared wallet state**

Store `coinTransactionKey` in the queue. Fetch the matching local transaction during sync, claim it only after the meal bundle succeeds, and preserve the queue item on either failure.

Extend `refresh`:

```ts
const [nextEntries, nextSummary, nextRewards, nextSettings, nextBalance] = await Promise.all([
  repository.listCards(),
  repository.getSummary(Date.now()),
  repository.listRewards?.(),
  repository.getExperienceSettings?.(),
  repository.getCoinBalance?.() ?? Promise.resolve(0),
])
```

For cloud purchases, generate one UUID transaction key, call the remote purchase once, then store the returned debit/reward locally. On `insufficient-coins`, refresh the authoritative balance and show the missing amount.

- [ ] **Step 4: Run sync and App tests**

Run: `npm.cmd run test:run -- src/data/syncRepository.test.ts src/data/supabaseRepository.test.ts src/App.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/data/syncRepository.ts src/data/syncRepository.test.ts src/App.tsx src/App.test.tsx
git commit -m "feat: synchronize the coin wallet"
```

### Task 5: Home Wallet and Existing-Room Shop UI

**Files:**
- Create: `src/features/shop/CosmeticShop.tsx`
- Create: `src/features/shop/CosmeticShop.test.tsx`
- Modify: `src/features/home/HomeScreen.tsx`
- Modify: `src/features/home/HomeScreen.test.tsx`
- Modify: `src/features/companion/CompanionScreen.tsx`
- Modify: `src/features/companion/CompanionScreen.test.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- `HomeScreen` consumes `coinBalance: number`.
- `CompanionScreen` consumes `coinBalance`, `shopOnline`, `onPurchaseProduct`.
- `CosmeticShop` emits only a product ID; it does not mutate storage.

- [ ] **Step 1: Write failing UI tests**

```tsx
expect(screen.getByLabelText('모험 코인')).toHaveTextContent('13')

await user.click(screen.getByRole('tab', { name: '내 방' }))
await user.click(screen.getByRole('button', { name: '별빛 머리핀 미리보기' }))
expect(onPurchaseProduct).not.toHaveBeenCalled()
await user.click(screen.getByRole('button', { name: '15코인으로 구매' }))
expect(onPurchaseProduct).toHaveBeenCalledWith('shop-star-pin')
```

Add tests for:

- `N코인이 더 필요해요`;
- `연결 후 구매할 수 있어요`;
- owned products showing `보유 중`;
- reduced-motion class suppressing the success animation.

- [ ] **Step 2: Run UI tests and confirm RED**

Run: `npm.cmd run test:run -- src/features/shop/CosmeticShop.test.tsx src/features/home/HomeScreen.test.tsx src/features/companion/CompanionScreen.test.tsx`

- [ ] **Step 3: Implement compact wallet displays**

Place this beside the existing level pill, not in the status grid:

```tsx
<span className="coin-balance" aria-label="모험 코인">
  <span aria-hidden="true">●</span>{coinBalance}
</span>
```

- [ ] **Step 4: Implement the shop inside the room tab**

Use one selected product state. Preview changes only a CSS class on the room preview. Purchase button copy is derived from `validatePurchase`. Disable purchase when offline, owned, or insufficient.

Do not add another companion tab; render `<CosmeticShop />` below `내 방 장식` when `activeTab === 'room'`.

- [ ] **Step 5: Add visual and accessibility styles**

Use existing radius and shadow values. Add:

- two-column product grid above 360px, one column at 320px;
- gold coin icon and purple/yellow selected border;
- short purchase pop and star effect;
- insufficient-balance shake;
- complete motion removal for OS and `.reduced-motion`.

- [ ] **Step 6: Run UI and App tests**

Run: `npm.cmd run test:run -- src/features/shop/CosmeticShop.test.tsx src/features/home/HomeScreen.test.tsx src/features/companion/CompanionScreen.test.tsx src/App.test.tsx`

Expected: PASS.

- [ ] **Step 7: Run React best-practices review and commit**

Review changed TSX files for derived state, stable effects, accessibility names, and unnecessary rerenders.

```powershell
git add src/features/shop src/features/home src/features/companion src/styles.css src/App.tsx src/App.test.tsx
git commit -m "feat: add the coin shop to Foodex room"
```

### Task 6: Live Supabase Verification and Deployment

**Files:**
- Modify only if verification finds an in-scope defect.

**Interfaces:**
- Produces a verified Supabase project, GitHub branch, and successful Vercel Preview.

- [ ] **Step 1: Run the full local suite**

Run: `npm.cmd run test:run`

Expected: every test file passes with no unhandled errors.

- [ ] **Step 2: Run the production build**

Run: `npm.cmd run build`

Expected: TypeScript and Vite succeed.

- [ ] **Step 3: Apply the migration to the linked project**

Use `supabase migration list` to verify pending state, then the CLI command discovered from `supabase db --help` to apply only the committed migration to project `dqpehkhnishnwrpnslcj`.

Do not print database passwords, access tokens, or secret environment values.

- [ ] **Step 4: Verify live behavior**

Using the publishable client and an anonymous authenticated test user:

1. insert one owned meal/card fixture;
2. call `claim_meal_coins` twice with one key;
3. confirm one ledger row and unchanged second balance;
4. purchase one affordable product;
5. confirm one debit, nonnegative balance, and one owned reward;
6. remove only the explicit test fixtures created by this step.

Do not inspect or alter other users' data.

- [ ] **Step 5: Run live advisors**

Run Supabase security and performance advisors. Resolve findings introduced by this migration before continuing.

- [ ] **Step 6: Inspect Git scope**

Run:

```powershell
git status --short
git diff --check
git diff origin/feature/foodex-mvp...HEAD --name-only
```

Confirm no secrets, generated build output, or unrelated files are included.

- [ ] **Step 7: Push and verify Vercel**

```powershell
git push origin feature/foodex-mvp
```

Query the GitHub commit status and deployment status until Vercel reports `success`. Record the commit SHA and actual Preview URL.
