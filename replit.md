# StudyAI - AI-Powered Learning Platform

## Overview

StudyAI is a comprehensive AI-powered educational web application that transforms study materials into interactive learning tools. The platform enables users to upload documents (PDFs, images, text files) and automatically generate flashcards, quizzes, and organized notes using artificial intelligence. Built as a full-stack application with a React frontend and Express.js backend, it features user authentication, file processing, AI content generation, and progress tracking capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent, accessible UI components
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules for modern JavaScript features
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: Replit Auth integration with OpenID Connect for secure user management
- **Session Management**: Express sessions with PostgreSQL storage for persistence

### Database Design
- **ORM**: Drizzle with PostgreSQL dialect for schema management and migrations
- **Schema Structure**:
  - Users table for authentication (required for Replit Auth)
  - Sessions table for session persistence (required for Replit Auth)
  - Flashcard sets and individual flashcards with user associations
  - Quizzes with questions and user attempts tracking
  - Notes with content versioning and tagging
  - File uploads tracking for content processing

### AI Integration Architecture
- **AI Service**: OpenAI API integration for content generation
- **Content Processing**: Modular AI service supporting:
  - Flashcard generation with customizable parameters
  - Quiz creation with multiple question types
  - Note summarization with different formats
- **File Processing**: Basic text extraction service with extensibility for OCR and PDF parsing

### Authentication & Authorization
- **Provider**: Replit Auth with OpenID Connect protocol
- **Session Management**: PostgreSQL-backed sessions with configurable TTL
- **Middleware**: Route-level authentication guards protecting API endpoints
- **User Context**: Persistent user state management across the application

### File Handling
- **Upload System**: Multer-based file upload with size limits and type validation
- **Storage**: Local file system with cleanup mechanisms
- **Processing Pipeline**: Text extraction service with support for multiple file formats
- **Future Extensibility**: Architecture supports integration with cloud storage and advanced OCR services

## External Dependencies

### Core Infrastructure
- **Database**: Neon PostgreSQL serverless database for scalable data storage
- **Authentication**: Replit's OpenID Connect service for user management
- **AI Services**: OpenAI API for natural language processing and content generation

### Development & Build Tools
- **Package Manager**: npm with lockfile for dependency management
- **Build System**: Vite for frontend bundling and development server
- **TypeScript**: Full-stack type safety with shared schema definitions
- **Database Migrations**: Drizzle Kit for schema versioning and migrations

### UI & Styling
- **Component Library**: shadcn/ui built on Radix UI primitives for accessibility
- **Icons**: Lucide React for consistent iconography
- **Styling**: Tailwind CSS with custom design system and CSS variables

### Planned Integrations
- **OCR Services**: Google Cloud Vision API or OCR.Space for image text extraction
- **Translation**: DeepL or Google Translate API for multi-language support
- **File Storage**: AWS S3 or similar for scalable file storage
- **Export Formats**: jsPDF for document generation and Anki format support