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


---

## Practical 9: In-Memory Caching & Query Optimization

In this practical, server-side in-memory caching was implemented using `node-cache` to reduce database query latency and minimize MongoDB load for read-heavy operations while ensuring cache consistency upon data modifications.

### 1. Core Caching Concepts

* **Cache Hit**: Occurs when a client requests data that already exists in memory. The response is returned immediately from the Node.js process heap, avoiding MongoDB network and disk I/O. The response includes the header `X-Cache: HIT`.
* **Cache Miss**: Occurs when the requested data is not present in cache (e.g., initial request or after invalidation). The server queries MongoDB, saves the result in memory, and returns the response with the header `X-Cache: MISS`.
* **TTL (Time-To-Live)**: Configured to **60 seconds**. If a cached entry is not refreshed or invalidated within 60 seconds, it automatically expires and is evicted during periodic cleanup (`checkperiod: 120s`).
* **Cache Invalidation**: Ensures data consistency by proactively purging stale cache entries immediately upon data mutations:
  * `POST /tasks`: Evicts cached task query lists for the creating user and platform admin.
  * `PUT /tasks/:id`: Evicts the specific task item (`task:<id>`) and related task query lists.
  * `DELETE /tasks/:id`: Evicts the specific task item (`task:<id>`) and related task query lists.
* **User-Scoped Cache Partitioning**: To preserve JWT authentication and multi-user privacy, cache keys are strictly scoped:
  * Normal User: `tasks:user:<userId>:<queryString>`
  * Administrator: `tasks:admin:<queryString>`
  * Single Task: `task:<taskId>` (validated with ownership check prior to return)

### 2. Multi-Instance Limitation: Why In-Memory Caching Fails in Distributed Architectures

In-memory caching with libraries like `node-cache` stores objects directly inside the V8 process heap memory of that single running Node.js process.

**Why this is unsuitable across multiple server instances:**
1. **Cache Drift / Stale Data**: When running multiple instances behind a load balancer (e.g., PM2 cluster, Docker swarm, or Kubernetes replicas), each instance holds an isolated memory cache.
2. **Missing Invalidation Across Nodes**: If a user sends a `PUT /tasks/:id` to Node 1, Node 1 invalidates its local cache. However, Node 2 and Node 3 are unaware of this update and will continue serving obsolete cached data until their local TTL expires.
3. **Memory Duplication**: The same task dataset is duplicated across each server's memory heap instead of being shared.

**Industry Standard Solution**:
For clustered or distributed applications, use a centralized, shared in-memory data store such as **Redis** or **Memcached**. All application instances connect to the centralized Redis cluster, guaranteeing unified cache hits, single-point invalidation, and data consistency.

---

### 3. Real Performance Benchmark Measurements

Below are the actual response times measured for `GET /tasks` before and after enabling in-memory caching:

| Test Run | Uncached Response Time (MongoDB) | Cached Response Time (`node-cache` Hit) | Response Header |
| :--- | :--- | :--- | :--- |
| **Run 1** | **10.66 ms** | **4.73 ms** | `X-Cache: HIT` |
| **Run 2** | **6.16 ms** | **3.55 ms** | `X-Cache: HIT` |
| **Run 3** | **5.14 ms** | **3.09 ms** | `X-Cache: HIT` |
| **Average** | **7.32 ms** | **3.79 ms** | — |

**Performance Analysis**:
* The in-memory cache achieved an average latency reduction of **48.2%** (~1.93x throughput speedup) on a local SSD database.
* In network-distributed environments (e.g., MongoDB Atlas across cloud regions with 30–80 ms RTT), in-memory caching typically yields a **10x to 50x speedup**.

---

### 4. Cache Statistics Debug Endpoint

* **Endpoint**: `GET /tasks/cache/stats` (or `GET /cache/stats`)
* **Headers**: `Authorization: Bearer <token>`
* **Status**: `200 OK`
* **Sample Response**:
  ```json
  {
    "success": true,
    "message": "Task Cache Statistics",
    "stats": {
      "hits": 4,
      "misses": 2,
      "totalRequests": 6,
      "hitRatio": "66.67%",
      "stdTTL": 60,
      "keysCount": 2,
      "activeKeys": [
        "tasks:admin:{}",
        "task:6ad614ccebef7c84fe8ee39d"
      ],
      "nodeCacheStats": {
        "hits": 4,
        "misses": 2,
        "keys": 2,
        "ksize": 43,
        "vsize": 360
      }
    }
  }
  ```


---

## Practical: Background Notifications Using Node.js Built-In EventEmitter (ITUE301)

This practical implements background asynchronous notifications upon task creation using the core Node.js `events` module without external event-handling dependencies.

### 1. Architecture & Execution Flow

```text
Client (Thunder Client / Frontend)
           │
           │  1. POST /tasks (JWT Authorized)
           ▼
     Express Route
           │
           │  2. Save to MongoDB (Task.create)
           ▼
    MongoDB Database
           │
           │  3. Task Persisted
           ▼
  taskEventEmitter.emit('task-created', task, timestamp)
           │
           ├───► 4. Immediate HTTP 201 Created Response (Non-blocking: ~25 ms)
           │
           └───► 5. EventEmitter Listener (`setTimeout` 2000 ms delay)
                        │
                        ▼ (2 seconds later)
                 Background Notification Executed
                 - Logs Task Title, User, Priority
                 - Logs Timestamps proving API responded first
```

### 2. EventEmitter Implementation Details

* **Core Module**: Built with `const { EventEmitter } = require('events')`.
* **Event (`task-created`)**: Dispatched immediately after a task document is saved in MongoDB.
* **Non-Blocking Timer**: Uses `setTimeout(..., 2000)` inside the listener.
* **Timing Proof**:
  * API Response Dispatched: `2026-10-19T17:22:30.034Z`
  * Notification Executed: `2026-10-19T17:22:32.047Z` (~2013 ms later)
* **Safe Error Handling**:
  * If notification processing encounters an error (e.g. simulated delivery failure or network fault), it emits an `'error'` event.
  * The registered `taskEventEmitter.on('error', ...)` listener catches the error, logs diagnostics, and prevents unhandled exceptions from terminating the Node.js process.

---

### 3. Thunder Client Testing Guide

#### Step 1: Login to Obtain JWT Token
* **Method**: `POST`
* **URL**: `http://localhost:3000/login`
* **Headers**: `Content-Type: application/json`
* **Body**:
  ```json
  {
    "email": "24aiml017@charusat.edu.in",
    "password": "Ruxvi@140"
  }
  ```
* **Response**: Copy the `token` string from the JSON response.

#### Step 2: Create a Task (Triggers Background Notification)
* **Method**: `POST`
* **URL**: `http://localhost:3000/tasks`
* **Headers**:
  * `Content-Type: application/json`
  * `Authorization: Bearer <YOUR_TOKEN>`
* **Body**:
  ```json
  {
    "title": "Complete AWD Practical Exercise",
    "description": "Implement background notifications using Node.js built-in EventEmitter",
    "priority": "high",
    "dueDate": "2026-10-22"
  }
  ```
* **Expected Result**:
  * Status: `201 Created` immediately.
  * Server terminal logs the background notification execution 2 seconds later.

#### Step 3: Test Safe Notification Error Handling
* **Method**: `POST`
* **URL**: `http://localhost:3000/tasks`
* **Headers**:
  * `Content-Type: application/json`
  * `Authorization: Bearer <YOUR_TOKEN>`
* **Body**:
  ```json
  {
    "title": "Failed Task Delivery [simulate-error]",
    "description": "Simulates background notification failure",
    "priority": "medium"
  }
  ```
* **Expected Result**:
  * Status: `201 Created` immediately.
  * 2 seconds later, server terminal displays `⚠️ [NOTIFICATION ERROR EVENT CAUGHT SAFELY]`.
  * The server remains running without crashing.

#### Step 4: Delete Task
* **Method**: `DELETE`
* **URL**: `http://localhost:3000/tasks/<TASK_ID>`
* **Headers**: `Authorization: Bearer <YOUR_TOKEN>`
* **Expected Result**:
  * Status: `200 OK` (`{"message": "Task deleted successfully"}`).

---

### 4. Viva Questions & Answers (Simplified English)

1. **What is EventEmitter in Node.js and how does it work?**
   * **Answer**: `EventEmitter` is a built-in Node.js class from the `events` module that implements the **Publisher-Subscriber (Observer) pattern**. It allows objects to emit named events (using `.emit('eventName', data)`) and register one or more listener functions (using `.on('eventName', callback)`). When the event is fired, all attached listeners are executed.

2. **Why should background notifications not block the HTTP API response?**
   * **Answer**: Node.js operates on a single-threaded event loop. If we delay or `await` time-consuming background operations (such as waiting 2 seconds, sending an email, or dispatching push notifications) before sending the HTTP response, the client has to wait needlessly. By emitting an event and scheduling the notification asynchronously, the API immediately returns `201 Created` in milliseconds, keeping the application fast, responsive, and scalable.

3. **What happens if an `error` event is emitted without a registered error listener?**
   * **Answer**: In Node.js, `error` is a special event. If an `EventEmitter` emits an `'error'` event and there is **no listener** registered for `'error'`, Node.js treats it as an unhandled exception. It prints a stack trace and **immediately crashes the entire server process** (`process.exit(1)`). To prevent crashes, an application must always attach a listener using `taskEventEmitter.on('error', (err) => { ... })`.
