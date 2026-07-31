import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from './App'
import type { FoodexRepository } from './data/foodexDb'
import type { FoodCard, FoodHistory, MealRecord } from './domain/types'

class SuccessfulFileReader {
  onload: ((event: ProgressEvent<FileReader>) => void) | null = null
  result: string | ArrayBuffer | null = null

  readAsDataURL() {
    this.result = 'data:image/jpeg;base64,dGVzdA=='
    this.onload?.({ target: this } as unknown as ProgressEvent<FileReader>)
  }
}

function createMemoryRepository(options: {
  failSave?: (meal: MealRecord) => Error | undefined
  saveGate?: Promise<void>
} = {}): FoodexRepository {
  const meals: MealRecord[] = []
  const cards: FoodCard[] = []

  return {
    async saveMealAndCard(meal, card) {
      await options.saveGate
      const failure = options.failSave?.(meal)
      if (failure) throw failure
      meals.push(meal)
      cards.push(card)
    },
    async listCards() {
      return cards
        .map((card) => ({ card, meal: meals.find((meal) => meal.id === card.mealId)! }))
        .filter(({ meal }) => Boolean(meal))
        .sort((left, right) => right.card.createdAt - left.card.createdAt)
    },
    async getHistory(): Promise<FoodHistory> {
      return {
        foodTypes: [...new Set(meals.map((meal) => meal.foodType))],
        foodNames: [...new Set(meals.map((meal) => meal.foodName))],
        categories: [],
      }
    },
    async getSummary(now) {
      const startOfToday = new Date(now).setHours(0, 0, 0, 0)
      const tomorrow = new Date(startOfToday).setDate(new Date(startOfToday).getDate() + 1)
      return {
        todayCount: meals.filter((meal) => meal.recordedAt >= startOfToday && meal.recordedAt < tomorrow).length,
        discoveredCount: new Set(meals.map((meal) => meal.foodType)).size,
        totalXp: cards.reduce((total, card) => total + card.xp, 0),
        ...(meals.length ? { lastMealAt: Math.max(...meals.map((meal) => meal.recordedAt)) } : {}),
      }
    },
  }
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((next) => {
    resolve = next
  })

  return { promise, resolve }
}

async function completeRecordFlow(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: '촬영' }))
  await user.upload(screen.getByLabelText('식사 사진 선택'), new File(['image'], 'meal.jpg', { type: 'image/jpeg' }))
  await user.click(screen.getByRole('button', { name: '다음' }))
  await user.type(screen.getByRole('searchbox', { name: '음식 검색' }), '라면')
  await user.click(screen.getByRole('button', { name: '라면' }))
  await user.click(screen.getByRole('button', { name: '다음' }))
  await user.click(screen.getByRole('button', { name: '맛보기' }))
  await user.click(screen.getByRole('button', { name: '카드 열기' }))
}

describe('App', () => {
  beforeEach(() => {
    vi.stubGlobal('FileReader', SuccessfulFileReader)
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('saves a revealed card and refreshes home and collection', async () => {
    const user = userEvent.setup()
    render(<App repository={createMemoryRepository()} />)

    await completeRecordFlow(user)
    await user.click(screen.getByRole('button', { name: '도감에 저장' }))

    expect(await screen.findByRole('button', { name: /오늘의 카드 1장/ })).toBeInTheDocument()
    expect(screen.getByText('레벨')).toBeInTheDocument()
    expect(screen.getByText('LV.1')).toBeInTheDocument()
    expect(screen.getByText('연속 기록')).toBeInTheDocument()
    expect(screen.getByText('1일')).toBeInTheDocument()
    expect(screen.getByText('오늘의 도전')).toBeInTheDocument()
    expect(screen.queryByText('여름 한입 시즌')).not.toBeInTheDocument()
    expect(screen.queryByText('오늘의 상자')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '도감' }))
    expect((await screen.findAllByText(/라면/)).length).toBeGreaterThan(0)
    expect(await screen.findByText('도감 완성률 9%')).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: '성장' }))
    expect(screen.getByText('첫 식사')).toBeInTheDocument()
    expect(screen.getByText('면 스타터')).toBeInTheDocument()
  })

  it('uses the specified home call to action copy', () => {
    render(<App repository={createMemoryRepository()} />)

    expect(screen.getByRole('button', { name: '오늘의 보상 받기' })).toBeInTheDocument()
  })

  it('shows the unified reward result only after the meal is safely persisted', async () => {
    const user = userEvent.setup()
    const saveGate = deferred<void>()
    render(<App repository={createMemoryRepository({ saveGate: saveGate.promise })} />)

    await completeRecordFlow(user)
    await user.click(screen.getByRole('button', { name: '도감에 저장' }))
    expect(screen.queryByRole('region', { name: '통합 보상' })).not.toBeInTheDocument()

    saveGate.resolve()

    expect(await screen.findByRole('region', { name: '통합 보상' })).toBeInTheDocument()
    expect(screen.getByText('다음 목표')).toBeInTheDocument()
  })

  it('shows an empty collection without blaming the user', async () => {
    const user = userEvent.setup()
    render(<App repository={createMemoryRepository()} />)

    await user.click(screen.getByRole('button', { name: '도감' }))

    expect(await screen.findByText('첫 식사 카드를 만나러 가볼까요?')).toBeInTheDocument()
  })

  it('marks the selected navigation destination as the current page', async () => {
    const user = userEvent.setup()
    render(<App repository={createMemoryRepository()} />)

    expect(screen.getByRole('button', { name: '홈' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: '촬영' })).not.toHaveAttribute('aria-current')

    await user.click(screen.getByRole('button', { name: '촬영' }))

    expect(screen.getByRole('button', { name: '촬영' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: '홈' })).not.toHaveAttribute('aria-current')
  })

  it('opens the adventure and companion destinations', async () => {
    const user = userEvent.setup()
    render(<App repository={createMemoryRepository()} />)

    await user.click(screen.getByRole('button', { name: '모험' }))
    expect(screen.getByRole('region', { name: '모험' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '모험' })).toHaveAttribute('aria-current', 'page')

    await user.click(screen.getByRole('button', { name: '버디' }))
    expect(screen.getByRole('region', { name: 'AI 친구' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '버디' })).toHaveAttribute('aria-current', 'page')
  })

  it('opens the same companion route from the home room action', async () => {
    const user = userEvent.setup()
    render(<App repository={createMemoryRepository()} />)

    await user.click(screen.getByRole('button', { name: '버디 방으로 가기' }))

    expect(screen.getByRole('region', { name: 'AI 친구' })).toBeInTheDocument()
  })

  it('names every V3 destination and collection tab', async () => {
    const user = userEvent.setup()
    render(<App repository={createMemoryRepository()} />)

    for (const destination of ['홈', '도감', '촬영', '모험', '버디']) {
      expect(screen.getByRole('button', { name: destination })).toHaveAccessibleName()
    }

    await user.click(screen.getByRole('button', { name: '도감' }))
    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(5)
    tabs.forEach((tab) => expect(tab).toHaveAccessibleName())
  })

  it('shows the automatic region discovery after saving a new meal', async () => {
    const user = userEvent.setup()
    render(<App repository={createMemoryRepository()} />)

    await completeRecordFlow(user)
    await user.click(screen.getByRole('button', { name: '도감에 저장' }))

    expect(await screen.findByText('한식마을에 새 친구가 나타났어요')).toBeInTheDocument()
  })

  it('names visible navigation, record, and reveal controls', async () => {
    const user = userEvent.setup()
    render(<App repository={createMemoryRepository()} />)

    const expectNamedVisibleButtons = () => {
      screen.getAllByRole('button').forEach((button) => expect(button).toHaveAccessibleName())
    }

    expectNamedVisibleButtons()
    await user.click(screen.getByRole('button', { name: '촬영' }))

    expectNamedVisibleButtons()
    expect(screen.getByLabelText('식사 사진 선택')).toHaveAttribute('type', 'file')
    expect(screen.getByLabelText('사진첩에서 고르기')).toHaveAttribute('type', 'file')

    await user.upload(screen.getByLabelText('식사 사진 선택'), new File(['image'], 'meal.jpg', { type: 'image/jpeg' }))
    await user.click(screen.getByRole('button', { name: '다음' }))
    expectNamedVisibleButtons()

    await user.type(screen.getByRole('searchbox', { name: '음식 검색' }), '라면')
    await user.click(screen.getByRole('button', { name: '라면' }))
    await user.click(screen.getByRole('button', { name: '다음' }))
    expectNamedVisibleButtons()

    await user.click(screen.getByRole('button', { name: '맛보기' }))
    await user.click(screen.getByRole('button', { name: '카드 열기' }))
    expectNamedVisibleButtons()
  })

  it('retries a quota failure by saving the card without its photo', async () => {
    const user = userEvent.setup()
    const repository = createMemoryRepository({
      failSave: (meal) => meal.imageData ? Object.assign(new Error('full'), { name: 'QuotaExceededError' }) : undefined,
    })
    render(<App repository={repository} />)

    await completeRecordFlow(user)
    await user.click(screen.getByRole('button', { name: '도감에 저장' }))
    expect(await screen.findByText('사진 저장 공간이 부족해요. 카드만 저장할까요?')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '카드만 저장' }))
    expect(await screen.findByRole('button', { name: /오늘의 카드 1장/ })).toBeInTheDocument()
  })

  it('preserves card-only mode when its first save fails and refreshes the photo-less card', async () => {
    const user = userEvent.setup()
    const attemptedMeals: MealRecord[] = []
    let cardOnlyFailures = 0
    const repository = createMemoryRepository({
      failSave: (meal) => {
        attemptedMeals.push(meal)
        if (meal.imageData) return Object.assign(new Error('full'), { name: 'QuotaExceededError' })
        cardOnlyFailures += 1
        return cardOnlyFailures === 1 ? new Error('offline') : undefined
      },
    })
    render(<App repository={repository} />)

    await completeRecordFlow(user)
    await user.click(screen.getByRole('button', { name: '도감에 저장' }))
    await user.click(await screen.findByRole('button', { name: '카드만 저장' }))
    expect(await screen.findByText('저장하지 못했어요. 다시 시도해 주세요.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '다시 저장' }))

    expect(await screen.findByRole('button', { name: /오늘의 카드 1장/ })).toBeInTheDocument()
    expect(attemptedMeals.map((meal) => meal.imageData)).toEqual([
      'data:image/jpeg;base64,dGVzdA==',
      null,
      null,
    ])
    await user.click(screen.getByRole('button', { name: '도감' }))
    await user.click(await screen.findByRole('button', { name: /라면/ }))
    expect(screen.getByLabelText('사진 없이 저장한 카드')).toBeInTheDocument()
  })

  it('disables save and discard while a save is in flight', async () => {
    const user = userEvent.setup()
    const saving = deferred<void>()
    const repository = createMemoryRepository()
    const save = repository.saveMealAndCard.bind(repository)
    repository.saveMealAndCard = async (meal, card) => {
      await saving.promise
      await save(meal, card)
    }
    render(<App repository={repository} />)

    await completeRecordFlow(user)
    const saveButton = screen.getByRole('button', { name: '도감에 저장' })
    const discardButton = screen.getByRole('button', { name: '다시 선택' })
    fireEvent.click(saveButton)

    expect(saveButton).toBeDisabled()
    expect(discardButton).toBeDisabled()
    fireEvent.click(discardButton)
    expect(screen.getByRole('heading', { name: /라면/ })).toBeInTheDocument()

    saving.resolve(undefined)
    expect(await screen.findByRole('button', { name: /오늘의 카드 1장/ })).toBeInTheDocument()
  })

  it('keeps a retry action available after a non-quota save failure', async () => {
    const user = userEvent.setup()
    render(<App repository={createMemoryRepository({ failSave: () => new Error('offline') })} />)

    await completeRecordFlow(user)
    await user.click(screen.getByRole('button', { name: '도감에 저장' }))

    const error = await screen.findByRole('alert')
    expect(error).toHaveTextContent('저장하지 못했어요. 다시 시도해 주세요.')
    expect(within(error).getByRole('button', { name: '다시 저장' })).toBeEnabled()
    expect(error).toHaveFocus()
    expect(error.closest('.card-reveal')).not.toBeNull()
  })

  it('offers a retry when initial card data cannot be read', async () => {
    const user = userEvent.setup()
    let shouldFail = true
    const repository = createMemoryRepository()
    repository.listCards = async () => {
      if (shouldFail) throw new Error('read failed')
      return []
    }
    repository.getSummary = async () => {
      if (shouldFail) throw new Error('read failed')
      return { todayCount: 0, discoveredCount: 0, totalXp: 0 }
    }
    render(<App repository={repository} />)

    expect(await screen.findByText('불러오지 못했어요. 다시 시도해 주세요.')).toBeInTheDocument()
    shouldFail = false
    await user.click(screen.getByRole('button', { name: '다시 불러오기' }))

    await waitFor(() => expect(screen.queryByText('불러오지 못했어요. 다시 시도해 주세요.')).not.toBeInTheDocument())
  })

  it('offers a retry when card history cannot be read before reveal', async () => {
    const user = userEvent.setup()
    let historyReads = 0
    const repository = createMemoryRepository()
    repository.getHistory = async () => {
      historyReads += 1
      if (historyReads === 1) throw new Error('history failed')
      return { foodTypes: [], foodNames: [], categories: [] }
    }
    render(<App repository={repository} />)

    await completeRecordFlow(user)
    const error = await screen.findByRole('alert')
    expect(error).toHaveTextContent('카드를 만들 준비를 하지 못했어요. 다시 시도해 주세요.')
    expect(error).toHaveFocus()
    expect(error.closest('.record-flow')).not.toBeNull()

    await user.click(screen.getByRole('button', { name: '다시 카드 열기' }))
    expect(await screen.findByRole('heading', { name: /라면/ })).toBeInTheDocument()
  })

  it('keeps post-save data when an earlier refresh finishes last', async () => {
    const user = userEvent.setup()
    const initialCards = deferred<Array<{ card: FoodCard; meal: MealRecord }>>()
    const initialSummary = deferred<{ todayCount: number; discoveredCount: number; totalXp: number }>()
    let listReadCount = 0
    let summaryReadCount = 0
    let saved: { card: FoodCard; meal: MealRecord } | undefined
    const repository: FoodexRepository = {
      async saveMealAndCard(meal, card) {
        saved = { meal, card }
      },
      async listCards() {
        listReadCount += 1
        return listReadCount === 1 ? initialCards.promise : saved ? [saved] : []
      },
      async getHistory() {
        return { foodTypes: [], foodNames: [], categories: [] }
      },
      async getSummary() {
        summaryReadCount += 1
        return summaryReadCount === 1 ? initialSummary.promise : { todayCount: saved ? 1 : 0, discoveredCount: saved ? 1 : 0, totalXp: saved?.card.xp ?? 0 }
      },
    }
    render(<App repository={repository} />)
    await waitFor(() => expect(listReadCount).toBe(1))
    await waitFor(() => expect(summaryReadCount).toBe(1))

    await completeRecordFlow(user)
    await user.click(screen.getByRole('button', { name: '도감에 저장' }))
    expect(await screen.findByRole('button', { name: /오늘의 카드 1장/ })).toBeInTheDocument()

    await act(async () => {
      initialCards.resolve([])
      initialSummary.resolve({ todayCount: 0, discoveredCount: 0, totalXp: 0 })
      await Promise.all([initialCards.promise, initialSummary.promise])
    })

    expect(screen.getByRole('button', { name: /오늘의 카드 1장/ })).toBeInTheDocument()
  })
})
