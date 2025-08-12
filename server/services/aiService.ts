// Simple content analysis without external APIs

interface FlashcardOptions {
  count?: number;
  cardType?: string;
  difficulty?: string;
  language?: string;
}

interface QuizOptions {
  questionCount?: number;
  questionTypes?: string[];
  difficulty?: string;
}

interface NotesOptions {
  length?: string;
  format?: string;
  focusAreas?: string[];
}

export class AIService {
  // Helper method to parse flashcards from text response
  private parseFlashcardsFromText(text: string, count: number): any[] {
    const flashcards = [];
    const lines = text.split('\n').filter(line => line.trim());
    
    // Simple pattern matching for Q&A format
    for (let i = 0; i < lines.length && flashcards.length < count; i++) {
      const line = lines[i].trim();
      if (line.includes('?') || line.toLowerCase().includes('what') || line.toLowerCase().includes('how')) {
        const question = line.replace(/^\d+\.?\s*/, '').trim();
        const answer = lines[i + 1]?.trim() || "Answer not provided";
        flashcards.push({
          front: question,
          back: answer
        });
        i++; // Skip the answer line
      }
    }
    
    // If we couldn't parse enough, generate some basic ones
    while (flashcards.length < Math.min(count, 5)) {
      flashcards.push({
        front: `Study Question ${flashcards.length + 1}`,
        back: "Review the study material for this concept"
      });
    }
    
    return flashcards;
  }

  // Helper method to parse quiz questions from text
  private parseQuizFromText(text: string, count: number): any {
    const questions = [];
    const lines = text.split('\n').filter(line => line.trim());
    
    for (let i = 0; i < lines.length && questions.length < count; i++) {
      const line = lines[i].trim();
      if (line.includes('?')) {
        const question = line.replace(/^\d+\.?\s*/, '').trim();
        const options = [];
        
        // Look for options in next few lines
        for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
          const optionLine = lines[j].trim();
          if (optionLine.match(/^[A-D]\)/)) {
            options.push(optionLine.substring(2).trim());
          }
        }
        
        if (options.length === 0) {
          options.push("True", "False");
        }
        
        questions.push({
          question,
          options: options.length > 0 ? options : ["True", "False"],
          correctAnswer: 0,
          type: "multiple-choice"
        });
      }
    }
    
    // Generate basic questions if parsing failed
    while (questions.length < Math.min(count, 3)) {
      questions.push({
        question: `Question ${questions.length + 1}: What is a key concept from this material?`,
        options: ["Concept A", "Concept B", "Concept C", "Review needed"],
        correctAnswer: 0,
        type: "multiple-choice"
      });
    }
    
    return { questions };
  }

  // Generate flashcards from content analysis
  private generateFlashcardsFromContent(content: string, count: number): any[] {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const flashcards = [];
    
    for (let i = 0; i < Math.min(count, sentences.length); i++) {
      const sentence = sentences[i].trim();
      if (sentence.length > 20) {
        // Create questions based on sentence structure
        let question = "";
        let answer = sentence;
        
        // Look for definitions (is/are patterns)
        if (sentence.includes(" is ") || sentence.includes(" are ")) {
          const parts = sentence.split(/ (is|are) /);
          if (parts.length >= 2) {
            question = `What ${parts[1]}?`;
            answer = parts[0];
          }
        } else {
          // Create fill-in-the-blank style questions
          const words = sentence.split(' ');
          if (words.length > 5) {
            const importantWordIndex = Math.floor(words.length / 2);
            const importantWord = words[importantWordIndex];
            question = sentence.replace(importantWord, '______');
            answer = importantWord;
          }
        }
        
        if (!question) {
          question = `What does this statement refer to: "${sentence.substring(0, 50)}..."?`;
        }
        
        flashcards.push({
          front: question,
          back: answer
        });
      }
    }
    
    // Fill remaining slots with generic cards
    while (flashcards.length < count && flashcards.length < 10) {
      flashcards.push({
        front: `Study Concept ${flashcards.length + 1}`,
        back: "Review the uploaded material for key concepts and definitions."
      });
    }
    
    return flashcards.slice(0, count);
  }

  // Generate quiz from content analysis
  private generateQuizFromContent(content: string, count: number): any {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const questions = [];
    
    for (let i = 0; i < Math.min(count, sentences.length); i++) {
      const sentence = sentences[i].trim();
      if (sentence.length > 20) {
        const words = sentence.split(' ');
        const importantWordIndex = Math.floor(words.length / 2);
        const correctAnswer = words[importantWordIndex];
        
        // Generate distractors
        const otherWords = words.filter((word, idx) => idx !== importantWordIndex && word.length > 3);
        const options = [correctAnswer];
        
        // Add some generic distractors if not enough words
        const genericOptions = ["None of the above", "All of the above", "Cannot be determined"];
        while (options.length < 4) {
          if (otherWords.length > 0) {
            options.push(otherWords.pop() || "");
          } else {
            options.push(genericOptions[options.length - 1] || `Option ${options.length}`);
          }
        }
        
        // Shuffle options
        const shuffled = [...options].sort(() => Math.random() - 0.5);
        const correctIndex = shuffled.indexOf(correctAnswer);
        
        const questionText = sentence.replace(correctAnswer, '______');
        
        questions.push({
          question: `Fill in the blank: ${questionText}`,
          options: shuffled,
          correctAnswer: correctIndex,
          type: "multiple-choice"
        });
      }
    }
    
    // Add some basic questions if not enough content
    while (questions.length < count && questions.length < 5) {
      questions.push({
        question: `Based on the study material, which statement is most accurate?`,
        options: ["Statement A", "Statement B", "Statement C", "All are correct"],
        correctAnswer: 3,
        type: "multiple-choice"
      });
    }
    
    return { questions: questions.slice(0, count) };
  }

  // Generate notes from content analysis
  private generateNotesFromContent(content: string, format: string, length: string): string {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 20);
    
    let summary = "";
    
    if (format === "Bullet Points") {
      summary = "# Study Notes\n\n";
      summary += "## Key Points:\n\n";
      
      const keyPoints = sentences.slice(0, Math.min(10, sentences.length)).map((s, i) => 
        `• ${s.trim()}`
      ).join('\n');
      
      summary += keyPoints;
      
      if (paragraphs.length > 0) {
        summary += "\n\n## Main Concepts:\n\n";
        summary += paragraphs.slice(0, 3).map(p => `• ${p.trim().substring(0, 100)}...`).join('\n');
      }
    } else if (format === "Outline") {
      summary = "# Study Notes Outline\n\n";
      
      paragraphs.slice(0, Math.min(5, paragraphs.length)).forEach((para, i) => {
        summary += `## ${i + 1}. Topic ${i + 1}\n\n`;
        const paraContent = para.trim();
        summary += `${paraContent.substring(0, 200)}...\n\n`;
        
        // Add sub-points
        const subSentences = para.split(/[.!?]+/).filter(s => s.trim().length > 15);
        subSentences.slice(0, 3).forEach((sent, j) => {
          summary += `   - ${sent.trim()}\n`;
        });
        summary += "\n";
      });
    } else {
      // Paragraph format
      summary = "# Study Notes Summary\n\n";
      
      if (length === "Brief") {
        summary += paragraphs.slice(0, 2).join('\n\n');
      } else if (length === "Medium") {
        summary += paragraphs.slice(0, 4).join('\n\n');
      } else {
        summary += paragraphs.join('\n\n');
      }
    }
    
    if (summary.length < 100) {
      summary = `# Study Notes\n\nKey concepts from the study material:\n\n${content.substring(0, 500)}...\n\nReview the original material for complete understanding.`;
    }
    
    return summary;
  }
  async generateFlashcards(content: string, options: FlashcardOptions = {}) {
    const {
      count = 10,
      cardType = "Question & Answer",
      difficulty = "Intermediate",
      language = "English"
    } = options;

    const prompt = `Create ${count} flashcards from the following study material. Use ${cardType} format with ${difficulty} difficulty level in ${language}.

Study Material:
${content}

Requirements:
- Generate exactly ${count} flashcards
- Each flashcard should have a clear, concise front (question/term) and back (answer/definition)
- Ensure questions test key concepts and important details
- Vary the difficulty within the ${difficulty} level
- Focus on the most important information for studying

Respond with a JSON object containing an array of flashcards:
{
  "flashcards": [
    {
      "front": "Question or term here",
      "back": "Answer or definition here"
    }
  ]
}`;

    try {
      // Generate flashcards using content analysis
      const flashcards = this.generateFlashcardsFromContent(content, count);
      return flashcards;
    } catch (error) {
      console.error("Error generating flashcards:", error);
      throw new Error("Failed to generate flashcards");
    }
  }

  async generateQuizQuestions(content: string, options: QuizOptions = {}) {
    const {
      questionCount = 10,
      questionTypes = ["Multiple Choice"],
      difficulty = "Intermediate"
    } = options;

    const typesStr = questionTypes.join(", ");
    const prompt = `Create a quiz with ${questionCount} questions from the following study material. Include ${typesStr} question types with ${difficulty} difficulty level.

Study Material:
${content}

Requirements:
- Generate exactly ${questionCount} questions
- Use the specified question types: ${typesStr}
- For multiple choice questions, provide 4 options with one correct answer
- For true/false questions, provide a clear statement
- For short answer questions, provide the expected answer
- Ensure questions test comprehension and key concepts
- Mark the correct answer for each question

Respond with a JSON object:
{
  "questions": [
    {
      "type": "Multiple Choice",
      "question": "Question text here",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 0,
      "explanation": "Brief explanation of the correct answer"
    },
    {
      "type": "True/False",
      "question": "Statement to evaluate",
      "correctAnswer": true,
      "explanation": "Brief explanation"
    },
    {
      "type": "Short Answer",
      "question": "Question requiring written response",
      "correctAnswer": "Expected answer",
      "explanation": "Brief explanation"
    }
  ]
}`;

    try {
      // Generate quiz using content analysis
      const quiz = this.generateQuizFromContent(content, questionCount);
      return quiz.questions;
    } catch (error) {
      console.error("Error generating quiz questions:", error);
      throw new Error("Failed to generate quiz questions");
    }
  }

  async generateNotes(content: string, options: NotesOptions = {}) {
    const {
      length = "Medium",
      format = "Bullet Points",
      focusAreas = ["Key Concepts"]
    } = options;

    const focusStr = focusAreas.join(", ");
    const prompt = `Summarize the following study material into well-organized notes. Use ${format} format with ${length} length, focusing on: ${focusStr}.

Study Material:
${content}

Requirements:
- Create a comprehensive summary in ${format} format
- Length should be ${length} (Brief: 1-2 paragraphs, Medium: 3-5 paragraphs, Detailed: 6+ paragraphs)
- Focus specifically on: ${focusStr}
- Organize information logically with clear headings
- Include the most important concepts, facts, and details
- Make it suitable for study and review
- Use clear, concise language

Respond with a JSON object:
{
  "title": "Generated title for the notes",
  "summary": "The formatted summary content here",
  "keyPoints": ["Important point 1", "Important point 2", "Important point 3"],
  "tags": ["suggested", "tags", "for", "organization"]
}`;

    try {
      // Generate notes using content analysis
      const summary = this.generateNotesFromContent(content, format, length);
      return summary;
    } catch (error) {
      console.error("Error generating notes:", error);
      throw new Error("Failed to generate notes");
    }
  }
}

export const aiService = new AIService();
