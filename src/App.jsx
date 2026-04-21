import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Files, Plus, Settings, Trash2, Share2, Search, FileText, Hash, AlertTriangle } from 'lucide-react'
import { ScannerService } from './services/ScannerService'
import { PdfGenerator } from './utils/PdfGenerator'
import { Capacitor } from '@capacitor/core';

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 }
}

const Modal = ({ isOpen, onClose, onConfirm, title, children }) => {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass w-full max-w-sm p-6 bg-gray-900 border border-white/10 shadow-2xl">
        <h3 className="text-xl font-bold mb-4">{title}</h3>
        {children}
        <div className="flex gap-3 mt-8">
          <button onClick={onClose} className="flex-1 py-4 rounded-2xl text-gray-400 font-bold bg-white/5">Cancelar</button>
          <button onClick={onConfirm} className="flex-1 py-4 rounded-2xl primary font-bold">Aceptar</button>
        </div>
      </motion.div>
    </div>
  )
}

const Dashboard = ({ onStartScan, documents, onShare, onDelete, scanningError }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const filteredDocs = documents.filter(doc => doc.name.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="p-6 pb-32">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tighter bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">OmScanner <span className="text-primary text-sm align-top">3.1</span></h1>
          <p className="text-gray-500 text-[10px] mt-1 font-bold tracking-[0.2em] uppercase">Compatibility Edition</p>
        </div>
        <button className="glass p-3 rounded-2xl active:scale-95 transition-transform"><Settings size={20} className="text-gray-400" /></button>
      </header>

      {scanningError && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="bg-accent/10 border border-accent/20 p-4 rounded-2xl mb-6 flex gap-3 items-start">
            <AlertTriangle className="text-accent shrink-0" size={18} />
            <div className="text-xs text-accent/80 font-medium leading-relaxed">
                <span className="font-bold">Error de compatibilidad:</span> {scanningError}. 
                Asegúrate de que Google Play Services esté actualizado en tu Galaxy A20.
            </div>
        </motion.div>
      )}

      <div className="glass mb-8 px-4 py-3.5 flex items-center gap-3 bg-white/5 border-white/5 shadow-inner">
        <Search size={18} className="text-gray-600" />
        <input 
          type="text" 
          placeholder="Buscar documentos..." 
          className="bg-transparent border-none outline-none text-sm w-full placeholder:text-gray-700"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {filteredDocs.length === 0 ? (
          <div className="glass p-16 flex flex-col items-center justify-center border-dashed border-2 border-white/5 bg-white/[0.01]">
            <div className="bg-white/5 p-6 rounded-full mb-4">
              <Files size={32} className="text-gray-700" />
            </div>
            <p className="text-gray-600 text-xs font-medium">Buzón de escaneos vacío</p>
          </div>
        ) : (
          filteredDocs.map((doc, i) => (
            <motion.div 
              key={doc.name} 
              className="glass p-4 flex items-center gap-4 bg-white/[0.02] border-white/5 active:bg-white/5 transition-colors"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="w-12 h-16 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/10 shrink-0">
                <FileText size={24} className="text-primary/40" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold truncate text-gray-200">{doc.name.replace('.pdf', '')}</h4>
                <p className="text-[10px] text-gray-600 mt-1 uppercase font-bold tracking-widest">Documento PDF</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => onShare(doc.uri, doc.name)} className="p-2.5 text-primary/60 active:scale-90 transition-transform"><Share2 size={20} /></button>
                <button onClick={() => onDelete(doc.name)} className="p-2.5 text-accent/50 active:scale-90 transition-transform"><Trash2 size={20} /></button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <motion.button 
        whileTap={{ scale: 0.9 }}
        onClick={onStartScan}
        className="fixed bottom-10 left-1/2 -translate-x-1/2 primary w-20 h-20 rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,242,255,0.4)] z-50 flex items-center justify-center"
      >
        <Plus size={36} strokeWidth={3} />
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
  const [scanningError, setScanningError] = useState(null)

  useEffect(() => {
    loadDocs()
  }, [])

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
        setScanningError(error.message || "Error al abrir la cámara nativa")
    }
  }

  const handleSavePdf = async () => {
    const finalName = pdfName.trim() || `Scan_${new Date().toISOString().replace(/[:.-]/g, '_')}`
    
    try {
        const imagesAsBase64 = await Promise.all(scannedPages.map(async (uri) => {
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
    if (confirm('¿Eliminar este documento?')) {
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
             scanningError={scanningError}
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
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em]">{scannedPages.length} páginas detectadas</p>
          <div className="glass px-4 py-4 flex items-center gap-3 bg-white/5 border-white/5">
             <Hash size={18} className="text-primary/60" />
             <input 
                type="text" 
                placeholder="Nombre del archivo..." 
                className="bg-transparent border-none outline-none text-sm w-full placeholder:text-gray-800"
                value={pdfName}
                onChange={(e) => setPdfName(e.target.value)}
                autoFocus
             />
          </div>
          <p className="text-[10px] text-gray-700 leading-relaxed italic">Si queda vacío, se asignará un nombre automático con la fecha.</p>
        </div>
      </Modal>
    </div>
  )
}

export default App
