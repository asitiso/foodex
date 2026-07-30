import type { WorldProgress } from '../../domain/v6WorldProgression'

export function WorldHubScreen({ progress }: { progress: WorldProgress }) {
  return (
    <section className="world-hub-screen" aria-label="음식 세계">
      <header><p className="eyebrow">FOODEX WORLD</p><h1>음식 세계 허브</h1><p>기록한 음식들이 이곳에서 친구가 됩니다.</p></header>
      <section className="world-event-card"><span className="world-event-badge">오늘의 세계 이벤트</span><strong>{progress.activeEvent}</strong><small>다음 목표 · {progress.nextGoal}</small></section>
      <section className="world-summary-grid" aria-label="세계 진행도"><div><strong>{progress.residentCount}</strong><span>발견한 주민</span></div><div><strong>{progress.villages.filter((village) => village.discovered).length}/{progress.villages.length}</strong><span>열린 마을</span></div><div><strong>{progress.museumRooms.filter((room) => room.completed).length}/{progress.museumRooms.length}</strong><span>완성 전시실</span></div></section>
      <section className="world-section"><div className="section-title-row"><h2>음식 마을</h2><span>{progress.residentCount}명과 만남</span></div><div className="world-village-list">{progress.villages.map((village) => <article className={village.discovered ? 'world-village discovered' : 'world-village'} key={village.id}><div className="world-village-icon" aria-hidden="true">{village.discovered ? '🏘️' : '🔒'}</div><div><strong>{village.name}</strong><small>{village.discovered ? village.residentNames.join(' · ') : '음식을 기록하면 주민을 만나요'}</small><span>{village.chef}</span></div></article>)}</div></section>
      <section className="world-section"><div className="section-title-row"><h2>음식 박물관</h2><span>전시실</span></div><div className="world-museum-list">{progress.museumRooms.map((room) => <div className={room.completed ? 'world-museum-room completed' : 'world-museum-room'} key={room.id}><strong>{room.name}</strong><span>{room.discovered}/{room.total}</span></div>)}</div></section>
      {progress.relationships.length > 0 && <section className="world-section"><div className="section-title-row"><h2>주민 관계</h2><span>이야기가 자라요</span></div><div className="world-relationship-list">{progress.relationships.map((relationship, index) => <article key={`${relationship.kind}-${index}`}><strong>{relationship.label}</strong><span>{relationship.members.join(' ↔ ')}</span></article>)}</div></section>}
    </section>
  )
}
