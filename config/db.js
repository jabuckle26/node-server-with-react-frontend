const mongoose = require('mongoose');
const config = require('config');

const db = config.get('mongoURI');


const connectDB = async () => {
    try {
        await mongoose.connect(db,{
            useNewURLParser: true,
            useCreateIndex: true
        });
        console.log('MongoDB is connected......');
    } catch(err) {
        console.error(err.message);
        //exit the process with a failure error
        process.exit(1);
    }
}

module.exports = connectDB;