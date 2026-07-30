import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getPhoto: vi.fn(),
  impact: vi.fn(),
  isNativePlatform: vi.fn(),
}))

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: mocks.isNativePlatform },
}))

vi.mock('@capacitor/camera', () => ({
  Camera: { getPhoto: mocks.getPhoto },
  CameraDirection: { Rear: 'rear' },
  CameraResultType: { DataUrl: 'dataUrl' },
  CameraSource: { Camera: 'camera' },
}))

vi.mock('@capacitor/haptics', () => ({
  Haptics: { impact: mocks.impact },
  ImpactStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
}))

import {
  captureNativeMealPhoto,
  isNativeApp,
  nativeHapticsAdapter,
} from './nativePlatform'

describe('nativePlatform', () => {
  beforeEach(() => {
    mocks.getPhoto.mockReset()
    mocks.impact.mockReset()
    mocks.isNativePlatform.mockReset()
  })

  it('opens the rear camera and returns a data URL on Android', async () => {
    mocks.isNativePlatform.mockReturnValue(true)
    mocks.getPhoto.mockResolvedValue({ dataUrl: 'data:image/jpeg;base64,bWVhbA==' })

    await expect(captureNativeMealPhoto()).resolves.toBe('data:image/jpeg;base64,bWVhbA==')
    expect(isNativeApp()).toBe(true)
    expect(mocks.getPhoto).toHaveBeenCalledWith(expect.objectContaining({
      source: 'camera',
      direction: 'rear',
      resultType: 'dataUrl',
    }))
  })

  it('maps Foodex feedback strength to native impact styles', async () => {
    await nativeHapticsAdapter.vibrate('heavy')

    expect(mocks.impact).toHaveBeenCalledWith({ style: 'heavy' })
  })
})
