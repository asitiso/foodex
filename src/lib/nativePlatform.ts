import { Capacitor } from '@capacitor/core'
import {
  Camera,
  CameraDirection,
  CameraResultType,
  CameraSource,
} from '@capacitor/camera'
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import type { HapticStrength } from '../domain/feedback'
import type { NativeHapticsAdapter } from './gameFeedback'

const IMPACT_STYLES: Record<Exclude<HapticStrength, 'none'>, ImpactStyle> = {
  light: ImpactStyle.Light,
  medium: ImpactStyle.Medium,
  heavy: ImpactStyle.Heavy,
}

export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform()
}

export async function captureNativeMealPhoto(): Promise<string | undefined> {
  const photo = await Camera.getPhoto({
    quality: 85,
    allowEditing: false,
    source: CameraSource.Camera,
    direction: CameraDirection.Rear,
    resultType: CameraResultType.DataUrl,
  })

  return photo.dataUrl
}

export const nativeHapticsAdapter: NativeHapticsAdapter = {
  async vibrate(strength) {
    await Haptics.impact({ style: IMPACT_STYLES[strength] })
  },
}
