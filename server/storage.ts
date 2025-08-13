import {
  users,
  flashcardSets,
  flashcards,
  quizzes,
  quizAttempts,
  notes,
  uploadedFiles,
  type User,
  type UpsertUser,
  type FlashcardSet,
  type InsertFlashcardSet,
  type Flashcard,
  type InsertFlashcard,
  type Quiz,
  type InsertQuiz,
  type QuizAttempt,
  type InsertQuizAttempt,
  type Note,
  type InsertNote,
  type UploadedFile,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Flashcard operations
  createFlashcardSet(userId: string, setData: InsertFlashcardSet): Promise<FlashcardSet>;
  getUserFlashcardSets(userId: string): Promise<FlashcardSet[]>;
  getFlashcardSet(setId: string): Promise<FlashcardSet | undefined>;
  getFlashcardsForSet(setId: string): Promise<Flashcard[]>;
  createFlashcard(flashcardData: InsertFlashcard): Promise<Flashcard>;
  deleteFlashcardSet(userId: string, setId: string): Promise<void>;
  deleteNote(userId: string, noteId: string): Promise<void>;
  deleteQuiz(userId: string, quizId: string): Promise<void>;
  getUserProfile(userId: string): Promise<any>;
  updateUserProfile(userId: string, updates: any): Promise<any>;
  
  // Quiz operations
  createQuiz(userId: string, quizData: InsertQuiz): Promise<Quiz>;
  getUserQuizzes(userId: string): Promise<Quiz[]>;
  getQuiz(quizId: string): Promise<Quiz | undefined>;
  createQuizAttempt(attemptData: InsertQuizAttempt): Promise<QuizAttempt>;
  getQuizAttempts(userId: string, quizId: string): Promise<QuizAttempt[]>;
  
  // Notes operations
  createNote(userId: string, noteData: InsertNote): Promise<Note>;
  getUserNotes(userId: string): Promise<Note[]>;
  getNote(noteId: string): Promise<Note | undefined>;
  updateNote(noteId: string, userId: string, updates: Partial<InsertNote>): Promise<Note | null>;
  deleteNote(noteId: string): Promise<void>;
  
  // File operations
  saveUploadedFile(userId: string, fileData: Omit<UploadedFile, 'id' | 'userId' | 'uploadedAt'>): Promise<UploadedFile>;
  getUploadedFile(fileId: string): Promise<UploadedFile | undefined>;
  getUserFiles(userId: string): Promise<UploadedFile[]>;
  
  // Stats operations
  getUserStats(userId: string): Promise<{
    flashcardSets: number;
    quizzesTaken: number;
    studyNotes: number;
    avgQuizScore: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async createFlashcardSet(userId: string, setData: InsertFlashcardSet): Promise<FlashcardSet> {
    const [flashcardSet] = await db
      .insert(flashcardSets)
      .values({ ...setData, userId })
      .returning();
    return flashcardSet;
  }

  async getUserFlashcardSets(userId: string): Promise<FlashcardSet[]> {
    return await db
      .select()
      .from(flashcardSets)
      .where(eq(flashcardSets.userId, userId))
      .orderBy(desc(flashcardSets.createdAt));
  }

  async getFlashcardSet(setId: string): Promise<FlashcardSet | undefined> {
    const [set] = await db
      .select()
      .from(flashcardSets)
      .where(eq(flashcardSets.id, setId));
    return set;
  }

  async getFlashcardsForSet(setId: string): Promise<Flashcard[]> {
    return await db
      .select()
      .from(flashcards)
      .where(eq(flashcards.setId, setId));
  }

  async createFlashcard(flashcardData: InsertFlashcard): Promise<Flashcard> {
    const [flashcard] = await db
      .insert(flashcards)
      .values(flashcardData)
      .returning();
    return flashcard;
  }

  async deleteFlashcardSet(setId: string): Promise<void> {
    await db.delete(flashcardSets).where(eq(flashcardSets.id, setId));
  }

  async createQuiz(userId: string, quizData: InsertQuiz): Promise<Quiz> {
    const [quiz] = await db
      .insert(quizzes)
      .values({ ...quizData, userId })
      .returning();
    return quiz;
  }

  async getUserQuizzes(userId: string): Promise<Quiz[]> {
    return await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.userId, userId))
      .orderBy(desc(quizzes.createdAt));
  }

  async getQuiz(quizId: string): Promise<Quiz | undefined> {
    const [quiz] = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.id, quizId));
    return quiz;
  }

  async createQuizAttempt(attemptData: InsertQuizAttempt): Promise<QuizAttempt> {
    const [attempt] = await db
      .insert(quizAttempts)
      .values(attemptData)
      .returning();
    return attempt;
  }

  async getQuizAttempts(userId: string, quizId: string): Promise<QuizAttempt[]> {
    return await db
      .select()
      .from(quizAttempts)
      .where(and(eq(quizAttempts.userId, userId), eq(quizAttempts.quizId, quizId)))
      .orderBy(desc(quizAttempts.completedAt));
  }

  async createNote(userId: string, noteData: InsertNote): Promise<Note> {
    const [note] = await db
      .insert(notes)
      .values({ ...noteData, userId })
      .returning();
    return note;
  }

  async getUserNotes(userId: string): Promise<Note[]> {
    return await db
      .select()
      .from(notes)
      .where(eq(notes.userId, userId))
      .orderBy(desc(notes.createdAt));
  }

  async getNote(noteId: string): Promise<Note | undefined> {
    const [note] = await db
      .select()
      .from(notes)
      .where(eq(notes.id, noteId));
    return note;
  }

  async updateNote(noteId: string, userId: string, updates: Partial<InsertNote>): Promise<Note | null> {
    const [note] = await db
      .update(notes)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(notes.id, noteId), eq(notes.userId, userId)))
      .returning();
    return note || null;
  }

  async deleteNote(noteId: string): Promise<void> {
    await db.delete(notes).where(eq(notes.id, noteId));
  }

  async saveUploadedFile(userId: string, fileData: Omit<UploadedFile, 'id' | 'userId' | 'uploadedAt'>): Promise<UploadedFile> {
    const [file] = await db
      .insert(uploadedFiles)
      .values({ ...fileData, userId })
      .returning();
    return file;
  }

  async getUploadedFile(fileId: string): Promise<UploadedFile | undefined> {
    const [file] = await db
      .select()
      .from(uploadedFiles)
      .where(eq(uploadedFiles.id, fileId));
    return file;
  }

  async getUserFiles(userId: string): Promise<UploadedFile[]> {
    return await db
      .select()
      .from(uploadedFiles)
      .where(eq(uploadedFiles.userId, userId))
      .orderBy(desc(uploadedFiles.uploadedAt));
  }

  async getUserStats(userId: string): Promise<{
    flashcardSets: number;
    quizzesTaken: number;
    studyNotes: number;
    avgQuizScore: number;
  }> {
    const [flashcardCount] = await db
      .select({ count: sql`count(*)` })
      .from(flashcardSets)
      .where(eq(flashcardSets.userId, userId));

    const [notesCount] = await db
      .select({ count: sql`count(*)` })
      .from(notes)
      .where(eq(notes.userId, userId));

    const quizStats = await db
      .select({
        count: sql`count(*)`,
        avgScore: sql`avg(${quizAttempts.score}::float / ${quizAttempts.totalQuestions}::float * 100)`,
      })
      .from(quizAttempts)
      .where(eq(quizAttempts.userId, userId));

    return {
      flashcardSets: Number(flashcardCount.count) || 0,
      quizzesTaken: Number(quizStats[0]?.count) || 0,
      studyNotes: Number(notesCount.count) || 0,
      avgQuizScore: Number(quizStats[0]?.avgScore) || 0,
    };
  }

  async deleteNote(userId: string, noteId: string): Promise<void> {
    await db.delete(notes).where(and(eq(notes.id, noteId), eq(notes.userId, userId)));
  }

  async deleteQuiz(userId: string, quizId: string): Promise<void> {
    await db.delete(quizzes).where(and(eq(quizzes.id, quizId), eq(quizzes.userId, userId)));
  }

  async deleteFlashcardSet(userId: string, setId: string): Promise<void> {
    // First delete all flashcards in the set
    await db.delete(flashcards).where(eq(flashcards.setId, setId));
    // Then delete the set
    await db.delete(flashcardSets).where(and(eq(flashcardSets.id, setId), eq(flashcardSets.userId, userId)));
  }

  async getUserProfile(userId: string): Promise<any> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    return user || null;
  }

  async updateUserProfile(userId: string, updates: any): Promise<any> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }
}

export const storage = new DatabaseStorage();
