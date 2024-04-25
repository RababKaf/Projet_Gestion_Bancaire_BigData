//imports

require('dotenv').config();
const express=require('express');
const mongoose=require('mongoose');
const session=require('express-session');

const app=express();
const port=process.env.port || 4000

//DB connexion
mongoose.connect(process.env.DB_URL,{useNewUrlParser:true,useUnifiedTopology:true});
const db=mongoose.connection;
db.on("eroor",(error)=>console.log(error));
db.once("open",()=>console.log('Connexion Etablie'));

//milddlewares
app.use(express.urlencoded({extended:false}));
app.use(express.json());

app.use(session({
    secret:'my secret key',
    saveUnitialized:true,
    resave:false,

}));

app.use((req,res,next)=>{
res.locals.message=req.session.message;
delete req.session.message;
next();
});
app.use(express.static('uploads'));

//le moteur de template
app.set('view engine',"ejs");


//route pfx

app.use("",require("./routes/routes"));


app.get('/',(req,res)=>{
    res.send("Hello World");
});


app.listen(port,()=>{
    console.log(`server started att http://localhost:${port}`);

})
