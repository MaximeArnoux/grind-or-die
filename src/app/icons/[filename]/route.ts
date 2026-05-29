import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params
  const size = filename.includes('512') ? 512 : 192
  const radius = Math.round(size * 0.18)
  const boltSize = Math.round(size * 0.62)

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
          borderRadius: `${radius}px`,
        }}
      >
        <svg viewBox="0 0 24 24" width={boltSize} height={boltSize}>
          <path d="M13 2L3 14h9l-1 8 10-12h-9z" fill="#f59e0b" />
        </svg>
      </div>
    ),
    { width: size, height: size }
  )
}
