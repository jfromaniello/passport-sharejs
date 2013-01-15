Use [passport.js](http://passportjs.org/) user profile from session to authorize operations on [Share.js](http://sharejs.org/) documents.

## Install

  npm install passport-sharejs

## Basic usage

~~~javascript
  var sessionOptions = { 
    key:    'the session key',
    cookie: {maxAge: 60000 * 60 * 24}, // 24 hours 
    secret: 'the session secret',
    store:  // the session storage.. memory, mongodb, redis
  };

  var app = express();

  //configure the express app and passport.js
  app.configure(function(){
    //...
    this.use(express.session(sessionOptions));
    //...
  })


  //configure share.js
  var share = require('share').server;
  var passportSharejs = require('passport-sharejs');

  share.attach(app, {
    db: {type: 'none'}, 
    auth: passportSharejs(sessionOptions);
  });
~~~

## Authorization with passportSharejs(sessionOptions, [actions], [callback])

```actions``` is an optional array of the [actions names](https://github.com/josephg/ShareJS/wiki/User-access-control) we want to enforce authentication. The default value is ```['open']```. 

```callback``` is a function that accepts 4 parameters (err, agent, action, user). It is optional and the default value is to accept any operation from any authentication user and reject all operations from anonymous users.

You can use this callback to create an authorization function:

~~~javascript

  share.attach(app, {
    db: {type: 'none'}, 
    auth: passportSharejs(sessionOptions, function (err, agent, action, user){
        
        // automatically accept any operation but open.
        if(action.name !== 'open') return action.accept();

        //reject anonymous user from opening this document.
        if(!user) return action.reject();

        //does this user has access to this document?
        user.canEditDoc(user.id, action.docName, function (err, canEdit){
          return canEdit ? action.accept() : action.reject();
        });

      });
  });
~~~


## License

MIT