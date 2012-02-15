---
layout: post
title: "Spec-ing it Right in Rails"
category: learning
tags: ["rspec", "learning", "rails"]
---
{% include JB/setup %}

Spec-in it and spec-in it and spec-in it well
=============================================

> I represent queens ...

So one of the things I've found most frustrating about getting started in doing rails development is the testing
expectations that come along with it. Don't get me wrong, I think the emphasis on automated testing is an excellent idea.
Having worked on a complicated website that was developed in a dynamic server side language with no automated tests, I can
definitely appreciate their value. However, having never written tests before, I wasn't familiar with all the types of tests that are supposed to be written in the course of writing a Rails application, and haven't totally found a writeup
of what's expected that _clicked_ with me (besides the fact that I still have so much to learn about Rails itself). I'm currently working in an environment where writing tests along with the code is expected. So, for a while I've been meaning to sit down and document the types of tests that should go along with all the types of code I can think of in a typical Rails app. I've read through many lines of testing code, waiting to have that moment where it clicks. But I'm betting just documenting, on a verbal level, all the types of tests will go much further towards getting me there. So, that's what this post is about. I'm going to be writing this assuming that RSpec is the library being used for testing.

What is Testing?
----------------

On a high level, all tests are written to ensure that methods that have been written, assuming certain pre-existing state, will generate expected results and/or won't generate unexpected results. The pre-existing state would typically refer to any object state and/or parameters that are used by the method in generating it's output. The results that are being tested would include any output returned from the method or any objects whose state could be altered by the method. Additionally, it's possible to test whether certain methods are called from within the method (which could be relevant when the method conditionally calls methods). _Note: There may be other types of tests that this description doesn't take into account, this is just my present understanding._

Typical Test setup
------------------

I've [seen](http://speakerdeck.com/u/qrush/p/test-driven-development) it said that the patterns for testing are the same in any language:

* setup - refers to creating the objects or methods that provide the pre-existing state for the objects to act on.
* exercise - run the method(s)
* verification - test the results match expectations
* teardown - remove state created in setup

Generally, these four concepts can be accomplished using the following constructs in RSpec:

## Setup

Refers to the creation/initialization of any objects or methods that are used in the execution of the method being tested. 

### Subject

I'm currently thinking of this as the object whose state is being verified during the test. Can be:

* Implicit - the Class passed to the describe method. An instance of that class is exposed through subject(). Like:

    {% highlight ruby %}
    describe Array do
        ...
        subject.should ...
    end
    {% endhighlight %}

In this context, an Array instance is returned by subject.

* Explicit - defined by passing a block to the subject method in a group scope. The return value of the block is used as the value of the subject. Like:

    {% highlight ruby %}
    describe Array do
        subject { [1,2,3] }
        ...
        subject.should ...
    end
    {% endhighlight %}

show me syntax highlighting... more testing...