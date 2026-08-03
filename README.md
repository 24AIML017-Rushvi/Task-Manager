# Task Manager API (Practical 4)

A complete, working RESTful API for task management built using Node.js and Express. It uses an MVC architecture and stores data in-memory (resets on server restart).

## Project Structure

```text
task-manager-api-24AIML017/
│
├── package.json
├── server.js
├── .gitignore
├── README.md
│
├── routes/
│   └── tasks.js
│
├── controllers/
│   └── taskController.js
│
├── middleware/
│   ├── logger.js
│   ├── validateJson.js
│   ├── validateTaskId.js
│   ├── errorHandler.js
│   └── notFound.js
```

## Installation

Run the following command to install the required dependencies (Express):
```bash
npm install
```

## Run

To start the server, run:
```bash
npm start
```
The server will start listening on port `3000`.

## API Endpoints

### 1. Get All Tasks
- **URL**: `GET /tasks`
- **Headers**: None
- **Status Code**: `200 OK`
- **Response**:
  ```json
  [
    {
      "id": 1,
      "title": "Complete Practical 4",
      "completed": false
    }
  ]
  ```

### 2. Get Task by ID
- **URL**: `GET /tasks/:id`
- **Headers**: None
- **Status Code**: `200 OK` (if found), `404 Not Found` (if not found), `400 Bad Request` (if invalid task ID)
- **Response (200 OK)**:
  ```json
  {
    "id": 1,
    "title": "Complete Practical 4",
    "completed": false
  }
  ```

### 3. Create Task
- **URL**: `POST /tasks`
- **Headers**: `Content-Type: application/json`
- **Body**:
  ```json
  {
    "title": "Learn Express"
  }
  ```
- **Status Code**: `201 Created`, `415 Unsupported Media Type` (if missing/incorrect Content-Type), `400 Bad Request` (if title is invalid or empty)
- **Response (201 Created)**:
  ```json
  {
    "id": 2,
    "title": "Learn Express",
    "completed": false
  }
  ```

### 4. Update Task
- **URL**: `PUT /tasks/:id`
- **Headers**: `Content-Type: application/json`
- **Body** (fields are optional, but at least one must be provided):
  ```json
  {
    "title": "Learn Express Deeply",
    "completed": true
  }
  ```
- **Status Code**: `200 OK`, `404 Not Found` (if not found), `400 Bad Request` (if ID format is invalid or validation fails), `415 Unsupported Media Type` (if missing/incorrect Content-Type)
- **Response (200 OK)**:
  ```json
  {
    "id": 2,
    "title": "Learn Express Deeply",
    "completed": true
  }
  ```

### 5. Delete Task
- **URL**: `DELETE /tasks/:id`
- **Headers**: None
- **Status Code**: `200 OK`, `404 Not Found` (if not found), `400 Bad Request` (if ID format is invalid)
- **Response (200 OK)**:
  ```json
  {
    "message": "Task deleted successfully"
  }
  ```

## Middleware Features
1. **Global Logger Middleware**: Logs request method, path, and ISO timestamp (e.g. `GET /tasks - 2026-08-03T10:30:00Z`).
2. **Content-Type Validation**: Rejects `POST` and `PUT` requests without `Content-Type: application/json` header with `415 Unsupported Media Type`.
3. **Route Validation**: Verifies that `:id` is a valid positive integer, returning `400 Bad Request` if invalid.
4. **404 Not Found Handling**: Returns `404 Not Found` with `{"message": "Route Not Found"}` for unmatched routes.
5. **Global Error Handling**: Intercepts unexpected errors and returns `500 Internal Server Error` with `{"error": "Something went wrong"}`.

## Postman Examples

### Request: Create Task
- **Method**: `POST`
- **URL**: `http://localhost:3000/tasks`
- **Headers**:
  - `Content-Type: application/json`
- **Body (raw JSON)**:
  ```json
  {
    "title": "Master Node.js"
  }
  ```

### Request: Update Task
- **Method**: `PUT`
- **URL**: `http://localhost:3000/tasks/1`
- **Headers**:
  - `Content-Type: application/json`
- **Body (raw JSON)**:
  ```json
  {
    "completed": true
  }
  ```
