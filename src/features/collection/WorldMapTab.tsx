import type { V3Progress } from '../../domain/v3Progression'

export function WorldMapTab({ progress }: { progress: V3Progress }) {
  return (
    <div className="world-grid">
      {progress.regions.map((region) => (
        <article className={region.discovered > 0 ? 'world-region discovered' : 'world-region'} key={region.id}>
          <span aria-hidden="true">{region.discovered > 0 ? '✦' : '◇'}</span>
          <h2>{region.title}</h2>
          <p>{region.discovered}/{region.total} 발견 · {region.percent}%</p>
          <div className="level-track" aria-hidden="true"><span style={{ width: `${region.percent}%` }} /></div>
        </article>
      ))}
    </div>
  )
}
