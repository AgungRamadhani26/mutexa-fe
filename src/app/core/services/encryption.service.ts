import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EncryptionService {
  private readonly SECRET_KEY = environment.storageEncryptionKey;

  constructor() { }

  /**
   * Mengenkripsi data (bisa objek atau string)
   */
  encrypt(data: any): string {
    const jsonStr = typeof data === 'string' ? data : JSON.stringify(data);
    return CryptoJS.AES.encrypt(jsonStr, this.SECRET_KEY).toString();
  }

  /**
   * Mendekripsi data kembali ke format aslinya
   */
  decrypt<T>(encryptedData: string): T | null {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, this.SECRET_KEY);
      const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);
      
      if (!decryptedStr) return null;
      
      try {
        return JSON.parse(decryptedStr) as T;
      } catch {
        return decryptedStr as unknown as T;
      }
    } catch (error) {
      console.error('Gagal mendekripsi data:', error);
      return null;
    }
  }
}
