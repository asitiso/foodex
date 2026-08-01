import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { GameIcon } from './GameIcon'

describe('GameIcon', () => {
  it('renders a stable svg icon instead of an emoji glyph', () => {
    render(<GameIcon name="camera" title="카메라" />)

    expect(screen.getByRole('img', { name: '카메라' }).tagName.toLowerCase()).toBe('svg')
  })
})
