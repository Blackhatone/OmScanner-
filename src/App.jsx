import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Files, Plus, Settings, Trash2, Check, X, Share2, Search, FileText, ChevronRight, Hash } from 'lucide-react'
import { ScannerService } from './services/ScannerService'
import { PdfGenerator } from './utils/PdfGenerator'

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 }
}

const Modal = ({ isOpen, onClose, onConfirm, title, children }) => {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass w-full max-w-sm p-6 bg-gray-900">
        <h3 className="text-xl font-bold mb-4">{title}</h3>
        {children}
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 rounded-2xl text-gray-400 font-bold bg-white/5">Cancelar</button>
          <button onClick={onConfirm} className="flex-1 py-3 rounded-2xl primary font-bold">Hecho</button>
        </div>
      </motion.div>
    </div>
  )
}

const Dashboard = ({ onStartScan, documents, onShare, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const filteredDocs = documents.filter(doc => doc.name.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="p-6 pb-32">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tighter bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">OmScanner <span className="text-primary text-sm align-top">3.0</span></h1>
          <p className="text-gray-500 text-xs mt-1 font-medium tracking-wide">MOTOR NATIVO ML-KIT</p>
        </div>
        <button className="glass p-3 rounded-2xl"><Settings size={20} className="text-gray-400" /></button>
      </header>

      <div className="glass mb-8 px-4 py-3 flex items-center gap-3">
        <Search size={18} className="text-gray-500" />
        <input 
          type="text" 
          placeholder="Buscar escaneos..." 
          className="bg-transparent border-none outline-none text-sm w-full"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {filteredDocs.length === 0 ? (
          <div className="glass p-12 flex flex-col items-center justify-center border-dashed border-2 border-white/5">
            <div className="bg-white/5 p-6 rounded-full mb-4">
              <Files size={32} className="text-gray-600" />
            </div>
            <p className="text-gray-500 text-sm">Sin documentos guardados</p>
          </div>
        ) : (
          filteredDocs.map((doc, i) => (
            <motion.div 
              key={doc.name} 
              className="glass p-4 flex items-center gap-4 group"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="w-12 h-16 bg-white/5 rounded-lg flex items-center justify-center border border-white/10 shrink-0">
                <FileText size={24} className="text-primary/60" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold truncate text-gray-200">{doc.name.replace('.pdf', '')}</h4>
                <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest">Documento PDF</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => onShare(doc.uri, doc.name)} className="p-2 text-primary/80"><Share2 size={18} /></button>
                <button onClick={() => onDelete(doc.name)} className="p-2 text-accent/80"><Trash2 size={18} /></button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <motion.button 
        whileTap={{ scale: 0.95 }}
        onClick={onStartScan}
        className="fixed bottom-10 left-1/2 -translate-x-1/2 primary w-20 h-20 rounded-full shadow-[0_20px_40px_rgba(0,242,255,0.3)] z-50 flex items-center justify-center"
      >
        <Plus size={32} strokeWidth={3} />
      </motion.button>
    </div>
  )
}

function App() {
  const [view, setView] = useState('dashboard')
  const [documents, setDocuments] = useState([])
  const [scannedPages, setScannedPages] = useState([])
  const [isNamingModalOpen, setNamingModalOpen] = useState(false)
  const [pdfName, setPdfName] = useState('')

  useEffect(() => {
    loadDocs()
  }, [])

  const loadDocs = async () => {
    const files = await ScannerService.listDocuments()
    setDocuments(files) 
  }

  const handleStartScan = async () => {
    const pages = await ScannerService.scanDocument()
    if (pages && pages.length > 0) {
      setScannedPages(pages)
      setNamingModalOpen(true)
    }
  }

  const handleSavePdf = async () => {
    const finalName = pdfName.trim() || `Escaner_${new Date().toLocaleDateString().replace(/\//g, '_')}_${new Date().getHours()}_${new Date().getMinutes()}`
    
    // Generate PDF from all scanned pages
    // Note: We need to convert URIs to base64 for jsPDF or use a helper
    const imagesAsBase64 = await Promise.all(scannedPages.map(async (uri) => {
        // Native scan images are local file paths
        const data = await fetch(Capacitor.convertFileSrc(uri)).then(r => r.blob())
        return new Promise((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result)
            reader.readAsDataURL(data)
        })
    }))

    const pdfData = await PdfGenerator.generatePdf(imagesAsBase64)
    const base64Pdf = pdfData.split(',')[1]
    
    await ScannerService.saveDocument(base64Pdf, finalName, true)
    
    setNamingModalOpen(false)
    setPdfName('')
    setScannedPages([])
    loadDocs()
  }

  const handleShare = (uri, name) => ScannerService.sharePdf(uri, name)
  const handleDelete = async (name) => {
    if (confirm('¿Eliminar este documento permanentemente?')) {
      await ScannerService.deleteDocument(name)
      loadDocs()
    }
  }

  return (
    <div className="app-container max-w-lg mx-auto min-h-screen">
      <AnimatePresence mode="wait">
        <motion.div key="dash" variants={pageVariants} initial="initial" animate="animate" exit="exit">
          <Dashboard 
             onStartScan={handleStartScan} 
             documents={documents} 
             onShare={handleShare}
             onDelete={handleDelete}
          />
        </motion.div>
      </AnimatePresence>

      <Modal 
        isOpen={isNamingModalOpen} 
        onClose={() => { setNamingModalOpen(false); setScannedPages([]); }}
        onConfirm={handleSavePdf}
        title="Guardar Documento"
      >
        <div className="space-y-4">
          <p className="text-gray-500 text-xs uppercase tracking-widest">{scannedPages.length} páginas capturadas</p>
          <div className="glass px-4 py-3 flex items-center gap-3">
             <Hash size={18} className="text-primary" />
             <input 
                type="text" 
                placeholder="Nombre del archivo (opcional)" 
                className="bg-transparent border-none outline-none text-sm w-full"
                value={pdfName}
                onChange={(e) => setPdfName(e.target.value)}
                autoFocus
             />
          </div>
          <p className="text-[10px] text-gray-600">Si lo dejas vacío, se usará la fecha actual como título.</p>
        </div>
      </Modal>
    </div>
  )
}

export default App
