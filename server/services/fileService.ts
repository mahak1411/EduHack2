import fs from "fs";
import path from "path";

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
        // For now, return a placeholder for PDF processing
        // In a real implementation, you would use a PDF parsing library like pdf-parse
        return "PDF text extraction not implemented yet. Please use text files for now.";
      }

      if (mimeType.startsWith("image/")) {
        // For now, return a placeholder for image OCR
        // In a real implementation, you would use an OCR service like Google Vision API
        return "Image OCR not implemented yet. Please use text files for now.";
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
