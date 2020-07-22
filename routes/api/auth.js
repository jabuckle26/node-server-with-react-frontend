const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const auth = require('../../middleware/auth');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');
const User = require('../../models/User');

// @route (the request type (GET) and endpoint (api/auth))
// @desc    Test route
// @access  Public (therefore we don't need a token)
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route (the request type (POST) and endpoint (api/auth))
// @desc    Authenticate user and get token - purpose of route is to get token so we can make requests to private routes
// @access  Public (therefore we don't need a token)
router.post('/',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { email, password } = req.body;

    try {
      //see if user exits
      //Note its good practice to use same error message for email and password ie (Invalid Credentials) to prevent hacker knowing if one is correct! using different here for debuging
      let user = await User.findOne({ email }); //can say {email} object here rather than {'email':'email'} here because we've used the const line above
      if (!user) {
        return res.status(400).json({ errors: [{ msg: 'No user with those credentials.' }] });
      }

      //Use bcrypt to compare encrypted (from user we got in response) and plain text password (password inputed)
      //compare returns a promise
      const isMatch = await bcrypt.compare(password, user.password);
      if(!isMatch) {
        return res.status(400).json({ errors: [{ msg: 'Invalid password.' }] });
      }

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
        { expiresIn: 360000 },
        (err, token) => {
          if (err) {
            throw err;
          } else {
            res.json({ token });
          }
        });

    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error.');
    }

  });

module.exports = router;