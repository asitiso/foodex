import { useState } from 'react'

const successMessage = '확인 메일을 보냈어요. 메일의 안내를 완료하면 다른 기기에서도 도감을 찾을 수 있어요.'

export function ProtectCollection({
  onProtect,
}: {
  onProtect: (email: string) => Promise<void>
}) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus('sending')

    try {
      await onProtect(email)
      setStatus('sent')
    } catch {
      setStatus('error')
    }
  }

  return (
    <section className="protect-collection" aria-labelledby="protect-title">
      <h2 id="protect-title">내 도감 보호하기</h2>
      <p>지금은 로그인 없이 바로 쓸 수 있어요. 이메일을 연결하면 기기를 바꿔도 도감을 찾을 수 있어요.</p>
      <form onSubmit={submit}>
        <label htmlFor="protect-email">이메일</label>
        <input
          id="protect-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <button type="submit" disabled={status === 'sending'}>
          {status === 'sending' ? '보내는 중…' : '확인 메일 보내기'}
        </button>
      </form>
      {status === 'sent' && <p role="status">{successMessage}</p>}
      {status === 'error' && <p role="alert">확인 메일을 보내지 못했어요. 잠시 후 다시 시도해 주세요.</p>}
    </section>
  )
}
