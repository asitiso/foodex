export interface V3DiscoveryResult {
  regionTitle: string
  seasonTitle?: string
  completedSetTitles: string[]
  rewardTitles: string[]
}

export function V3DiscoverySummary({
  regionTitle,
  seasonTitle,
  completedSetTitles,
  rewardTitles,
}: V3DiscoveryResult) {
  return (
    <section className="v3-discovery-summary" aria-label="새 발견 결과">
      <strong>{regionTitle}에 새 친구가 나타났어요</strong>
      {seasonTitle && <span>{seasonTitle} 도장 획득</span>}
      {completedSetTitles.map((title) => <span key={title}>{title} 완성</span>)}
      {rewardTitles.map((title) => <span key={title}>{title} 획득</span>)}
    </section>
  )
}
