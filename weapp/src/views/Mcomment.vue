<template>
<div class="page preview js_show" style="background-color:#eee" v-if="work!=null">

 <div class="page__bd">
          <div class="page__bd page__bd_spacing" style="height:60px;">
                  <div class="weui-flex js_category">
                    <a href="/">
                     <p class="weui-flex__item" style="margin:15px;"> < </p>
                    </a>
                    <p class="weui-flex__item" style="margin:15px;"></p>
                    <a href="/m/newwork">
                     <img src="/static/camera.png" style="width:40px;margin:15px;" alt="">
                    </a>
                </div>
           </div>
  <div class="weui-panel weui-panel_access">
    <div class="weui-panel__bd">
        <a href="javascript:void(0);" class="weui-media-box weui-media-box_appmsg" style="align-items:flex-start;padding:8px;">
            <div class="weui-media-box__hd" style="width:40px;height:40px;">
                <img class="weui-media-box__thumb" v-bind:src="work.author.avatar||'/static/default-img.png'" alt="" style="width:40px;height:40px;"> 
            </div>
            <div class="weui-media-box__bd">
                <h4 class="weui-media-box__title">{{work.author.nickname||work.author.username}}</h4>
                
                <p class="weui-media-box__desc">{{work.createdate | getYMD }}</p>
                <p class="weui-media-box__desc">
                   <article class="weui-article" style="padding-left:0px;">
                     <section>
                       <div v-html="work.content" style="white-space:pre-wrap"> </div>
                      
                       <div class="weui-form-preview__ft">
                          <button type="submit" class="weui-form-preview__btn weui-form-preview__btn_primary" @click='jokeclick(work,1)'><font><font><img  style="width:24px;" src="/static/joke.png"> {{work.joke}}</font></font></button>
                          <button type="submit" class="weui-form-preview__btn weui-form-preview__btn_primary"><font><font><img style="width:24px;" src="/static/comment.png"> {{work.comment}}</font></font></button>
                          <button type="submit" class="weui-form-preview__btn weui-form-preview__btn_primary" @click='jokeclick(joke,0)'><font><font><img style="width:24px;" src="/static/unjoke.png"> {{work.unjoke}}</font></font></button>
                       </div>

                       <template v-for="(c,index) in comments">
                        <div class="triangle-up" style="margin-left:15px;" v-if="index===0"></div>
                        <div class="comment" > <font class="comment_name">{{c.author.nickname||c.author.username}}:</font><font class="comment_content">{{c.content}}</font></div>
                       </template>
                     </section>
                   </article>
                </p>
            </div>
        </a>
     </div>



  </div>

   <div class="weui-tab">
    <div class="weui-tabbar" style="position:fixed;">
      <div class="weui-cell__bd">
       <input class="weui-input" style="margin:8px;" type="text" id="content" placeholder="评论...">
      </div>
      <button class="weui-btn weui-btn_primary" style="width:80px;" @click="send(work)">发送</button>

    </div>
  </div> <!-- weui-tab -->
 </div> <!--page__bd-->
</div>
</template>

<script>
import axios from 'axios'

export default {
  data () {
    return {
      work: null,
      workid: null,
      comments: {},
      workurl: '/api/works',
      commentsurl: '/api/comments'
    }
  },
  created () {
    this.getWork()
    this.getComments()
  },

  methods: {
    jokeclick (j, jo) {
      if (jo) {
        j.joke += 1
        axios.get(this.workurl + '/' + j._id + '?joke=1')
      } else {
        j.unjoke += 1
        axios.get(this.workurl + '/' + j._id + '?unjoke=1')
      }
    },
    send (j) {
      /* eslint-disable */
      var content1 = $('#content').val();
      /* eslint-enable */
      var that = this
      axios.post(this.commentsurl + '?id=' + j._id + '&populate=author', {
        content: content1
      })
        .then(function (response) {
          /* eslint-disable */
          $('#content').val('');
          /* eslint-enable */
          that.getComments()
        })
    },
    getComments () {
      var that = this
      this.workid = that.$route.query.workid
      axios.get(this.commentsurl + '?workid=' + this.workid)
        .then(function (response) {
          that.comments = response.data
        })
    },
    getWork () {
      var that = this
      this.workid = that.$route.query.workid
      axios.get(this.workurl + '/' + this.workid + '?populate=author')
        .then(function (response) {
          that.work = response.data
        })
    }
  },
  components: {
  }
}
</script>
<style>
div > img {width:90%;}
div > video {width:90%}
a {text-decoration:none;}
</style>
