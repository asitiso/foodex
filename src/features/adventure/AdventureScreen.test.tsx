import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { buildProgression } from '../../domain/progression'
import { buildAdvancedGameSystems } from '../../domain/advancedGameSystems'
import { AdventureScreen } from './AdventureScreen'

describe('AdventureScreen', () => {
  afterEach(cleanup)
  it('groups quests achievements and events without putting them on home', async () => {
    render(<AdventureScreen progression={buildProgression([])} />)

    expect(screen.getByRole('tab', { name: '오늘' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '업적' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '이벤트' })).toBeInTheDocument()
    expect(screen.getByRole('tabpanel', { name: '오늘' })).toHaveTextContent('오늘의 도전')

    await userEvent.click(screen.getByRole('tab', { name: '업적' }))
    expect(screen.getByRole('tabpanel', { name: '업적' })).toHaveTextContent('첫 식사')
    expect(screen.queryByRole('tabpanel', { name: '오늘' })).not.toBeInTheDocument()
  })

  it('highlights missions and achievements completed by the latest meal', async () => {
    const progression = buildProgression([])
    progression.dailyQuests[0] = { ...progression.dailyQuests[0], completed: true }
    progression.achievements[0] = { ...progression.achievements[0], unlocked: true }
    render(
      <AdventureScreen
        progression={progression}
        recentQuestIds={['today-card']}
        recentAchievementIds={['first-meal']}
      />,
    )

    expect(screen.getByTestId('quest-today-card')).toHaveClass('recently-unlocked')
    await userEvent.click(screen.getByRole('tab', { name: '업적' }))
    expect(screen.getByTestId('achievement-first-meal')).toHaveClass('recently-unlocked')
  })

  it('explains an achievement in a popup when tapped', async () => {
    const user = userEvent.setup()
    render(<AdventureScreen progression={buildProgression([])} />)

    await user.click(screen.getByRole('tab', { name: '업적' }))
    await user.click(screen.getByTestId('achievement-first-meal'))

    expect(screen.getByRole('dialog', { name: '첫 식사' })).toHaveTextContent('첫 카드를 도감에 저장했어요.')
    await user.click(screen.getByRole('button', { name: '첫 식사 닫기' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('explains the season event and its steps in a popup when tapped', async () => {
    const user = userEvent.setup()
    render(<AdventureScreen progression={buildProgression([])} />)

    await user.click(screen.getByRole('tab', { name: '이벤트' }))
    await user.click(screen.getByRole('button', { name: '여름 한입 시즌' }))

    const dialog = screen.getByRole('dialog', { name: '여름 한입 시즌' })
    expect(dialog).toHaveTextContent('여름 한정 이벤트예요')
    expect(dialog).toHaveTextContent('과일 카드 발견하기')
    expect(dialog).toHaveTextContent('전설의 여름 식탁')
  })

  it('shows every season mission as its own clickable panel', async () => {
    const user = userEvent.setup()
    const progression = buildProgression([])
    render(<AdventureScreen progression={progression} />)

    await user.click(screen.getByRole('tab', { name: '이벤트' }))

    for (const mission of progression.seasonMissions) {
      const panel = screen.getByRole('button', { name: mission.title })
      expect(panel).toHaveTextContent(mission.rewardTitle)
    }

    const secondMission = progression.seasonMissions[1]
    await user.click(screen.getByRole('button', { name: secondMission.title }))
    const dialog = screen.getByRole('dialog', { name: secondMission.title })
    expect(dialog).toHaveTextContent(secondMission.description)
    expect(dialog).toHaveTextContent(secondMission.rewardTitle)
    expect(dialog).toHaveTextContent(secondMission.steps[0].label)
  })

  it('shows the boss fight card and explains boss damage in a popup when tapped', async () => {
    const user = userEvent.setup()
    const advancedSystems = buildAdvancedGameSystems([], 'hearty-guardian', 1)
    render(<AdventureScreen progression={buildProgression([])} advancedSystems={advancedSystems} />)

    const bossPanel = screen.getByRole('button', { name: '오늘의 보스전' })
    expect(bossPanel).toHaveTextContent(advancedSystems.boss.name)
    expect(bossPanel).toHaveTextContent(`${advancedSystems.boss.hp}/${advancedSystems.boss.maxHp}`)

    await user.click(bossPanel)
    const dialog = screen.getByRole('dialog', { name: '오늘의 보스전' })
    expect(dialog).toHaveTextContent('골고루 먹을수록 보스에게 더 큰 피해를 줘요!')
    await user.click(screen.getByRole('button', { name: '오늘의 보스전 닫기' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('explains the meal dungeon rooms in a popup when tapped', async () => {
    const user = userEvent.setup()
    const advancedSystems = buildAdvancedGameSystems([], 'hearty-guardian', 1)
    render(<AdventureScreen progression={buildProgression([])} advancedSystems={advancedSystems} />)

    const dungeonPanel = screen.getByRole('button', { name: '오늘의 식사 던전' })
    await user.click(dungeonPanel)

    const dialog = screen.getByRole('dialog', { name: '오늘의 식사 던전' })
    expect(dialog).toHaveTextContent('식사를 기록할 때마다 방이 하나씩 열려요')
    for (const room of advancedSystems.dungeon.rooms) {
      expect(dialog).toHaveTextContent(room.name)
    }
    await user.click(screen.getByRole('button', { name: '오늘의 식사 던전 닫기' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('celebrates a fully cleared meal dungeon', () => {
    const now = Date.now()
    const meals = ['ramen', 'rice', 'side'].map((foodType, index) => ({
      id: `meal-${index}`,
      imageData: null,
      foodType: foodType as 'ramen' | 'rice' | 'side',
      foodName: foodType,
      amount: 'almostAll' as const,
      recordedAt: now,
    }))
    const advancedSystems = buildAdvancedGameSystems(meals.map((meal) => ({ meal })), 'hearty-guardian', 1)
    render(<AdventureScreen progression={buildProgression([])} advancedSystems={advancedSystems} />)

    const dungeonPanel = screen.getByRole('button', { name: '오늘의 식사 던전' })
    expect(dungeonPanel).toHaveClass('dungeon-complete')
    expect(dungeonPanel).toHaveTextContent('완주!')
  })

  it('does not show a boss panel when advancedSystems is not provided', () => {
    render(<AdventureScreen progression={buildProgression([])} />)

    expect(screen.queryByRole('button', { name: '오늘의 보스전' })).not.toBeInTheDocument()
  })
})
