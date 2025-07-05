const express = require('express');
const router = express.Router();
const User = require('./../models/user');
const {jwtAuthMiddleware, generateToken} = require('./../jwt');
const Candidate = require('./../models/candidate');

const checkAdminRole = async (userID) => {
    try{
        const user = await User.findById(userID);
        if(user.role === 'admin'){
            return true;
        }
    }catch(err){
        return false;
    }
}

// POST route to add a candidate
router.post('/', jwtAuthMiddleware, async (req,res) => { // async useed bcz we hv a db operation ahead which is gonna take time
    try{
        if(! (await checkAdminRole(req.user.id))){
            return res.status(403).json({message: 'user does not have admin role'});
        }
        const data = req.body;  // Assuming the request body contains the candidate data (parsed)

        // Create a new User document using the Mongoose model
        const newCandidate = new Candidate(data); 

        // Save the new user to the database
        const response = await newCandidate.save(); // await - wait until the operation (saving) is performed
        console.log('data saved');
        res.status(200).json({response: response});
    }catch(err){  // this block starts executing the moment "response" stores error
        console.error(err);
        res.status(500).json({error: 'Internal Server Error'});
    }

})  

// Updation in Candidate details
router.put('/:candidateID', jwtAuthMiddleware, async (req,res) => {
    try{
        if(!checkAdminRole(req.user.id)){
            return res.status(403).json({message: 'user does not have admin role'});
        }
        const candidateID = req.params.candidateID;            // Extract the person's id from the URL parameter
        const updatedCandidateData = req.body;       
        const response = await Candidate.findByIdAndUpdate(candidateID, updatedCandidateData, {
            new: true,
            runValidators: true, 
        });

        // let say the id is invalid
        if(!response){
            return res.status(404).json({error: 'Candidate not found'});
        }

        console.log("Candidate Data Updated");
        res.status(200).json(response);
    }catch(err){  
        console.error(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
})

// Deleting a Candidate
router.delete('/:candidateID', jwtAuthMiddleware, async (req, res) => {
    try{
        if(!checkAdminRole(req.user.id)){
            return res.status(403).json({message: 'user does not have admin role'});
        }
        const candidateID = req.params.candidateID;            // Extract the person's id from the URL parameter

        const response = await Candidate.findByIdAndDelete(candidateID);

        // let say the id is invalid
        if(!response){
            return res.status(404).json({error: 'Candidate not found'});
        }

        console.log("Candidate Deleted");
        res.status(200).json(response);
    }catch(err){  
        console.error(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
})

// let's start voting
router.post('/vote/:candidateID', jwtAuthMiddleware, async (req,res) => { 
    // no admin can vote
    // user can only vote once

    candidateID = req.params.candidateID;
    userID = req.user.id;

    try{
        // Find the Candidate document with the specified candidateID
        const candidate = await Candidate.findById(candidateID);
        if(!candidate){
            return res.status(404).json({message: "Candidate not found"});
        }

        const user = await User.findById(userID);
        if(!user){
            return res.status(404).json({message: "User not found"});
        }
        if(user.isVoted){
            return res.status(400).json({message: "You have already voted"});
        }
        if(user.role == 'admin'){
            return res.status(403).json({message: "Admin is not authorized to vote."});
        }

        // Update the Candidate document to record the vote
        candidate.votes.push({user: userID})
        candidate.voteCount++;
        await candidate.save();

        // Update the user document
        user.isVoted = true
        await user.save();

        return res.status(200).json({message: "Vote recorded Successfully"});
    }catch(err){  
        console.error(err);
        return res.status(500).json({error: 'Internal Server Error'});
    }
})  

// view vote count
router.get('/vote/count', async (req, res) => {
    try{
        // Find all candidates and sort them by voteCount in descending order
        const candidate = await Candidate.find().sort({voteCount: 'desc'});

        // Map the candidates to only return their party and voteCount
        const voteRecord = candidate.map((data)=>{
            return {
                party: data.party,
                count: data.voteCount
            }
        });

        return res.status(200).json(voteRecord);
    }catch(err){  
        console.error(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
})

// Get List of all candidates with only name and party fields
router.get('/', async (req, res) => {
    try{
        // Find all candidates and select only the name and party fields, excluding _id
        const candidates = await Candidate.find({}, 'name party -_id');

        // Return the list of candidates
        res.status(200).json(candidates);
    }catch(err){  
        console.error(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
})

module.exports = router;