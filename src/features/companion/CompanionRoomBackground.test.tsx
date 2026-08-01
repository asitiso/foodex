import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SCENE_ASSETS } from '../../ui/sceneAssets'
import { CompanionRoomScene } from './CompanionRoomScene'

describe('CompanionRoomScene background', () => {
  it('renders the fantasy room artwork as an isolated image layer', () => {
    render(
      <CompanionRoomScene
        characterId="foody"
        emotion="happy"
        reducedMotion={false}
        coinBalance={0}
        activePanel={null}
        onPanelChange={vi.fn()}
        childrenByPanel={{}}
      />,
    )

    const scene = screen.getByRole('region', { name: '친구의 방' })
    const background = scene.querySelector<HTMLImageElement>('.buddy-room-background')

    expect(background).not.toBeNull()
    expect(background).toHaveAttribute('src', SCENE_ASSETS.companionRoom)
    expect(background).toHaveAttribute('aria-hidden', 'true')
  })
})
