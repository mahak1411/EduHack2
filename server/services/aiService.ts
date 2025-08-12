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
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const flashcards = [];
    
    // Enhanced content validation and filtering for flashcards
    const validSentences = sentences.filter(sentence => {
      const words = sentence.trim().split(' ');
      return words.length >= 5 && words.length <= 30 && !this.isInappropriateContent(sentence);
    });
    
    for (let i = 0; i < Math.min(count, validSentences.length); i++) {
      const sentence = validSentences[i].trim();
      if (sentence.length > 20) {
        // Create questions based on sentence structure
        let question = "";
        let answer = sentence;
        
        // Look for definitions (is/are patterns)
        if (sentence.includes(" is ") || sentence.includes(" are ")) {
          const parts = sentence.split(/ (is|are) /);
          if (parts.length >= 2 && parts[0].trim() && parts[1].trim()) {
            question = `What ${parts[1].trim()}?`;
            answer = parts[0].trim();
          }
        } else if (sentence.includes(" means ") || sentence.includes(" refers to ")) {
          // Handle definition patterns
          const splitWord = sentence.includes(" means ") ? " means " : " refers to ";
          const parts = sentence.split(splitWord);
          if (parts.length >= 2) {
            question = `What ${splitWord.trim()} ${parts[1].trim()}?`;
            answer = parts[0].trim();
          }
        } else {
          // Create fill-in-the-blank style questions with better word selection
          const words = sentence.split(' ');
          const meaningfulWords = words.filter(word => 
            word.length > 3 && 
            !['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were'].includes(word.toLowerCase())
          );
          
          if (meaningfulWords.length > 0) {
            const importantWord = meaningfulWords[Math.floor(Math.random() * meaningfulWords.length)];
            question = sentence.replace(importantWord, '______');
            answer = importantWord;
          }
        }
        
        if (!question || question === sentence) {
          // Create a more engaging question format
          question = `Based on your study material: ${sentence.substring(0, 60)}...`;
          answer = "Review the key concepts and main points from this section.";
        }
        
        // Ensure questions and answers are appropriate and useful
        if (question.length > 10 && answer.length > 2) {
          flashcards.push({
            front: question,
            back: answer
          });
        }
      }
    }
    
    // Fill remaining slots with content-based cards if needed
    while (flashcards.length < count && flashcards.length < Math.min(10, validSentences.length)) {
      const remainingSentence = validSentences[flashcards.length % validSentences.length];
      flashcards.push({
        front: `Key concept from your study material: What does this relate to?`,
        back: `${remainingSentence.substring(0, 100)}...`
      });
    }
    
    return flashcards.slice(0, count);
  }

  // Generate quiz from content analysis
  private generateQuizFromContent(content: string, count: number, questionTypes: string[] = ["Multiple Choice"]): any {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const questions = [];
    
    // Enhanced content validation and filtering
    const validSentences = sentences.filter(sentence => {
      const words = sentence.trim().split(' ');
      return words.length >= 5 && words.length <= 50 && !this.isInappropriateContent(sentence);
    });

    const questionTypesToGenerate = questionTypes.length > 0 ? questionTypes : ["Multiple Choice"];
    
    for (let i = 0; i < Math.min(count, validSentences.length * 2); i++) {
      const sentence = validSentences[i % validSentences.length]?.trim();
      if (!sentence) continue;

      const questionType = questionTypesToGenerate[i % questionTypesToGenerate.length];
      
      if (questionType === "Short Answer" || questionType === "Fill in the Blank") {
        // Generate fill-in-the-blank questions
        const fillInQuestion = this.generateFillInBlankQuestion(sentence);
        if (fillInQuestion) {
          questions.push(fillInQuestion);
        }
      } else if (questionType === "True/False") {
        // Generate true/false questions
        const trueFalseQuestion = this.generateTrueFalseQuestion(sentence);
        if (trueFalseQuestion) {
          questions.push(trueFalseQuestion);
        }
      } else {
        // Generate multiple choice questions (default)
        const mcqQuestion = this.generateMultipleChoiceQuestion(sentence, validSentences);
        if (mcqQuestion) {
          questions.push(mcqQuestion);
        }
      }

      if (questions.length >= count) break;
    }
    
    // Fill remaining slots with appropriate questions if needed
    while (questions.length < count && questions.length < Math.min(10, validSentences.length)) {
      const remainingType = questionTypesToGenerate[questions.length % questionTypesToGenerate.length];
      const sentence = validSentences[questions.length % validSentences.length];
      
      if (remainingType === "Short Answer" || remainingType === "Fill in the Blank") {
        questions.push({
          question: `Based on the study material, explain: ${sentence.substring(0, 60)}...`,
          type: "Short Answer",
          correctAnswer: `See study material for details about: ${sentence.substring(0, 40)}...`,
          explanation: "Review the provided content for the complete answer."
        });
      } else if (remainingType === "True/False") {
        questions.push({
          question: `True or False: ${sentence}`,
          type: "True/False",
          correctAnswer: true,
          explanation: "Based on the provided study material."
        });
      } else {
        questions.push({
          question: `Which concept best relates to the following statement: "${sentence.substring(0, 50)}..."?`,
          options: ["Primary concept", "Secondary concept", "Related topic", "All of the above"],
          correctAnswer: 0,
          type: "Multiple Choice",
          explanation: "This relates to the main concepts in your study material."
        });
      }
    }
    
    return { questions: questions.slice(0, count) };
  }

  private generateFillInBlankQuestion(sentence: string): any {
    const words = sentence.split(' ');
    const meaningfulWords = words.filter(word => 
      word.length > 3 && 
      !['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were'].includes(word.toLowerCase())
    );
    
    if (meaningfulWords.length === 0) return null;
    
    const randomWord = meaningfulWords[Math.floor(Math.random() * meaningfulWords.length)];
    const questionText = sentence.replace(randomWord, '______');
    
    return {
      question: questionText,
      type: "Short Answer",
      correctAnswer: randomWord,
      explanation: `The missing word is "${randomWord}".`
    };
  }

  private generateTrueFalseQuestion(sentence: string): any {
    // Create variations of the sentence for true/false
    const isTrue = Math.random() > 0.5;
    
    if (isTrue) {
      return {
        question: sentence,
        type: "True/False", 
        correctAnswer: true,
        explanation: "This statement is true based on the study material."
      };
    } else {
      // Create a false version by modifying key words
      const words = sentence.split(' ');
      const modifiedWords = words.map(word => {
        if (word.length > 4 && Math.random() > 0.8) {
          return word + " (modified)";
        }
        return word;
      });
      
      return {
        question: modifiedWords.join(' '),
        type: "True/False",
        correctAnswer: false,
        explanation: "This statement has been modified and is false."
      };
    }
  }

  private generateMultipleChoiceQuestion(sentence: string, allSentences: string[]): any {
    const words = sentence.split(' ');
    const meaningfulWords = words.filter(word => word.length > 3);
    
    if (meaningfulWords.length === 0) return null;
    
    const targetWord = meaningfulWords[Math.floor(Math.random() * meaningfulWords.length)];
    const questionText = sentence.replace(targetWord, '______');
    
    // Generate distractors from other sentences
    const distractors = [];
    for (const otherSentence of allSentences) {
      if (otherSentence === sentence) continue;
      const otherWords = otherSentence.split(' ').filter(word => word.length > 3);
      distractors.push(...otherWords);
    }
    
    // Create options
    const options = [targetWord];
    const usedWords = new Set([targetWord.toLowerCase()]);
    
    while (options.length < 4 && distractors.length > 0) {
      const randomDistractor = distractors[Math.floor(Math.random() * distractors.length)];
      if (!usedWords.has(randomDistractor.toLowerCase())) {
        options.push(randomDistractor);
        usedWords.add(randomDistractor.toLowerCase());
      }
    }
    
    // Fill remaining slots if needed
    const fallbackOptions = ["None of these", "Cannot determine", "Not applicable"];
    while (options.length < 4) {
      options.push(fallbackOptions[options.length - 1] || `Option ${options.length}`);
    }
    
    // Shuffle options
    const shuffled = [...options].sort(() => Math.random() - 0.5);
    const correctIndex = shuffled.indexOf(targetWord);
    
    return {
      question: questionText,
      options: shuffled,
      correctAnswer: correctIndex,
      type: "Multiple Choice",
      explanation: `The correct answer is "${targetWord}".`
    };
  }

  private isInappropriateContent(text: string): boolean {
    // Basic content validation to avoid inappropriate flashcards
    const inappropriateKeywords = [
      'inappropriate', 'offensive', 'harmful', 'violent', 
      'cardic', 'cardictype', // Handle the specific "CardICType" issue mentioned
    ];
    
    const lowerText = text.toLowerCase();
    return inappropriateKeywords.some(keyword => lowerText.includes(keyword));
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
      // Generate quiz using content analysis with specific question types
      const quiz = this.generateQuizFromContent(content, questionCount, questionTypes);
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
