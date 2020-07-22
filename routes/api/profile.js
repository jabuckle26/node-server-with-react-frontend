const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator/check');
const request = require('request');
const config = require('config');
const Profile = require('../../models/Profile');
const User = require('../../models/User');

// @route (the request type (GET) and endpoint (api/profiles/me))
// @desc    Get the current user's profile
// @access  Public (therefore we don't need a token)
router.get('/me', auth, async (req, res) => {
    try {
        //Getting the profile by finding it by the user Id and quering specific fields (on user)
        const profile = await Profile.findOne({ user: req.user.id }).populate('user', ['name', 'avatar']);
        if (!profile) {
            return res.status(400).json({ msg: 'There is no profile for this user GURL' });
        }
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route (the request type (POST) and endpoint (api/profile))
// @desc    Create or update a user profile
// @access  Private (so we need a token)
//Notice we have two middleware here - auth and the checks - Note the use of [ ] to hold both middlewarerouter.post('/', [auth, [
router.post('/',
    [auth,
        [
            check('status', 'Status is required').not().isEmpty(),
            check('skills', 'skills is required').not().isEmpty()
        ]
    ], 
    async (req, res) => {
        const errors = validationResult(req);

        if(!errors.isEmpty()) {
            return res.status(400).json( {errors: errors.array()});
        }

        const {
            company,
            location,
            website,
            bio,
            skills,
            status,
            githubusername,
            youtube,
            twitter,
            instagram,
            linkedin,
            facebook
          } = req.body;

        //Build profile object
        const profileFields = {};
        profileFields.user = req.user.id;
        if(company) profileFields.company = company;
        if(location) profileFields.location = location;
        if(website) profileFields.website = website;
        if(bio) profileFields.bio = bio;
        if(status) profileFields.status = status;
        if(githubusername) profileFields.githubusername = githubusername;
        if(skills) {
            profileFields.skills = skills.split(',').map(skill => skill.trim());
        }
        //Build social object
        profileFields.social = {};
        if (youtube) profileFields.social.youtube = youtube;
        if (twitter) profileFields.social.twitter = twitter;
        if (facebook) profileFields.social.facebook = facebook;
        if (linkedin) profileFields.social.linkedin = linkedin;
        if (instagram) profileFields.social.instagram = instagram;

        try {
            console.log(req.user.id);
            let profile = await Profile.findOne({user:req.user.id});
            console.log(profile);
            if(profile) {
                //Update
                console.log('Updating');
                profile = await Profile.findOneAndUpdate(
                    {user : req.user.id},
                    {$set: profileFields},
                    {new: true}
                    );
                return res.json(profile);
            }
            //Create
            profile = new Profile(profileFields);
            await profile.save();
            return res.json(profile);
        } catch(err) {
            console.error(err.messae);
            res.status(500).send('Server ERROR ');
        }
});


// @route (the request type (GET) and endpoint (api/profile))
// @desc    Get all profiles
// @access  Public
//Notice we have two middleware here - auth and the checks - Note the use of [ ] to hold both middlewarerouter.post('/', [auth, [
router.get('/', async (req, res) => {
    try {
        const profiles = await Profile.find().populate('user', ['name', 'avatar']);
        res.json(profiles);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('SERVER ERROR GURL');
    }
});

// @route (the request type (GET) and endpoint (api/profile/user/:user_id))
// @desc    Get profile by user Id
// @access  Public
//Notice we have two middleware here - auth and the checks - Note the use of [ ] to hold both middlewarerouter.post('/', [auth, [
    router.get('/user/:user_id', async (req, res) => {
        try {
            const profile = await Profile.findOne({ user: req.params.user_id }).populate('user', ['name', 'avatar']); //accessing request params in findOne due to :
            if(!profile) {
                return res.status(400).json({msg: 'Profile not found.....'})
            }
            res.json(profile);
        } catch (err) {
            console.error(err.message);
            if (err.kind == 'ObjectId') {
                return res.status(400).json({msg: 'Profile not found...'})
            }
            res.status(500).send('SERVER ERROR GURL');
        }
    });
// @route (the request type (DELETE) and endpoint (api/profile))
// @desc    Delete profile, user and posts
// @access  Private
router.delete('/', auth,  async (req, res) => {
    try {
        // return to this later - remove users posts
        //remove profile
        await Profile.findOneAndRemove({ user: req.user.id });
        //remove user
        await User.findOneAndRemove({ _id: req.user.id });
        
        res.json({msg: 'User deleted'});
    } catch (err) {
        console.error(err.message);
        if (err.kind == 'ObjectId') {
            return res.status(400).json({msg: 'Profile not found...'})
        }
        res.status(500).send('SERVER ERROR GURL');
    }
});

// @route (the request type (PUT) and endpoint (api/profile/experience))
// @desc    Add experience to the profile
// @access  Private
router.put('/experience', [auth, [
    check('title', 'Title is required').not().isEmpty(),
    check('company', 'Company is required').not().isEmpty(),
    check('from', 'From date is required').not().isEmpty()
]], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array()});
    }

    const {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    } = req.body;

    const newExp = {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    }

    try{
        const profile = await Profile.findOne({ user: req.user.id });
        profile.experience.unshift(newExp); //unsift adds to the beginning like push adds to the end
        await profile.save();
        res.json(profile);
    } catch(err) {
        console.log('request was:');
        console.log(req);
        console.error(err.message);
        res.status(500).send('SERVER error gurl');
    }

});

// @route (the request type (Delete) and endpoint (api/profile/experience/:exp_id))
// @desc    Delete experience to the profile
// @access  Private
router.delete('/experience/:exp_id', auth, async (req,res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });

        //get the remove index
        const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id);
        profile.experience.splice(removeIndex,1);
        await profile.save();
        res.json(profile);
    } catch(err) {
        console.error(err.message);
        res.status(500).send('SERVER error gurl');
    }
});

// @route (the request type (PUT) and endpoint (api/profile/education))
// @desc    Add education to the profile
// @access  Private
router.put('/education', [auth, [
    check('school', 'School is required').not().isEmpty(),
    check('degree', 'Degree is required').not().isEmpty(),
    check('fieldofstudy', 'Field of study is required').not().isEmpty(),
    check('from', 'From date is required').not().isEmpty()
]], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array()});
    }

    const {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
    } = req.body;

    const newEducation = {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
    }

    try{
        const profile = await Profile.findOne({ user: req.user.id });
        profile.education.unshift(newEducation); //unsift adds to the beginning like push adds to the end
        await profile.save();
        res.json(profile);
    } catch(err) {
        console.log('request was:');
        console.log(req);
        console.error(err.message);
        res.status(500).send('SERVER error gurl');
    }

});

// @route (the request type (Delete) and endpoint (api/profile/education/:exp_id))
// @desc    Delete eductaion to the profile
// @access  Private
router.delete('/education/:exp_id', auth, async (req,res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });

        //get the remove index
        const removeIndex = profile.education.map(item => item.id).indexOf(req.params.exp_id);
        profile.education.splice(removeIndex,1);
        await profile.save();
        res.json(profile);
    } catch(err) {
        console.error(err.message);
        res.status(500).send('SERVER error gurl');
    }
});

// @route (the request type (GET) and endpoint (api/profile/github/:username))
// @desc    Get user repos from Github
// @access  Public
router.get('/github/:username', async (req, res) => {
    try {
        const options ={
            uri: `http://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${config.get('githubClientId')}&client_secret=${config.get('githubClientSecret')}`,
            method:'GET',
            headers: {'user-agent': 'node.js'}
        };

        request(options, (error, response, body)=> {
            if(error) console.error(error);
            if(response.statusCode != 200) {
                console.log(response.statusCode);
                 return res.status(404).json({msg: 'No Github profile found'});
            }
            res.json(JSON.parse(body));
        });
    } catch(err) {
        console.error(err.message);
        res.status(500).send('Server error gurl');
    }
})
module.exports = router;