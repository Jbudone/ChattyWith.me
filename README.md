# ChattyWith.me

An AJAX approach to IRC. 

How it works
=============

### Comet ###
	
Comet (aka Reverse AJAX) is a way to enable realtime communication through HTTP. Essentially the user opens a request to a longpolling script which continuously pings the database for updates to the user (eg. new messages, events). When an update is found, it's wrapped in the form of a JSON reply and read from the user.

### Structure ###

The chat client is structured into two main components: client and terminal. The client is basically the core of the webapp: managing channels, messages, events, users, sending requests, handling replies, etc. This will take care of everything necessary to run the chat client. The Terminal is really the look and feel of the webapp. It will display received messages, split them up between channels, parse links, draw emoticons, even encrypt the entire chat into Elvish. Things were structured this way to enable maximum scalability. In this way the client can work across any device and have a completely different look and feel.

### Event Handling ###

Chatty adopts a hook based coding scheme. That's where various events are defined, and those events can have callbacks before and after they're handled, before being parsed, and after successful or failure of the event. For example the /leave event is hooked by the client to remove the user from the list of users in that channel, and inform the terminal to remove the user from the displayed list of users; it also checks if the user is yourself (ie. you've been kicked from the channel), and if so removes the channel and informs the terminal to delete the channel element data and messages. 


Wishful TODO's
==============

index.php contains a full list of TODO's; these are only the higher priority TODO's

	- picture messages
	- channel settings on mobile
	- LaTex integration
	- show colour/emoticons in textbox
	- improve loading screen
	- themes
	- localization of time
	- IE page
	- newbie-friendly joins (as anonymous123)
	- link to channel: chattywith.me/#somechat

Bugs
==============

index.php contains a full list of found bugs. If something is found which is not already listed, please let me know: Jbud@live.ca


Donations
==============

Donations are always greatly appreciated. Feel free to Paypal me at Jbud@live.ca
All donations go to buying, specifically `Venti Raspberry Mocha's` over at Starbucks :)
