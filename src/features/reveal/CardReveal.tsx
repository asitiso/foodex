import '../../styles.css'
import { FOOD_EMOJI, FOOD_META } from '../../domain/types'
import type { FoodCard, FoodType } from '../../domain/types'
import { useEffect, useMemo, useRef } from 'react'
import type { ReactNode } from 'react'
import type { ExperienceSettings } from '../../domain/companionTypes'
import type { MealAdventureResult } from '../../domain/progression'
import { directFeedback } from '../../domain/feedback'
import { playFeedback } from '../../lib/gameFeedback'
import type { IntegratedMealResult } from '../../domain/integratedMealResult'

interface CardRevealProps {
  card: FoodCard
  foodType: FoodType
  imageData: string | null
  isSaving: boolean
  recovery?: ReactNode
  adventureResult?: MealAdventureResult
  integratedResult?: IntegratedMealResult
  experienceSettings?: ExperienceSettings
  onSave: () => void
  onDiscard: () => void
}

const DEFAULT_EXPERIENCE_SETTINGS: ExperienceSettings = {
  soundEnabled: true,
  musicEnabled: false,
  hapticsEnabled: true,
  reducedMotion: false,
}

const SECRET_TAG_META: Record<string, string> = {
  midnight: '🌙 심야 카드',
  seasonal: '🍉 제철 카드',
  rainy: '🌈 행운의 날 카드',
}

function secretTagLabels(secretTags?: string[]) {
  if (!secretTags) return []
  return secretTags.map((tag) => SECRET_TAG_META[tag]).filter((label): label is string => Boolean(label))
}

export function CardReveal({
  card,
  foodType,
  imageData,
  isSaving,
  recovery,
  adventureResult,
  integratedResult,
  experienceSettings = DEFAULT_EXPERIENCE_SETTINGS,
  onSave,
  onDiscard,
}: CardRevealProps) {
  const feedback = useMemo(() => directFeedback({ type: 'card', rarity: card.rarity }), [card.rarity])
  const feedbackPlayed = useRef(false)
  const secretTags = useMemo(() => secretTagLabels(card.secretTags), [card.secretTags])

  useEffect(() => {
    if (feedbackPlayed.current) return
    feedbackPlayed.current = true
    void playFeedback(feedback, experienceSettings)
  }, [experienceSettings, feedback])

  return (
    <section
      className={`card-reveal feedback-${feedback.visual}${experienceSettings.reducedMotion ? ' reduced-motion' : ''}`}
      aria-label="발견 카드"
      aria-busy={isSaving}
      data-feedback-visual={feedback.visual}
    >
      <div className="reward-spotlight" aria-hidden="true"><span>✦</span><span>✦</span><span>✦</span></div>
      <p className="reward-headline">식사 카드 획득!</p>
      <p className="eyebrow">새 카드 발견!</p>
      {integratedResult?.evolvedFood && (
        <section className="evolution-reveal-banner" aria-label="진화 알림">
          <span aria-hidden="true">🎉</span>
          <strong>{integratedResult.evolvedFood.title}(으)로 진화했어요!</strong>
        </section>
      )}
      <div className="card-scene card-scene-reveal">
        <article className={`food-card rarity-${card.rarity} card-arrival-pop${card.isShiny ? ' shiny' : ''}`}>
          <div className="sparkles" aria-hidden="true"><span>✦</span><span>✧</span><span>✦</span></div>
          {card.isShiny && (
            <div className="sparkles shiny-sparkles" aria-hidden="true">
              <span>✨</span><span>⭐</span><span>✨</span><span>⭐</span><span>✨</span>
            </div>
          )}
          {card.isShiny && <span className="shiny-badge">✨ 반짝이 카드!</span>}
          <div className="food-card-face food-card-front">
            <span className="rarity-badge">{card.rarity.toUpperCase()}</span>
            <div className={`food-illustration${imageData ? ' has-photo' : ''}`} aria-label={FOOD_META[foodType].label}>
              {imageData ? (
                <img src={imageData} alt="기록한 식사" />
              ) : (
                <span>{FOOD_EMOJI[foodType]}</span>
              )}
              {imageData && <span className="food-illustration-emoji-badge" aria-hidden="true">{FOOD_EMOJI[foodType]}</span>}
              {secretTags.length > 0 && <span className="food-illustration-stamp" aria-hidden="true">{card.secretTags?.[0] === 'midnight' ? '🌙' : card.secretTags?.[0] === 'seasonal' ? '🍉' : '🌈'}</span>}
            </div>
            <h1>{card.name}</h1>
            <p>“{card.quote}”</p>
            <span className="xp-pill">+{card.xp} XP</span>
          </div>
        </article>
      </div>
      {card.stats && (
        <div className="card-stats-row" aria-label="힘 · 행운 · 온기">
          <span><b>힘</b>{card.stats.power}</span>
          <span><b>행운</b>{card.stats.luck}</span>
          <span><b>온기</b>{card.stats.warmth}</span>
        </div>
      )}
      {secretTags.length > 0 && (
        <div className="secret-tag-badges" aria-label="비밀 조건 카드">
          {secretTags.map((label) => <span className="secret-tag-badge" key={label}>{label}</span>)}
        </div>
      )}
      {integratedResult && (
        <section className="integrated-reward-result" aria-label="통합 보상">
          <p className="eyebrow">MEAL REWARD</p>
          <h2>한 끼 모험 보상</h2>
          <div className="integrated-reward-list">
            {integratedResult.primaryRewards.map((reward) => (
              <article data-testid="primary-reward" key={reward.id}>
                <span>{reward.label}</span>
                <strong>{reward.value}</strong>
              </article>
            ))}
          </div>
          <strong className="integrated-next-goal-title">다음 목표</strong>
          <p>{integratedResult.nextGoal.label}</p>
          {integratedResult.detailRewards.length > 0 && (
            <details className="integrated-reward-details">
              <summary>추가 보상 {integratedResult.detailRewards.length}개</summary>
              <ul>
                {integratedResult.detailRewards.map((reward) => <li key={reward.id}>{reward.label}</li>)}
              </ul>
            </details>
          )}
        </section>
      )}
      {adventureResult && (
        <section className="adventure-result-card result-celebration" aria-label="한 끼 모험 결과">
          <p className="eyebrow">V5.1 QUEST CLEAR</p>
          <strong className="adventure-result-headline">{adventureResult.headline}</strong>
          <dl className="adventure-result-grid">
            <div>
              <dt>경험치</dt>
              <dd>{adventureResult.xpText}</dd>
            </div>
            <div>
              <dt>캐릭터</dt>
              <dd>{adventureResult.levelText}</dd>
            </div>
            <div>
              <dt>퀘스트</dt>
              <dd>{adventureResult.questText}</dd>
            </div>
            <div>
              <dt>박물관</dt>
              <dd>{adventureResult.museumText}</dd>
            </div>
          </dl>
          <p className="evolution-result">{adventureResult.evolutionText}</p>
          {adventureResult.rewardTexts.length > 0 && (
            <ul className="reward-result-list">
              {adventureResult.rewardTexts.map((reward) => <li key={reward}>{reward}</li>)}
            </ul>
          )}
          <strong className="next-goal-result">{adventureResult.nextGoalText}</strong>
        </section>
      )}
      <p className="reveal-copy">도감에 저장하고 다음 모험도 이어 가자!</p>
      <div className="reveal-actions">
        {!integratedResult && <button className="secondary-action" type="button" onClick={onDiscard} disabled={isSaving}>다시 선택</button>}
        <button type="button" onClick={onSave} disabled={isSaving}>{integratedResult ? '보상 확인 완료' : '도감에 저장'}</button>
      </div>
      {recovery}
    </section>
  )
}
