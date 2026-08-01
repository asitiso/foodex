import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { InstallAppButton } from './InstallAppButton'

describe('InstallAppButton', () => {
  it('explains that the app can be installed when the browser supports it', () => {
    render(<InstallAppButton />)

    expect(screen.getByRole('button', { name: /앱 설치/i })).toBeInTheDocument()
  })
})
