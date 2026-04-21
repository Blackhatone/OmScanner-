import { DocumentScanner } from '@capgo/capacitor-document-scanner';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

export const ScannerService = {
  /**
   * Opens the robust Capgo Document Scanner.
   * This plugin has better compatibility for older Android versions like 11.
   */
  async scanDocument() {
    try {
      const { scannedImages } = await DocumentScanner.scanDocument({
        // Modes: 0 (Basic), 1 (Filter), 2 (Full)
        // We use 1 to get a balance of speed and quality
        letSelectedImage: true
      });
      
      // scannedImages is an array of file URIs
      return scannedImages || [];
    } catch (error) {
      console.error('Error in Capgo Scanning:', error);
      // Return the error code to help user diagnose
      throw error;
    }
  },

  async saveDocument(base64Data, fileName, isPdf = false) {
    try {
      const extension = isPdf ? 'pdf' : 'jpg';
      const savedFile = await Filesystem.writeFile({
        path: `OmScanner/${fileName}.${extension}`,
        data: base64Data,
        directory: Directory.Documents,
        recursive: true
      });
      return savedFile;
    } catch (error) {
      console.error('Error saving document:', error);
      return null;
    }
  },

  async listDocuments() {
    try {
      const result = await Filesystem.readdir({
        path: 'OmScanner',
        directory: Directory.Documents,
      });
      
      const docs = await Promise.all(result.files.map(async (file) => {
        const fileStat = await Filesystem.getUri({
          path: `OmScanner/${file.name}`,
          directory: Directory.Documents
        });
        
        return {
          name: file.name,
          uri: fileStat.uri,
          webPath: Capacitor.convertFileSrc(fileStat.uri),
          isPdf: file.name.endsWith('.pdf')
        };
      }));

      return docs.filter(d => d.isPdf).sort((a,b) => b.name.localeCompare(a.name));
    } catch (error) {
      console.warn('OmScanner directory might not exist yet');
      return [];
    }
  },

  async sharePdf(uri, fileName) {
    try {
      await Share.share({
        title: fileName,
        text: 'Enviado desde OmScanner',
        url: uri,
        dialogTitle: 'Compartir Documento',
      });
    } catch (error) {
      console.error('Error sharing PDF:', error);
    }
  },

  async deleteDocument(fileName) {
    try {
      await Filesystem.deleteFile({
        path: `OmScanner/${fileName}`,
        directory: Directory.Documents
      });
      return true;
    } catch (error) {
      console.error('Error deleting document:', error);
      return false;
    }
  }
};
