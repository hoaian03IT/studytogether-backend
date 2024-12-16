const schedule = require("node-schedule");
const Queue = require("bull");
const { transporter: nodemailerTransporter } = require("../../config/nodemailer");
const { pool } = require("../../db/connectDB.js"); // Job Queue
const { NotificationController } = require("./notification.controller");
const { CommonHelpers } = require("../helpers/commons");
const { redisConfig } = require("../../redis/config.js");

class ReminderController {
	constructor(config) {
		this.redis = redisConfig;

		// Email transporter setup
		this.transporter = nodemailerTransporter;

		// Job queue setup
		this.emailQueue = new Queue("emailQueue", { redis: this.redis });

		// Batch size for user processing
		this.batchSize = config?.batchSize || 100;

		// Setup email queue processor
		this.setupQueueProcessor();

		// Schedule the reminder job
		this.scheduleReminderJob();
	}

	/**
	 * Fetch a batch of users from the database
	 * @param {number} offset - Start index for pagination
	 * @param {number} limit - Number of users per batch
	 * @returns {Promise<Array>} - Batch of users
	 */
	async fetchUsersBatch(offset, limit) {
		let conn;
		try {
			conn = await pool.getConnection();
			const currentDay = new Date();
			const responseSql = await conn.query("CALL SP_BatchUsers(?, ?, ?)", [
				limit,
				offset,
				`${currentDay.getFullYear()}-${currentDay.getMonth() + 1}-${currentDay.getDate()}`,
			]);

			return responseSql[0][0];
		} catch (error) {
			console.error(error);
		} finally {
			if (conn) await pool.releaseConnection(conn);
		}
	}

	/**
	 * Add email jobs to the queue
	 * @param {Array} users - List of users to email
	 */
	addEmailJobs(users) {
		console.log(`Adding ${users?.length} users to email queue`);
		users.forEach((user, index) => {
			try {
				const job = this.emailQueue.add({
					email: user?.email,
					currentStreak: user?.["current streak"],
					userId: user?.["user id"],
					callReturn: user?.["call return"],
				});
				console.log(`Job ${index + 1}: Added email job for ${user?.email}`);
			} catch (error) {
				console.error(`Failed to add job for user ${user?.email}:`, error);
			}
		});
	}

	/**
	 * Process email queue
	 */
	setupQueueProcessor() {
		this.emailQueue.process(async (job, done) => {
			console.log("Full job object:", JSON.stringify(job, null, 2));
			console.log("Job data type:", typeof job.data);
			console.log("Job data content:", job.data);

			const { email, currentStreak, userId, callReturn } = job.data;

			const mailOptions = callReturn
				? {
						from: {
							name: "StudyTogether😊",
							address: process.env.NODEMAILER_USER,
						}, // sender address
						to: email, // list of receivers
						subject: "We've missed you on StudyTogether!🥹🥹", // Subject line
						text: "We've been missing your participation in our learning community. Your goals are waiting for you - let's get back on track!", // plain text body
						html: `
						<!DOCTYPE html>
						<html lang="en">
						<head>
							<meta charset="UTF-8">
							<style>
								body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5; }
								.container { background-color: rgba(0, 0, 0, 0.1); border-radius: 5px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); padding: 30px; max-width: 500px}
								.header { text-align: center; margin-bottom: 30px; }
								.header h1 { color: #333; font-size: 28px; }
								.content { line-height: 1.6; color: #555; text-align: center}
								.cta { text-align: center; margin-top: 30px; }
								.cta a { display: inline-block; background-color: #4CAF50; color: white; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-size: 16px; transition: background-color 0.3s; }
								.cta a:hover { background-color: #3e8e41; }
							</style>
						</head>
						<body>
							<div class="container">
								<div class="header">
									<h1>We've Missed You on StudyTogether!</h1>
								</div>
								<div class="content">
									<p>Long time no see, my friend! We've been waiting for you to come back and explore all the new courses and features we've added to StudyTogether.</p>
									<p>Our community of learners is here to support you and help you reach your goals. Open the app to get started - there's so much waiting for you!</p>
								</div>
								<div class="cta">
									<a href="${process.env.CLIENT_URL}/list-course">Open StudyTogether</a>
								</div>
							</div>
						</body>
						</html>
                        `, // html body
				  }
				: {
						from: {
							name: "StudyTogether😊",
							address: process.env.NODEMAILER_USER,
						}, // sender address
						to: email, // list of receivers
						subject: "Keep your streak 🔥🔥", // Subject line
						text: "Hello, my friend. We are waiting you for you to learn new words", // plain text body
						html: `
						<!DOCTYPE html>
						<html lang="en">
						<head>
						<meta charset="UTF-8">
						<style>
						body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; text-align: center; }
						.streak-container { background-color: #f0f4f8; padding: 20px; border-radius: 10px; }
						.streak-number { font-size: 48px; color: #4CAF50; font-weight: bold; }
						.motivational-text { color: #333; font-size: 18px; margin: 15px 0; }
						.action-button { 
							display: inline-block; 
							background-color: #4CAF50; 
							color: white; 
							padding: 10px 20px; 
							text-decoration: none; 
							border-radius: 5px; 
							margin: 15px 0;
							}
						</style>
						</head>
						<body>
						<div class="streak-container">
						<h1>Don't Break Your StudyTogether Streak! 🔥</h1>
						<div class="streak-number">${currentStreak > 1 ? currentStreak + " Days" : currentStreak + " Day"}</div>
						<p class="motivational-text">You're on a roll! Keep learning and growing with StudyTogether.</p>
						<a href="${process.env.CLIENT_URL}" class="action-button">Go to Website now!</a>
						<p>Your daily commitment is making a difference!</p>
						</div>
						</body>
						</html>
                        `, // html body
				  };

			try {
				await this.transporter.sendMail(mailOptions);
				await NotificationController.createNotificationStreak(userId, currentStreak);
				console.log(`Reminder sent to ${email} with streak ${currentStreak}`);
				done();
			} catch (error) {
				console.error(`Failed to send email to ${email} with streak ${currentStreak}:`, error);
				done(error);
			}
		});
	}

	/**
	 * Process all users in batches
	 */
	async processAllUsers() {
		let offset = 0;
		let users;

		do {
			users = await this.fetchUsersBatch(offset, this.batchSize);
			if (users.length > 0) {
				console.log(`Processing batch starting at offset ${offset}`);
				this.addEmailJobs(users);
				offset += this.batchSize;
			}
		} while (users.length > 0);

		console.log("All users have been queued for reminders.");
	}

	/**
	 * Schedule the reminder job
	 * cron expression 0 12 * * *
	 * 					minute (0)
	 * 					hour (12) = 12 am
	 * 					day of month (*)
	 * 					month (*)
	 * 					year (*)
	 */
	scheduleReminderJob() {
		schedule.scheduleJob("05 10 * * *", async () => {
			console.log("Starting daily reminder job...");
			await this.processAllUsers();
		});
		// lich reset streak ve 0 neu nhu day > 1
		schedule.scheduleJob("0 0 * * *", async () => {
			let conn;
			try {
				conn = await pool.getConnection();
				const currentDay = new Date();
				await conn.query("CALL SP_ResetStreak(?)", [`${currentDay.getFullYear()}-${currentDay.getMonth() + 1}-${currentDay.getDate()}`]);
			} catch (error) {
				console.error(error);
			} finally {
				await CommonHelpers.safeRelease(pool, conn);
			}
		});
	}
}

module.exports = { ReminderController };
