const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');
const morgan = require('morgan');

const app = express();

var mongoose = require('mongoose');
var configDB = require('../config/database.js');

mongoose.connect(configDB.url, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set('useCreateIndex', true);
mongoose.connection.on('error', error => console.log(error));
mongoose.Promise = global.Promise;

require('./auth/auth');

app.use(morgan('dev')); // sử dụng để log mọi request ra console
app.use(bodyParser.json()); // Use Node.js body parsing middleware
app.use(bodyParser.urlencoded({
  extended: true,
}));
// app.use(bodyParser()); // lấy thông tin từ form HTML

const routes = require('./routes/routes.js');
const secureRoute = require('./routes/secure-routes.js');

app.use('/', routes);
//We plugin our jwt strategy as a middleware so only verified users can access this route
app.use('/user', passport.authenticate('jwt', { session: false }), secureRoute);

//Handle errors
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.json({ error: err });
});

module.exports = (bot) => {
  app.post('/' + bot.token, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
  });
};

// Start the server
// const server = app.listen(port, (error) => {
//   if (error) return console.log(`Error: ${error}`);
//   console.log(`Server listening on port ${server.address().port}`);
// });
var server = app.listen(process.env.PORT || 8080, '0.0.0.0', () => {
  const host = server.address().address;
  const port = server.address().port;
  console.log('Web server started at http://%s:%s', host, port);
});