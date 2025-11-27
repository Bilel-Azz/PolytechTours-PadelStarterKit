const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { sequelize } = require('./models');
const authRoutes = require('./routes/auth');
const playersRoutes = require('./routes/players');
const teamsRoutes = require('./routes/teams');
const poolsRoutes = require('./routes/pools');
const eventsRoutes = require('./routes/events');
const matchesRoutes = require('./routes/matches');
const resultsRoutes = require('./routes/results');
const profileRoutes = require('./routes/profile');
const adminRoutes = require('./routes/admin');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors({
  origin: true, // Allow any origin (reflects the request origin)
  credentials: true
}));
app.use(express.json());

// Security headers middleware (simplified version of what was in FastAPI)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/players', playersRoutes);
app.use('/api/v1/teams', teamsRoutes);
app.use('/api/v1/pools', poolsRoutes);
app.use('/api/v1/events', eventsRoutes);
app.use('/api/v1/matches', matchesRoutes);
app.use('/api/v1/results', resultsRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/admin', adminRoutes);

app.get('/', (req, res) => {
  res.json({ message: "Bienvenue sur l'API Corpo Padel", version: "1.0.0" });
});

app.get('/health', (req, res) => {
  res.json({ status: "healthy" });
});

// Error handling - must be after all routes
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    // Sync database models (use { force: false } in production)
    await sequelize.sync({ alter: true });
    console.log('Database models synchronized.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
});

