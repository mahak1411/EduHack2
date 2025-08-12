import OpenAI from "openai";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

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
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return result.flashcards || [];
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
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return result.questions || [];
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
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return result.summary || content;
    } catch (error) {
      console.error("Error generating notes:", error);
      throw new Error("Failed to generate notes");
    }
  }
}

export const aiService = new AIService();
