const express = require('express');
const router = express.Router();
const User = require('./../models/user');
const {jwtAuthMiddleware, generateToken} = require('./../jwt');

// POST route to add a person
router.post('/signup', async (req,res) => { // async useed bcz we hv a db operation ahead which is gonna take time
    try{
        const data = req.body;  // Assuming the request body contains the person data (parsed)

        // Check if there is already an admin user
        const adminUser = await User.findOne({role: 'admin'});
        if(data.role === 'admin' && adminUser){
            return res.status(400).json({error: 'Admin user already exists.'});
        }

        // Validate Aadhar Card Number must have exactly 12 digits
        if(!/^\d{12}$/.test(data.aadharCardNumber)){
            return res.status(400).json({error: 'Aadhar Card Number must be exactly 12 digits'});
        }

        // Check if a user with the same Aadhar Card Number already exists
        const existingUser = await User.findOne({aadharCardNumber: data.aadharCardNumber});
        if(existingUser){
            return res.status(400).json({error: 'User with the same Aadhar Card Number already exists'});
        }

        // Create a new User document using the Mongoose model
        const newUser = new User(data); 

        // Save the new user to the database
        const response = await newUser.save(); // await - wait until the operation (saving) is performed
        console.log('data saved');

        const payload = {
            id: response.id  // the unique id mongodb gives
        }
        console.log(JSON.stringify(payload));
        const token = generateToken(payload);
        
        res.status(200).json({response: response, token: token});
    }catch(err){  // this block starts executing the moment "response" stores error
        console.error(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
})     

// Login Route
router.post('/login', async(req, res) => {
    try{
        // Extract username and pwd from request body
        const {aadharCardNumber, password} = req.body;

        // Find the user by aadharCardNumber
        const user = await User.findOne({aadharCardNumber: aadharCardNumber});

        // If user does not exist or pwd does not match, return error
        if(!user || !(await user.comparePassword(password))){
            return res.status(401).json({error: 'Invalid username or password'});
        }

        // generate Token
        const payload = {
            id: user.id,
        }
        const token = generateToken(payload);

        // return token as response
        res.json({token});
    }catch(err){
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error'});
    }
});

// Profile Route
router.get('/profile', jwtAuthMiddleware, async (req, res) => {
    try{
        const userData = req.user;   // user key mein decoded data of the user bheja jaata h isiliye usko hi use kr rhe (check jwt file)

        // Extract user id from decoded token
        const userId = userData.id;
        const user = await User.findById(userId);

        res.status(200).json({user});
    }catch(err){
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error'});
    }
})

router.put('/profile/password', jwtAuthMiddleware, async (req,res) => {
    try{
        const userId = req.user.id;            // Extract the id from the token
        const {currentPassword, newPassword} = req.body // Extract current and new pwds from the request body

        // Find the user by userID
        const user = await User.findById(userId);

        // If pwd does not match, return error
        if(!(await user.comparePassword(currentPassword))){
            return res.status(401).json({error: 'Invalid username or password'});
        }

        // Update the user's pwd
        user.password = newPassword;
        await user.save();

        console.log("Password Updated");
        res.status(200).json({message: "Password Updated"});

    }catch(err){
        console.error(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
})



module.exports = router;