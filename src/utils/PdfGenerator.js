import { jsPDF } from 'jspdf'

export const PdfGenerator = {
  /**
   * Generates a compressed PDF from a list of images.
   * Optimizes file size by using JPEG compression and scaling.
   */
  async generatePdf(images) {
    // 1. Initialize with compression enabled
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
      compress: true
    })
    
    for (let i = 0; i < images.length; i++) {
      if (i > 0) doc.addPage()
      
      const imgData = images[i]
      const imgProps = doc.getImageProperties(imgData)
      const pdfWidth = doc.internal.pageSize.getWidth()
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width
      
      // 2. Add image with JPEG compression and 'FAST' alias for smaller output
      // we use 0, 0 as start coordinates and match page width
      // quality is controlled by the 'FAST'/ 'MEDIUM' / 'SLOW' internal jspdf logic
      doc.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST')
    }
    
    return doc.output('datauristring')
  }
}
