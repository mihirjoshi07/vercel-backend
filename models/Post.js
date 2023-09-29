const mongoose=require('mongoose')

const PostSchema=new mongoose.Schema({
    title:String,
    summary:String,
    content:String,
    img:String,
    author:{type:mongoose.Schema.Types.ObjectId,ref:'User'},
},{
    timestamps:true,
});


                                //post is the name of collection
const PostModel=mongoose.model('Post',PostSchema);

module.exports=PostModel;
