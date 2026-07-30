import type { ExperienceSettings as ExperienceSettingsValue } from '../../domain/companionTypes'

const OPTIONS: readonly {
  key: keyof ExperienceSettingsValue
  label: string
  description: string
}[] = [
  { key: 'soundEnabled', label: '효과음', description: '카드와 보상 소리' },
  { key: 'musicEnabled', label: '배경음', description: '방의 잔잔한 음악' },
  { key: 'hapticsEnabled', label: '진동', description: '획득 순간의 진동' },
  { key: 'reducedMotion', label: '움직임 줄이기', description: '점프와 반짝임 최소화' },
]

export function ExperienceSettings({
  value,
  onChange,
}: {
  value: ExperienceSettingsValue
  onChange: (value: ExperienceSettingsValue) => void
}) {
  return (
    <section className="experience-settings" aria-labelledby="experience-settings-title">
      <h2 id="experience-settings-title">게임 효과 설정</h2>
      {OPTIONS.map((option) => (
        <div className="setting-row" key={option.key}>
          <div><strong>{option.label}</strong><small>{option.description}</small></div>
          <button
            type="button"
            role="switch"
            aria-label={option.label}
            aria-checked={value[option.key]}
            onClick={() => onChange({ ...value, [option.key]: !value[option.key] })}
          >
            <span aria-hidden="true" />
          </button>
        </div>
      ))}
    </section>
  )
}
