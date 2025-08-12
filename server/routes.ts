import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { aiService } from "./services/aiService";
import { fileService } from "./services/fileService";
import { 
  insertFlashcardSetSchema,
  insertQuizSchema,
  insertNoteSchema,
  insertQuizAttemptSchema
} from "@shared/schema";
import multer from "multer";

const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User stats route
  app.get('/api/user/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  // File upload route
  app.post('/api/files/upload', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const extractedText = await fileService.extractText(file);
      
      const savedFile = await storage.saveUploadedFile(userId, {
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        extractedText,
      });

      res.json(savedFile);
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  // Flashcard routes
  app.post('/api/flashcards/generate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { content, options } = req.body;

      if (!content) {
        return res.status(400).json({ message: "Content is required" });
      }

      const flashcards = await aiService.generateFlashcards(content, options);
      
      // Create flashcard set
      const setData = insertFlashcardSetSchema.parse({
        title: options.title || "AI Generated Flashcards",
        description: "Generated from uploaded content",
        tags: options.tags || [],
      });

      const flashcardSet = await storage.createFlashcardSet(userId, setData);

      // Create individual flashcards
      const createdFlashcards = await Promise.all(
        flashcards.map((card: any) => 
          storage.createFlashcard({
            setId: flashcardSet.id,
            front: card.front,
            back: card.back,
          })
        )
      );

      res.json({
        set: flashcardSet,
        flashcards: createdFlashcards,
      });
    } catch (error) {
      console.error("Error generating flashcards:", error);
      res.status(500).json({ message: "Failed to generate flashcards" });
    }
  });

  app.get('/api/flashcards/sets', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sets = await storage.getUserFlashcardSets(userId);
      res.json(sets);
    } catch (error) {
      console.error("Error fetching flashcard sets:", error);
      res.status(500).json({ message: "Failed to fetch flashcard sets" });
    }
  });

  app.get('/api/flashcards/sets/:setId', isAuthenticated, async (req: any, res) => {
    try {
      const { setId } = req.params;
      const set = await storage.getFlashcardSet(setId);
      
      if (!set) {
        return res.status(404).json({ message: "Flashcard set not found" });
      }

      const flashcards = await storage.getFlashcardsForSet(setId);
      
      res.json({
        set,
        flashcards,
      });
    } catch (error) {
      console.error("Error fetching flashcard set:", error);
      res.status(500).json({ message: "Failed to fetch flashcard set" });
    }
  });

  // Quiz routes
  app.post('/api/quizzes/generate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { content, options } = req.body;

      if (!content) {
        return res.status(400).json({ message: "Content is required" });
      }

      const questions = await aiService.generateQuizQuestions(content, options);
      
      const quizData = insertQuizSchema.parse({
        title: options.title || "AI Generated Quiz",
        description: "Generated from uploaded content",
        questions,
        tags: options.tags || [],
      });

      const quiz = await storage.createQuiz(userId, quizData);
      res.json(quiz);
    } catch (error) {
      console.error("Error generating quiz:", error);
      res.status(500).json({ message: "Failed to generate quiz" });
    }
  });

  app.get('/api/quizzes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const quizzes = await storage.getUserQuizzes(userId);
      res.json(quizzes);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      res.status(500).json({ message: "Failed to fetch quizzes" });
    }
  });

  app.get('/api/quizzes/:quizId', isAuthenticated, async (req: any, res) => {
    try {
      const { quizId } = req.params;
      const quiz = await storage.getQuiz(quizId);
      
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      res.json(quiz);
    } catch (error) {
      console.error("Error fetching quiz:", error);
      res.status(500).json({ message: "Failed to fetch quiz" });
    }
  });

  app.post('/api/quizzes/:quizId/attempts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { quizId } = req.params;
      const { answers } = req.body;

      const quiz = await storage.getQuiz(quizId);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      // Calculate score
      const questions = quiz.questions as any[];
      let score = 0;
      
      questions.forEach((question, index) => {
        if (answers[index] === question.correctAnswer) {
          score++;
        }
      });

      const attemptData = insertQuizAttemptSchema.parse({
        quizId,
        userId,
        answers,
        score,
        totalQuestions: questions.length,
      });

      const attempt = await storage.createQuizAttempt(attemptData);
      res.json(attempt);
    } catch (error) {
      console.error("Error submitting quiz attempt:", error);
      res.status(500).json({ message: "Failed to submit quiz attempt" });
    }
  });

  // Notes routes
  app.post('/api/notes/generate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { content, options } = req.body;

      if (!content) {
        return res.status(400).json({ message: "Content is required" });
      }

      const summary = await aiService.generateNotes(content, options);
      
      const noteData = insertNoteSchema.parse({
        title: options.title || "AI Generated Notes",
        content: summary,
        originalContent: content,
        tags: options.tags || [],
      });

      const note = await storage.createNote(userId, noteData);
      res.json(note);
    } catch (error) {
      console.error("Error generating notes:", error);
      res.status(500).json({ message: "Failed to generate notes" });
    }
  });

  app.get('/api/notes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notes = await storage.getUserNotes(userId);
      res.json(notes);
    } catch (error) {
      console.error("Error fetching notes:", error);
      res.status(500).json({ message: "Failed to fetch notes" });
    }
  });

  app.get('/api/notes/:noteId', isAuthenticated, async (req: any, res) => {
    try {
      const { noteId } = req.params;
      const note = await storage.getNote(noteId);
      
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }

      res.json(note);
    } catch (error) {
      console.error("Error fetching note:", error);
      res.status(500).json({ message: "Failed to fetch note" });
    }
  });

  app.put('/api/notes/:noteId', isAuthenticated, async (req: any, res) => {
    try {
      const { noteId } = req.params;
      const updates = req.body;

      const updatedNote = await storage.updateNote(noteId, updates);
      res.json(updatedNote);
    } catch (error) {
      console.error("Error updating note:", error);
      res.status(500).json({ message: "Failed to update note" });
    }
  });

  app.delete('/api/notes/:noteId', isAuthenticated, async (req: any, res) => {
    try {
      const { noteId } = req.params;
      await storage.deleteNote(noteId);
      res.json({ message: "Note deleted successfully" });
    } catch (error) {
      console.error("Error deleting note:", error);
      res.status(500).json({ message: "Failed to delete note" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
