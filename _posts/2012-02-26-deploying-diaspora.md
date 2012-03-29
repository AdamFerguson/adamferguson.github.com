---
layout: post
title: "Deploying Diaspora"
category: fiddling
tags: ["rails", "diaspora", "deployment"]
---
{% include JB/setup %}

After spending the majority of my Sunday morning browsing the web, mostly reading programming related posts, as I increasingly find myself doing, I decided that a fun thing to do this morning would be deploying an instance of Diaspora to my linode. You know, for the educational benefit and whatnot. Not that I actually intend to use Diaspora on the server, merely that it's one of the larger (the largest?) available open source Rails projects that I know of and I think it would fun to try and take that code base and get it running on my own server.

### Run it locally

So, first things first, pull down the code locally:

    {% highlight bash %}
      % git clone https://github.com/diaspora/diaspora.git
      % cd diaspora 
      % gem install bundler
      % bundle install
    {% endhighlight %}
    
Then, start getting the application set up locally:

      % cp config/database.yml.example config/database.yml
      % rake db:schema:load
      ******** You haven't set up your Diaspora settings file. **********
      Please do the following:
      1. Copy config/application.yml.example to config/application.yml.
      2. Have a look at the settings in that file. It has sensible defaults for development, which (we hope)
      work without modification. However, it's always good to know what's available to change later.
      3. Restart Diaspora!
      ******** Thanks for being an alpha tester! **********
    
Oops, looks like they have a specific application.yml file, reading through it, contains something about pods. I'll need to check that out later. Continuing on...

    {% highlight bash %}
      % cp config/application.yml.example config/application.yml
      % rake db:schema:load
      % be rake db:seed
      % thin start
    {% endhighlight %}
    
And, there we have it. Up and running locally, simple as that!

### Run it on the server

I already have a linode (running ubuntu 10.04, upgrade to 12.04 forthcoming) set up with the following:

* nginx
* mysql
* rvm

So I have all those dependencies set up. I haven't messed around with Capistrano configuration much so I think I'll be using that on the deploy, just to get a little practice. Also, apparently diaspora requires https for deployment, so this will give me the opportunity to practice getting that set up. Also, apparently there's a dependency on Redis, so I'll get to play around with that also. I'll be using thin as the webserver, since that's what diaspora recommends, though Unicorn is supposed to be the new hotness.