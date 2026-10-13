# Task Manager REST API (Practical 5)

A complete, beginner-friendly RESTful API for task management built using Node.js, Express, MongoDB, and Mongoose ODM. This practical extends Practical 4 by replacing in-memory data storage with persistent database storage in MongoDB using Mongoose schemas and model validations.

## Architecture

```text
Client / Postman
       ↓
 Express Server
       ↓
  Mongoose ODM
       ↓
    MongoDB
       ↓
tasks collection
```

## Project Structure

```text
task-manager-api-24AIML017/
│
├── models/
│   └── Task.js
│
├── controllers/
│   └── taskController.js
│
├── middleware/
│   ├── errorHandler.js
│   ├── logger.js
│   ├── notFound.js
│   ├── validateJson.js
│   └── validateTaskId.js
│
├── routes/
│   └── tasks.js
│
├── .env
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── README.md
└── server.js
```

## Features & Schema Design

### Mongoose Model (`models/Task.js`)
* `title`: String, required with custom error message (`Title is required`).
* `description`: String, optional.
* `completed`: Boolean, default: `false`.
* `createdAt`: Date, default: `Date.now`.
* `priority`: String, enum: `['low', 'medium', 'high']`, default: `'medium'`.
* **Pre-save Hook**: Automatically trims leading and trailing whitespace from the `title` before saving into MongoDB.

---

## Installation & Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Configuration**:
   Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Configure your MongoDB connection string in `.env`:
   ```env
   PORT=3000
   MONGO_URI=mongodb://127.0.0.1:27017/taskmanager
   ```

3. **Start MongoDB Server**:
   Ensure MongoDB is running locally on port `27017` or use MongoDB Atlas.

4. **Run the Application**:
   ```bash
   npm start
   ```
   The server will start on port `3000` and output:
   ```text
   MongoDB connected
   Server is running on port 3000
   ```

---

## API Endpoints

### 1. Get All Tasks
* **Method**: `GET`
* **URL**: `/tasks`
* **Status**: `200 OK`
* **Response**:
  ```json
  [
    {
      "_id": "651a2b3c4d5e6f7a8b9c0d1e",
      "title": "Learn MongoDB",
      "description": "Practice Mongoose schemas",
      "completed": false,
      "priority": "medium",
      "createdAt": "2026-10-07T18:00:00.000Z"
    }
  ]
  ```

### 2. Create a Task
* **Method**: `POST`
* **URL**: `/tasks`
* **Headers**: `Content-Type: application/json`
* **Body**:
  ```json
  {
    "title": "   Learn MongoDB   ",
    "description": "Practice Mongoose",
    "priority": "high"
  }
  ```
* **Status**: `201 Created`
* **Response** (Note: `title` is trimmed automatically via pre-save hook):
  ```json
  {
    "_id": "651a2b3c4d5e6f7a8b9c0d1e",
    "title": "Learn MongoDB",
    "description": "Practice Mongoose",
    "completed": false,
    "priority": "high",
    "createdAt": "2026-10-07T18:00:00.000Z"
  }
  ```

### 3. Get Task by ID
* **Method**: `GET`
* **URL**: `/tasks/:id`
* **Status**: `200 OK` (if found), `404 Not Found` (if not found), `400 Bad Request` (if invalid ObjectId)
* **Response (404 Not Found)**:
  ```json
  {
    "message": "Task not found"
  }
  ```

### 4. Update Task
* **Method**: `PUT`
* **URL**: `/tasks/:id`
* **Headers**: `Content-Type: application/json`
* **Body**:
  ```json
  {
    "completed": true,
    "priority": "low"
  }
  ```
* **Status**: `200 OK` (if found), `404 Not Found` (if not found), `400 Bad Request` (if validation fails)

### 5. Delete Task
* **Method**: `DELETE`
* **URL**: `/tasks/:id`
* **Status**: `200 OK`
* **Response**:
  ```json
  {
    "message": "Task deleted successfully"
  }
  ```

---

## Validation & Error Handling

* **Missing Title (`POST /tasks`)**:
  Status `400 Bad Request`:
  ```json
  {
    "error": "Validation failed",
    "details": {
      "title": "Title is required"
    }
  }
  ```

* **Invalid Priority (`POST /tasks` or `PUT /tasks/:id`)**:
  Sending `{"priority": "urgent"}` returns Status `400 Bad Request`:
  ```json
  {
    "error": "Validation failed",
    "details": {
      "priority": "urgent is not a valid priority. Allowed values: low, medium, high"
    }
  }
  ```

* **Invalid ObjectId (`GET /tasks/123`)**:
  Status `400 Bad Request`:
  ```json
  {
    "error": "Bad Request. Invalid Task ID format."
  }
  ```

* **Non-JSON Media Type (`POST` / `PUT`)**:
  Status `415 Unsupported Media Type`:
  ```json
  {
    "error": "Unsupported Media Type. Content-Type must be application/json"
  }
  ```

* **Undefined Route (`GET /invalid-route`)**:
  Status `404 Not Found`:
  ```json
  {
    "success": false,
    "status": 404,
    "message": "Route Not Found",
    "method": "GET",
    "path": "/invalid-route",
    "timestamp": "2026-10-07T18:00:00.000Z"
  }
  ```

---

## Viewing Data in MongoDB Compass

1. Open **MongoDB Compass**.
2. Connect to: `mongodb://127.0.0.1:27017`
3. In the left sidebar, find the database named `taskmanager`.
4. Click on the `tasks` collection.
5. You can view all saved task documents stored in MongoDB with their `_id`, `title`, `description`, `completed`, `priority`, and `createdAt` fields.
