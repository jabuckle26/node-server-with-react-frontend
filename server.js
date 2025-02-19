const express = require('express');
const connectDB = require('./config/db');

const app = express();
connectDB();

//Init Middleware
// This line lets us get the data in the routes
app.use(express.json({extended: false}));

app.get('/', (req, res)=>res.send('API running'));

//Define Routes
app.use('/api/users', require('./routes/api/users'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/profile', require('./routes/api/profile'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=> console.log(`Server started on port ${PORT}`));
