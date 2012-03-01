# Hornet

* https://github.com/nectify/hornet

## Description

Hornet is a realtime engine originally built for [Fresc](http://fre.sc) that let you enhance your web application by connecting users together.
Hornet is meant to be used next to your own existing application, no matter what language or framework you're using, by using connectors.

Hornet is powered by NodeJs, Socket.io and is backed by Redis.

### Hornet philosophy: the engine and the connector

Hornet engine acts as a hub for your existing web application: it keeps a pool of connected users and offers you the possibility to broadcast them messages in realtime.

The connector is a small library that is going to be used by your existing application to connect your clients to Hornet and to broadcast message to them. 
When a client access a page with realtime features on it, your webapp has to generate a connection token to let the client subscribe to a hornet channel. 

When you want to broadcast a message to a specific channel, you'll also use the hornet connector to publish it. 
Using Redis publish/subscribe mechanism, Hornet core engine will be notified by this new message and forward it to subscribed clients.

Hornet messages should always be JSON valid objects, containing at least the "type" property.

### Features

* Realtime publishing to clients from your existing web application
* Secure subscription to channels, using temporary (2 min TTL), non-consecutive 9-chars base 62 numbers.
* Standardised architecture for connectors. Implementation already existing for Java and Ruby
* Lots of supported transports and browsers thanks to [Socket.io](http://socket.io/)
* Multichannel support

## Requirements

* [Node.js](https://github.com/joyent/node) and [npm](http://npmjs.org/)
* [Redis](http://redis.io/)

## Installation

	npm install hornet -g

## Starting a hornet instance

Launch redis server if not already done:

	redis-server

Launch hornet:
  
	hornet

How to scale? Just launch more hornet instances and load balance them though a TCP load balancer.

## Client side JavaScript API    

### Required libs

Include this library :

	<script src="http://host:port/hornet/hornet.js"></script>

Note that Hornet is running on port 8187 by default. If you want to expose Hornet on port 80 on your domain, use a TCP load balancer, like HAProxy


### Instantiate the connection

Token should be generated for one or multiple channels using a connector. See the dedicated section below.

	// javascript
	var hornet = new Hornet({
		uri: 'uri', 
		channels: ['channel1', 'channel2'], 
		token: 'token' 
	});
	hornet.connect();

Example :

	// javascript
	var hornet = new Hornet({ uri: 'http://localhost:8187', channels: ['news', 'privateMessages'], token: 'VhjHU89Jhk' });
	hornet.connect();    

## Messages handling

Each time a new message is coming, an event is raised. Handle them like the following:

	// javascript
	hornet.on("channel","message_type", function ( messageData ) {
		// your own code here
	});

Note that you can handle the same type on multiple channels like the following:

	// javascript
	hornet.on(["channel", "channel2"], "message_type", function ( messageData ) {
		// your own code here
	});

### Excluding clients from a message broadcast

If message have the except attribute setted, with a token as value, then the client will not be notified from the message.

Example:

	Client with token "a3RErg5Z" has subscribed to channel "cookie"
	Client with token "2dlk5ELM" has subscribed to channel "cookie"
	Client with token "EKR39Ehg" has subscribed to channel "cookie"	
	Client with token "a3RErg5Z" sends "{ type: "foo", except: "a3RErg5Z", text: "dummy" }"
	Hornet is notified of the new message, broadcasts it to clients with tokens : "2dlk5ELM" and "EKR39Ehg"

### Sending message to specific clients

If message have the except attribute setted, with a token as value, then the client will not be notified from the message.

Example:

	Client with token "a3RErg5Z" has subscribed to channel "cookie"
	Client with token "2dlk5ELM" has subscribed to channel "cookie"
	Client with token "EKR39Ehg" has subscribed to channel "cookie"	
	Client with token "a3RErg5Z" sends "{ type: "foo", only: "2dlk5ELM", text: "dummy" }"
	Hornet is notified of the new message, sends it to clients with tokens : "2dlk5ELM"

## Hornet channel
This channel is only used for handling intern events like disconnect or error.

### Handling error 

Hornet can throw some errors events through the socket, like an invalid token. Use the following to handle that case :

	//javascript
	hornet.on("hornet", "error", function (reply) {
		// Something went wrong
	};

	//javascript
	//Exemple of a reply :
	{ 
	  type: "error",
	  channel: "hornet",
	  error: "INVALID_TOKEN", 
	  errorMsg : "Invalid token used, please get a new token" 
	};

### Reconnect when loosing the connection

Socket.io has an built-in system for reconnection and Hornet has its own too. It allows you to ask for a new token to initialize a new connection. You just have to define the "disconnect" event with this :

	//javascript
	hornet.on("hornet", disconnect", function ( ) {
		//Ajax calling to get a new token ?
	};

After that, the client will try to open a new connection to Hornet with the new token. Notice that it lets some time between two attempts and this increases over the time to a maximum of 30 seconds.

## Hornet connectors 

### Standard

Each connector should expose the following described methods, adapted to any language or framework specificities

#### constructor

	initializer of the connector. Should have Redis connection settings as parameters

#### create access token

	param string : channel : name of the channel associated to the access token
	return string : the access token

#### disconnect tokens

	param string list : tokens : list of tokens to permanently disconnect from any hornet instance

#### publish

	param string list: channels : names of the channels to publish
	param string : type : type of the message that is going to be published
	param string : message : JSON object containing all the message data to be broadcasted
	param string list : options : pair of key/value of options that will be merged with @message. Usually used to specify "only" or "except".
	return number : the result of the redis publish event

#### redis

	returns redis client instance : the redis client instance used by the connector

#### TTL

	property : the value of time to live for access token. Should be 120 seconds as default ( 2 minuts ) 

### List of existing connectors

Each language who has an existing Redis client library should be able to produce an Hornet connector. At the moment, the following are existing:

* Java : https://github.com/nectify/hornet-connector-java
* Ruby : https://github.com/nectify/hornet-connector-ruby

## License

This project is distributed under Apache 2 License. See LICENSE.txt for more information.
