import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { CompanionScreen } from './CompanionScreen'
import { buildProgression } from '../../domain/progression'

const props = {
  entries: [],
  roomUnlocks: [],
  progression: buildProgression([]),
  rewards: [],
  experienceSettings: { soundEnabled: true, musicEnabled: false, hapticsEnabled: true, reducedMotion: false },
  onExperienceSettingsChange: () => undefined,
}

describe('CompanionScreen', () => {
  it('opens on the room instead of the journal dashboard', () => {
    const { container } = render(<CompanionScreen {...props} />)

    expect(container.querySelector('.companion-room-scene')).toBeInTheDocument()
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('opens the shop in the room sheet and preserves preview behavior', async () => {
    const user = userEvent.setup()
    const { container } = render(<CompanionScreen {...props} coinBalance={30} shopOnline />)
    const shopButton = Array.from(screen.getAllByRole('button')).find((button) => button.classList.contains('room-hotspot-shop'))

    expect(shopButton).toBeDefined()
    await user.click(shopButton!)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await user.click(screen.getAllByRole('button', { name: /미리보기/ })[0])
    expect(container.querySelector('.shop-dialog')).toBeInTheDocument()
  })
})
