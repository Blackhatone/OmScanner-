import React, { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { Check, X, RotateCw } from 'lucide-react'

const CropEditor = ({ image, onCropComplete, onCancel }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)

  const onCropChange = useCallback((crop) => {
    setCrop(crop)
  }, [])

  const onCropCompleteInternal = useCallback((_croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleDone = () => {
    onCropComplete(croppedAreaPixels, rotation)
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <header className="glass m-4 p-4 flex justify-between items-center">
        <button onClick={onCancel} className="secondary p-2"><X size={20} /></button>
        <h2 className="font-bold">Ajustar Bordes</h2>
        <button onClick={handleDone} className="primary p-2 px-4"><Check size={20} /> Listo</button>
      </header>

      <div className="flex-1 relative bg-gray-900">
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={undefined} // Free style cropping for documents
          onCropChange={onCropChange}
          onCropComplete={onCropCompleteInternal}
          onZoomChange={setZoom}
          onRotationChange={setRotation}
        />
      </div>

      <div className="glass m-4 p-6 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">Zoom</span>
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-labelledby="Zoom"
            onChange={(e) => setZoom(e.target.value)}
            className="w-2/3 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        <div className="flex justify-center">
           <button 
             onClick={() => setRotation((prev) => (prev + 90) % 360)}
             className="secondary gap-2"
           >
             <RotateCw size={18} /> Rotar 90°
           </button>
        </div>
      </div>
    </div>
  )
}

export default CropEditor
