const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Interface definition for Storage Services
 */
class IStorageService {
  /**
   * Save a base64 encoded photo or image buffer
   * @param {string|Buffer} data - Base64 string (with or without data URI header) or Buffer
   * @param {string} prefix - Optional filename prefix (e.g. 'checkin', 'profile')
   * @returns {Promise<string>} Publicly accessible URL or path
   */
  async savePhoto(data, prefix = 'photo') {
    throw new Error('Method not implemented.');
  }

  /**
   * Delete a stored photo by relative path/key
   * @param {string} photoUrl 
   */
  async deletePhoto(photoUrl) {
    throw new Error('Method not implemented.');
  }
}

/**
 * Local Storage implementation: saves to local directory and returns /uploads/filename.jpg URL
 */
class LocalStorageService extends IStorageService {
  constructor(uploadDir) {
    super();
    this.uploadDir = uploadDir || path.join(__dirname, '../../uploads');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async savePhoto(data, prefix = 'selfie') {
    try {
      let buffer;
      let ext = '.jpg';

      if (Buffer.isBuffer(data)) {
        buffer = data;
      } else if (typeof data === 'string') {
        if (data.startsWith('data:image/')) {
          const matches = data.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
          if (matches) {
            ext = `.${matches[1] === 'jpeg' ? 'jpg' : matches[1]}`;
            buffer = Buffer.from(matches[2], 'base64');
          } else {
            buffer = Buffer.from(data, 'base64');
          }
        } else {
          // Direct base64 string
          buffer = Buffer.from(data, 'base64');
        }
      } else {
        throw new Error('Invalid photo data format');
      }

      const filename = `${prefix}_${Date.now()}_${crypto.randomBytes(6).toString('hex')}${ext}`;
      const filePath = path.join(this.uploadDir, filename);

      await fs.promises.writeFile(filePath, buffer);
      return `/uploads/${filename}`;
    } catch (error) {
      console.error('[StorageService] Error saving photo:', error);
      throw error;
    }
  }

  async deletePhoto(photoUrl) {
    try {
      if (!photoUrl || !photoUrl.startsWith('/uploads/')) return;
      const filename = path.basename(photoUrl);
      const filePath = path.join(this.uploadDir, filename);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    } catch (error) {
      console.error('[StorageService] Error deleting photo:', error);
    }
  }
}

// Instantiate default storage service (can be swapped for S3StorageService in future without altering caller code)
const storageService = new LocalStorageService();

module.exports = {
  IStorageService,
  LocalStorageService,
  storageService,
};
