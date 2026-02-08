const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db.js');

// Import Routes
const userRoutes = require('./routes/userRoutes');
const courseRoutes = require('./routes/courseRoutes');
const admissionRoutes = require('./routes/admissionRoutes');
const paymentRoutes = require('./routes/paymentRoutes'); // <--- এই লাইনটি চেক করুন
const dashboardRoutes = require('./routes/dashboardRoutes'); // Import
const classRoutes = require('./routes/classRoutes'); // Import
const productRoutes = require('./routes/productRoutes'); // Import
const uploadRoutes = require('./routes/uploadRoutes'); // Import

// Load env vars
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

// Mount Routes
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/admissions', admissionRoutes);
app.use('/api/payments', paymentRoutes); // <--- এই লাইনটি চেক করুন
app.use('/api/dashboard', dashboardRoutes); // Mount dashboard routes
app.use('/api/classes', classRoutes); // Mount class routes
app.use('/api/products', productRoutes); // Mount product routes
app.use('/api/upload', uploadRoutes); // Mount upload routes

// Basic Route
app.get('/', (req, res) => {
    res.send('TCTC Backend API is Running...');
});

// Error Handler
app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});