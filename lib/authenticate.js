var connectUtils = require('connect').utils,
    cookie = require('cookie'),
    xtend = require('xtend');

/**
 * Generate an auth function for the share.js library.
 * 
 * @param  {object} options the same options object you use for the connect.session middleware
 * @param  {array} optional array of string of the actions we want to enforce authentication/authorization default to ['open']
 * @param  {function} callback function of (err, agent, action, user)
 * @return {function} the callback to pass to share.js options { auth:  }
 */
function authenticate (options, actions, callback) {
  if (typeof actions === 'function'){
    callback = actions;
    actions = null;
  }
  
  actions  = actions  || ['open'];

  callback = callback || function(err, agent, action, user){
    return (err || !user) ?  action.reject() : action.accept();
  };

  var auth = {
    passport:       require('passport'),
    key:            'express.sid',
    secret:   null,
    store:    null
  };

  xtend( auth, options );

  var userProperty = auth.passport._userProperty || 'user';

  return function (agent, action) {

    if( actions.indexOf(action.name) === -1 ) {
      return action.accept();
    }

    if (!agent.headers.cookie) {
      return callback(new Error('no cookie'), agent, action);
    }

    var parsedCookie = connectUtils.parseSignedCookies(
                    cookie.parse(agent.headers.cookie), 
                    auth.secret);

    var sessionId = parsedCookie[auth.key];

    auth.store.get(sessionId, function(err, session){
      if (err || !session) {
        if(err){
          return callback(err, agent, action);
        }
        return callback(new Error('there is no session'), agent, action);
      }

      if( !session[ auth.passport._key ] ){
        return callback(new Error('passport was not initialized'), agent, action);
      }

      var userKey = session[ auth.passport._key ][ userProperty ];

      if( !userKey ) {
        //anonymous user
        return callback(null, agent, action, null);
      }

      auth.passport.deserializeUser(userKey, function(err, user) {
        agent.name = user.id;
        return callback(null, agent, action, user);
      });

    });
  };
}

module.exports = authenticate;