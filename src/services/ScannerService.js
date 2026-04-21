import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

export const ScannerService = {
  async takePhoto() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false, // We use our own cropper
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
      });
      return image;
    } catch (error) {
      console.error('Error taking photo:', error);
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
      
      // Map files to include their full native path for display
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

      // Return only PDFs for the dashboard, using their corresponding JPEGs as thumbnails if they exist
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
        text: 'Compartido desde OmScanner',
        url: uri,
        dialogTitle: 'Enviar documento',
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
