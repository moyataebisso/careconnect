import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'CareConnect — Minnesota care provider directory'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#1B4332',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ fontSize: 96, fontWeight: 900, color: 'white', letterSpacing: '-2px' }}>
          CareConnect
        </div>
        <div style={{ fontSize: 40, color: '#95D5B2', marginTop: 24 }}>
          Minnesota care provider directory
        </div>
      </div>
    ),
    { ...size },
  )
}
