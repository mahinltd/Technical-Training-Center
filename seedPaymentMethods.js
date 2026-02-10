const mongoose = require('mongoose');
const dotenv = require('dotenv');
const PaymentMethod = require('./models/PaymentMethod'); // Path ঠিক আছে কিনা দেখবেন

dotenv.config();

// Connect to DB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected...'))
    .catch(err => console.log(err));

const methods = [
    {
        methodName: "bKash",
        number: "01956181848", // আপনার আসল নম্বর দিন
        accountType: "Personal",
        isActive: true
    },
    {
        methodName: "Nagad",
        number: "01956181848", // আপনার আসল নম্বর দিন
        accountType: "Personal",
        isActive: true
    },
    {
        methodName: "Rocket",
        number: "01956181848", // আপনার আসল নম্বর দিন
        accountType: "Personal",
        isActive: true
    }
];

const seedDB = async () => {
    try {
        await PaymentMethod.deleteMany({}); // আগের সব মেথড মুছে ফেলবে
        await PaymentMethod.insertMany(methods);
        console.log("✅ Payment Methods Added Successfully!");
    } catch (error) {
        console.error("Error:", error);
    } finally {
        mongoose.connection.close();
    }
};

seedDB();