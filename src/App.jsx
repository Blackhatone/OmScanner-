import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Files, Plus, Settings, Trash2, Download, Check, X, RotateCw, Share2, Search, MoreVertical } from 'lucide-react'
import { ScannerService } from './services/ScannerService'
import { ImageProcessor } from './utils/ImageProcessor'
import { PdfGenerator } from './utils/PdfGenerator'
import CropEditor from './components/CropEditor'

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
}

const Dashboard = ({ onStartScan, documents, onShare, onDelete, onLoad }) => {
  const [searchTerm, setSearchTerm] = useState('')
  
  const filteredDocs = documents.filter(doc => 
    doc.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-6 pb-32">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">OmScanner</h1>
          <p className="text-gray-500 text-sm mt-1">Escaner Profesional Offline</p>
        </div>
        <button className="glass p-3 rounded-2xl"><Settings size={20} className="text-gray-400" /></button>
      </header>

      <div className="glass mb-8 px-4 py-3 flex items-center gap-3">
        <Search size={18} className="text-gray-500" />
        <input 
          type="text" 
          placeholder="Buscar documentos..." 
          className="bg-transparent border-none outline-none text-sm w-full"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {filteredDocs.length === 0 ? (
          <div className="col-span-2 glass p-12 flex flex-col items-center justify-center border-dashed border-2 border-gray-800">
            <div className="bg-white/5 p-5 rounded-full mb-4">
              <Files size={32} className="text-gray-600" />
            </div>
            <p className="text-gray-500 text-sm">No se encontraron documentos</p>
          </div>
        ) : (
          filteredDocs.map((doc, i) => (
            <motion.div 
              key={doc.name} 
              className="glass p-2 relative group flex flex-col"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="aspect-[3/4] bg-gray-900 rounded-xl overflow-hidden mb-3 relative flex items-center justify-center">
                 {/* Search for corresponding image thumbnail if we were using a more complex system */}
                 <Files size={40} className="text-gray-800" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                 <div className="absolute bottom-2 left-2 right-2 flex justify-between">
                    <button onClick={() => onShare(doc.uri, doc.name)} className="bg-white/10 p-2 rounded-lg backdrop-blur-md">
                        <Share2 size={14} className="text-primary" />
                    </button>
                    <button onClick={() => onDelete(doc.name)} className="bg-white/10 p-2 rounded-lg backdrop-blur-md">
                        <Trash2 size={14} className="text-accent" />
                    </button>
                 </div>
              </div>
              <div className="px-1 flex flex-col">
                <span className="text-xs font-bold truncate text-gray-200">{doc.name}</span>
                <span className="text-[10px] text-gray-500 mt-0.5">PDF Document</span>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <motion.button 
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.05 }}
        onClick={onStartScan}
        className="fixed bottom-10 left-1/2 -translate-x-1/2 primary px-8 py-4 rounded-3xl shadow-[0_20px_40px_rgba(0,242,255,0.3)] z-50 flex items-center gap-3"
      >
        <Camera size={24} />
        <span className="font-bold tracking-tight">NUEVO ESCANEO</span>
      </motion.button>
    </div>
  )
}

const ScannerHUD = ({ onCapture, onCancel }) => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black z-50 flex flex-col"
  >
    <div className="flex-1 flex items-center justify-center relative bg-gray-950 overflow-hidden">
      <header className="absolute top-0 left-0 right-0 p-8 flex justify-between items-center z-20">
         <button onClick={onCancel} className="bg-black/50 p-3 rounded-2xl backdrop-blur-xl border border-white/10"><X size={24} /></button>
         <div className="text-xs font-bold tracking-[0.2em] text-primary bg-primary/10 px-4 py-2 rounded-full border border-primary/30">AI SCANNER READY</div>
         <div className="w-12"></div>
      </header>

      {/* Futuristic Grid Layer */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ 
        backgroundImage: 'radial-gradient(var(--primary) 1px, transparent 1px)', 
        backgroundSize: '30px 30px' 
      }}></div>

      <div className="relative w-4/5 h-3/5">
        <motion.div 
          animate={{ scale: [1, 1.02, 1] }} 
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute inset-0 border border-primary/20 rounded-2xl"
        ></motion.div>
        
        {/* Animated Corners */}
        {[
          'top-0 left-0 border-t-4 border-l-4 rounded-tl-3xl',
          'top-0 right-0 border-t-4 border-r-4 rounded-tr-3xl',
          'bottom-0 left-0 border-b-4 border-l-4 rounded-bl-3xl',
          'bottom-0 right-0 border-b-4 border-r-4 rounded-br-3xl'
        ].map((pos, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`absolute w-12 h-12 border-primary ${pos} shadow-[0_0_15px_var(--primary)]`}
          ></motion.div>
        ))}

        <div className="scan-line"></div>
      </div>
      
      <p className="absolute bottom-10 text-gray-500 text-xs font-medium tracking-widest bg-black/40 px-6 py-2 rounded-full backdrop-blur-md border border-white/5">ALINEE EL DOCUMENTO</p>
    </div>

    <div className="h-44 bg-black flex items-center justify-center relative px-8 border-t border-white/5">
      <motion.button 
        whileTap={{ scale: 0.9 }}
        onClick={() => onCapture()} 
        className="primary w-24 h-24 rounded-full flex items-center justify-center relative group"
      >
        <div className="absolute inset-0 rounded-full border-4 border-black/20 group-hover:border-black/40 transition-colors"></div>
        <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center">
            <div className="w-14 h-14 bg-white rounded-full opacity-10"></div>
        </div>
      </motion.button>
    </div>
  </motion.div>
)

const FilterView = ({ image, onSave, onCancel }) => {
  const [filter, setFilter] = useState('magic')
  const [processedImage, setProcessedImage] = useState(image)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    applyFilter(filter)
  }, [filter, image])

  const applyFilter = async (f) => {
    setProcessing(true)
    // We mock the original pixels for preview since we only have the single image here
    // In handleCropComplete we did the real processing. This is just visual options.
    setProcessedImage(image) // For the MVP we keep it simple, real filtering happens at save or in Utils
    setProcessing(false)
  }

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="p-6 h-screen flex flex-col bg-black">
      <h2 className="text-xl font-bold mb-6 text-center tracking-tight">Perfeccionar Escaneo</h2>
      
      <div className="flex-1 glass mb-8 overflow-hidden flex items-center justify-center p-2 relative bg-gray-900 rounded-[2rem]">
        {processing && <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center">Procesando...</div>}
        <img src={processedImage} alt="Filter Preview" className="max-w-full max-h-full object-contain shadow-2xl rounded" />
      </div>

      <div className="flex justify-between mb-10 gap-3">
        {['original', 'magic', 'bw', 'grayscale'].map((f) => (
          <button 
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 flex-col py-3 px-1 rounded-2xl transition-all ${filter === f ? 'primary' : 'bg-white/5 text-gray-500'}`}
          >
            <span className="capitalize text-[10px] font-bold tracking-wider">{f === 'magic' ? 'MAGICO' : f.toUpperCase()}</span>
          </button>
        ))}
      </div>

      <div className="flex gap-4">
        <button onClick={onCancel} className="flex-1 py-5 rounded-3xl text-gray-400 font-bold text-sm">DESCARTAR</button>
        <button onClick={() => onSave(processedImage)} className="flex-1 primary py-5 rounded-3xl font-bold shadow-xl"><Check size={20} /> GUARDAR PDF</button>
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
    setDocuments(files) 
  }

  const handleStartScan = async () => {
    const photo = await ScannerService.takePhoto()
    if (photo) {
      setCurrentScan({ original: photo.webPath || photo.path, cropped: null })
      setView('editor')
    }
  }

  const handleCropComplete = async (pixels, rotation) => {
    try {
      const processedUrl = await ImageProcessor.processImage(currentScan.original, pixels, rotation, 'magic')
      setCurrentScan(prev => ({ ...prev, cropped: processedUrl }))
      setView('filter')
    } catch (error) {
      console.error("Processing failed", error)
      alert("Error al procesar la imagen")
    }
  }

  const handleSave = async (finalImage) => {
    const fileName = `Scan_${new Date().toISOString().replace(/[:.-]/g, '_')}`
    const pdfData = await PdfGenerator.generatePdf([finalImage])
    const base64Image = finalImage.split(',')[1]
    const base64Pdf = pdfData.split(',')[1]
    
    await ScannerService.saveDocument(base64Image, `${fileName}_thumb`)
    await ScannerService.saveDocument(base64Pdf, fileName, true)
    
    setView('dashboard')
    loadDocs()
  }

  const handleShare = (uri, name) => ScannerService.sharePdf(uri, name)
  const handleDelete = async (name) => {
    if (confirm('¿Eliminar este documento?')) {
      await ScannerService.deleteDocument(name)
      loadDocs()
    }
  }

  return (
    <div className="app-container max-w-lg mx-auto min-h-screen bg-transparent">
      <AnimatePresence mode="wait">
        {view === 'dashboard' && (
          <motion.div key="dash" variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <Dashboard 
               onStartScan={handleStartScan} 
               documents={documents} 
               onShare={handleShare}
               onDelete={handleDelete}
               onLoad={loadDocs}
            />
          </motion.div>
        )}
        
        {view === 'editor' && currentScan && (
          <CropEditor 
            key="crop"
            image={currentScan.original}
            onCropComplete={handleCropComplete}
            onCancel={() => setView('dashboard')}
          />
        )}

        {view === 'filter' && currentScan && currentScan.cropped && (
          <FilterView 
            key="filter"
            image={currentScan.cropped}
            onSave={handleSave}
            onCancel={() => setView('dashboard')}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
