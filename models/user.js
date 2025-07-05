const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Define the Userschema
const userSchema = new mongoose.Schema({
    name:{
        type: String,  
        required: true 
    },
    age:{
        type: Number,
        required: true
    },
    email:{
        type: String,
    },
    mobile:{
        type: String
    },
    address:{
        type: String,
        required: true
    },
    aadharCardNumber:{
        type: Number,
        required: true,
        unique: true
    },
    password:{
        type: String,
        required: true
    },
    role:{
        type: String,
        enum: ['voter', 'admin'],
        default: 'voter'
    },
    isVoted:{
        type: Boolean,
        default: false
    }
});

userSchema.pre('save', async function(next){      // pre - is a middleware fn
    const person = this;

    // Hash the password only if it has been modified (or is new)
    if(!person.isModified('password')) return next();

    try{
        // salt generation
        const salt = await bcrypt.genSalt(10); // more the number, more complex salt, but bahut bada number hone se bhi prblm h - hashing algo ko bahut time lg skta h pwd ko hash krne mein
        
        // hash the pwd with the salt
        const hashedPassword = await bcrypt.hash(person.password, salt);
        
        // Override the plain pwd with the hashed one
        person.password = hashedPassword;
        
        next();
    }catch(err){
        return next(err);
    }
})

userSchema.methods.comparePassword = async function(candidatePassword){
    try{
        // Use bcrypt to compare the provided password with the hashed password
        const isMatch = await bcrypt.compare(candidatePassword, this.password);  
        return isMatch;
    }catch(err){
        throw err;
    }
}

const User = mongoose.model('User', userSchema);
module.exports = User;