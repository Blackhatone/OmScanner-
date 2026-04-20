import { jsPDF } from 'jspdf'

export const PdfGenerator = {
  async generatePdf(images) {
    const doc = new jsPDF()
    
    for (let i = 0; i < images.length; i++) {
      if (i > 0) doc.addPage()
      
      const imgProps = doc.getImageProperties(images[i])
      const pdfWidth = doc.internal.pageSize.getWidth()
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width
      
      doc.addImage(images[i], 'JPEG', 0, 0, pdfWidth, pdfHeight)
    }
    
    return doc.output('datauristring')
  }
}
