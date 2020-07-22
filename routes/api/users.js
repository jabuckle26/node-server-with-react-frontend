const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const User = require('../../models/User');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const config = require('config');

// @route (the request type (POST) and endpoint (api/users))
// @desc    Register User
// @access  Public (therefore we don't need a token)
router.post('/',
    [
        check('name', 'Name is required').not().isEmpty(),
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Please enter a password > 6 characters').isLength({ min: 6 })
    ],
    async (req, res) => {
        console.log('HERE');
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()})
        }

        const {name, email, password} = req.body;

        try {
            //see if user exits
            let user = await User.findOne({email}); //can say {email} object here rather than {'email':'email'} here because we've used the const line above
            if(user) {
                return res.status(400).json({ errors: [{msg: 'User already exists gurrl'}]});
            }
            //get the users gravitar
            const avatar = gravatar.url(email, {
                s: '200', //size
                r: 'pg', //rating
                d: 'mm' //default (code)
            });

            user = new User({
                name,
                email,
                avatar,
                password
            });

            //encrypt the password using vcrpyt
            const salt = await bcrypt.genSalt(10); //the more you have here, the slower but more secure
            user.password = await bcrypt.hash(password, salt);
            await user.save();
    
            //return jsonwebtoken
            // res.send('User registered');
            const payload = {
                user: {
                    id: user.id
                }
            }

            jwt.sign(
                payload, 
                config.get('jwtSecret'),
                {expiresIn: 360000},
                (err, token) => {
                    if (err) {
                        throw err;
                    } else {
                        res.json({token});
                    }
                });
            
        } catch(err){
            console.error(err.message);
            res.status(500).send('Server Error gurrl');
        }

    });

module.exports = router;