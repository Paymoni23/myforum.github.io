const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.')); // Serve static files from current directory
app.use('/data', express.static('data')); // Serve data directory

// Data file paths
const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const THREADS_FILE = path.join(__dirname, 'data', 'threads.json');

// Initialize data files if they don't exist
if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
}
if (!fs.existsSync(THREADS_FILE)) {
    fs.writeFileSync(THREADS_FILE, JSON.stringify([], null, 2));
}

// Read data functions
function readUsers() {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
}

function readThreads() {
    return JSON.parse(fs.readFileSync(THREADS_FILE, 'utf8'));
}

// Write data functions
function writeUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function writeThreads(threads) {
    fs.writeFileSync(THREADS_FILE, JSON.stringify(threads, null, 2));
}

// Register endpoint
app.post('/api/register', (req, res) => {
    try {
        const { studentId, username, password } = req.body;
        const users = readUsers();

        // Check if user already exists
        if (users.some(user => user.studentId === studentId)) {
            return res.status(400).json({ error: 'Student ID already registered' });
        }
        if (users.some(user => user.username === username)) {
            return res.status(400).json({ error: 'Username already taken' });
        }

        // Create new user
        const newUser = {
            studentId,
            username,
            password: Buffer.from(password).toString('base64'), // Basic encoding (use proper hashing in production)
            role: 'member',
            joinDate: new Date().toISOString(),
            lastActive: new Date().toISOString(),
            posts: 0,
            likes: 0,
            avatar: '/img/default-avatar.png'
        };

        // Save user
        users.push(newUser);
        writeUsers(users);

        // Return user data without password
        const { password: _, ...userWithoutPassword } = newUser;
        res.json({ success: true, user: userWithoutPassword });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Login endpoint
app.post('/api/login', (req, res) => {
    try {
        const { studentId, password } = req.body;
        const users = readUsers();

        // Find user
        const user = users.find(u => u.studentId === studentId);
        if (!user || user.password !== Buffer.from(password).toString('base64')) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Update last active
        user.lastActive = new Date().toISOString();
        writeUsers(users);

        // Return user data without password
        const { password: _, ...userWithoutPassword } = user;
        res.json({ success: true, user: userWithoutPassword });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get user profile
app.get('/api/users/:studentId', (req, res) => {
    try {
        const users = readUsers();
        const user = users.find(u => u.studentId === req.params.studentId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Update user profile
app.put('/api/users/:studentId', (req, res) => {
    try {
        const users = readUsers();
        const userIndex = users.findIndex(u => u.studentId === req.params.studentId);
        
        if (userIndex === -1) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update allowed fields
        const allowedUpdates = ['username', 'avatar'];
        allowedUpdates.forEach(field => {
            if (req.body[field]) {
                users[userIndex][field] = req.body[field];
            }
        });

        writeUsers(users);
        
        const { password: _, ...userWithoutPassword } = users[userIndex];
        res.json(userWithoutPassword);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all users
app.get('/api/users.json', (req, res) => {
    try {
        const users = readUsers();
        // Return users without passwords
        const safeUsers = users.map(user => {
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
        });
        res.json(safeUsers);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Thread endpoints
app.get('/api/threads', (req, res) => {
    try {
        const threads = readThreads();
        res.json(threads);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/threads', (req, res) => {
    try {
        const { title, content, authorId, category, tags } = req.body;
        console.log('Received thread creation request:', { title, content, authorId, category, tags });
        
        if (!title || !content || !authorId || !category) {
            console.log('Missing required fields:', { title, content, authorId, category });
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const users = readUsers();
        const user = users.find(u => u.studentId === authorId);
        if (!user) {
            console.log('User not found:', authorId);
            return res.status(404).json({ error: 'User not found' });
        }

        const threads = readThreads();
        
        const newThread = {
            id: String(threads.length + 1),
            title,
            content,
            authorId,
            category,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            likes: 0,
            replies: [],
            tags: tags || []
        };
        
        console.log('Creating new thread:', newThread);
        threads.push(newThread);
        writeThreads(threads);
        
        // Update user's post count
        user.posts += 1;
        writeUsers(users);
        
        res.json(newThread);
    } catch (error) {
        console.error('Error creating thread:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/threads/:id', (req, res) => {
    try {
        const threads = readThreads();
        const thread = threads.find(t => t.id === req.params.id);
        
        if (!thread) {
            return res.status(404).json({ error: 'Thread not found' });
        }
        
        res.json(thread);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/threads/:id/replies', (req, res) => {
    try {
        const { content, authorId } = req.body;
        const threads = readThreads();
        const threadIndex = threads.findIndex(t => t.id === req.params.id);
        
        if (threadIndex === -1) {
            return res.status(404).json({ error: 'Thread not found' });
        }
        
        const newReply = {
            id: `${req.params.id}-${threads[threadIndex].replies.length + 1}`,
            content,
            authorId,
            createdAt: new Date().toISOString(),
            likes: 0
        };
        
        threads[threadIndex].replies.push(newReply);
        threads[threadIndex].updatedAt = new Date().toISOString();
        writeThreads(threads);
        
        res.json(newReply);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/threads/:id', (req, res) => {
    try {
        const threads = readThreads();
        const threadIndex = threads.findIndex(t => t.id === req.params.id);
        
        if (threadIndex === -1) {
            return res.status(404).json({ error: 'Thread not found' });
        }
        
        // Update allowed fields
        const allowedUpdates = ['title', 'content', 'category', 'tags'];
        allowedUpdates.forEach(field => {
            if (req.body[field]) {
                threads[threadIndex][field] = req.body[field];
            }
        });
        
        threads[threadIndex].updatedAt = new Date().toISOString();
        writeThreads(threads);
        
        res.json(threads[threadIndex]);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/api/threads/:id', (req, res) => {
    try {
        const threads = readThreads();
        const threadIndex = threads.findIndex(t => t.id === req.params.id);
        
        if (threadIndex === -1) {
            return res.status(404).json({ error: 'Thread not found' });
        }
        
        threads.splice(threadIndex, 1);
        writeThreads(threads);
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 