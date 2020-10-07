const express = require('express');
const app = express();
const routes = require('./routes');
const path = require('path');

//setting view engine:
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname,'views'))

app.get('/', routes);
app.get('/register', routes);
app.post('/register', routes);
app.get('/login', routes);
app.post('/login', routes);
app.get('/dashboard', routes);
app.get('/logout', routes);
app.get('/homelogout', routes);
app.post('/addmsg', routes);

const PORT = process.env.PORT || 2000;
app.listen(PORT, () => {
    console.log("server is running at port : ", PORT);
})