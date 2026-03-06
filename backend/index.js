const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/packages', require('./routes/packageRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));

// Start Server
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

module.exports = app;
