import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Files, Plus, Settings, Trash2, Download, Check, X, RotateCw } from 'lucide-react'
import { ScannerService } from './services/ScannerService'
import { ImageProcessor } from './utils/ImageProcessor'
import { PdfGenerator } from './utils/PdfGenerator'
import CropEditor from './components/CropEditor'

// Animation variants
const pageVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 1.05 }
}

const Dashboard = ({ onStartScan, documents }) => (
  <div className="p-6">
    <header className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">OmScanner</h1>
        <p className="text-gray-400">Escaneos Locales y Privados</p>
      </div>
      <button className="glass p-3"><Settings size={20} /></button>
    </header>

    <div className="grid grid-cols-2 gap-4">
      {documents.length === 0 ? (
        <div className="col-span-2 glass p-10 flex flex-col items-center justify-center border-dashed border-2 border-gray-700">
          <div className="bg-white/10 p-4 rounded-full mb-4">
            <Files size={32} className="text-gray-400" />
          </div>
          <p className="text-gray-500 text-center">No tienes documentos guardados aún.</p>
        </div>
      ) : (
        documents.map((doc, i) => (
          <motion.div 
            key={i} 
            className="glass p-2 relative group"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="aspect-[3/4] bg-gray-800 rounded-lg overflow-hidden mb-2">
              <img src={doc.url} alt="Scan" className="w-full h-full object-cover" />
            </div>
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-semibold truncate">{doc.name}</span>
              <Download size={14} className="text-primary" />
            </div>
          </motion.div>
        ))
      )}
    </div>

    <motion.button 
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.05 }}
      onClick={onStartScan}
      className="fixed bottom-10 right-6 primary w-16 h-16 rounded-full shadow-2xl p-0 flex items-center justify-center z-10"
    >
      <Plus size={32} />
    </motion.button>
  </div>
)

const FilterView = ({ image, onSave, onCancel }) => {
  const [filter, setFilter] = useState('magic')
  const [processedImage, setProcessedImage] = useState(image)

  useEffect(() => {
    // In a final version, this would call ImageProcessor with the selected filter
    setProcessedImage(image)
  }, [filter, image])

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="p-6 h-screen flex flex-col">
      <h2 className="text-2xl font-bold mb-4 text-center">Perfeccionar Escaneo</h2>
      
      <div className="flex-1 glass mb-6 overflow-hidden flex items-center justify-center p-2 relative bg-gray-900">
        <img src={processedImage} alt="Filter Preview" className="max-w-full max-h-full object-contain shadow-2xl rounded" />
      </div>

      <div className="flex justify-around mb-8 gap-4 px-2">
        {['original', 'magic', 'bw'].map((f) => (
          <button 
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 flex-col py-4 ${filter === f ? 'primary' : 'secondary shadow-none'}`}
          >
            <span className="capitalize text-xs font-bold">{f}</span>
          </button>
        ))}
      </div>

      <div className="flex gap-4">
        <button onClick={onCancel} className="flex-1 secondary p-5 text-gray-400">Descartar</button>
        <button onClick={() => onSave(processedImage)} className="flex-1 primary p-5"><Check /> Guardar PDF</button>
      </div>
    </motion.div>
  )
}

function App() {
  const [view, setView] = useState('dashboard')
  const [documents, setDocuments] = useState([])
  const [currentScan, setCurrentScan] = useState(null)

  useEffect(() => {
    loadDocs()
  }, [])

  const loadDocs = async () => {
    const files = await ScannerService.listDocuments()
    // For local dev/preview, we map the metadata
    setDocuments(files.map(f => ({ name: f.name, url: '#' }))) 
  }

  const handleStartScan = async () => {
    // Note: In browser this might trigger permission request or file selector if not in Capacitor
    const photo = await ScannerService.takePhoto()
    if (photo) {
      setCurrentScan({ original: photo.webPath || photo.path, cropped: null })
      setView('editor')
    }
  }

  const handleCropComplete = async (pixels, rotation) => {
    try {
      const processedUrl = await ImageProcessor.processImage(currentScan.original, pixels, rotation)
      setCurrentScan(prev => ({ ...prev, cropped: processedUrl }))
      setView('filter')
    } catch (error) {
      console.error("Processing failed", error)
      alert("Error al procesar la imagen")
    }
  }

  const handleSave = async (finalImage) => {
    const fileName = `scan_${Date.now()}`
    
    // 1. Generate PDF
    const pdfData = await PdfGenerator.generatePdf([finalImage])
    
    // 2. Save PDF and Image to local storage
    const base64Image = finalImage.split(',')[1]
    const base64Pdf = pdfData.split(',')[1]
    
    await ScannerService.saveDocument(base64Image, `${fileName}_img`)
    await ScannerService.saveDocument(base64Pdf, fileName)
    
    alert('PDF Guardado con éxito en Documentos!')
    setView('dashboard')
    loadDocs()
  }

  const handleCancel = () => {
    setCurrentScan(null)
    setView('dashboard')
  }

  return (
    <div className="app-container max-w-lg mx-auto min-h-screen bg-transparent">
      <AnimatePresence mode="wait">
        {view === 'dashboard' && (
          <motion.div key="dash" variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <Dashboard onStartScan={handleStartScan} documents={documents} />
          </motion.div>
        )}
        
        {view === 'editor' && currentScan && (
          <CropEditor 
            key="crop"
            image={currentScan.original}
            onCropComplete={handleCropComplete}
            onCancel={handleCancel}
          />
        )}

        {view === 'filter' && currentScan && currentScan.cropped && (
          <FilterView 
            key="filter"
            image={currentScan.cropped}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
