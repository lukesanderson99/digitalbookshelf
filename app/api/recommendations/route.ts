import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

interface BookRecommendation {
    title: string;
    author: string;
    reason: string;
    confidence: number;
    genre: string;
    cover_url?: string | null;
}

// Fallback recommendations if AI fails - MOVED TO TOP
function getFallbackRecommendations(preferredGenre: string): BookRecommendation[] {
    const fallbackBooks: Record<string, BookRecommendation[]> = {
        'Science': [
            {
                title: "Sapiens",
                author: "Yuval Noah Harari",
                reason: "A fascinating exploration of human history and development that combines science with engaging storytelling.",
                confidence: 8,
                genre: "Science"
            },
            {
                title: "The Immortal Life of Henrietta Lacks",
                author: "Rebecca Skloot",
                reason: "Combines medical science with human story, perfect for science enthusiasts who enjoy narrative non-fiction.",
                confidence: 7,
                genre: "Science"
            },
            {
                title: "Astrophysics for People in a Hurry",
                author: "Neil deGrasse Tyson",
                reason: "Makes complex astrophysics accessible and engaging, perfect for curious science readers.",
                confidence: 8,
                genre: "Science"
            },
            {
                title: "The Code Breaker",
                author: "Walter Isaacson",
                reason: "Fascinating biography of Jennifer Doudna and the CRISPR revolution, combining science with human story.",
                confidence: 8,
                genre: "Science"
            }
        ],
        'Sports & Recreation': [
            {
                title: "Open",
                author: "Andre Agassi",
                reason: "An honest and compelling sports memoir that goes beyond tennis to explore personal struggles and triumphs.",
                confidence: 8,
                genre: "Sports"
            },
            {
                title: "The Boys in the Boat",
                author: "Daniel James Brown",
                reason: "An inspiring story of teamwork and perseverance, combining sports history with compelling narrative.",
                confidence: 8,
                genre: "Sports"
            },
            {
                title: "Moneyball",
                author: "Michael Lewis",
                reason: "Revolutionary look at baseball analytics that changed sports forever, engaging for all readers.",
                confidence: 9,
                genre: "Sports"
            },
            {
                title: "The Last Dance",
                author: "Michael Jordan",
                reason: "Inside look at basketball greatness and the mentality required for championship success.",
                confidence: 8,
                genre: "Sports"
            }
        ],
        'Fiction': [
            {
                title: "The Seven Husbands of Evelyn Hugo",
                author: "Taylor Jenkins Reid",
                reason: "An engaging novel with complex characters and compelling storytelling that's widely loved.",
                confidence: 8,
                genre: "Fiction"
            },
            {
                title: "Where the Crawdads Sing",
                author: "Delia Owens",
                reason: "Beautiful coming-of-age story with mystery elements, perfect for literary fiction lovers.",
                confidence: 8,
                genre: "Fiction"
            },
            {
                title: "The Midnight Library",
                author: "Matt Haig",
                reason: "Thought-provoking novel about life's possibilities and second chances, emotionally resonant.",
                confidence: 8,
                genre: "Fiction"
            },
            {
                title: "Klara and the Sun",
                author: "Kazuo Ishiguro",
                reason: "Beautifully written exploration of love, consciousness, and what makes us human.",
                confidence: 8,
                genre: "Fiction"
            }
        ],
        'General': [
            {
                title: "Educated",
                author: "Tara Westover",
                reason: "A powerful memoir about education and self-discovery that appeals to readers across all genres.",
                confidence: 9,
                genre: "Biography"
            },
            {
                title: "Becoming",
                author: "Michelle Obama",
                reason: "Inspiring memoir that combines personal story with historical insight, universally appealing.",
                confidence: 9,
                genre: "Biography"
            },
            {
                title: "The Alchemist",
                author: "Paulo Coelho",
                reason: "Timeless philosophical novel about following your dreams and finding your purpose.",
                confidence: 8,
                genre: "Philosophy"
            },
            {
                title: "Atomic Habits",
                author: "James Clear",
                reason: "Practical guide to building good habits and breaking bad ones, applicable to all areas of life.",
                confidence: 9,
                genre: "Self-Help"
            }
        ]
    };

    return fallbackBooks[preferredGenre] || fallbackBooks['General'];
}

// Google Books API function to fetch book covers
async function getBookCover(title: string, author: string): Promise<string | null> {
    try {
        const query = `${title} ${author}`.replace(/[^\w\s]/gi, '').trim();
        const response = await fetch(
            `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=1&orderBy=relevance`,
            {
                headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BookRecommendationService/1.0)' }
            }
        );

        if (!response.ok) {
            console.warn(`Google Books API error for "${title}": ${response.status}`);
            return null;
        }

        const data = await response.json();

        if (data.items && data.items.length > 0) {
            const book = data.items[0];
            const coverUrl = book.volumeInfo?.imageLinks?.thumbnail;

            if (coverUrl) {
                // Convert to HTTPS and get higher quality image
                return coverUrl.replace('http:', 'https:').replace('&zoom=1', '&zoom=2');
            }
        }

        return null;
    } catch (error) {
        console.error(`Error fetching book cover for "${title}":`, error);
        return null;
    }
}

export async function POST(request: NextRequest) {
    try {
        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                { error: 'OpenAI API key not configured' },
                { status: 500 }
            );
        }

        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        const { books } = await request.json();

        // Analyze user's reading patterns
        const readBooks = books.filter((book: any) => book.reading_status === 'finished');
        const currentlyReading = books.filter((book: any) => book.reading_status === 'reading');
        const categories = [...new Set(books.map((book: any) => book.category))];

        const prompt = `
You are a book recommendation expert. Based on this person's reading history, recommend 4 books they would enjoy.

COMPLETED BOOKS:
${readBooks.map((book: any) => `- "${book.title}" by ${book.author} (${book.category})`).join('\n')}

CURRENTLY READING:
${currentlyReading.map((book: any) => `- "${book.title}" by ${book.author} (${book.category})`).join('\n')}

FAVORITE CATEGORIES: ${categories.join(', ')}

Please recommend 4 books with:
1. Real books that exist (verify title and author)
2. Similar themes or authors to what they've enjoyed
3. Mix of their favorite categories and 1-2 new genres they might like
4. Brief reason why they'd enjoy each book

Format as JSON array:
[
  {
    "title": "Exact Book Title",
    "author": "Author Name",
    "reason": "Brief explanation why they'd enjoy this (30-40 words)",
    "confidence": 8,
    "genre": "Category"
  }
]

Focus on popular, well-reviewed books that are likely to be available.
`;

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are an expert librarian who gives excellent book recommendations. Always suggest real, existing books with correct titles and authors."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_tokens: 800,
            temperature: 0.8,
        });

        const aiResponse = response.choices[0]?.message?.content;

        if (!aiResponse) {
            throw new Error('No response from AI');
        }

        // Try to parse the JSON response
        let recommendations: BookRecommendation[];

        try {
            recommendations = JSON.parse(aiResponse);

            // Validate the response structure
            if (!Array.isArray(recommendations)) {
                throw new Error('Invalid response format');
            }

            // Ensure each recommendation has required fields
            recommendations = recommendations.map(rec => ({
                title: rec.title || 'Unknown Title',
                author: rec.author || 'Unknown Author',
                reason: rec.reason || 'Recommended based on your reading history',
                confidence: rec.confidence || 7,
                genre: rec.genre || 'General'
            }));

        } catch (parseError) {
            console.error('Failed to parse AI response:', parseError);

            // Fallback recommendations based on user's categories
            const fallbackGenre = categories[0] || 'Fiction';
            recommendations = getFallbackRecommendations(fallbackGenre);
        }

        // Fetch book covers for all recommendations
        const recommendationsWithCovers = await Promise.all(
            recommendations.slice(0, 4).map(async (rec) => {
                try {
                    const cover_url = await getBookCover(rec.title, rec.author);
                    return {
                        ...rec,
                        cover_url
                    };
                } catch (error) {
                    console.warn(`Failed to fetch cover for "${rec.title}":`, error);
                    return {
                        ...rec,
                        cover_url: null
                    };
                }
            })
        );

        return NextResponse.json({
            recommendations: recommendationsWithCovers,
            basedOn: {
                completedBooks: readBooks.length,
                categories: categories,
                totalBooks: books.length
            }
        });

    } catch (error) {
        console.error('Recommendations API Error:', error);

        // Return fallback recommendations with covers
        const fallbackRecs = getFallbackRecommendations('General');

        // Try to get covers for fallback recommendations too
        const fallbackWithCovers = await Promise.all(
            fallbackRecs.map(async (rec) => {
                try {
                    const cover_url = await getBookCover(rec.title, rec.author);
                    return { ...rec, cover_url };
                } catch {
                    return { ...rec, cover_url: null };
                }
            })
        );

        return NextResponse.json({
            recommendations: fallbackWithCovers,
            basedOn: { completedBooks: 0, categories: ['General'], totalBooks: 0 },
            error: 'Using fallback recommendations'
        });
    }
}