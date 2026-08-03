const express = require('express');
const logger = require('./middleware/logger');
const validateJson = require('./middleware/validateJson');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const taskRoutes = require('./routes/tasks');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Enable express.json() for request body parsing (must be before routes)
app.use(express.json());

// 2. Global Logger Middleware (logs method, url, and timestamp)
app.use(logger);

// 3. Content-Type Validation Middleware (rejects non-JSON POST/PUT requests)
app.use(validateJson);

// Mount router for /tasks endpoints
app.use('/tasks', taskRoutes);

// 4. Fallback 404 Middleware (Route Not Found)
app.use(notFound);

// 5. Global Error Handler Middleware (must be the LAST middleware)
app.use(errorHandler);

// Start listening for incoming traffic
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
