const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const userauthRoutes = require('./Router/userauth');
const OrgauthRoutes = require("./Router/orgauth");

dotenv.config();

const PORT = 8081;
const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use('/userauth', userauthRoutes);
app.use('/org-auth', OrgauthRoutes);

const MONGOURI = process.env.MONGO_URI;


mongoose.connect(MONGOURI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Start the server
app.listen(PORT, () => {
    console.log("Server is running on Port", PORT);
});
