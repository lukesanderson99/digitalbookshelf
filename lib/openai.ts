import OpenAI from 'openai';

// Initialize OpenAI client with better error handling
const getOpenAIClient = () => {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        throw new Error('OPENAI_API_KEY is not set in environment variables');
    }

    return new OpenAI({
        apiKey: apiKey,
    });
};

// Types for our AI features
export interface BookRecommendation {
    title: string;
    author: string;
    reason: string;
    confidence: number;
}

export interface ReadingInsight {
    pattern: string;
    recommendation: string;
    categories: string[];
}

// Analyze user's reading patterns and generate insights
export async function analyzeReadingPatterns(books: any[]): Promise<ReadingInsight> {
    try {
        const openai = getOpenAIClient();
        // Prepare book data for AI analysis
        const bookSummary = books.map(book => ({
            title: book.title,
            author: book.author,
            category: book.category,
            status: book.reading_status,
            progress: book.progress_percentage
        }));

        const prompt = `
Analyze this person's reading habits and provide insights:

Books: ${JSON.stringify(bookSummary, null, 2)}

Please provide:
1. A pattern you notice in their reading preferences
2. A personalized recommendation for what type of book they should read next
3. Their top 3 favorite categories based on completion rates

Format as JSON:
{
  "pattern": "brief description of reading pattern",
  "recommendation": "specific recommendation with reasoning",
  "categories": ["category1", "category2", "category3"]
}
`;

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are a helpful book recommendation assistant who analyzes reading patterns."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_tokens: 300,
            temperature: 0.7,
        });

        const aiResponse = response.choices[0]?.message?.content;

        if (!aiResponse) {
            throw new Error('No response from AI');
        }

        // Parse the JSON response
        const insight = JSON.parse(aiResponse);

        return {
            pattern: insight.pattern || "No clear pattern detected yet.",
            recommendation: insight.recommendation || "Keep reading what you enjoy!",
            categories: insight.categories || ["Fiction", "Non-fiction", "Science"]
        };

    } catch (error) {
        console.error('Error analyzing reading patterns:', error);

        // Fallback response if AI fails
        return {
            pattern: "You're building a diverse reading collection!",
            recommendation: "Based on your current books, try exploring related authors in your favorite genres.",
            categories: ["Science", "Fiction", "Biography"]
        };
    }
}

// Get AI-powered book recommendations based on current library
export async function getBookRecommendations(books: any[], limit: number = 3): Promise<BookRecommendation[]> {
    try {
        const openai = getOpenAIClient();
        const bookTitles = books.map(book => `${book.title} by ${book.author}`).join(', ');
        const favoriteCategories = [...new Set(books.map(book => book.category))].join(', ');

        const prompt = `
Based on someone who has read: ${bookTitles}

Their favorite categories seem to be: ${favoriteCategories}

Recommend ${limit} books they might enjoy. For each recommendation, provide:
- Title and author
- Brief reason why they'd like it
- Confidence level (1-10)

Format as JSON array:
[
  {
    "title": "Book Title",
    "author": "Author Name", 
    "reason": "why they'd like this book",
    "confidence": 8
  }
]
`;

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are a knowledgeable librarian who gives excellent book recommendations based on reading history."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_tokens: 500,
            temperature: 0.8,
        });

        const aiResponse = response.choices[0]?.message?.content;

        if (!aiResponse) {
            throw new Error('No response from AI');
        }

        const recommendations = JSON.parse(aiResponse);

        return recommendations.slice(0, limit);

    } catch (error) {
        console.error('Error getting book recommendations:', error);

        // Fallback recommendations if AI fails
        return [
            {
                title: "The Midnight Library",
                author: "Matt Haig",
                reason: "A thought-provoking novel that combines philosophy with engaging storytelling.",
                confidence: 7
            },
            {
                title: "Educated",
                author: "Tara Westover",
                reason: "A powerful memoir about education and personal growth.",
                confidence: 8
            },
            {
                title: "The Seven Husbands of Evelyn Hugo",
                author: "Taylor Jenkins Reid",
                reason: "An engaging historical fiction with complex characters.",
                confidence: 7
            }
        ];
    }
}

// Analyze a specific book and provide insights
export async function analyzeBook(title: string, author: string): Promise<string> {
    try {
        const openai = getOpenAIClient();
        const prompt = `
Provide a brief, engaging analysis of the book "${title}" by ${author}.

Include:
- What makes this book special
- Who would enjoy it
- Key themes or insights
- Why it's worth reading

Keep it concise but informative (2-3 sentences max).
`;

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are a book critic who provides insightful, concise book analyses."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_tokens: 150,
            temperature: 0.7,
        });

        return response.choices[0]?.message?.content || "This book offers a unique perspective worth exploring.";

    } catch (error) {
        console.error('Error analyzing book:', error);
        return "This book offers a unique perspective worth exploring.";
    }
}