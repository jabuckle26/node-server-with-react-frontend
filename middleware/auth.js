const jwt = require('jsonwebtoken');
const config = require('config');

//As this is a middleware function - it needs three parameters
//A middleware function is a function that has access to the request/response cycle. Next is a callback we run to know we're done
module.exports = function(req, res, next) {
    //get token from the header
    const token = req.header('x-auth-token');

    //Check if no token
    if(!token) {
        return res.status(401).json({ msg: 'No token -authororisation dennied GURRL' });
    }

    //Verify token
    try {
        //We need to pass our JWT secret from config to be able to decode the token.
        const decoded = jwt.verify(token, config.get('jwtSecret'));
        req.user = decoded.user;
        next() //we always call next in a middleware function
    }
    catch(err) {
        res.status(401).json({ msg: 'Token not valid gurrl'});
    }

}