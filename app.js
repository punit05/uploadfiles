const express=require("express");
const bodyParser=require("body-parser");
const path=require("path");
const crypto=require('crypto');//for file name
const mongoose=require('mongoose');
const multer=require('multer');
const GridFsStorage=require('multer-gridfs-storage');
const Grid=require('gridfs-stream');
const methodOverride=require('method-override');
const app=express();

app.use(bodyParser.json());
app.use(methodOverride('_method'));
//Mongo URI
app.set('view engine','ejs');

const mongoURI='mongodb://punit5:hometown5@ds245240.mlab.com:45240/mongouploads';



//mongo connection

const conn=mongoose.createConnection(mongoURI);
//init variable for gfs;

let gfs;
conn.once('open',() => {
    //init stream
     gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('uploads');
    // all set!
  })

//create storage engine

const storage = new GridFsStorage({
    url: mongoURI,
    file: (req, file) => {
      return new Promise((resolve, reject) => {
        crypto.randomBytes(16, (err, buf) => {
          if (err) {
            return reject(err);
          }
          const filename = buf.toString('hex') + path.extname(file.originalname);
          const fileInfo = {
            filename: filename,
            bucketName: 'uploads'
          };
          resolve(fileInfo);
        });
      });
    }
  });
  const upload = multer({ storage });

//route get
app.get('/',(req,res)=>{
    gfs.files.find().toArray((err,files)=>
    {
        //check if files
        if(!files||files.length===0)
        {
           res.render('index',{files:false});
      }
            else
            {
                files.map(file=>
                {
                    if(file.contentType==='image/jpeg'||file.contentType==='image/png')
                {
                   file.isImage=true;
                }
                else 
                {
                    file.isImage=false;
                }
                });
                res.render('index',{files:files});
            }
           
        });
        
        

        
        //files exist
   
    // res.render('index');
});
//route post  /upload
//upload file to db
//upload is a middleware
app.post('/upload',upload.single('file'),(req,res)=>
{
    res.redirect('/');
 //   res.json({file:req.file});
});

//route get /file @desc display all files in json

app.get('/files',(req,res)=>{
    gfs.files.find().toArray((err,files)=>
    {
        //check if files
        if(!files||files.length===0)
        {
            return res.status(404).json({
                err:'No files exist'
            });
        }
        //files exist
        return res.json(files);
    });
});


//route get /:filename @desc display single file object in json

app.get('/files/:filename',(req,res)=>{
    gfs.files.findOne({filename:req.params.filename},(err,file)=>
{
    //check if file
    if(!file||file .length===0)
    {
        return res.status(404).json({
            err:'No file exist'
        });
    }
//file exist
return res.json(file);
});
});
//@route get/images/:filename display images
app.get('/image/:filename',(req,res)=>{
    gfs.files.findOne({filename:req.params.filename},(err,file)=>
{
    //check if file
    if(!file||file .length===0)
    {
        return res.status(404).json({
            err:'No file exist'
        });
    }

//check if imaage
if(file.contentType==='image/jpeg'||file.contentType==='image/png')
{
    //read output to browser

    const readstream=gfs.createReadStream(file.filename);
    readstream.pipe(res);


}
else 
{
    res.status(404).json({
        err:'Not an image'
    });
}

});
});

//route delete /files/:id
//@desc elete file

app.delete('/files/:id',(req,res)=>
{
gfs.remove({_id:req.params.id,root:'uploads'},(err,gridStore)=>
{
    if(err)
{
return res.status(404).json({err:err});
}
res.redirect('/');
});
});

const port=5000;
app.listen(port,()=> console.log('server started on port ${port}'));