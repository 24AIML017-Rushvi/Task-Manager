/**
 * Central API client for Task Manager full-stack integration.
 * Communicates with Express + MongoDB backend at http://localhost:3000.
 */

const API_BASE_URL = 'http://localhost:3000';

/**
 * Retrieve stored auth token from localStorage if present.
 */
function getAuthHeader() {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('task_manager_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Handle fetch response, distinguish HTTP errors (404, 500, 400), and extract messages.
 */
async function handleResponse(response) {
  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    let errorMessage = '';

    if (data) {
      if (data.details) {
        if (typeof data.details === 'object') {
          errorMessage = Object.values(data.details).join(', ');
        } else {
          errorMessage = String(data.details);
        }
      } else if (data.error) {
        errorMessage = data.error;
      } else if (data.message) {
        errorMessage = data.message;
      }
    }

    if (!errorMessage) {
      switch (response.status) {
        case 404:
          errorMessage = `Resource not found (404) at ${response.url}`;
          break;
        case 500:
          errorMessage = 'Internal server error (500). Please check backend server logs.';
          break;
        case 401:
          errorMessage = 'Unauthorized (401). Please check your credentials or log in again.';
          break;
        case 403:
          errorMessage = 'Forbidden (403). You do not have permission to access this resource.';
          break;
        case 400:
          errorMessage = 'Bad request (400). Please verify the submitted data.';
          break;
        case 415:
          errorMessage = 'Unsupported Media Type (415). Content-Type must be application/json.';
          break;
        default:
          errorMessage = `HTTP error ${response.status}: ${response.statusText || 'Operation failed'}`;
      }
    }

    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

/**
 * Robust fetch wrapper that attempts direct connection to http://localhost:3000,
 * and if blocked by browser CORS/network policy, attempts Vite dev server proxy fallback.
 */
async function apiRequest(endpoint, options = {}) {
  // 1. Try direct connection to backend URL
  try {
    const directUrl = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(directUrl, options);
    return await handleResponse(response);
  } catch (err) {
    // If it's an HTTP error (404, 500, 403, etc.), throw it directly
    if (err.status) {
      throw err;
    }

    // If it's a browser network/CORS error (TypeError), try proxy fallback via relative URL
    if (err.name === 'TypeError' && typeof window !== 'undefined') {
      try {
        const fallbackResponse = await fetch(endpoint, options);
        return await handleResponse(fallbackResponse);
      } catch (fallbackErr) {
        if (fallbackErr.status) {
          throw fallbackErr;
        }
      }
    }

    // Both direct and fallback failed due to connection failure
    throw new Error(
      'Unable to connect to backend server. Please verify backend is running on http://localhost:3000.',
      { cause: err }
    );
  }
}

/* ==========================================================================
   Tasks CRUD & Reporting Endpoints
   ========================================================================== */

/**
 * GET /tasks — Fetch tasks with optional filters
 * @param {Object} params - { status, priority, search, startDate, endDate }
 * @returns {Promise<Array>} List of task documents
 */
export async function getTasks(params = {}) {
  const query = new URLSearchParams();
  if (params.status && params.status !== 'all') query.append('status', params.status);
  if (params.priority && params.priority !== 'all') query.append('priority', params.priority);
  if (params.search && params.search.trim()) query.append('search', params.search.trim());
  if (params.startDate) query.append('startDate', params.startDate);
  if (params.endDate) query.append('endDate', params.endDate);

  const queryString = query.toString() ? `?${query.toString()}` : '';

  return await apiRequest(`/tasks${queryString}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      ...getAuthHeader()
    }
  });
}

/**
 * GET /tasks/reports — Fetch admin date-range task report & analytics
 * @param {Object} params - { startDate, endDate, priority, status }
 * @returns {Promise<Object>} Aggregated analytics report
 */
export async function getTaskReports(params = {}) {
  const query = new URLSearchParams();
  if (params.startDate) query.append('startDate', params.startDate);
  if (params.endDate) query.append('endDate', params.endDate);
  if (params.priority && params.priority !== 'all') query.append('priority', params.priority);
  if (params.status && params.status !== 'all') query.append('status', params.status);

  const queryString = query.toString() ? `?${query.toString()}` : '';

  return await apiRequest(`/tasks/reports${queryString}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      ...getAuthHeader()
    }
  });
}

/**
 * POST /tasks — Create a new task in MongoDB
 * @param {Object} task - { title, description, completed, priority, dueDate }
 * @returns {Promise<Object>} Created task document
 */
export async function createTask(task) {
  return await apiRequest('/tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify(task)
  });
}

/**
 * PUT /tasks/:id — Update a task in MongoDB
 * @param {string} id - Task ObjectId
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated task document
 */
export async function updateTask(id, updates) {
  return await apiRequest(`/tasks/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify(updates)
  });
}

/**
 * DELETE /tasks/:id — Delete a task from MongoDB
 * @param {string} id - Task ObjectId
 * @returns {Promise<Object>} Response confirmation
 */
export async function deleteTask(id) {
  return await apiRequest(`/tasks/${id}`, {
    method: 'DELETE',
    headers: {
      'Accept': 'application/json',
      ...getAuthHeader()
    }
  });
}

/* ==========================================================================
   Workflow Rules Endpoints
   ========================================================================== */

/**
 * GET /rules — Fetch all workflow rules
 */
export async function getWorkflowRules() {
  return await apiRequest('/rules', {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      ...getAuthHeader()
    }
  });
}

/**
 * POST /rules — Create a new workflow rule
 */
export async function createWorkflowRule(rule) {
  return await apiRequest('/rules', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify(rule)
  });
}

/**
 * PUT /rules/:id — Update a workflow rule (e.g. toggle active)
 */
export async function updateWorkflowRule(id, updates) {
  return await apiRequest(`/rules/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify(updates)
  });
}

/**
 * DELETE /rules/:id — Delete a workflow rule
 */
export async function deleteWorkflowRule(id) {
  return await apiRequest(`/rules/${id}`, {
    method: 'DELETE',
    headers: {
      'Accept': 'application/json',
      ...getAuthHeader()
    }
  });
}

/* ==========================================================================
   Authentication Endpoints
   ========================================================================== */

/**
 * POST /auth/signup — Register new user
 * @param {Object} userData - { name, email, password, adminCode }
 */
export async function signupUser(userData) {
  return await apiRequest('/auth/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(userData)
  });
}

/**
 * POST /auth/login — Login existing user
 * @param {Object} credentials - { email, password }
 */
export async function loginUser(credentials) {
  return await apiRequest('/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(credentials)
  });
}

/**
 * GET /auth/me — Get authenticated profile
 */
export async function getCurrentUser() {
  return await apiRequest('/auth/me', {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      ...getAuthHeader()
    }
  });
}

export { API_BASE_URL };
