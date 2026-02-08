const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Course = require('./models/Course'); // নিশ্চিত হোন path ঠিক আছে

dotenv.config();

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected...'))
    .catch(err => console.log(err));

const courses = [
    // 1. Office Application (Govt)
    {
        title: "Office Application (Govt)",
        titleBn: "অফিস অ্যাপ্লিকেশন (সরকারি)",
        description: "BTEB Certified Government Course. Includes MS Word, Excel, PowerPoint, Access & Internet.",
        descriptionBn: "কারিগরি শিক্ষা বোর্ড অনুমোদিত ৬ মাস মেয়াদী সরকারি কোর্স।",
        type: "Govt",
        fee: 4500,
        duration: "6 Months",
        isActive: true,
        iconName: "Monitor"
    },
    // 2. Office Application (Private)
    {
        title: "Office Application (Private)",
        titleBn: "অফিস অ্যাপ্লিকেশন (প্রাইভেট)",
        description: "Short course for quick learning. Includes basic office tools for job preparation.",
        descriptionBn: "চাকরির প্রস্তুতির জন্য ৩ মাস মেয়াদী প্রাইভেট শর্ট কোর্স।",
        type: "Private",
        fee: 3000,
        duration: "3 Months",
        isActive: true,
        iconName: "Monitor"
    },
    // 3. AutoCAD (Govt)
    {
        title: "AutoCAD 2D & 3D (Govt)",
        titleBn: "অটোক্যাড 2D ও 3D (সরকারি)",
        description: "BTEB Certified Government Course for Civil/Architecture/Mechanical designs.",
        descriptionBn: "কারিগরি শিক্ষা বোর্ড অনুমোদিত ৬ মাস মেয়াদী প্রফেশনাল অটোক্যাড কোর্স।",
        type: "Govt",
        fee: 5000, // আপনি চাইলে পরিবর্তন করতে পারেন
        duration: "6 Months",
        isActive: true,
        iconName: "DraftingCompass" // আইকন নাম ফ্রন্টএন্ডে হ্যান্ডেল করা হবে
    },
    // 4. AutoCAD (Private)
    {
        title: "AutoCAD 2D & 3D (Private)",
        titleBn: "অটোক্যাড 2D ও 3D (প্রাইভেট)",
        description: "Intensive private course for learning architectural drafting quickly.",
        descriptionBn: "৩ মাস মেয়াদী প্রাইভেট অটোক্যাড কোর্স।",
        type: "Private",
        fee: 3500, // আপনি চাইলে পরিবর্তন করতে পারেন
        duration: "3 Months",
        isActive: true,
        iconName: "DraftingCompass"
    },
    // 5. Graphics Design (Private)
    {
        title: "Graphics Design & Freelancing",
        titleBn: "গ্রাফিক্স ডিজাইন ও ফ্রিল্যান্সিং",
        description: "Professional Graphics Design course with Freelancing guidelines. Coaching Center Certified.",
        descriptionBn: "কোচিং সেন্টার প্রদত্ত সার্টিফিকেট সহ ৬ মাস মেয়াদী কোর্স।",
        type: "Private",
        fee: 6000,
        duration: "6 Months",
        isActive: true,
        iconName: "Palette"
    }
];

const seedDB = async () => {
    try {
        await Course.deleteMany({}); // আগের সব ডাটা ক্লিয়ার করবে
        await Course.insertMany(courses); // নতুন ৫টি কোর্স অ্যাড করবে
        console.log("✅ 5 Courses (Office, AutoCAD, Graphics) Added Successfully!");
    } catch (error) {
        console.error("Error seeding database:", error);
    } finally {
        mongoose.connection.close();
    }
};

seedDB();