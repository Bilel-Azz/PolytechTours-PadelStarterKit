const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { sequelize } = require('./models');
const authRoutes = require('./routes/auth');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.set("trust proxy", true);

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

app.get('/', (req, res) => {
  res.json({ message: "Bienvenue sur l'API Corpo Padel", version: "1.0.0" });
});

app.get('/health', (req, res) => {
  res.json({ status: "healthy" });
});

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
});
