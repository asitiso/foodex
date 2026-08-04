import { FOOD_CATALOG } from '../../domain/v3Content'
import { FOOD_EMOJI } from '../../domain/types'
import type { RegionId } from '../../domain/types'
import type { V3Progress } from '../../domain/v3Progression'

const REGION_ICON: Record<RegionId, string> = {
  korea: '🏯',
  china: '⚓',
  japan: '⛩️',
  west: '🏰',
  'snack-island': '🏝️',
}

const REGION_THEME: Record<RegionId, string> = {
  korea: 'region-korea',
  china: 'region-china',
  japan: 'region-japan',
  west: 'region-west',
  'snack-island': 'region-snack-island',
}

const REGION_MASTERY_TITLE: Record<RegionId, string> = {
  korea: '한식 마스터',
  china: '중화 탐험가',
  japan: '일식 장인',
  west: '양식 셰프',
  'snack-island': '간식 대장',
}

export function WorldMapTab({ progress, discovered }: { progress: V3Progress; discovered?: ReadonlySet<string> }) {
  const found = discovered ?? new Set<string>()

  return (
    <section className="world-map-board" aria-label="음식 세계 지도">
      <p className="world-map-copy">발견한 음식이 길을 밝히고, 새로운 마을로 이어져요.</p>
      <div className="world-grid">
        {progress.regions.map((region) => {
          const foods = FOOD_CATALOG.filter((food) => food.regionId === region.id)
          const conquered = region.percent >= 100
          return (
            <article
              className={[
                'world-region',
                REGION_THEME[region.id],
                region.discovered > 0 ? 'discovered' : '',
                conquered ? 'conquered' : '',
              ].filter(Boolean).join(' ')}
              key={region.id}
            >
              <span className="world-region-marker" aria-hidden="true">
                {conquered ? '🏆' : region.discovered > 0 ? REGION_ICON[region.id] : '◇'}
              </span>
              <div><h2>{region.title}</h2><p>{region.discovered}/{region.total} 발견 · {region.percent}%</p></div>
              <div className="level-track" aria-hidden="true"><span style={{ width: `${region.percent}%` }} /></div>
              <ul className="world-region-foods" aria-label={`${region.title} 음식`}>
                {foods.map((food) => {
                  const foodDiscovered = found.has(food.id)
                  return (
                    <li className={foodDiscovered ? 'found' : ''} key={food.id} title={foodDiscovered ? food.label : '아직 못 만난 음식'}>
                      <span aria-hidden="true">{foodDiscovered ? FOOD_EMOJI[food.foodType] : '❔'}</span>
                    </li>
                  )
                })}
              </ul>
              <small>
                {conquered
                  ? `🏆 ${REGION_MASTERY_TITLE[region.id]} 칭호 획득!`
                  : region.discovered > 0 ? '탐험 중인 마을' : '음식 친구를 만나면 열려요'}
              </small>
            </article>
          )
        })}
      </div>
    </section>
  )
}
