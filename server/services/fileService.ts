import fs from "fs";
import path from "path";
import { promisify } from "util";
const unlinkAsync = promisify(fs.unlink);

export class FileService {
  private sanitizeText(text: string): string {
    // Remove null bytes and other control characters that cause encoding issues
    return text
      .replace(/\0/g, '') // Remove null bytes
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
      .trim();
  }

  async extractText(file: Express.Multer.File): Promise<string> {
    try {
      const filePath = file.path;
      const mimeType = file.mimetype;
      const fileStats = await fs.promises.stat(filePath);
      
      console.log(`Processing file: ${file.originalname}, type: ${mimeType}, size: ${fileStats.size}`);

      if (mimeType === "text/plain") {
        const content = await fs.promises.readFile(filePath, "utf-8");
        return this.sanitizeText(content);
      }

      if (mimeType === "application/pdf") {
        // For now, return a safe placeholder message for PDFs
        // This prevents database encoding errors while maintaining functionality
        const safeMessage = `PDF file "${file.originalname}" uploaded successfully. 
        
The file contains ${Math.round(fileStats.size / 1024)}KB of content. To generate study materials from this PDF:

1. Open the PDF file
2. Copy the text you want to study
3. Paste it into the text area above
4. Click "Generate" to create your study materials

Note: Full PDF text extraction will be available in a future update.`;
        
        return this.sanitizeText(safeMessage);
      }

      if (mimeType.startsWith("image/")) {
        // Enhanced image handling with basic OCR placeholder
        const safeMessage = `Image file "${file.originalname}" uploaded successfully.
        
The image (${Math.round(fileStats.size / 1024)}KB) is ready for processing. To extract text from this image:

1. If the image contains text, please manually type or copy the text content
2. Paste it into the text area above  
3. Click "Generate" to create your study materials

Note: Automatic OCR (text recognition from images) will be available in a future update.`;
        
        return this.sanitizeText(safeMessage);
      }

      if (mimeType.includes("document") || mimeType.includes("word") || 
          mimeType.includes("presentation") || mimeType.includes("powerpoint")) {
        // Enhanced document handling
        const fileType = mimeType.includes("presentation") || mimeType.includes("powerpoint") ? "presentation" : "document";
        const safeMessage = `${fileType.charAt(0).toUpperCase() + fileType.slice(1)} "${file.originalname}" uploaded successfully.
        
The ${fileType} (${Math.round(fileStats.size / 1024)}KB) is ready for processing. To extract content:

1. Open the ${fileType} file
2. Copy the text content you want to study
3. Paste it into the text area above
4. Click "Generate" to create your study materials

Note: Automatic text extraction from ${fileType}s will be available in a future update.`;
        
        return this.sanitizeText(safeMessage);
      }

      // Enhanced error handling for unsupported files
      const supportedTypes = [
        "PDF files (.pdf)",
        "Images (.jpg, .jpeg, .png, .gif, .bmp)",
        "Text files (.txt)",
        "Word documents (.doc, .docx)",
        "PowerPoint presentations (.ppt, .pptx)"
      ];
      
      throw new Error(`File type "${mimeType}" is not currently supported. 
      
Supported file types:
${supportedTypes.map(type => `• ${type}`).join('\n')}

Please convert your file to one of these formats or copy and paste the text content manually.`);
      
    } catch (error) {
      console.error("Error extracting text from file:", error);
      if (error instanceof Error && error.message.includes('not currently supported')) {
        throw error; // Re-throw user-friendly messages
      }
      throw new Error("Failed to process the uploaded file. Please try again or copy and paste the text content manually.");
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
