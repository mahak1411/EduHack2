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

      console.log("Upload request received:");
      console.log("- User ID:", userId);
      console.log("- File:", file ? {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path
      } : "No file");
      console.log("- Request body keys:", Object.keys(req.body));
      console.log("- Request files:", req.files);

      if (!file) {
        console.error("File upload failed: No file in request");
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

      // Clean up the uploaded file after processing
      await fileService.cleanupFile(file.path);
      console.log("Successfully processed and cleaned up file:", file.originalname);

      res.json({
        ...savedFile,
        extractedText
      });
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

  // Comprehensive study materials generation route
  app.post('/api/generate-all-materials', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let content = req.body.content;
      
      // If file uploaded, extract text
      if (req.file) {
        try {
          const extractedText = await fileService.extractText(req.file);
          
          // Check if extraction was successful (not a fallback message)
          if (!extractedText.includes('failed') && !extractedText.includes('manually') && extractedText.length > 100) {
            content = extractedText;
          } else {
            // File extraction failed, return the message for manual entry
            await fileService.cleanupFile(req.file.path);
            return res.status(400).json({ 
              message: "Automatic text extraction failed",
              extractionResult: extractedText,
              requiresManualInput: true
            });
          }
        } catch (error) {
          await fileService.cleanupFile(req.file.path);
          return res.status(400).json({ 
            message: "File processing failed",
            error: error instanceof Error ? error.message : "Unknown error",
            requiresManualInput: true
          });
        }
        
        // Clean up uploaded file
        await fileService.cleanupFile(req.file.path);
      }

      if (!content || content.trim().length < 100) {
        return res.status(400).json({ 
          message: "Insufficient content for study material generation. Please provide at least 100 characters of text content.",
          requiresManualInput: true
        });
      }

      console.log(`Generating comprehensive study materials for user ${userId} with ${content.length} characters`);

      // Generate all three types of study materials in parallel
      const [summary, quiz, flashcards] = await Promise.all([
        aiService.generateNotes(content, { 
          format: 'summary'
        }),
        aiService.generateQuizQuestions(content, {
          questionCount: 8,
          questionTypes: ['multiple-choice', 'true-false', 'short-answer']
        }),
        aiService.generateFlashcards(content, {
          count: 10
        })
      ]);

      // Save all materials to database
      const [savedNote, savedQuiz, savedFlashcardSet] = await Promise.all([
        // Save notes
        storage.createNote(userId, insertNoteSchema.parse({
          title: `📝 ${req.body.title || 'Study Summary'}`,
          content: summary,
          tags: ['auto-generated', 'summary']
        })),
        
        // Save quiz
        storage.createQuiz(userId, insertQuizSchema.parse({
          title: `🧠 ${req.body.title || 'Study Quiz'}`,
          description: "Auto-generated mixed-format quiz",
          questions: quiz,
          tags: ['auto-generated', 'mixed-format']
        })),
        
        // Save flashcards
        storage.createFlashcardSet(userId, insertFlashcardSetSchema.parse({
          title: `💡 ${req.body.title || 'Study Flashcards'}`,
          description: "Auto-generated flashcard set",
          tags: ['auto-generated', 'comprehensive']
        })).then(async (flashcardSet) => {
          // Add individual flashcards
          const flashcardPromises = flashcards.map((card: any) =>
            storage.createFlashcard({
              setId: flashcardSet.id,
              front: card.front,
              back: card.back
            })
          );
          await Promise.all(flashcardPromises);
          return flashcardSet;
        })
      ]);

      res.json({
        success: true,
        message: "All study materials generated successfully!",
        materials: {
          summary: {
            id: savedNote.id,
            title: savedNote.title,
            content: summary
          },
          quiz: {
            id: savedQuiz.id,
            title: savedQuiz.title,
            questionCount: quiz.length,
            questions: quiz
          },
          flashcards: {
            id: savedFlashcardSet.id,
            title: savedFlashcardSet.title,
            cardCount: flashcards.length,
            cards: flashcards
          }
        }
      });

    } catch (error) {
      console.error("Error generating comprehensive study materials:", error);
      
      // Clean up file if it exists
      if (req.file) {
        await fileService.cleanupFile(req.file.path);
      }
      
      res.status(500).json({ 
        message: "Failed to generate study materials",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Delete routes for study materials
  app.delete('/api/notes/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const noteId = req.params.id;
      
      await storage.deleteNote(userId, noteId);
      res.json({ success: true, message: "Note deleted successfully" });
    } catch (error) {
      console.error("Error deleting note:", error);
      res.status(500).json({ message: "Failed to delete note" });
    }
  });

  app.delete('/api/quizzes/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const quizId = req.params.id;
      
      await storage.deleteQuiz(userId, quizId);
      res.json({ success: true, message: "Quiz deleted successfully" });
    } catch (error) {
      console.error("Error deleting quiz:", error);
      res.status(500).json({ message: "Failed to delete quiz" });
    }
  });

  app.delete('/api/flashcards/sets/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const setId = req.params.id;
      
      await storage.deleteFlashcardSet(userId, setId);
      res.json({ success: true, message: "Flashcard set deleted successfully" });
    } catch (error) {
      console.error("Error deleting flashcard set:", error);
      res.status(500).json({ message: "Failed to delete flashcard set" });
    }
  });

  // Profile routes
  app.get('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUserProfile(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.put('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updates = req.body;
      
      const updatedProfile = await storage.updateUserProfile(userId, updates);
      res.json(updatedProfile);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Recent activity route
  app.get('/api/recent-activity', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get recent items from each category (limit 5 each)
      const [recentFlashcards, recentQuizzes, recentNotes] = await Promise.all([
        storage.getUserFlashcardSets(userId),
        storage.getUserQuizzes(userId),
        storage.getUserNotes(userId)
      ]);

      // Combine and sort by creation date
      const allItems = [
        ...(recentFlashcards || []).slice(0, 5).map((item: any) => ({
          ...item,
          type: 'flashcard'
        })),
        ...(recentQuizzes || []).slice(0, 5).map((item: any) => ({
          ...item, 
          type: 'quiz'
        })),
        ...(recentNotes || []).slice(0, 5).map((item: any) => ({
          ...item,
          type: 'note'
        }))
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
       .slice(0, 6); // Get top 6 most recent

      res.json(allItems);
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      res.status(500).json({ message: "Failed to fetch recent activity" });
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

  app.patch('/api/notes/:noteId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { noteId } = req.params;
      const { summary, content, title } = req.body;

      // Update the note with the new content
      const updateData: any = {};
      if (content !== undefined) updateData.content = content;
      if (summary !== undefined) updateData.content = summary; // Support legacy field name
      if (title !== undefined) updateData.title = title;

      const updatedNote = await storage.updateNote(noteId, userId, updateData);
      if (!updatedNote) {
        return res.status(404).json({ message: "Note not found or you don't have permission to edit it" });
      }

      res.json(updatedNote);
    } catch (error) {
      console.error("Error updating note:", error);
      res.status(500).json({ message: "Failed to update note" });
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
