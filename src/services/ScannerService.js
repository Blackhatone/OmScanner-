import { DocumentScanner } from '@capacitor-mlkit/document-scanner';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

export const ScannerService = {
  /**
   * Opens the professional Native ML Kit Scanner.
   * Handles edge detection, perspective correction and multi-page capture.
   */
  async scanDocument() {
    try {
      // 1. Check and request permissions (Mandatory for Android 13+)
      const permissions = await DocumentScanner.checkPermissions();
      if (permissions.camera !== 'granted') {
        const result = await DocumentScanner.requestPermissions();
        if (result.camera !== 'granted') {
          alert('Se requiere permiso de cámara para escanear.');
          return null;
        }
      }

      // 2. Launch the native scanner
      const { scans } = await DocumentScanner.scan({
        maxNumScenes: 20, 
        galleryImportAllowed: true,
      });
      
      // scans contains an array of { imageUri: string }
      return scans.map(s => s.imageUri);
    } catch (error) {
      console.error('Error in Native Scanning:', error);
      return null;
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

      // Return reverse chronological list
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
