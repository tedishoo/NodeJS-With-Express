const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({path:'./config.env'});

process.on('uncaughtException', (error) => {
    console.log(error.name, error.message);
    console.log('uncaught exception occured! shutting down...');
    
    process.exit(1);   
})

const app = require('./app');

//console.log(app.get('env'));
//console.log(process.env);

mongoose.connect(process.env.CONN_STR, {
    //useNewUrlParser: true
}).then((conn) =>{
    //console.log(conn);
    console.log("db connection successful");
}).catch((error) => {
    console.log("unable to connect database");
});

const port = process.env.PORT || 3000;

const server = app.listen(port, () =>{
    console.log('server has started...');
});

process.on('unhandledRejection', (error) => {
    console.log(error.name, error.message);
    console.log('unhandled rejection occured! shutting down...');

    server.close(() => {
        process.exit(1);
    });
})

