import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Sun, Moon, Trash2, Share2, Search, FileText, Hash, AlertTriangle, ExternalLink, Files, CreditCard } from 'lucide-react'
import { ScannerService } from './services/ScannerService'
import { PdfGenerator } from './utils/PdfGenerator'
import { ImageProcessor } from './utils/ImageProcessor'
import { Capacitor } from '@capacitor/core'

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 }
}

const Modal = ({ isOpen, onClose, onConfirm, title, children }) => {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass w-full max-w-sm p-6 bg-card border border-white/10 shadow-2xl">
        <h3 className="text-xl font-bold mb-4">{title}</h3>
        {children}
        <div className="flex gap-3 mt-8">
          <button onClick={onClose} className="flex-1 py-4 rounded-2xl text-muted font-bold bg-input">Cancelar</button>
          <button onClick={onConfirm} className="flex-1 py-4 rounded-2xl primary font-bold text-black">Aceptar</button>
        </div>
      </motion.div>
    </div>
  )
}

const Dashboard = ({ onStartScan, onStartIDScan, documents, onShare, onDelete, scanningError, isDarkMode, onToggleTheme }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const filteredDocs = documents.filter(doc => doc.name.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="flex flex-col h-screen max-h-screen p-6 overflow-hidden">
      <header className="flex justify-between items-center mb-6 shrink-0 pt-2">
        <div className="min-w-0">
          <h1 className="text-4xl font-bold tracking-tighter bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent truncate">OmScanner <span className="text-primary text-sm align-top">3.2</span></h1>
          <p className="text-muted text-[10px] mt-1 font-bold tracking-[0.2em] uppercase truncate">Professional Edition</p>
        </div>
        <button 
          onClick={onToggleTheme}
          className="glass p-3 rounded-2xl active:scale-95 transition-transform shrink-0"
        >
          {isDarkMode ? <Sun size={20} className="text-primary" /> : <Moon size={20} className="text-primary" />}
        </button>
      </header>

      {scanningError && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="bg-accent/10 border border-accent/20 p-4 rounded-2xl mb-6 flex gap-3 items-start shrink-0">
            <AlertTriangle className="text-accent shrink-0" size={18} />
            <div className="text-xs font-medium">
                <span className="font-bold text-accent">Error:</span> {scanningError}
            </div>
        </motion.div>
      )}

      <div className="glass mb-6 px-4 py-3.5 flex items-center gap-3 bg-input border-white/5 shadow-inner shrink-0 focus-within:ring-1 ring-primary/20 transition-all">
        <Search size={18} className="text-muted" />
        <input 
          type="text" 
          placeholder="Buscar documentos..." 
          className="bg-transparent border-none outline-none text-sm w-full placeholder:text-muted font-medium text-main"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex-1 space-y-4 mb-4 overflow-y-auto pr-1 customize-scrollbar">
        {filteredDocs.length === 0 ? (
          <div className="glass p-16 flex flex-col items-center justify-center border-dashed border-2 border-white/5 bg-white/[0.01]">
            <div className="bg-primary/5 p-6 rounded-full mb-4">
              <Files size={32} className="text-primary opacity-20" />
            </div>
            <p className="text-muted text-xs font-medium text-center italic">No hay documentos en la carpeta</p>
          </div>
        ) : (
          filteredDocs.map((doc, i) => (
            <motion.div 
              key={doc.name} 
              className="glass p-4 flex items-center gap-4 bg-card border-white/5 shadow-sm active:bg-primary/5 transition-all"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="w-12 h-16 bg-primary/5 rounded-xl flex items-center justify-center border border-primary/10 shrink-0">
                <FileText size={20} className="text-primary opacity-30" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold truncate text-main">{doc.name.replace('.pdf', '')}</h4>
                <p className="text-[9px] text-primary mt-1 uppercase font-bold tracking-widest opacity-60">PDF-Scan</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button 
                   onClick={() => onShare(doc.uri, doc.name)} 
                   className="p-3 text-primary opacity-60 active:scale-95 transition-transform bg-input rounded-xl"
                >
                    <Share2 size={16} />
                </button>
                <button 
                   onClick={() => onDelete(doc.name)} 
                   className="p-3 text-accent opacity-60 active:scale-95 transition-transform bg-input rounded-xl"
                >
                    <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <div className="shrink-0 flex flex-col items-center gap-6 pt-2 pb-2">
        <footer className="flex flex-col items-center gap-2 opacity-30">
           <img 
              src="/logo.png" 
              alt="Black Hat One" 
              onError={(e) => e.target.style.display = 'none'} 
              className={`h-3 w-auto ${isDarkMode ? 'grayscale brightness-200' : 'grayscale brightness-50'}`} 
           />
           <div className="flex items-center gap-1.5 text-[7px] text-muted font-bold tracking-[0.2em] uppercase">
              <span>Back Hat One</span>
           </div>
        </footer>

        <div className="flex items-center gap-8 mb-4">
            <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={onStartIDScan}
                className="glass w-14 h-14 rounded-2xl flex items-center justify-center border-white/10 active:bg-primary/20 transition-all shadow-xl"
            >
                <CreditCard size={24} className="text-primary/70" />
            </motion.button>

            <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={onStartScan}
                className="primary w-14 h-14 rounded-2xl shadow-[0_15px_40px_rgba(0,242,255,0.3)] flex items-center justify-center border-t border-white/20 active:brightness-125 transition-all overflow-hidden relative"
            >
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none"></div>
                <Plus size={28} strokeWidth={3} className="relative z-10 text-black" />
            </motion.button>
        </div>
      </div>
    </div>
  )
}

function App() {
  const [documents, setDocuments] = useState([])
  const [scannedPages, setScannedPages] = useState([])
  const [isNamingModalOpen, setNamingModalOpen] = useState(false)
  const [pdfName, setPdfName] = useState('')
  const [scanningError, setScanningError] = useState(null)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('omscanner-theme')
    return saved === null ? true : saved === 'dark'
  })

  useEffect(() => {
    loadDocs()
  }, [])

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.remove('light-mode')
      localStorage.setItem('omscanner-theme', 'dark')
    } else {
      document.body.classList.add('light-mode')
      localStorage.setItem('omscanner-theme', 'light')
    }
  }, [isDarkMode])

  const loadDocs = async () => {
    try {
        const files = await ScannerService.listDocuments()
        setDocuments(files) 
    } catch (e) {
        console.warn(e)
    }
  }

  const handleStartScan = async () => {
    setScanningError(null)
    try {
        const pages = await ScannerService.scanDocument()
        if (pages && pages.length > 0) {
          setScannedPages(pages)
          setNamingModalOpen(true)
        }
    } catch (error) {
        console.error("Scan failed", error)
        setScanningError(error.message || "No se pudo iniciar el escaneo")
    }
  }

  const handleIDCardScan = async () => {
    setScanningError(null)
    try {
        alert("Paso 1: Por favor, escanea el FRENTE de la cédula.")
        const front = await ScannerService.scanDocument()
        if (!front || front.length === 0) return

        alert("Paso 2: ¡Muy bien! Ahora escanea el DORSO de la cédula.")
        const back = await ScannerService.scanDocument()
        if (!back || back.length === 0) return

        const stitchedImage = await ImageProcessor.stitchIDCard(front[0], back[0])
        setScannedPages([stitchedImage])
        setNamingModalOpen(true)
    } catch (error) {
        console.error("ID Scan failed", error)
        setScanningError("Error en Modo Cédula: " + (error.message || "Fallo al procesar"))
    }
  }

  const handleSavePdf = async () => {
    const finalName = pdfName.trim() || `Scan_${new Date().toISOString().replace(/[:.-]/g, '_')}`
    
    try {
        const imagesAsBase64 = await Promise.all(scannedPages.map(async (uri) => {
            if (uri.startsWith('data:')) return uri
            const dataUrl = Capacitor.convertFileSrc(uri)
            const response = await fetch(dataUrl)
            const blob = await response.blob()
            return new Promise((resolve) => {
                const reader = new FileReader()
                reader.onloadend = () => resolve(reader.result)
                reader.readAsDataURL(blob)
            })
        }))

        const pdfData = await PdfGenerator.generatePdf(imagesAsBase64)
        const base64Pdf = pdfData.split(',')[1]
        
        await ScannerService.saveDocument(base64Pdf, finalName, true)
        
        setNamingModalOpen(false)
        setPdfName('')
        setScannedPages([])
        loadDocs()
    } catch (e) {
        alert("Error al generar el PDF: " + e.message)
    }
  }

  const handleShare = (uri, name) => ScannerService.sharePdf(uri, name)
  const handleDelete = async (name) => {
    if (confirm('¿Deseas eliminar este documento permanentemente?')) {
      try {
        await ScannerService.deleteDocument(name)
        await loadDocs() 
      } catch (e) {
        alert("No se pudo eliminar el archivo")
      }
    }
  }

  return (
    <div className="app-container max-w-lg mx-auto h-screen max-h-screen overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div key="dash" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="h-full">
          <Dashboard 
             onStartScan={handleStartScan}
             onStartIDScan={handleIDCardScan}
             documents={documents} 
             onShare={handleShare}
             onDelete={handleDelete}
             scanningError={scanningError}
             isDarkMode={isDarkMode}
             onToggleTheme={() => setIsDarkMode(!isDarkMode)}
          />
        </motion.div>
      </AnimatePresence>

      <Modal 
        isOpen={isNamingModalOpen} 
        onClose={() => { setNamingModalOpen(false); setScannedPages([]); }}
        onConfirm={handleSavePdf}
        title="Guardar Escaneo"
      >
        <div className="space-y-5">
          <p className="text-muted text-[10px] font-bold uppercase tracking-[0.2em]">{scannedPages.length > 1 ? `${scannedPages.length} páginas` : 'Scan Cédula'} detectado</p>
          <div className="glass px-4 py-4 flex items-center gap-3 bg-input border-white/5 focus-within:border-primary/30 transition-colors">
             <Hash size={18} className="text-primary/60" />
             <input 
                type="text" 
                placeholder="Nombre del archivo..." 
                className="bg-transparent border-none outline-none text-sm w-full placeholder:text-muted text-main"
                value={pdfName}
                onChange={(e) => setPdfName(e.target.value)}
                autoFocus
             />
          </div>
          <p className="text-[9px] text-muted leading-relaxed italic">Si dejas el campo vacío, se usará la fecha actual.</p>
        </div>
      </Modal>
    </div>
  )
}

export default App
