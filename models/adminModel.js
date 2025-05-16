import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema({
    username: {type: String, required:true},
    password: {type: String, required:true},
}, {minimize:false})


const adminModel = mongoose.model.admin || mongoose.model("admin", adminSchema);

export default adminModel;