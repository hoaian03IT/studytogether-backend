// import { Queue } from "bull";
// import Redis from "ioredis";
// import { transporter } from "../../config/nodemailer";
//
// // Interfaces for type safety
// // interface UserLearningProgress {
// // 	userId: string;
// // 	lastLessonDate: Date;
// // 	dailyGoalStreak: number;
// // 	emailPreferences: {
// // 		enableReminders: boolean;
// // 		emailAddress: string;
// // 	};
// // }
//
// class ReminderService {
// 	// private reminderQueue;
// 	// private redisClient;
// 	// private emailTransporter;
//
// 	constructor() {
// 		// Initialize Redis for distributed caching and queue management
// 		this.redisClient = new Redis({
// 			host: process.env.REDIS_HOST,
// 			port: parseInt(process.env.REDIS_PORT || "6379"),
// 		});
//
// 		// Initialize Bull queue for asynchronous reminder processing
// 		this.reminderQueue = new Queue("user-reminders", {
// 			redis: {
// 				host: process.env.REDIS_HOST,
// 				port: parseInt(process.env.REDIS_PORT || "6379"),
// 			},
// 		});
//
// 		// Set up Nodemailer transporter with SMTP configuration
// 		this.emailTransporter = transporter;
//
// 		// Start processing reminder jobs
// 		this.initializeReminderProcessing();
// 	}
//
// 	// Method to schedule reminder checks
// 	async scheduleReminderCheck(user) {
// 		// Use distributed lock to prevent duplicate processing
// 		const lockKey = `reminder-lock:${user.userId}`;
// 		const lockTTL = 5 * 60; // 5 minutes
//
// 		try {
// 			const lockAcquired = await this.redisClient.set(
// 				lockKey,
// 				"locked",
// 				"NX",
// 				"EX",
// 				lockTTL,
// 			);
//
// 			if (lockAcquired) {
// 				// Add reminder check job to queue
// 				await this.reminderQueue.add({
// 					userId: user.userId,
// 					emailAddress: user.emailPreferences.emailAddress,
// 					lastLessonDate: user.lastLessonDate,
// 				}, {
// 					// Configure job options for retry and rate limiting
// 					attempts: 3,
// 					backoff: {
// 						type: "exponential",
// 						delay: 1000,
// 					},
// 					// Prevent overwhelming the system
// 					rate: 10, // max 10 jobs per second
// 				});
// 			}
// 		} catch (error) {
// 			console.error("Error scheduling reminder:", error);
// 		}
// 	}
//
// 	// Background job processing method
// 	initializeReminderProcessing() {
// 		this.reminderQueue.process(async (job) => {
// 			const { userId, emailAddress, lastLessonDate } = job.data;
//
// 			// Check if user hasn't learned in last 24 hours
// 			const hoursSinceLastLesson = this.calculateHoursSinceLastLesson(lastLessonDate);
//
// 			if (hoursSinceLastLesson >= 24) {
// 				await this.sendReminderEmail(emailAddress, userId);
// 			}
// 		});
// 	}
//
// 	// Calculate hours since last lesson
// 	private calculateHoursSinceLastLesson(lastLessonDate: Date): number {
// 		const now = new Date();
// 		const diffMs = now.getTime() - lastLessonDate.getTime();
// 		return diffMs / (1000 * 60 * 60);
// 	}
//
// 	// Send reminder email
// 	private async sendReminderEmail(emailAddress: string, userId: string) {
// 		try {
// 			const mailOptions = {
// 				from: process.env.EMAIL_FROM || "reminders@yourlearningapp.com",
// 				to: emailAddress,
// 				subject: "Keep Your Learning Streak Alive!",
// 				html: `
//           <h1>Don't Break Your Learning Streak!</h1>
//           <p>Hey there! It looks like you've missed a day of learning.
//           Jump back in and keep your progress going!</p>
//           <a href="https://yourapp.com/continue-learning/${userId}">Continue Learning</a>
//         `,
// 			};
//
// 			// Send email
// 			const info = await this.emailTransporter.sendMail(mailOptions);
// 			console.log(`Reminder sent to user ${userId}. Message ID: ${info.messageId}`);
// 		} catch (error) {
// 			console.error("Email sending failed:", error);
// 		}
// 	}
//
// 	// Additional method to clean up old reminder jobs
// 	async cleanupOldReminderJobs() {
// 		const completedJobs = await this.reminderQueue.getCompleted();
//
// 		// Remove jobs older than 24 hours
// 		for (const job of completedJobs) {
// 			if (job.timestamp < Date.now() - 24 * 60 * 60 * 1000) {
// 				await job.remove();
// 			}
// 		}
// 	}
//
// 	// Verify email transporter connection
// 	async verifyEmailConnection() {
// 		try {
// 			await this.emailTransporter.verify();
// 			console.log("Email transporter is ready to send emails");
// 		} catch (error) {
// 			console.error("Email transporter verification failed:", error);
// 		}
// 	}
// }
//
// export default ReminderService;