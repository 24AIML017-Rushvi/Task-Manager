const cache = require('../utils/cache');
const validateJson = require('../middleware/validateJson');
const notFound = require('../middleware/notFound');
const Task = require('../models/Task');

describe('Task Manager Automated Unit Tests (Practical 12)', () => {

  // 1. In-Memory Cache Tests (Practical 9 Module)
  describe('Cache Utility Module', () => {
    beforeEach(() => {
      cache.flush();
    });

    test('should correctly set and get an item from cache', () => {
      cache.set('test-key', { message: 'hello world' });
      const cachedData = cache.get('test-key');
      expect(cachedData).toBeDefined();
      expect(cachedData.message).toBe('hello world');
    });

    test('should return undefined for a nonexistent key', () => {
      const nonExistent = cache.get('non-existent-key');
      expect(nonExistent).toBeUndefined();
    });

    test('should delete an item from cache', () => {
      cache.set('item-to-delete', 12345);
      cache.del('item-to-delete');
      expect(cache.get('item-to-delete')).toBeUndefined();
    });
  });

  // 2. Middleware Tests (Content-Type & 404 Handlers)
  describe('Middleware Validation', () => {
    test('validateJson: should return 415 if POST request has missing/invalid Content-Type', () => {
      const req = {
        method: 'POST',
        headers: {}
      };
      const res = {
        statusCode: null,
        jsonData: null,
        status(code) {
          this.statusCode = code;
          return this;
        },
        json(data) {
          this.jsonData = data;
          return this;
        }
      };
      let nextCalled = false;
      const next = () => { nextCalled = true; };

      validateJson(req, res, next);

      expect(res.statusCode).toBe(415);
      expect(res.jsonData.error).toContain('Unsupported Media Type');
      expect(nextCalled).toBe(false);
    });

    test('validateJson: should call next() if POST request has application/json Content-Type', () => {
      const req = {
        method: 'POST',
        headers: { 'content-type': 'application/json' }
      };
      const res = {};
      let nextCalled = false;
      const next = () => { nextCalled = true; };

      validateJson(req, res, next);

      expect(nextCalled).toBe(true);
    });

    test('notFound: should return 404 with proper error response structure', () => {
      const req = {
        method: 'GET',
        originalUrl: '/api/invalid-route'
      };
      const res = {
        statusCode: null,
        jsonData: null,
        status(code) {
          this.statusCode = code;
          return this;
        },
        json(data) {
          this.jsonData = data;
          return this;
        }
      };
      const next = () => {};

      notFound(req, res, next);

      expect(res.statusCode).toBe(404);
      expect(res.jsonData.success).toBe(false);
      expect(res.jsonData.message).toBe('Route Not Found');
    });
  });

  // 3. Task Model Schema Validation Tests
  describe('Task Mongoose Model Validation', () => {
    test('should fail validation when task title is missing', async () => {
      const taskWithoutTitle = new Task({
        description: 'Testing without title'
      });

      let validationError = null;
      try {
        await taskWithoutTitle.validate();
      } catch (err) {
        validationError = err;
      }

      expect(validationError).not.toBeNull();
      expect(validationError.errors.title).toBeDefined();
      expect(validationError.errors.title.message).toBe('Title is required');
    });

    test('should pass validation and set default values when valid title is provided', async () => {
      const validTask = new Task({
        title: 'Complete Practical 12 CI/CD'
      });

      let validationError = null;
      try {
        await validTask.validate();
      } catch (err) {
        validationError = err;
      }

      expect(validationError).toBeNull();
      expect(validTask.completed).toBe(false);
      expect(validTask.priority).toBe('medium');
    });
  });

});
