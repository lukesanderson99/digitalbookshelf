const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Supabase
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// Middleware
app.use(cors({
    origin: 'http://localhost:3000'
}));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
    res.json({
        message: '📚 Digital Bookshelf Backend API',
        version: 'v1',
        timestamp: new Date().toISOString()
    });
});

app.get('/health', async (req, res) => {
    try {
        const { data, error } = await supabase.from('books').select('count', { count: 'exact' });
        res.json({
            status: 'OK',
            database: error ? 'Disconnected' : 'Connected',
            timestamp: new Date().toISOString(),
            port: PORT
        });
    } catch (err) {
        res.json({
            status: 'OK',
            database: 'Error',
            timestamp: new Date().toISOString(),
            port: PORT
        });
    }
});

// Get all books
app.get('/api/v1/books', async (req, res) => {
    try {
        console.log('📚 Fetching all books...');

        const { data, error } = await supabase
            .from('books')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Supabase error:', error);
            throw error;
        }

        console.log(`✅ Found ${data.length} books`);
        res.json({
            success: true,
            data: data,
            count: data.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error fetching books:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch books',
            message: error.message
        });
    }
});

// Get book stats
app.get('/api/v1/books/stats', async (req, res) => {
    try {
        console.log('📊 Calculating book statistics...');

        const { data, error } = await supabase
            .from('books')
            .select('category');

        if (error) throw error;

        const stats = {
            totalBooks: data.length,
            categories: {},
            topCategories: []
        };

        // Count books by category
        data.forEach(book => {
            stats.categories[book.category] = (stats.categories[book.category] || 0) + 1;
        });

        // Get top 5 categories
        stats.topCategories = Object.entries(stats.categories)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([category, count]) => ({ category, count }));

        console.log(`✅ Stats calculated: ${stats.totalBooks} books`);
        res.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error calculating stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to calculate statistics',
            message: error.message
        });
    }
});

// Get analytics overview
app.get('/api/v1/analytics/overview', async (req, res) => {
    try {
        console.log('📈 Calculating analytics overview...');

        const { data, error } = await supabase
            .from('books')
            .select('*');

        if (error) throw error;

        // Calculate analytics
        const analytics = {
            totalBooks: data.length,
            readingStats: {
                finished: data.filter(book => book.reading_status === 'finished').length,
                reading: data.filter(book => book.reading_status === 'reading').length,
                toRead: data.filter(book => book.reading_status === 'to-read').length
            },
            progressStats: {
                averageProgress: data.length > 0 ?
                    Math.round(data.reduce((sum, book) => sum + (book.progress_percentage || 0), 0) / data.length) : 0,
                booksWithProgress: data.filter(book => book.progress_percentage > 0).length
            },
            categoryBreakdown: {},
            recentActivity: {
                booksStartedThisMonth: data.filter(book => {
                    if (!book.date_started) return false;
                    const startDate = new Date(book.date_started);
                    const thisMonth = new Date();
                    return startDate.getMonth() === thisMonth.getMonth() &&
                        startDate.getFullYear() === thisMonth.getFullYear();
                }).length,
                booksFinishedThisMonth: data.filter(book => {
                    if (!book.date_finished) return false;
                    const finishDate = new Date(book.date_finished);
                    const thisMonth = new Date();
                    return finishDate.getMonth() === thisMonth.getMonth() &&
                        finishDate.getFullYear() === thisMonth.getFullYear();
                }).length
            }
        };

        // Category breakdown
        data.forEach(book => {
            analytics.categoryBreakdown[book.category] =
                (analytics.categoryBreakdown[book.category] || 0) + 1;
        });

        console.log('✅ Analytics calculated successfully');
        res.json({
            success: true,
            data: analytics,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error calculating analytics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to calculate analytics',
            message: error.message
        });
    }
});

// Get analytics dashboard (HTML format)
app.get('/api/v1/analytics/dashboard', async (req, res) => {
    try {
        console.log('📊 Generating analytics dashboard...');

        const { data, error } = await supabase
            .from('books')
            .select('*');

        if (error) throw error;

        // Calculate analytics
        const finished = data.filter(book => book.reading_status === 'finished');
        const reading = data.filter(book => book.reading_status === 'reading');
        const toRead = data.filter(book => book.reading_status === 'to-read');

        const averageProgress = data.length > 0 ?
            Math.round(data.reduce((sum, book) => sum + (book.progress_percentage || 0), 0) / data.length) : 0;

        // Category breakdown
        const categories = {};
        data.forEach(book => {
            categories[book.category] = (categories[book.category] || 0) + 1;
        });

        // Recent activity
        const thisMonth = new Date();
        const booksFinishedThisMonth = data.filter(book => {
            if (!book.date_finished) return false;
            const finishDate = new Date(book.date_finished);
            return finishDate.getMonth() === thisMonth.getMonth() &&
                finishDate.getFullYear() === thisMonth.getFullYear();
        });

        const currentlyReadingBooks = data.filter(book => book.reading_status === 'reading');

        // Generate HTML dashboard
        const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>📚 Reading Analytics Dashboard</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    margin: 0;
                    padding: 20px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh;
                    color: #333;
                }
                .container {
                    max-width: 1200px;
                    margin: 0 auto;
                    background: white;
                    border-radius: 15px;
                    padding: 30px;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                }
                .header {
                    text-align: center;
                    margin-bottom: 40px;
                    border-bottom: 2px solid #f0f0f0;
                    padding-bottom: 20px;
                }
                .header h1 {
                    color: #4a5568;
                    margin: 0;
                    font-size: 2.5em;
                }
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 20px;
                    margin-bottom: 40px;
                }
                .stat-card {
                    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
                    padding: 25px;
                    border-radius: 12px;
                    text-align: center;
                    color: white;
                    box-shadow: 0 8px 20px rgba(79, 172, 254, 0.3);
                }
                .stat-card.finished {
                    background: linear-gradient(135deg, #56ab2f 0%, #a8e6cf 100%);
                    box-shadow: 0 8px 20px rgba(86, 171, 47, 0.3);
                }
                .stat-card.reading {
                    background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
                    box-shadow: 0 8px 20px rgba(255, 154, 158, 0.3);
                }
                .stat-card.to-read {
                    background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
                    box-shadow: 0 8px 20px rgba(168, 237, 234, 0.3);
                }
                .stat-number {
                    font-size: 3em;
                    font-weight: bold;
                    margin: 0;
                }
                .stat-label {
                    font-size: 1.1em;
                    margin-top: 10px;
                    opacity: 0.9;
                }
                .section {
                    margin-bottom: 40px;
                }
                .section h2 {
                    color: #4a5568;
                    border-bottom: 2px solid #e2e8f0;
                    padding-bottom: 10px;
                    margin-bottom: 20px;
                }
                .category-list {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                }
                .category-item {
                    background: #f7fafc;
                    padding: 15px;
                    border-radius: 8px;
                    border-left: 4px solid #4facfe;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .book-list {
                    background: #f7fafc;
                    padding: 20px;
                    border-radius: 8px;
                    margin-top: 20px;
                }
                .book-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px 0;
                    border-bottom: 1px solid #e2e8f0;
                }
                .book-item:last-child {
                    border-bottom: none;
                }
                .book-title {
                    font-weight: 600;
                    color: #2d3748;
                }
                .book-author {
                    color: #718096;
                    font-size: 0.9em;
                }
                .progress-bar {
                    width: 100px;
                    height: 8px;
                    background: #e2e8f0;
                    border-radius: 4px;
                    overflow: hidden;
                }
                .progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #4facfe, #00f2fe);
                    transition: width 0.3s ease;
                }
                .badge {
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 0.8em;
                    font-weight: 600;
                }
                .badge.finished { background: #48bb78; color: white; }
                .badge.reading { background: #ed8936; color: white; }
                .badge.to-read { background: #38b2ac; color: white; }
                .refresh-btn {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    background: #4facfe;
                    color: white;
                    border: none;
                    padding: 15px 20px;
                    border-radius: 50px;
                    cursor: pointer;
                    font-weight: 600;
                    box-shadow: 0 8px 20px rgba(79, 172, 254, 0.4);
                    transition: transform 0.2s ease;
                }
                .refresh-btn:hover {
                    transform: translateY(-2px);
                }
                .timestamp {
                    text-align: center;
                    color: #718096;
                    font-size: 0.9em;
                    margin-top: 40px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📚 Reading Analytics Dashboard</h1>
                    <p>Your personal reading insights</p>
                </div>

                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-number">${data.length}</div>
                        <div class="stat-label">📖 Total Books</div>
                    </div>
                    <div class="stat-card finished">
                        <div class="stat-number">${finished.length}</div>
                        <div class="stat-label">✅ Finished</div>
                    </div>
                    <div class="stat-card reading">
                        <div class="stat-number">${reading.length}</div>
                        <div class="stat-label">📖 Currently Reading</div>
                    </div>
                    <div class="stat-card to-read">
                        <div class="stat-number">${toRead.length}</div>
                        <div class="stat-label">📋 To Read</div>
                    </div>
                </div>

                <div class="section">
                    <h2>📊 Categories</h2>
                    <div class="category-list">
                        ${Object.entries(categories)
                .sort(([, a], [, b]) => b - a)
                .map(([category, count]) => `
                            <div class="category-item">
                                <span>${category}</span>
                                <span style="font-weight: 600; color: #4facfe;">${count} book${count > 1 ? 's' : ''}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="section">
                    <h2>📈 Reading Insights</h2>
                    <div class="category-list">
                        <div class="category-item">
                            <span>📖 Currently Reading</span>
                            <span style="font-weight: 600; color: #ff9a9e;">${reading.length} book${reading.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div class="category-item">
                            <span>⏳ Books in Queue</span>
                            <span style="font-weight: 600; color: #a8edea;">${toRead.length} book${toRead.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div class="category-item">
                            <span>📊 Completion Rate</span>
                            <span style="font-weight: 600; color: #56ab2f;">
                                ${data.length > 0 ? Math.round((finished.length / data.length) * 100) : 0}%
                            </span>
                        </div>
                        <div class="category-item">
                            <span>📚 Favorite Category</span>
                            <span style="font-weight: 600; color: #4facfe;">
                                ${Object.entries(categories).length > 0 ?
                Object.entries(categories).sort(([, a], [, b]) => b - a)[0][0] : 'None yet'}
                            </span>
                        </div>
                    </div>
                </div>

                ${currentlyReadingBooks.length > 0 ? `
                <div class="section">
                    <h2>📖 Currently Reading</h2>
                    <div class="book-list">
                        ${currentlyReadingBooks.map(book => `
                            <div class="book-item">
                                <div>
                                    <div class="book-title">${book.title}</div>
                                    <div class="book-author">by ${book.author}</div>
                                </div>
                                <div style="display: flex; align-items: center; gap: 15px;">
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: ${book.progress_percentage || 0}%"></div>
                                    </div>
                                    <span style="font-weight: 600; color: #4facfe; min-width: 40px;">${book.progress_percentage || 0}%</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                ${booksFinishedThisMonth.length > 0 ? `
                <div class="section">
                    <h2>🎉 Finished This Month</h2>
                    <div class="book-list">
                        ${booksFinishedThisMonth.map(book => `
                            <div class="book-item">
                                <div>
                                    <div class="book-title">${book.title}</div>
                                    <div class="book-author">by ${book.author}</div>
                                </div>
                                <div class="badge finished">Completed</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                
                <div class="section">
                    <h2>📚 Complete Library</h2>
                    <div class="book-list">
                        ${data.map(book => `
                            <div class="book-item">
                                <div style="display: flex; align-items: center; gap: 15px;">
                                    ${book.cover_url ? `
                                        <img src="${book.cover_url}" alt="${book.title}" 
                                             style="width: 40px; height: 60px; object-fit: cover; border-radius: 4px;">
                                    ` : `
                                        <div style="width: 40px; height: 60px; background: linear-gradient(135deg, #4facfe, #00f2fe); 
                                                    border-radius: 4px; display: flex; align-items: center; justify-content: center; 
                                                    color: white; font-size: 18px;">📖</div>
                                    `}
                                    <div style="flex: 1;">
                                        <div class="book-title">${book.title}</div>
                                        <div class="book-author">by ${book.author}</div>
                                        <div style="margin-top: 4px;">
                                            <span style="background: #4facfe20; color: #4facfe; padding: 2px 8px; border-radius: 12px; font-size: 0.8em;">
                                                ${book.category}
                                            </span>
                                        </div>
                                    </div>
                                    <div style="text-align: right;">
                                        <div class="badge ${book.reading_status}">${book.reading_status === 'finished' ? '✅ Finished' :
                        book.reading_status === 'reading' ? '📖 Reading' : '📚 To Read'
                    }</div>
                                        ${book.reading_status === 'reading' && book.progress_percentage ? `
                                            <div style="margin-top: 4px; font-size: 0.8em; color: #718096;">
                                                ${book.progress_percentage}% complete
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="timestamp">
                    📅 Last updated: ${new Date().toLocaleString()}
                </div>
            </div>

            <button class="refresh-btn" onclick="location.reload()">🔄 Refresh</button>
        </body>
        </html>`;

        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    } catch (error) {
        console.error('❌ Error generating dashboard:', error);
        res.status(500).send(`
            <h1>Error</h1>
            <p>Failed to load analytics dashboard: ${error.message}</p>
        `);
    }
});

// Create new book
app.post('/api/v1/books', async (req, res) => {
    try {
        const { title, author, category, cover_url } = req.body;
        console.log(`📝 Creating new book: ${title} by ${author}`);

        if (!title || !author || !category) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: title, author, category'
            });
        }

        const { data, error } = await supabase
            .from('books')
            .insert([{
                title: title.trim(),
                author: author.trim(),
                category: category.trim(),
                cover_url: cover_url || null
            }])
            .select()
            .single();

        if (error) throw error;

        console.log(`✅ Created book: ${data.title}`);
        res.status(201).json({
            success: true,
            data: data,
            message: 'Book created successfully'
        });
    } catch (error) {
        console.error('❌ Error creating book:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create book',
            message: error.message
        });
    }
});

// Update book
app.put('/api/v1/books/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        console.log(`✏️ Updating book with ID: ${id}`);

        const { data, error } = await supabase
            .from('books')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({
                    success: false,
                    error: 'Book not found'
                });
            }
            throw error;
        }

        console.log(`✅ Updated book: ${data.title}`);
        res.json({
            success: true,
            data: data,
            message: 'Book updated successfully'
        });
    } catch (error) {
        console.error('❌ Error updating book:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update book',
            message: error.message
        });
    }
});

// Delete book
app.delete('/api/v1/books/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`🗑️ Deleting book with ID: ${id}`);

        const { error } = await supabase
            .from('books')
            .delete()
            .eq('id', id);

        if (error) throw error;

        console.log(`✅ Deleted book with ID: ${id}`);
        res.json({
            success: true,
            message: 'Book deleted successfully'
        });
    } catch (error) {
        console.error('❌ Error deleting book:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete book',
            message: error.message
        });
    }
});

// Start server
app.listen(PORT, async () => {
    console.log('🚀 Starting Digital Bookshelf Backend...');
    console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`📚 Books API: http://localhost:${PORT}/api/v1/books`);
    console.log(`📈 Stats API: http://localhost:${PORT}/api/v1/books/stats`);
    console.log(`📊 Analytics API: http://localhost:${PORT}/api/v1/analytics/overview`);
    console.log(`🎨 Dashboard: http://localhost:${PORT}/api/v1/analytics/dashboard`);

    // Test database connection
    try {
        const { data, error } = await supabase.from('books').select('count', { count: 'exact' });
        if (error) throw error;
        console.log('✅ Database connected successfully');
        console.log('✅ Backend ready to serve requests!');
    } catch (error) {
        console.log('⚠️ Backend running but database connection failed:', error.message);
    }
});