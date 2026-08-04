import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ReferenceLandmarkButton } from './ReferenceLandmarkButton'

describe('ReferenceLandmarkButton', () => {
  it.each([
    ['collection', '도감 열기', '도감', 'collection'],
    ['adventure', '모험 열기', '모험', 'adventure'],
    ['buddy', '버디 열기', '버디', 'buddy'],
  ] as const)('renders %s variant and preserves callback', async (variant, label, text, icon) => {
    const onActivate = vi.fn()
    const user = userEvent.setup()
    render(
      <ReferenceLandmarkButton
        variant={variant}
        label={label}
        text={text}
        icon={icon}
        className={`world-landmark-${variant}`}
        onActivate={onActivate}
      />,
    )
    const button = screen.getByRole('button', { name: label })
    expect(button).toHaveAttribute('data-landmark-variant', variant)
    expect(button).toHaveClass('reference-landmark-button')
    await user.click(button)
    expect(onActivate).toHaveBeenCalledTimes(1)
  })
})
