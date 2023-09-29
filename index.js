const fs=require('fs')
const express=require('express');
const jwt=require("jsonwebtoken");
const cors=require('cors')
const mongoose=require('mongoose');
const UserModel=require('./models/User')
const bcrypt=require('bcryptjs')
const cookieParser=require('cookie-parser')
const multer=require('multer')
const app=express();
const PostModel=require('./models/Post')
const uploadMiddleware=multer({dest:'uploads/'})


//for encrypting password
const salt=bcrypt.genSaltSync(10);

//Creating Secret key for generating web token
const seceret='ddjkvuk5bdd3jlvsfytighk6jggjkrsg3dfd';
app.use(cors(
    {
        credentials:true,origin:"https://vercel-frontend-three.vercel.app",  allowedHeaders: ['Content-Type', 'Authorization'],
    }
    ));
app.use(express.json());
app.use(cookieParser())
app.use('/uploads',express.static(__dirname+'/uploads'))
mongoose.connect('mongodb+srv://mike:mike123@nodeexpressprojects.cuzmdpd.mongodb.net/my-app?retryWrites=true&w=majority',{
useNewUrlParser:true,useUnifiedTopology:true})

app.get("/",(req,res)=>{
    res.send("hello my aewsoem blog");
})

//Register a new User
app.post("/register",async(req,res)=>{

const {username,password}=req.body;
try {
    
const userDoc=await UserModel.create(
    {username,
    password:bcrypt.hashSync(password,salt),
});
res.json(userDoc);    

} catch (error) {
    res.status(400).json(error);
}

});
//==================Registration end==============================================


//Login End point
app.post('/login',async(req,res)=>{
    const {username,password}=req.body;
    const userDoc=await UserModel.findOne({username});
    var isCorrect;
    try {
        isCorrect=bcrypt.compareSync(password,userDoc.password)
        
    } catch (error) {
        console.log("error")       
    }
    if(isCorrect)
    {
        //logged in
        jwt.sign({username,id:userDoc._id},seceret,{ expiresIn: '1h' },(err,token)=>{
            if(err) throw err;
            res.cookie('token',token).json({
                id:userDoc._id,
                username,
            });
             res.json({ redirectUrl: 'https://vercel-frontend-three.vercel.app' });
        })
        // res.json();
    }else{
        res.status(400).json('Wrong credential')
    }
})
//========================== login end============================================



//================profile
app.get("/profile",(req,res)=>{
    const {token}=req.cookies;
    
    if (!token) {
        return res.status(401).json({ message: 'Token not provided' });
      }
    jwt.verify(token,seceret,{},(err,info)=>{
        if(err) throw err;
        res.json(info)
    })
})


//=======================End profile



//========================================Logout

app.post("/logout",(req,res)=>{
    console.log(res)
    res.cookie('token','').json("ok");
})

//====================================End Logout



//================================Create post=======================

app.post('/post',uploadMiddleware.single('file'),(req,res)=>{
  const {originalname,path}=req.file;
  //divide from dot(.)
  const parts =originalname.split('.');
 //extract the text after last dot(.)
  const extention=parts[parts.length-1];
  const newPath=path+'.'+extention
  fs.renameSync(path,newPath);
  
  const {token}=req.cookies;
  if (!token) {
    return res.status(401).json({ message: 'Token not provided' });
  }
  jwt.verify(token,seceret,{},async(err,info)=>{
    if(err) throw err;
    const {title,summary,content}=req.body;
    const PostDoc=await PostModel.create({
        title,
        summary,
        content,
        img:newPath,
        author:info.id
        
    })
    res.json(PostDoc);

})

  

})

// =============================Create post ends=====================



//Get data from the databases by using get method on post/
app.get('/post',async(req,res)=>{
    const posts= await PostModel.find()
                .populate('author',['username'])
                .sort({createdAt:-1})
                .limit(20);
   
    res.json(posts);
})
// ================================End ===============================



//================For retriving specific posts by id=========================
app.get('/post/:id',async(req,res)=>{
   const {id}=req.params;
   console.log("hit get")
   const postDoc=await PostModel.findById(id).populate('author',['username'])
    res.json(postDoc)
})

//==========================For updating the post by user id===================
app.put('/post',uploadMiddleware.single('file'),(req,res)=>{
    let newPath=null
    if(req.file){
        const {originalname,path}=req.file;
        //divide from dot(.)
        const parts =originalname.split('.');
        //extract the text after last dot(.)
        const extention=parts[parts.length-1];
        newPath=path+'.'+extention
        fs.renameSync(path,newPath);
    }
        
        const {token}=req.cookies
        if (!token) {
            return res.status(401).json({ message: 'Token not provided' });
          }
        jwt.verify(token,seceret,{},async(err,info)=>{
            if(err) throw err;
            
            const {id,title,summary,content}=req.body;
            const PostDoc=await PostModel.findById(id)
            const isAuthor=JSON.stringify(PostDoc.author)===JSON.stringify(info.id)
            if(!isAuthor){
                return res.status(400).json("you are not the author");
            }

        PostDoc.title = title;
        PostDoc.summary = summary;
        PostDoc.content = content;
        PostDoc.img = newPath || PostDoc.img; // Use the new path if it exists, otherwise, keep the old one
        await PostDoc.save();

           res.json(PostDoc);
        });
    }
);
app.listen(4000);
