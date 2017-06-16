var restful = require('node-restful')
var mong = require('mongoose')

// app.jokes, /jokes
// app.images,/images
var LEVEL_JOKE = 1;
var LEVEL_COMMENT = 2;
var LEVEL_POST = 5;
var LEVEL_SHARE = 10;

module.exports = function (app){
	var mongoose = restful.mongoose
  //databases
  mongoose.connect("mongodb://localhost/huimoges")	

  //collection 1,
  var Works = app.blogs = restful.model(
		'works', mongoose.Schema({
    title: String,
    content: String,
		videourl: String,
    createdate : { type:Date},
    pv: { type:Number, default: 0 },
    joke: {type:Number, default: 0 },
    unjoke: {type:Number,default: 0},
    published: {type:Number, default:1 },// 1 ,show. 0. hide
    comments: [{type : mongoose.Schema.ObjectId, ref : 'comments'}], // 1 ,show. 0. hide
    author  : {type : mongoose.Schema.ObjectId, ref : 'accounts'},
  }))
  .methods(['post','delete']);

  var accounts = restful.model(
    'accounts',mongoose.Schema({
    nickname: String,
    avatar: String,  //image url
    createdate : { type:Date, default: Date.now },
    level: {type: Number,default: 0},
    weappid: {type: String},
  }));

  var comments = restful.model(
    'comments',mongoose.Schema({
    content : String,
    createdate : { type:Date, default: Date.now },
    author  : {type : mongoose.Schema.ObjectId, ref : 'accounts'},
    work    : {type : mongoose.Schema.ObjectId, ref : 'works'},
  }))
  .methods(['post']);

  app.get('/api/works' ,function (req,res){
    var l = 0
    var s = 0
    var video = 0 // 0: haven't video ,1:only video , 2: all

    if (req.query.limit){
      l = req.query.limit
    }

    if (req.query.skip){
      s = req.query.skip
    }

    if (req.query.video){
      video = req.query.video
    }

    // default ,haven't video
		var	videoquery = {"videourl":null} 

    if (video == 1){
			videoquery = {"videourl":{$ne:null}}  // 1,only video
    }

		if (video == 2){
    	var videoquery = {}
		}

    // Works.find( videoquery ,{comments:0}) //审核
    Works.find( videoquery/*,{comments:0}*/)
         .limit(l)
         .skip(s)
         .sort('-_id')
         .populate({ path: 'author', select: {'avatar':1,'nickname':1,'level':1,'username':1} })
         .populate({ path: 'comments',
                     populate: {path: 'author', select: {'nickname':1,'username':1}}})
         .exec(function (err, works) {
           if (err) return handleError(err);
           res.json(works)
         })
   })
 
   // get works end

   // get use own works
   app.get('/api/my/works',function(req,res){
     if(!req.isAuthenticated()){
        return res.json({"err":"need login"})
     } else {
	     var l = 0
  	   var s = 0
    	 if (req.query.limit){
      	 l = req.query.limit
    	 }

    	 if (req.query.skip){
      	 s = req.query.skip
    	 }

       // Works.find({author:[req.user._id]} ,{comments:0} ) // 审核 
       Works.find({author:[req.user._id]}/*,{comments:0}*/)
              .sort('-_id')
							.limit(l)
							.skip(s)
              .populate({ path: 'author', select: {'avatar':1,'nickname':1,'level':1,'username':1} })
              .populate({ path: 'comments',
                     // options: {sort: {'_id': -1 }}, 
                     populate: {path: 'author', select: {'nickname':1,'username':1}}})
              .exec(function (err, works) {
                if (err) return handleError(err);
                res.json(works)
              })
     }
   })
 
   // a work
   app.get('/api/works/:id',function(req,res){

      Works.findOne({'_id': req.params['id']})
           .populate({ path: 'author', select: {'avatar':1,'nickname':1,'level':1,'username':1} })
           .exec(function(err,j){
             if (req.query['joke']){
               j.joke = j.joke + 1

               update_author_level(req.params['id'], LEVEL_JOKE) // joke

               j.save(function(err,data){
                 res.json(data)
               })
             } else if (req.query['unjoke']) {

               j.unjoke = j.unjoke + 1
               j.save(function(err,data){
                 res.json(data)
               })
             } else {
               res.json(j)
           }

         }) //exec jokes find one
   }) //app.get

   /*****************************************************/
   // id is jokeid ,val is + level value 
   function update_author_level (id,val) {
    Works.findOne({_id:id})
       .populate('author')
       .exec(function(error,cursor) {
          var author = cursor.author
          accounts.update({_id:author._id},{level:author.level+val},function(e,a){
          })
        })
   }
   /*****************************************************/
   // req ,val is + level value 
   function update_accounts_level (req,val,cb) {
      accounts.update({_id:req.user._id},{$inc:{level:val}},function(e,a){
				if (cb){
					cb()
				}
			})
   }

  Works.before('post', function(req, res, next) {
    if(req.isAuthenticated()){
      req.body['createdate'] = Date() + ''
      req.body['pv'] = 1
      req.body['joke'] = 0
      req.body['unjoke'] = 0
      req.body['published'] = 0
      req.body['author'] = req.user._id
      update_accounts_level(req,LEVEL_POST)
      next();
    } else {
			res.sendStatus(403);
    } 
  })

  Works.before('put', function(req, res, next) {
    if(req.isAuthenticated()){
      
      next();
    } else {
			res.sendStatus(403);
    } 
  })

  Works.before('delete', function(req, res, next) {
    var user = req.user.toJSON()
    if (req.isAuthenticated() && (user.admin==1)){
		  next();	
    } else if(req.isAuthenticated()){
      
      Works.findOne({'_id': req.params['id']})
           .populate({ path: 'author', select: {'avatar':1,'nickname':1,'level':1,'username':1} })
           .exec(function(err,j){
							if (j.author[0]._id == req.user._id.toString()){
                next();
              } else {
								res.sendStatus(403)
							}
           })
    } else {
			res.sendStatus(403);
    } 
  })


	Works.register(app,'/api/works')


  // get user sort
  app.get('/api/userlevel',function(req,res){
    var l = 0
    if (req.query.limit){
      l = req.query.limit
    }

		accounts.find( { level:{ $gt: 0 } } ,{salt:0,hash:0,weappid:0})
					 .sort( { level:-1 } )
		       .limit( l )			 
					 .exec(function(err,cursor){
							res.json(cursor)
           })
  })

  comments.before('post', function(req, res, next) {
    if(req.isAuthenticated()){
      req.body['createdate'] = Date()
      req.body['author'] = req.user._id
      req.body['work'] = req.query.id
      update_author_level(req.query.id,LEVEL_COMMENT) // works
      next();
    } else {
      res.sendStatus(403);
    }
  })

  comments.after('post', function(req, res, next) {
    if(req.isAuthenticated()){ 
      
      Works.findOneAndUpdate({_id:req.query.id},
                           {$push: { comments: res.locals.bundle._id} },function(err, count, resp){
            });
      next();
    } else {
      res.sendStatus(403);
    }
  })

  app.get('/api/comments' ,function (req,res){
    var workid = req.query.workid
    comments.find({work:workid})
         // .sort('-_id')
         .populate({ path: 'author', select: {'avatar':1,'nickname':1,'level':1,'username':1} })
         .exec(function (err, comments) {
           if (err) return handleError(err);
           
           res.json(comments)
         })
   })

	comments.register(app,'/api/comments')


  // share success update level
  app.post('/api/share',function(req,res){
      update_accounts_level(req,LEVEL_SHARE,function(){
				res.json({'result':'ok'})
			})
	})

  // collection 2,
  var UploadImg = app.images = restful.model(
		'uploadimg', mongoose.Schema({
    url: String,
    createdate : { type:Date, default: Date.now },
  }))
  .methods(['get','post']);

	UploadImg.register(app,'/api/images')

}


/*
GET    /works
GET    /works/:id
POST   /works
PUT    /works/:id
DELETE /works/:id
*/
