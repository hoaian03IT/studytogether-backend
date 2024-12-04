const schedule = require("node-schedule");
const Queue = require("bull");
const { transporter: nodemailerTransporter } = require("../../config/nodemailer");
const { pool } = require("../../connectDB"); // Job Queue
const Redis = require("ioredis");


class ReminderController {
	constructor(config) {
		this.redis = new Redis({
			host: "localhost",
			port: 6379,
			maxRetriesPerRequest: 50, // Increased retry limit
			connectTimeout: 10000,    // 10-second connection timeout
			retryStrategy: (times) => {
				return Math.min(times * 50, 2000);
			},
		});

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
			const currentDay = new Date().toISOString().split("T")[0];
			const responseSql = await conn.query("CALL SP_BatchUsers(?, ?, ?)", [limit, offset, currentDay]);
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
				const job = this.emailQueue.add({ email: user?.email, currentStreak: user?.["current streak"] });
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

			const { email, currentStreak } = job.data;

			const mailOptions = {
				from: {
					name: "StudyTogether😊",
					address: process.env.NODEMAILER_USER,
				}, // sender address
				to: email, // list of receivers
				subject: "Keep your streak 🔥🔥", // Subject line
				text: "Hello, guys. We are waiting you to learn new words", // plain text body
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
		let offset = 1;
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
		schedule.scheduleJob("0 12 * * *", async () => {
			console.log("Starting daily reminder job...");
			await this.processAllUsers();
		});
	}
}

module.exports = { ReminderController };