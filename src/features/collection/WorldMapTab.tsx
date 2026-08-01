import type { V3Progress } from '../../domain/v3Progression'

const VILLAGE_ICONS = ['🏯', '⚓', '⛩️', '🏕️', '🏝️']

export function WorldMapTab({ progress }: { progress: V3Progress }) {
  return (
    <section className="world-map-board" aria-label="음식 세계 지도">
      <p className="world-map-copy">발견한 음식이 길을 밝히고, 새로운 마을로 이어져요.</p>
      <div className="world-grid">
        {progress.regions.map((region, index) => (
          <article className={region.discovered > 0 ? 'world-region discovered' : 'world-region'} key={region.id}>
            <span className="world-region-marker" aria-hidden="true">{region.discovered > 0 ? VILLAGE_ICONS[index % VILLAGE_ICONS.length] : '◇'}</span>
            <div><h2>{region.title}</h2><p>{region.discovered}/{region.total} 발견 · {region.percent}%</p></div>
            <div className="level-track" aria-hidden="true"><span style={{ width: `${region.percent}%` }} /></div>
            <small>{region.discovered > 0 ? '탐험 중인 마을' : '음식 친구를 만나면 열려요'}</small>
          </article>
        ))}
      </div>
    </section>
  )
}
