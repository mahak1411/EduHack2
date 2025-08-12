import fs from "fs";
import path from "path";
import { promisify } from "util";
const unlinkAsync = promisify(fs.unlink);

export class FileService {
  async extractText(file: Express.Multer.File): Promise<string> {
    try {
      const filePath = file.path;
      const mimeType = file.mimetype;

      if (mimeType === "text/plain") {
        const content = await fs.promises.readFile(filePath, "utf-8");
        return content;
      }

      if (mimeType === "application/pdf") {
        // Basic PDF text extraction - for production use pdf-parse library
        const content = await fs.promises.readFile(filePath, "utf-8").catch(() => {
          return "PDF uploaded successfully. Text extraction from PDFs is coming soon - please copy and paste text content for now.";
        });
        return content;
      }

      if (mimeType.startsWith("image/")) {
        // Basic image OCR placeholder - for production use Google Vision API or similar
        return "Image uploaded successfully. OCR text extraction from images is coming soon - please copy and paste text content for now.";
      }

      if (mimeType.includes("document") || mimeType.includes("word")) {
        // Basic document handling
        return "Document uploaded successfully. Text extraction from Word documents is coming soon - please copy and paste text content for now.";
      }

      throw new Error(`Unsupported file type: ${mimeType}`);
    } catch (error) {
      console.error("Error extracting text from file:", error);
      throw new Error("Failed to extract text from file");
    }
  }

  async cleanupFile(filePath: string): Promise<void> {
    try {
      await fs.promises.unlink(filePath);
    } catch (error) {
      console.error("Error cleaning up file:", error);
    }
  }
}

export const fileService = new FileService();
