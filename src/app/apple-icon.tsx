import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #150a2c 0%, #2d1060 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '36px',
        }}
      >
        <svg viewBox="0 0 24 24" width="110" height="110">
          <path d="M13 2L3 14h9l-1 8 10-12h-9z" fill="#f59e0b" />
        </svg>
      </div>
    ),
    { ...size }
  )
}
