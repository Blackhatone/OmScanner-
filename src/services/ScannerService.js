import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';

export const ScannerService = {
  async takePhoto() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
      });
      return image;
    } catch (error) {
      console.error('Error taking photo:', error);
      return null;
    }
  },

  async saveDocument(base64Data, fileName) {
    try {
      const savedFile = await Filesystem.writeFile({
        path: `scans/${fileName}.jpg`,
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
        path: 'scans',
        directory: Directory.Documents,
      });
      return result.files;
    } catch (error) {
      console.warn('Scans directory might not exist yet');
      return [];
    }
  }
};
