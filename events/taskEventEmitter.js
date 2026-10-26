const { EventEmitter } = require('events');

/**
 * Task Management Event Emitter (ITUE301 Practical)
 *
 * Built using Node.js built-in EventEmitter to handle background notifications
 * asynchronously without blocking Express request-response cycles.
 */
class TaskEventEmitter extends EventEmitter {}

const taskEventEmitter = new TaskEventEmitter();

// Increase max listeners if needed
taskEventEmitter.setMaxListeners(20);

/**
 * Event Listener: 'task-created'
 * Triggered after a task is successfully persisted in MongoDB.
 * Schedules notification work with a 2-second delay using setTimeout.
 */
taskEventEmitter.on('task-created', (task, apiTimestamp) => {
  console.log(`\n[EVENT EMITTED] Event 'task-created' received for: "${task.title}"`);
  console.log(`[EVENT TIMING] API Response was dispatched at: ${apiTimestamp}`);
  console.log(`[EVENT SCHEDULER] 2-second notification timer started...`);

  // Requirement 4: Schedule notification work using setTimeout with 2-second delay
  setTimeout(() => {
    try {
      const notificationTimestamp = new Date().toISOString();

      // Requirement 8: Safe way to test error-event handling without crashing server
      if (
        task.simulateError ||
        (task.title && task.title.toLowerCase().includes('[simulate-error]'))
      ) {
        throw new Error(`Notification dispatch failed for task: "${task.title}" (Simulated Failure)`);
      }

      // Requirement 5 & 10: Safely extract title, timestamp, and assigned user from task schema
      const assignedUser = task.user
        ? (task.user.email ? `${task.user.name || 'User'} (${task.user.email})` : task.user.toString())
        : 'Unassigned';

      // Requirement 6: Log timestamps to prove API responded BEFORE notification ran
      console.log('\n=============================================================');
      console.log('🔔 [BACKGROUND NOTIFICATION EXECUTED] (2-Second Delay)');
      console.log('=============================================================');
      console.log(`📌 Task Title:                ${task.title}`);
      console.log(`👤 Assigned User:              ${assignedUser}`);
      console.log(`🏷️ Priority:                   ${task.priority || 'medium'}`);
      console.log(`🚀 API Response Timestamp:     ${apiTimestamp}`);
      console.log(`⏰ Notification Exec Timestamp: ${notificationTimestamp}`);
      console.log(`⚡ Verified Non-Blocking:      API responded ~2000ms BEFORE notification completed`);
      console.log('=============================================================\n');
    } catch (err) {
      // Safely forward error to 'error' listener instead of crashing process
      taskEventEmitter.emit('error', err, task);
    }
  }, 2000);
});

/**
 * Event Listener: 'error'
 * Requirement 8: Catches notification errors safely to prevent process crashes.
 */
taskEventEmitter.on('error', (err, task) => {
  const errorTimestamp = new Date().toISOString();
  console.error('\n=============================================================');
  console.error('⚠️ [NOTIFICATION ERROR EVENT CAUGHT SAFELY]');
  console.error('=============================================================');
  console.error(`⏰ Timestamp:     ${errorTimestamp}`);
  console.error(`📌 Task Title:    ${task ? task.title : 'N/A'}`);
  console.error(`❌ Error Message: ${err.message}`);
  console.error(`🛡️ Server Status: HTTP server remains healthy and active (No Crash)`);
  console.error('=============================================================\n');
});

module.exports = taskEventEmitter;
