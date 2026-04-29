import { useRef, useState, useEffect } from 'react'
import SignatureCanvas from 'react-signature-canvas'

export default function SignatureCanvasComponent({ label, value, onChange, required = false }) {
  const sigCanvas = useRef(null)
  const [isEmpty, setIsEmpty] = useState(true)
  const fromInternal = useRef(false)

  // Sincronizar la resolución interna del canvas con su tamaño CSS real.
  // Sin esto, el canvas tiene 500px internos pero se muestra a otro ancho,
  // lo que desplaza las coordenadas del trazo.
  useEffect(() => {
    if (sigCanvas.current) {
      const canvas = sigCanvas.current.getCanvas()
      const displayWidth = canvas.offsetWidth
      if (displayWidth && displayWidth !== canvas.width) {
        canvas.width = displayWidth
      }
    }
  }, [])

  useEffect(() => {
    if (fromInternal.current) {
      fromInternal.current = false
      return
    }
    if (value && sigCanvas.current) {
      sigCanvas.current.fromDataURL(value)
      setIsEmpty(false)
    } else if (!value && sigCanvas.current) {
      sigCanvas.current.clear()
      setIsEmpty(true)
    }
  }, [value])

  const handleClear = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear()
      setIsEmpty(true)
      fromInternal.current = true
      onChange('')
    }
  }

  const handleEnd = () => {
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      setIsEmpty(false)
      fromInternal.current = true
      const dataURL = sigCanvas.current.toDataURL('image/png')
      onChange(dataURL)
    }
  }

  return (
    <div className="field">
      <label>
        {label}
        {required && <span style={{ color: 'var(--bad)', marginLeft: 4 }}>*</span>}
      </label>
      <div
        style={{
          border: isEmpty && required ? '2px solid var(--bad)' : '1px solid var(--line)',
          borderRadius: 12,
          background: 'rgba(255,255,255,0.03)',
          padding: 8,
          transition: 'border-color 0.2s'
        }}
      >
        <SignatureCanvas
          ref={sigCanvas}
          onEnd={handleEnd}
          canvasProps={{
            height: 200,
            className: 'signature-canvas',
            style: {
              width: '100%',
              height: '200px',
              borderRadius: 8,
              background: 'rgba(0,0,0,0.2)',
              touchAction: 'none',
              display: 'block'
            }
          }}
        />
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button
            type="button"
            className="btn"
            onClick={handleClear}
            style={{ fontSize: 12, padding: '6px 12px' }}
          >
            Limpiar
          </button>
          {isEmpty && required && (
            <span style={{ color: 'var(--bad)', fontSize: 12, display: 'flex', alignItems: 'center' }}>
              Firma requerida
            </span>
          )}
          {!isEmpty && (
            <span style={{ color: 'var(--ok)', fontSize: 12, display: 'flex', alignItems: 'center' }}>
              ✓ Firma capturada
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
