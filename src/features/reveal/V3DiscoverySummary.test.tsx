import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { V3DiscoverySummary } from './V3DiscoverySummary'

describe('V3DiscoverySummary', () => {
  it('shows every newly earned V3 result together', () => {
    render(
      <V3DiscoverySummary
        regionTitle="간식섬"
        seasonTitle="여름"
        completedSetTitles={['햇살 한입단']}
        rewardTitles={['햇살 소풍 배경']}
      />,
    )

    expect(screen.getByText('간식섬에 새 친구가 나타났어요')).toBeInTheDocument()
    expect(screen.getByText('여름 도장 획득')).toBeInTheDocument()
    expect(screen.getByText('햇살 한입단 완성')).toBeInTheDocument()
    expect(screen.getByText('햇살 소풍 배경 획득')).toBeInTheDocument()
  })
})
