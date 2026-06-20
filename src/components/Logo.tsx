const SYS = "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif"

export default function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const fontSize = size === 'lg' ? 34 : size === 'sm' ? 18 : 24
  return (
    <span style={{ fontFamily: SYS, fontWeight: 800, fontSize, lineHeight: 1, letterSpacing: '-0.02em', userSelect: 'none' }}>
      <span style={{ background: '#A4B2DA', color: '#1a1a1a', padding: '1px 5px', borderRadius: 4 }}>Tour</span>
      <span style={{ background: '#DC412C', color: '#1a1a1a', padding: '1px 5px', borderRadius: 4 }}>Pilot</span>
    </span>
  )
}
