const mongoose = require('mongoose');
const winston = require('./winston');

const connectDB = async () => {
	try {
		await mongoose.connect(process.env.DB_URL, {
			useNewUrlParser: true,
			useCreateIndex: true,
			useFindAndModify: false,
			useUnifiedTopology: true
		});

		winston.info('MongoDB Connected...');
	} catch (err) {
		winston.error('Error connecting to MongoDB', err);
		// Exit process with failure
		process.exit(1);
	}
};

module.exports = connectDB;