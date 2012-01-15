// JavaScript Document


/*
 *		Terminal		js
 *
 *	Author: JB Braendel
 *
 *	 ChattyWith.me's Front-End Requests Terminal script.
 *	All Terminal functionality is used, handled and
 *	maintained here. This handles all the display and
 *	functionality OF the terminal itself, and communication
 *	between the Terminal and CommandStation.
 *
 ****************************************************/

	
	
	/********************
		TODO LIST
		
		Dear JB: We are COMPLETELY revamping the architecture of this site.  terminal js will be a common grounds area
				between both mobile and desktop, and mobile/desktop.js will be two separate files that will extend 
				the Terminal
		
		* ...
	
	********************/



/************************************ ADMIN MANAGEMENT AREA BELOW *****************************************/



var spitBack=true; // Show the command sent before executing it
var kUPDATE_TIMER=2000;
var kMAX_LASTSENT=15;
var kOFFSET_TIMEFROMSERVER=0; // The offset from local time to server time (set when Comet script loads)


var colourMap=['white','','navy','green','red','maroon','purple','olive','orange','lime','teal','aqua','royalBlue','fuchsia','grey','silver'];
var emoticonMap={
	'\\:DD':'grin.gif',
	'\\(H\\)':'cool.gif',
	'\\:S':'confused2.gif',
	'\\:D':'open-smile.gif',
	'\\:P':'tongue.gif',
	'\\(Y\\)':'thumbs-up.gif',
	'\\(N\\)':'thumbs-down.gif',
	'\\(BD\\)':'nerd.gif',
	'\\(\\=\\\\\\)':'mouth-at-side.gif',
	'\\(\\=\\\/\\)':'mouth-at-side.gif',
	'\\:X':'lips-are-sealed.gif',
	'\\:\\$':'embarrassed.gif',
	'\\(\\:\\(':'sad.gif',
	'\\:\\(\\(':'depressed.gif',
	'\\:\\(':'frown.gif',
	'\\:\\\'\\(':'crying.gif',
	'0\\:\\)':'angelic.gif',
	'\\:\\)':'happy.gif',
	'\\^o\\)':'not-sure.gif',
	'\\+o\\(':'being-sick.gif',
	'\\(8\\)':'music.png',
	'\\(Y\\)':'sleepy.gif',
	'\\:\\\"\\(':'crying2.gif',
	'\\(BD2\\)':'dork.gif',
	'\\+oP':'ill.gif',
	'\\:R':'tongue2.gif',
	'\\(hubba\\)':'hubba_hubba.gif',
	'\\(laugh\\)':'laugh.gif',
	'\\(\\:\\(':'sad.gif',
	'\\(BH\\)':'cool2.gif',
	'\\:\\"D':'crying_with_laughter.gif',
	'\\(0o\\)':'black_eye.gif',
	'\\;\\)':'wink.gif',
	'\\;S':'confused.gif',
	'\\:\\@':'angry.gif',
	'\\:\Z':'zip.gif',
	'\\:O':'surprised.gif',
	'\\(L\\)':'heart.png',
	'\\(der\\)':'caveman.gif',
	
};
var themeMap={
	'Default':'',
	'Midnight Blue':'theme_midnight.css',
	'Blood Red':'theme_bloodred.css',
	'Acidic':'theme_acidic.css',
	'Dirty Blonde':'theme_dirtyblonde.css',
	'Purp':'theme_purp.css',
	'Teal':'theme_teal.css',
};
var theme='default';


/************************************ END OF ADMIN MANAGEMENT AREA *****************************************/

/************************************ CLASS DEFINITION BELOW *****************************************/
// Terminal class below here
//	The whole Terminal UI and functionality handled/managed here



/* Terminal   (class)
 * 
 *		Terminal class to create an artificial Terminal
 *	and link it with the UI. All commands are sanitized
 *	and sent to the CommandStation, and Responses are
 *	received and managed accordingly back here
 *
 *
 *
 *  requirements:   jQuery (tested on 1.6.2)
 *
 *	usage:	...
 ****************************/
var Terminal={

	// DOM Links
	console: null,
	prompt: null,
	usermenu: null,
	chanmenu: null,
	colourwin: null,
	emotewin: null,
	
	
	// Channels
	//	curChanID is the currently open channel
	//	channels: the array of channels we have loaded
	//	msgQueue: A queue of messages to be sent to the given channel [0:{chanid:0,data:{appendMe}},...]
	curChanID: 0,
	channels: {}, 
	msgQueue: [],
	
	
	// Commands
	sent: [], // Last sent commands
	sentSelected: null,
	
	
	// Self-Info
	userid: null,
	usernick: null,
	identification: null,
		
	
	
	command: function(cmd) {
		
		cmd=cmd.replace(/^\s+|\s+$/g, '') ; // (trim)
		if (cmd=='')
			return;
		if (Terminal.curChanID!='chanlist')
			savedCmd=cmd;
		//cmd=cmd.replace(/\\/g,'\\\\'); // \
		//cmd=cmd.replace(/\'/g,'\\\''); // '
		if (cmd[0]=='/') {
			// Command	
			if (Terminal.curChanID!='chanlist') {
				// Get the actual commmand
				var cmdStr=cmd.substring(1); // Command WITH arguments
				if (spacePos=cmdStr.indexOf(' '))
					cmdStr=cmdStr.substring(0,spacePos);
				if (exists(commands[cmdStr]) && !exists(commands[cmdStr].nospit))
					Terminal.spitback(cmd);
			}
			CommandStation.command(cmd.substring(1),Terminal.curChanID);
		} else {
			// Message
			CommandStation.message(cmd,Terminal.curChanID);
		}
		
		
		// Save the last-sent command
		if (savedCmd) {
			Terminal.sent.unshift(savedCmd);
			if (Terminal.sent.length>kMAX_LASTSENT)
				Terminal.sent.pop();
			Terminal.sentSelected=-1;
		}
	},
	
	
	spitback: function(cmd) {
		if (spitBack) {
			var spit=$('<span></span>').addClass('spit').text('> '+cmd);
			Terminal.channels[Terminal.curChanID].append(spit);
		}
	},
	
	
	// chanUpdate
	//	Retrieve for a specific channel
	chanUpdate: function(chanid) {
		if (!exists(Terminal.channels[chanid]) || chanid==0 || chanid=='chanlist') return;
		CommandStation.command("retrieve "+chanid+" "+Terminal.channels[chanid].msgid);	
	},
	
	
	// update
	//	Update ALL the channels by sending a RETRIEVAL request for each channel
	update: function() {
		if (!Terminal.userid) {
			// Logged Out
			if (retrieval_mode==kRETRIEVAL_NOCOMET)
				setTimeout(Terminal.update,kUPDATE_TIMER);
			return;
		}
		if (retrieval_mode==kRETRIEVAL_COMET_LONGPOLLING) {
			var updateReady=false; // Update is not ready if we have no channels to update (eg. serverchan, chanlist)
			try {
				var cmdStr='multiretrieve ';
				for (var i in Terminal.channels) {
					if (i==0 || i=='chanlist' || !Terminal.channels[i]) continue;
					updateReady=true;
					cmdStr+=i+' '+Terminal.channels[i].msgid+' ';
				}
				cmdStr=cmdStr.substring(0,cmdStr.length-1);
			} finally {
			
				// Ignore updateReady now that whispers are a factor (ie. user is in NO channels, but still wants to chat via. whispering)
				if (true || updateReady) {
					CommandStation.command(cmdStr);
				}
				else
					setTimeout(Terminal.update,800);
			}
		} else if (retrieval_mode==kRETRIEVAL_NOCOMET) {
			for (var i in Terminal.channels) {
				if (i==0 || i=='chanlist') continue;
				CommandStation.command("retrieve "+i+" "+Terminal.channels[i].msgid);	
			}
			setTimeout(Terminal.update,kUPDATE_TIMER);
		}
	},
	
	
	// msgDequeue
	//	Dequeue from the message queue and properly append the message to the associated channel
	msgDequeue: function() {
		if (shortenTextFunctionInUse) { setTimeout(function(){ Terminal.msgDequeue(); },1); return } // Don't append the message until we can safely trunctate it
		if (message=Terminal.msgQueue.shift()) {
			if (!exists(message.chanid) || !exists(Terminal.channels[message.chanid]))
				return;
			message.data.text(shortenText(message.data.text(),723)); // Shorten the text
			Terminal.channels[message.chanid].append(message.data); // Append this message
		}
		setTimeout(function(){ Terminal.msgDequeue(); },1);
	},
	
	
	// cycleSent
	//	Cycle through all the previously sent messages/commands
	//
	//	@direction: 1 to move forward, -1 to move backard, 0 to go back to home (blank)
	cycleSent: function(direction) {
		if (direction>0) {
			if (++Terminal.sentSelected>kMAX_LASTSENT) { Terminal.sentSelected=kMAX_LASTSENT; return; }
			if (!exists(Terminal.sent[Terminal.sentSelected])) { $(Terminal.prompt).val(Terminal.sent[--Terminal.sentSelected]); return; }
			$(Terminal.prompt).val(Terminal.sent[Terminal.sentSelected]);
		} else if (direction<0) {
			if (--Terminal.sentSelected<-1) { Terminal.sentSelected=-1; }
			if (Terminal.sentSelected==-1) { $(Terminal.prompt).val(""); }
			$(Terminal.prompt).val(Terminal.sent[Terminal.sentSelected]);
		} else if (direction==0) {
			Terminal.sentSelected=-1;
			$(Terminal.prompt).val("");
		}
	},
	
	
	
	// sanitizeMessage
	//	Properly sanitizes a message, by truncating it, adding colour, etc.
	sanitizeMessage: function(message) {
		
		// Truncate Text
		message=message.replace(/</g,'&lt;');	
		message=message.replace(/>/g,'&gt;');	
		message=shortenText(message,720);
		
		// Add Colour
		for (var i=colourMap.length; i>=0; i--) {
			while (message.indexOf('^'+i)!=-1) { 
				message=message.replace('^'+i,'<a style="color: '+colourMap[i]+'">');
			}
		}
		message=message+'</a>';
		
		// Replace with Emoticons
		for(var i in emoticonMap) {
			var regexp=new RegExp(i,'gi');
			message=message.replace(regexp,'<img class="emoticon" src="images/emoticons/'+emoticonMap[i]+'" />');
		}
		
		// Replace Links
		fixedMessage='';
		while((match=message.search(/((https{0,1}:\/\/)*www\.|https{0,1}:\/\/){1}[a-zA-Z0-9\-\_]{1,}\.[a-zA-Z]{2,5}[a-zA-Z0-9\/\-\_\.\?\=\&]*/i))>-1) {
			var txt=message.match(/((https{0,1}:\/\/)*www\.|https{0,1}:\/\/){1}[a-zA-Z0-9\-\_]{1,}\.[a-zA-Z]{2,5}[a-zA-Z0-9\/\-\_\.\?\=\&]*/i);
			txt=txt[0];
			if (txt.indexOf('http://')>0)
				txt='http://'+txt;
			fixedMessage+=message.substr(0,match)+'<a href="'+txt+'" target="_blank">'+txt+'</a>';
			message=message.substr(match+txt.length);
		}
		message=fixedMessage+message;
		
		
		return message;
	},
	
	
	// sanitizeDatetime
	//  Properly sanitizes a timestamp into the way we want to view it
	sanitizeDatetime: function(timestamp) {
		
		if (mobileEnabled)
			return "";
		
		// Change the Format
		var _timestamp=new Date(timestamp.replace(/-/g,'/')); // ISO 8601 Extended Format
		var date;
		if (isNaN(_timestamp.getSeconds()))
			date=new Date(timestamp);
		else
			date=_timestamp;
		date.setSeconds(date.getSeconds()-kOFFSET_TIMEFROMSERVER);
		var sec=date.getSeconds();
		if ((''+sec).length==1)
			sec='0'+sec;
		var minute=date.getMinutes();
		if ((''+minute).length==1)
			minute='0'+minute;
		var hours=date.getHours();
		if (hours>12)
			hours-=12;
		else if (hours==12)
			hours=12;
		timestamp=''+hours+':'+minute+':'+sec+'  ';
		
		// Wrap in proper styling
		//timestamp='<span class="time">'+timestamp+'</span> ';
		
		return timestamp;
	},

	

	
	
	
	
	
	/////////
	/// RECEIVE
	/////////////////////////
	// ...
	
	
	// print
	//	The default print message function, which always
	//	prints to the server window
	//
	//	html: The element to print to server window, in
	//		html format
	print: function(html) {
		Terminal.channels[0].append(html);
	},
	
	printMsg: function(msg) {
		var str=$('<span></span>').addClass('message').html(Terminal.sanitizeMessage(msg));
		Terminal.print(str);
	},
	
	
	rcvError: function(chanid,errcode,data) {
		// data { .response, .error }
		if (!Terminal.channels[chanid]) {
			Terminal.rcvError(0,errcode,data);
			return;
		}
		
		var str=$('<span></span>').addClass('error').text("Error: "+data.error);
		Terminal.channels[chanid].append(str);
	}, 
	
	
	rcvEvent: function(chanid,evtcode,data) {
		if (!Terminal.channels[chanid]) {
			Terminal.rcvEvent(0,evtcode,data);
			return;
		}
		
		var str=$('<span></span>').addClass('event').text(data.message);
		Terminal.channels[chanid].append(str);
	},
	
	
	rcvOldEvent: function(chanid,evtcode,data) {
		if (!Terminal.channels[chanid]) {
			Terminal.rcvEvent(0,evtcode,data);
			return;
		}
		
		var str=$('<span></span>').addClass('event').text(data.message);
		Terminal.channels[chanid].prepend(str);
	},
	
	
	rcvChanlist: function(data) {
		if (!Terminal.channels['chanlist'])
			Terminal.openWin('chanlist','Channels',null,false);
		Terminal.swapWin('chanlist');
		Terminal.channels['chanlist'].clear();
		var channels=$('<table/>').addClass('channels');
		for (var i in data.channels) {
			var channel=data.channels[i];
			var tablerow=$('<tr/>');
			var tablecol_channame=$('<td/>');
			var tablecol_count=$('<td/>');
			var tablecol_topic=$('<td/>');
			
			var channame=$('<a/>').attr('href','#').addClass('chan').addClass('unselectable').attr('channame',channel.name).text('#'+channel.name).click(function(){
				Terminal.command('/join #'+$(this).attr('channame'));
				return false; 
			}).appendTo(tablecol_channame);
			var chancount=$('<a/>').attr('href','#').addClass('chan').addClass('unselectable').attr('channame',channel.name).text('('+channel.users+')').click(function(){
				Terminal.command('/join #'+$(this).attr('channame'));
				return false; 
			}).appendTo(tablecol_count);
			var chantopic=$('<a/>').attr('href','#').addClass('chan').addClass('unselectable').attr('channame',channel.name).text(channel.topic).click(function(){
				Terminal.command('/join #'+$(this).attr('channame'));
				return false; 
			}).appendTo(tablecol_topic);
			
			tablerow.append(tablecol_channame);
			tablerow.append(tablecol_count);
			tablerow.append(tablecol_topic);
			channels.append(tablerow);
			/*var chan=$('<span></span>').addClass('chan').addClass('unselectable').attr('channame',channel.name).text('#'+channel.name+"\t("+channel.users+")\t\t\t"+channel.topic).bind('dblclick',function(){
				Terminal.command('/join #'+$(this).attr('channame'));
			});
			Terminal.channels['chanlist'].append(chan);	*/
		}
		Terminal.channels['chanlist'].append(channels);
	},
	
	rcvList: function(chanid,listid,list) {
		if (!Terminal.channels[chanid]) {
			Terminal.rcvList(0,listid,list);
			return;
		}
		
		var title="";
		if (listid==1) { title="List of Users"; }
		else if (listid==2) { title="List of Operators"; }
		else if (listid==4) { title="List of Bans"; }
		
		var content="";
		for (var i in list) {
			// [status nick] (IP): !strict {until}, "reason"
			if (list[i].nick)
				content+=(list[i].status=='operator'?'@':list[i].status=='voice'?'+':'')+list[i].nick+' ';
			content+='('+list[i].ip+')';
			if (listid==4) {
				content+=': ';
				if (list[i].strict)
					content+='!'+list[i].strict+' ';
				if (list[i].until)
					content+='{'+list[i].until+'} ';
				if (list[i].reason)
					content+='"'+list[i].reason+'"';
				
			}
			content+='\n';
		}
		if (list.length==0) {
			content="  *empty*  ";	
		}
		
		var str=$('<span></span>').addClass('list').text(title+'\n\n'+content);
		Terminal.channels[chanid].append(str);
	},
	
	
	rcvMessage: function(chanid,data) {
		if (!Terminal.channels[chanid]) {
			Terminal.rcvMessage(0,data);
			return;
		}
		var timestamp=Terminal.sanitizeDatetime(data.timestamp);
		var str=$('<span></span>').addClass('message').html(Terminal.sanitizeMessage(timestamp+data.nick+" says: "+data.message));
		if (data.userid==Terminal.userid)
			str.addClass('personal');
		Terminal.channels[chanid].append(str);
	},
	
	rcvOldMessage: function(chanid,data) {
		if (!Terminal.channels[chanid]) {
			return;
		}
		var timestamp=Terminal.sanitizeDatetime(data.timestamp);
		var str=$('<span></span>').addClass('message').html(Terminal.sanitizeMessage(timestamp+data.nick+" says: "+data.message));
		Terminal.channels[chanid].prepend(str);
	},
	
	
	rcvAction: function(chanid,data) {
		if (!Terminal.channels[chanid]) {
			Terminal.rcvMessage(0,data);
			return;
		}
		var timestamp=Terminal.sanitizeDatetime(data.timestamp);
		var str=$('<span></span>').addClass('action').html(Terminal.sanitizeMessage(timestamp+' *'+data.nick+" "+data.message));
				if (data.userid==Terminal.userid)
			str.addClass('personal');
		Terminal.channels[chanid].append(str);
	},
	
	rcvOldAction: function(chanid,data) {
		if (!Terminal.channels[chanid]) {
			return;
		}
		var timestamp=Terminal.sanitizeDatetime(data.timestamp);
		var str=$('<span></span>').addClass('action').html(Terminal.sanitizeMessage(timestamp+' *'+data.nick+" "+data.message));
		Terminal.channels[chanid].prepend(str);
	},
	
	rcvWhisper: function(data) {
		var timestamp=Terminal.sanitizeDatetime(data.timestamp);
		var str=$('<span></span>').addClass('whisper').html(Terminal.sanitizeMessage(timestamp+' ^15-^7'+data.nick+"^15-^1  "+data.message));
		if (Terminal.curChanID!='chanlist') {
// TODO: Why doesn't STR work here, but putting the EXACT same contents directly as an arg work??
			Terminal.channels[Terminal.curChanID].append($('<span></span>').addClass('whisper').html(Terminal.sanitizeMessage('^15'+timestamp+' ^15-^7'+data.nick+'^15-^1 '+data.message)));
		}
		if (Terminal.curChanID!=0)
			Terminal.channels[0].append(str);
	},
	
	rcvWhisperSend: function(data) {
		var now=new Date();
		var timestamp=Terminal.sanitizeDatetime(now.toString());
		var str=$('<span></span>').addClass('whisper').html(Terminal.sanitizeMessage(timestamp+' ^15-^2'+Terminal.usernick+"^15-^1  "+data.message));
		if (Terminal.curChanID!='chanlist') {
// TODO: Why doesn't STR work here, but putting the EXACT same contents directly as an arg work??
			Terminal.channels[Terminal.curChanID].append($('<span></span>').addClass('whisper').html(Terminal.sanitizeMessage('^15'+timestamp+' ^15-^2'+data.nick+'^15-^1 '+data.message)));
		}
		if (Terminal.curChanID!=0)
			Terminal.channels[0].append(str);
	},
	
	rcvData: function(chanid,data) {
		if (!Terminal.channels[chanid]) {
			Terminal.rcvData(0,data);
			return;
		}
		
		var str=$('<span></span>').addClass('data').text(objToStr(data));
		Terminal.channels[chanid].append(str);
	},
	
	rcvHelp: function(chanid,data) {
		if (!Terminal.channels[chanid]) {
			Terminal.rcvHelp(0,data);
			return;
		}
		
		var str=$('<span></span>').addClass('help').html('\n'+data.help+(data.def?"\n\tdefinition: "+data.def:'')+(data.example?"\n\texample: "+data.example:''));
		Terminal.channels[chanid].append(str);
	},
	
	
	
	
	
	updateMsgID: function(chanid,msgid) {
		if (!exists(Terminal.channels[chanid]))
			return false;
		Terminal.channels[chanid].msgid=msgid;
	},
	
	refocus: function() {
		Terminal.prompt.focus();	
	},
	
	
	// addUser
	//	Add a given user to the given channel
	//
	//	@chanid
	//	@user
	addUser: function(chanid,user) {
		if (!exists(Terminal.channels[chanid]))
			return false;
		Terminal.channels[chanid].users.push(user);
		if (Terminal.curChanID==chanid)
			Terminal.loadUsers(Terminal.channels[chanid].users);
	},
	
	// remUser
	//	Remove a given user from the userlist of a channel
	//
	//	@chanid
	//	@userid
	remUser: function(chanid,userid) {
		if (!exists(Terminal.channels[chanid]))
			return false;
		var users=Terminal.channels[chanid].users;
		var index=null;
		for (var i in users) {
			if (users[i].id==userid) {
				index=i;
				break;	
			}
		}
		if (index==null)
			return false;

		users.splice(index,1);
		if (Terminal.curChanID==chanid)
			Terminal.loadUsers(users);
	},
	
	// setUserStatus
	//	Sets a given users operator status
	//
	//	@chanid
	//	@userid
	//	@status: {'operator','voice',''}
	setUserStatus: function(chanid,userid,status) {
		if (!exists(Terminal.channels[chanid]))
			return false;
		var users=Terminal.channels[chanid].users;
		for (var i in users) {
			if (users[i].id==userid) {
				users[i].status=status;
				break;	
			}
		}
		if (Terminal.curChanID==chanid)
			Terminal.loadUsers(users);
	},
	
	
	setChanTopic: function(chanid,topic) {
		if (!exists(Terminal.channels[chanid]))
			return false;
		Terminal.channels[chanid].topic=topic;
		Terminal.channels[chanid].loadTopic();
	},
	
	setChanMode: function(chanid,mode) {
		if (!exists(Terminal.channels[chanid]))
			return false;
		Terminal.channels[chanid].mode=mode;
	},
	
	
	
	
	
	
	/////////
	/// WINDOW HANDLING
	/////////////////////////
	// ChattyWith.me allows multiple windows in the Terminal, with 1 active window (channel)
	//	being displayed at any given time. The Server (starting) window is represented as chanid=0
	//	and cannot be closed
	
	
	
	// openWin
	//	Opens a new window within the terminal
	//
	//	@chanid
	//	@title: title of the new window
	//	@users: list of users in the chatroom
	//	@swapto: true to swapWin to this newly created window
	openWin: function(chanid,title,users,swapto) {
		if (Terminal.channels[chanid])
			return false; // Channel Window already exists!
		
		var chanlist=$('.channelinfo');
		var chan=new Channel(chanid,users,title);
		Terminal.channels[chanid]=chan;
		chan.button=$('<a></a>').attr('href','#').attr('chanid',chanid).addClass('chanbutton').text('').click(function(){
			Terminal.swapWin(chanid);
			return false;
		}).appendTo(chanlist);
		chan.button.append('<a style="display:block;">'+title+'</a>');
		$('<a/>').addClass('chanClose').text('x').attr('href','').attr('chanid',chanid).css({ 'margin-top':'-24px' }).click(function(){
			Terminal.command("/leave "+$(this).attr('chanid'));
			Terminal.prompt.focus();
			return false; 
		}).appendTo(chan.button);
		if (mobileEnabled) {
			chan.console=$('<channel/>').attr('chanid',chanid).attr('id','chan'+chanid).appendTo($('#console-hidden'));
		}
		else {
			chan.console=$('<channel/>').attr('chanid',chanid).attr('id','chan'+chanid).appendTo($('.console')).mousedown(function(event){
				if (event.which==3) {
					Terminal.chanmenu.open(event,$(this).attr('chanid'));	
				}
			});
		//if (mobileEnabled)
		//	chan.console.remove().appendTo($('#console-hidden'));
		}
		if (chanid!=0 && chanid!='chanlist') {
			var loadOlder=$('<a></a>').attr('href','#').attr('name','loadOlder').addClass('enabled').text("Load Older Messages").click(function(){
				CommandStation.command("retrieveold "+chanid+" "+Terminal.channels[chanid].minmsgid);	
				return false;
			});
			if (mobileEnabled) {
				var li=$('<li/>').append(loadOlder).prependTo(chan.console);
				chan.loadOlder=loadOlder;
				setTimeout(function(){
				loadOlder.click(function(){
					CommandStation.command("retrieveold "+chanid+" "+Terminal.channels[chanid].minmsgid);	
					return false;
				});
				},0);
			} else {
				loadOlder.prependTo(chan.console);
				chan.loadOlder=loadOlder;
			}
		}
		
		if (swapto)
			Terminal.swapWin(chanid);
	},
	
	
	// swapWin
	//	Change the given viewport window
	//
	//	@chanid
	swapWin: function(chanid) {
		if (!Terminal.channels[chanid])
			return false; // Channel does not exist!
		Terminal.channels[Terminal.curChanID].hide();
		Terminal.channels[chanid].open();
		var oldChanid=Terminal.curChanID;
		Terminal.curChanID=chanid;
		
		if (!mobileEnabled) {
			Terminal.prompt.focus();
			
			// Re-enable the channel-menu for this chan
			if (Terminal.chanmenu) {
				Terminal.chanmenu.lMenu.remove();
				Terminal.chanmenu=null;
			}
			Terminal.chanmenu=new chanMenu();
			Terminal.chanmenu.chanid=chanid;
		}
		else {
			Terminal.channels[chanid].console.focus();
			if (Terminal.channels[oldChanid].msgInformer)
				Terminal.channels[oldChanid].msgInformer.turnOff();
		}
		
	},
	
	
	// closeWin
	//	Close the given viewport window
	//
	//	@chanid
	closeWin: function(chanid) {
		if (chanid==0) {
			Terminal.rcvError(0,null,{error:"You may not close the Server window"});
			return;	
		} else if (!Terminal.channels[chanid])
			return false; // Channel does not exist!
		
		Terminal.channels[chanid].close();
			
		if (Terminal.curChanID==chanid)
			Terminal.swapWin(0);
		delete Terminal.channels[chanid];
	},
	
	
	// loadUsers
	//	Loads all the given users into the users-panel
	//
	//	@users
	loadUsers: function(users) {
		var lUsers=$('div.users');
		lUsers.html('');
		for(var i in users) {
			var user=users[i];
			var lUser=$('<a></a>').addClass('user').attr('href','').attr('sel','false').attr('userid',user.id).attr('nick',user.nick).attr('ip',user.ip).attr('status',user.status).text((user.status?(user.status=='operator'?"@":"+"):"")+user.nick).appendTo(lUsers).mousedown(function(event){
				$('a.user[sel="true"]',lUsers).attr('sel','false');
				$(this).attr('sel','true');
				$(this).addClass('selected');
				//$('.actions').attr('selected',true).attr('chanid',html('User: <b>'+$(this).attr('nick')+'</b>/n'+'userid (<b>'+$(this).attr('userid')+'</b>)\n'+'IP:  <i>'+$(this).attr('ip')+'</i>\n');
				
				if (event.which==3) {
					// Right click (pop menu)
					Terminal.usermenu.open(event,Terminal.curChanID,$(this).attr('userid'),$(this).attr('nick'),$(this).attr('ip'),$(this).attr('status'));
				}
				
				Terminal.refocus();
			}).click(function(){ return false; });
		}
	},
	
	showColourWin: function() {
		this.colourwin.open();
	},
	
	hideColourWin: function() {
		this.colourwin.close();
	},
	
	
	// setupTerminal
	setupTerminal: function() {
		
	
		
		//
		// Setup the Terminal prompt
		/////////////////////////
		
		Terminal.prompt=$('form[name="prompt"] input[type="text"]');
		Terminal.prompt.attr('maxlength',promptMaxlen);
		Terminal.prompt.bind('keydown',function(event) {
			if (event.which==38) // Up
				Terminal.cycleSent(1);
			else if (event.which==40) // Down
				Terminal.cycleSent(-1);
			else if (event.which==promptCycleHome) // Home
				Terminal.cycleSent(0);
			else if (event.which==54 && event.shiftKey) {
				Terminal.showColourWin();
			}
			else
				Terminal.hideColourWin();
		}).bind('input',function(event){
			if (encodeURI($(this).val()).length>506)
				$(this).val($(this).attr('safeguard'));
			else
				$(this).attr('safeguard',$(this).val());
		}).attr('safeguard','');
		Terminal.prompt.css({ 'margin-left':0, 'width': $('.leftpanelinner').width()-4 });
			
		
		
		
		
		//
		// Setup the Console Channel-Slider
		//////////////////////////
		$('.channislide').attr('held','false').bind('mousedown',function(event){
			$(this).attr('held','true');
			var channi=$('.channelinfo');
			
			var inst=$(this);
			var dir=$(this).hasClass('left')?-channiSliderAmt:channiSliderAmt;
			var slide=function(){ 
				if (inst.attr('held')=='true') {
					var pos=parseInt(channi.css('margin-left'));
					
					var firstChan=$('.chanbutton:first');
					var startPos=firstChan.offset().left;
					var startOfContainer=$('.channislide.right').offset().left+$('.channislide.right').width()+5;
					var sTop=firstChan.offset().top;
					
					var lastChan=$('.chanbutton:last');
					var endPos=lastChan.offset().left+lastChan.width();
					var endOfContainer=$('.leftpanelinner').offset().left+$('.leftpanelinner').width();
					var eTop=lastChan.offset().top;
					if (dir<0 && startPos>startOfContainer) return;
					else if (dir>0 && (endPos<endOfContainer && sTop==eTop)) return;
					
					channi.css({'margin-left':pos-dir});
					setTimeout(slide,channiSliderSpd);
				}
			};
			slide();
			return false;
		}).bind('mouseup',function(){ $(this).attr('held','false'); return false;
		}).click(function(){ return false; });
		
		
		
		// 
		// Setup the Command-Send form
		////////////////////////////
		$('form[name="prompt"]').submit(function() {
			Terminal.command(Terminal.prompt.val());
			Terminal.prompt.val('');
			Terminal.prompt.attr('safeguard','');
			return false;
		});
		
		
			
			
			
		//
		// Setup Menu's
		////////////////////
		Terminal.usermenu=new userMenu();
		Terminal.colourwin=new colourWin(Terminal.prompt);
		setMenuClearing();
		
		$(':not(head)').each(function(){ $(this).keypress(function(){ Terminal.prompt.focus(); }); });
		
		
		if (!mobileEnabled) {
		
			// Sortable Channel Buttons
			$( ".channelinfo" ).sortable({
				revert: true
			});
			
			// Title Message Notification
			Terminal.msgNotification();
			
			// Setup Arrow-Messager Triggering
			$('.console').scroll(function(){
				var chanid=$('.console .open').attr('chanid');
				if (getScrollFromBottom()==0) {
					Terminal.channels[chanid].msgInformer.turnOff();
				} else {
					var top=$('.console').scrollTop()+$('.console').height();
					Terminal.channels[chanid].msgInformer.reposition(top);
				}
			});
			
			// Emoticon Button
			Terminal.emotewin=new emoteWin(Terminal.prompt);
			$('#emoteButton').click(function(){
				if (Terminal.emotewin.isopen())
					Terminal.emotewin.close();
				else
					Terminal.emotewin.open();
				return false;
			});
		} else {
		}
		
		
		
		// 
		// Setup Settings Panel
		///////////////////////////
		var settings_rm_iframe=$('form[name="settings"] [name="comet_mode"][value="iframe"]').prop('checked', (retrieval_mode==kRETRIEVAL_COMET_IFRAME));
		var settings_rm_longpoll=$('form[name="settings"] [name="comet_mode"][value="longpoll"]').prop('checked', (retrieval_mode==kRETRIEVAL_COMET_LONGPOLLING));
		if (mobileEnabled) {
				settings_rm_iframe.checkboxradio("refresh");
				settings_rm_longpoll.checkboxradio("refresh");
		}
		settings_rm_iframe.bind('change',function(){
			if (retrieval_mode==kRETRIEVAL_COMET_IFRAME)
				return;
			retrieval_mode=kRETRIEVAL_COMET_IFRAME;
			if (typeof localStorage!='undefined')
				localStorage.setItem('retrieval_mode',kRETRIEVAL_COMET_IFRAME);
			setTimeout(function(){ CommandStation.pingCheckMessage(); },1500);
		});
		settings_rm_longpoll.bind('change',function(){
			if (retrieval_mode==kRETRIEVAL_COMET_LONGPOLLING)
				return;
			$('iframe').remove();
			retrieval_mode=kRETRIEVAL_COMET_LONGPOLLING;
			if (typeof localStorage!='undefined')
				localStorage.setItem('retrieval_mode',kRETRIEVAL_COMET_LONGPOLLING);
			Terminal.update();
		});
		
		
		var settings_theme=$('form[name="settings"] [name="theme"]').bind('change',function(){
			// Remove Previous Theme
			if (theme)
				$('head link[href="styles/'+theme+'"]').remove();
			theme=themeMap[$(':selected',this).val()];
			if (theme)
				$('<link/>').attr('href','styles/'+theme).attr('type','text/css').attr('rel','stylesheet').appendTo($('head'));
			if (typeof localStorage!='undefined')
				localStorage.setItem('theme',$(':selected',this).val());
		});
		for (var i in themeMap) {
			$('<option/>').val(i).text(i).appendTo(settings_theme);	
		}
		if (theme)
			$('<link/>').attr('href','styles/'+theme).attr('type','text/css').attr('rel','stylesheet').appendTo($('head'));
		var theme_key=get_key(themeMap,theme);
		if (theme_key)
			$('[value="'+theme_key+'"]',settings_theme).prop('selected',true);
		
		
	},
	
	msgNotification: function() {
		if (mobileEnabled)
			return;
		if (windowOpened)
			notify=false;
		else if (!notify) {
			var chans=$('.channelinfo .chanbutton.unread[chanid!="0"]');
			if (chans.length)
				notify=true;
		}
		
		
		
		if (!notify) {
			// Turn notification title off
			$('title').attr('notify','0');
			$('title').text('ChattyWith.me -- An AJAX approach to IRC');	
		} else if (!windowOpened) {
			// Trigger notification title	
			iNotify=!parseInt($('title').attr('notify'));
			$('title').attr('notify',iNotify?"1":"0");
			if (iNotify)
				$('title').text(' --- Message Notifcation --- ');
			else
				$('title').text('ChattyWith.me -- An AJAX approach to IRC');
		}
		
		setTimeout(Terminal.msgNotification,1000);
	},
}


/* Channel   (class)
 * 
 *		The Channel class takes care of all channel-specific
 *	functionality. Everything from opening, closing, viewing
 *	and hiding the channel window (window management), and
 *	sending message/events to the channel window.
 *
 *
 *
 *  requirements:   jQuery (tested on 1.6.2)
 *
 *	usage:	...
 ****************************/
function Channel(chanid,users,name) {
	
	// Channel Fieldset
	this.chanid=chanid;
	this.name=name;
	this.users=users;
	this.topic="";
	this.mode=0; // Moderated -m
	
	// DOM Objects
	this.button=null;
	this.console=null;
	this.loadOlder=null;
	
	
	this.minmsgid=null; // The earliest-loaded msgid
	this.msgid=null;
	this.reachedStart=null; // TRUE if we cannot load any earlier messages, due to reaching the end already
	this.mobilescroll=null; // iScroll
	this.msgInformer=null; // Arrows that will be displayed at the bottom of the channel window when new messages are received and we are scrolled up
}
Channel.prototype.open=function(){
	$(this.button).addClass('open');
	$(this.button).removeClass('unread');
	$(this.console).addClass('open');
	$('.console').scrollTop($(this.console).height()-$('.console').height()+20);
	
	Terminal.loadUsers(this.users);
	this.loadTopic();
	setMenuClearing();
	if (mobileEnabled) {
		var that=this;
		$(function(){
			$(that.console).remove().appendTo($('.console'));
		});
		setTimeout(function(){
			this.loadTopic();
			/*var title=(that.chanid==0?'Server':
						that.chanid=='chanlist'?'Channel Listing':
						(that.topic!=null && that.topic!='') ?
							'#'+(that.name)+' - '+that.topic:
							'#'+(that.name));
			$('header .ui-title').text(title);*/
		},0);
	}// else {
	if (!this.msgInformer) {
		this.msgInformer=new ArrowMessager();
		this.msgInformer.create(this.console);
	}
	//}	
};
Channel.prototype.hide=function(){
	$(this.button).removeClass('open');
	$(this.console).removeClass('open');
	if (mobileEnabled) {
		$(this.console).remove().appendTo($('#console-hidden'));
		if (consoleScroller) {
			consoleScroller.destroy();
			consoleScroller=null;
		}
	}// else {
		if (this.msgInformer)
			this.msgInformer.turnOff();
	//}
};
Channel.prototype.close=function(){
	$(this.button).remove();
	$(this.console).remove();
	if (this.msgInformer)
		this.msgInformer=null;
};
Channel.prototype.append=function(data){
	var needToScroll=getScrollFromBottom()<=0;
	if (mobileEnabled) {
		$('<li/>').append(data).appendTo(this.console);
	}
	else {
		$('<br/>').appendTo($(this.console));
		$(this.console).append(data)
	}
	if (Terminal.curChanID==this.chanid) {
		if (mobileEnabled) {
			this.refresh(needToScroll && ($('#subconsole').height()+32>$('.console').height()));
			if (!needToScroll)
				this.msgInformer.turnOn();
		}
		else {
			if (needToScroll) {
				// Scroll to the bottom
				var height=$(this.console).height();
				var autoScroll=function(){$('.console').scrollTop(height-$('.console').height()+20);};
				autoScroll();
				setTimeout(autoScroll,350); // Necessary in the case of emoticons
			} else {
				// Flashing arrow to inform us of new messages
				this.msgInformer.turnOn();
			}
		}
	}
	if (!$(this.button).hasClass('open'))
		$(this.button).addClass('unread');
	else if (!windowOpened && this.chanid!=0 && this.chanid!='chanlist')
		notify=true;
};
Channel.prototype.prepend=function(data){
	
	if (mobileEnabled) {
		var li=$('<li/>').append(data);
		$(this.loadOlder).parent('li').after(li);
		this.refresh(false);
	} else {
		$(this.loadOlder).after('<br/>');
		$(this.loadOlder).after(data);
	}
	if (!$(this.button).hasClass('open'))
		$(this.button).addClass('unread');
};
Channel.prototype.print=function(data){
	this.append(objToStr(data));
};
Channel.prototype.clear=function(){
	$(this.console).html('');
};
Channel.prototype.loadTopic=function(){
	if (mobileEnabled) {
		var that=this;
		setTimeout(function(){
			var title=(that.chanid==0?'Server':
						that.chanid=='chanlist'?'Channel Listing':
						(that.topic!=null && that.topic!='') ?
							'#'+(that.name)+' - '+that.topic:
							'#'+(that.name));
			$('header .ui-title').text(title);
		},0);
	} else {
		$('div.topic span').text(this.topic);
	}
};
Channel.prototype.backToStart=function(){
	$(this.loadOlder).addClass('disabled');
};
Channel.prototype.refresh=function(autoScroll){
	mobi_adjustChan_valign();
};


function ArrowMessager(chan) {
	// Settings
	this.kUPDATE_TIMER=150;
	this.kMAX_OPACITY=0.7;
	this.kMIN_OPACITY=0.15;
	this.kANIMATION_SPEED=650;
	this.kAUTO_SCROLL_SPEED=215;
	
	this.lObj=null;
	this.lImg=null;
	this.container=null;
	this.on=false;
	this.animating=false;
	this.opacity=this.kMAX_OPACITY;
}
ArrowMessager.prototype.create=function(lChan){
	// Create the ArrowMessager
	this.container=lChan;
	this.lImg=$('<img/>').attr('src','images/arrow-msginformer.png').css({
		position: 'relative',
		top: 0,
		border: 'none',
	});
	this.lObj=$('<a/>').addClass('arrow-informer').attr('chanid',lChan.attr('chanid')).attr('href','#').click(function(){
		// Auto scroll to bottom here (animated)
		var that=Terminal.channels[$(this).attr('chanid')].msgInformer;
		if (!mobileEnabled) {
			$('.console').animate({
				scrollTop: ($('.console .open').height()-$('.console').height())
			}, that.kAUTO_SCROLL_SPEED);
		} else {
			//var lastEl=$('#subconsole ul :last(li)');
			//var height=$('#subconsole').offset().top-lastEl.offset().top-(2*lastEl.height());
			//consoleScroller.scrollTo(0,height,1);
			setTimeout(function(){ consoleScroller.scrollTo(0,-($('#subconsole').height()-$('.console').height()),1); },0);
			//consoleScroller.y=height;
		}
		that.turnOff();
		return false;
	}).css({
		opacity: this.opacity,
		position: 'absolute',
	}).append(this.lImg).appendTo(lChan).hide();
	this.update(this);
	return this.lObj;
};
ArrowMessager.prototype.update=function(that){
	// Update -- this will be called on regular intervals
	//	If turned on, it will animate the flashing (opacity) of these arrows
	if (!that.on || that.animating) {
		setTimeout(that.update,that.kUPDATE_TIMER,that);
		return;	
	}
	
	// Time to start animating this!
	var that=that;
	var toOpacity=(that.opacity>=that.kMAX_OPACITY?that.kMIN_OPACITY:that.kMAX_OPACITY);
	that.lObj.animate({
		opacity: toOpacity,
	}, that.kANIMATION_SPEED, function(){
		that.opacity=toOpacity;
		that.animating=false;
	});
	that.animating=true;
	setTimeout(that.update,that.kUPDATE_TIMER,that);
};
ArrowMessager.prototype.turnOn=function(){
	this.on=true;
	this.lObj.show();
	var that=this;
	
	// Bouncing effect
	this.lObj.animate({ opacity: 0.9 }, 10);
	this.lImg.animate({
		top: -25
	}, 180, function(){
		that.lImg.animate({
			top: 0	
		}, 100, function(){
			that.lImg.animate({
				top: -12
			}, 120, function(){
				that.lImg.animate({
					top: 0
				}, 40, function(){
					that.lImg.animate({
						top:-6
					}, 60, function(){
						that.lImg.animate({
							top:0
						}, 15);
					})
				})
			})
		})
	});
	
	if (mobileEnabled) {
		var that=this;
		var xtop=-consoleScroller.y+$('.console').height();
		setTimeout(function(){ that.reposition(xtop); },100);
	}
};
ArrowMessager.prototype.turnOff=function(){
	this.on=false;
	this.lObj.hide();
};
ArrowMessager.prototype.reposition=function(top){
	var offset=-5;
	if (mobileEnabled)
		offset+=20;
	this.lObj.css({ top: (top-this.lObj.height()-offset) });
};

/************************************ END OF CLASS DEFINITION *****************************************/


var userMenu=function() {
	this.isopen=false;
	this.chanid=null;
	this.userid=null;
	this.usernick=null;
	this.userip=null;
	this.userstatus=null;
	
	this.lMenu=$('<div/>').addClass('usermenu').html(" \
		<a handler='whois'>Whois</a> \
		<hr/> \
		<a handler='kick'>Kick</a>	\
		<a handler='ban5m'>Kick&Ban 5 minutes</a>	\
		<a handler='ban15m'>Kick&Ban 15 minutes</a>	\
		<a handler='ban1h'>Kick&Ban 1 hour</a>	\
		<a handler='ban1d'>Kick&Ban 1 day</a>	\
		<a handler='banperma'>Perma Ban!</a>	\
		<hr/> \
		<a handler='setops'>Set Chanop</a>	\
		<a handler='setvoice'>Set Voiceop</a>	\
		<a handler='remops'>Remove Ops</a>	\
		<hr/>	\
		<a handler='actionkiss'>Kiss</a>	\
		<a handler='actionpoke'>Poke</a>	\
		<a handler='actionslap'>Slap</a>	\
		").appendTo($('body')).attr('oncontextmenu','return false;');
	$('a',this.lMenu).each(function(){ $(this).attr('href','#').click(function(){
		if ($(this).hasClass('disabled'))
			return false;
		
		var handler=$(this).attr('handler');
		if (handler=='whois') {
			Terminal.spitback('Whois user: '+Terminal.usermenu.usernick);
			CommandStation.command("whois "+Terminal.usermenu.usernick);
		}
		else if (handler=='kick') {
			Terminal.spitback('Kick user: '+Terminal.usermenu.usernick);
			CommandStation.command("kick "+Terminal.usermenu.usernick+" get out!",Terminal.usermenu.chanid);
		}
		else if (handler=='ban5m') {
			Terminal.spitback('Ban user: '+Terminal.usermenu.usernick+' [5 minutes]');
			CommandStation.command("ban "+Terminal.usermenu.usernick+" !strict for:\"5 minutes\"",Terminal.usermenu.chanid);
			CommandStation.command("kick "+Terminal.usermenu.usernick+" banned!",Terminal.usermenu.chanid);
		}
		else if (handler=='ban15m') {
			Terminal.spitback('Ban user: '+Terminal.usermenu.usernick+' [15 minutes]');
			CommandStation.command("ban "+Terminal.usermenu.usernick+" !strict for:\"15 minutes\"",Terminal.usermenu.chanid);
			CommandStation.command("kick "+Terminal.usermenu.usernick+" banned!",Terminal.usermenu.chanid);
		}
		else if (handler=='ban1h') {
			Terminal.spitback('Ban user: '+Terminal.usermenu.usernick+' [1 hour]');
			CommandStation.command("ban "+Terminal.usermenu.usernick+" !strict for:\"1 hour\"",Terminal.usermenu.chanid);
			CommandStation.command("kick "+Terminal.usermenu.usernick+" banned!",Terminal.usermenu.chanid);
		}
		else if (handler=='ban1d') {
			Terminal.spitback('Ban user: '+Terminal.usermenu.usernick+' [1 day]');
			CommandStation.command("ban "+Terminal.usermenu.usernick+" !strict for:\"1 day\"",Terminal.usermenu.chanid);
			CommandStation.command("kick "+Terminal.usermenu.usernick+" banned!",Terminal.usermenu.chanid);
		}
		else if (handler=='banperma') {
			Terminal.spitback('Ban user: '+Terminal.usermenu.usernick+' [!strick permanently]');
			CommandStation.command("ban "+Terminal.usermenu.usernick+" !ipany !strict for:\"10 years\"",Terminal.usermenu.chanid);
		}
		else if (handler=='setops') {
			Terminal.spitback('Give +O chanops to user: '+Terminal.usermenu.usernick);
			CommandStation.command("setops +O "+Terminal.usermenu.usernick,Terminal.usermenu.chanid);
		}
		else if (handler=='setvoice') {
			Terminal.spitback('Give +v voiceops to user: '+Terminal.usermenu.usernick);
			CommandStation.command("setops +v "+Terminal.usermenu.usernick,Terminal.usermenu.chanid);
		}
		else if (handler=='remops') {
			Terminal.spitback('Remove operator status from user: '+Terminal.usermenu.usernick);
			CommandStation.command("setops -O "+Terminal.usermenu.usernick,Terminal.usermenu.chanid);
		}
		else if (handler=='actionkiss')
			CommandStation.command("me gives "+Terminal.usermenu.usernick+" a big fat ^4juicy^2 kiss",Terminal.usermenu.chanid);
		else if (handler=='actionpoke')
			CommandStation.command("me pokes "+Terminal.usermenu.usernick+" like the pillsbury dough boy!",Terminal.usermenu.chanid);
		else if (handler=='actionslap')
			CommandStation.command("me slaps "+Terminal.usermenu.usernick+" around with a large trout",Terminal.usermenu.chanid);
		return false;
	}); });
	this.open=function(e,chanid,userid,usernick,userip,userstatus){  
		this.isopen=true;  
		this.chanid=chanid;
		this.userid=userid;
		this.usernick=usernick;
		this.userip=userip;
		this.userstatus=userstatus;
		var leftPos=e.pageX;
		if (leftPos+this.lMenu.css('width')>window.innerWidth)
			leftPos=e.pageX-(leftPos+parseInt(Terminal.usermenu.lMenu.css('width'))-window.innerWidth);
		this.lMenu.addClass('open').css({
				left:leftPos, 
				top:e.pageY
		}); 
	};
	this.close=function(){ this.isopen=false; this.lMenu.removeClass('open'); };
}



var chanMenu=function() {
	this.isopen=false;
	this.chanid=null;
	
	this.lMenu=$('<div/>').addClass('chanmenu').html(" \
		<a handler='info' class='disabled'>Channel Info</a> \
		<hr/> \
		<a handler='showop'>Show Operators</a>	\
		<a handler='showbans'>List Bans</a>	\
		<a handler='showusers'>List Users</a>	\
		").appendTo($('body')).attr('oncontextmenu','return false;');
	var that=this;
	$('a',this.lMenu).each(function(){ $(this).attr('href','#').click(function(){
		if ($(this).hasClass('disabled'))
			return false;
		
		var handler=$(this).attr('handler');
		if (handler=='showop') {
			Terminal.spitback('/getlist operators');
			CommandStation.command("getlist operators",that.chanid);
			that.close();
		}
		else if (handler=='showbans') {
			Terminal.spitback('/getlist bans');
			CommandStation.command("getlist bans",that.chanid);
			that.close();
		}
		else if (handler=='showusers') {
			Terminal.spitback('/getlist users');
			CommandStation.command("getlist users",that.chanid);
			that.close();
		}
		return false;
	}); });
	this.open=function(e,chanid){  
		this.isopen=true;  
		this.chanid=chanid;
		var leftPos=e.pageX;
		if (leftPos+this.lMenu.css('width')>window.innerWidth)
			leftPos=e.pageX-(leftPos+parseInt(Terminal.chanmenu.lMenu.css('width'))-window.innerWidth);
		this.lMenu.addClass('open').css({
				left:leftPos, 
				top:e.pageY
		}); 
	};
	this.close=function(){ this.isopen=false; this.lMenu.removeClass('open'); };
}


var colourWin=function(prompt) {
	
	this.prompt=prompt;
	this.lWin=$('<div/>').attr('id','colourwin').css({
		margin: '-110px 0 0 20px',
		position: 'absolute',
		display: 'block',
	}).appendTo($('.prompt')).hide();
	
	for (var i in colourMap) {
		if (i%4==0 && i>0)
			$('<br/>').appendTo(this.lWin);
		var that=this;
		colourCode=i;
		colour=colourMap[i];
		var a=$('<a/>').attr('href','#').attr('colourCode',colourCode).attr('colour',colour).addClass('colour').css({
			background: colour,
		}).click(function(){
			that.prompt.val(that.prompt.val().substr(0,that.prompt[0].selectionStart)+$(this).attr('colourCode')+that.prompt.val().substr(that.prompt[0].selectionStart));
			that.close();
			return false;
		}).appendTo(this.lWin);
		
		// Note: '' is a CLEAR-COLOUR code
		if (colour=='') {
			a.css({ background: 'black', color: 'red', overflow: 'hidden', top: -2, position: 'relative', 'text-decoration': 'none' }).text('X');
		}
	}
	
	
	this.open=function(){
		this.lWin.show();
		this.lWin.css({	});
	};
	this.close=function(){ this.lWin.hide(); };
	
}

var emoteWin=function(prompt) {
	
	this.sanitizeCode=function(str){
		str=str.replace(/\\:/g,':');
		str=str.replace(/\\;/g,';');
		str=str.replace(/\\@/g,'@');
		str=str.replace(/\\\(/g,'(');
		str=str.replace(/\\\)/g,')');
		str=str.replace(/\\\[/g,'[');
		str=str.replace(/\\\]/g,']');
		str=str.replace(/\\{/g,'{');
		str=str.replace(/\\}/g,'}');
		str=str.replace(/\\\\/g,'\\');
		str=str.replace(/\\\//g,'/');
		str=str.replace(/\\=/g,'=');
		
		str=str.replace(/\\\'/g,'\'');
		str=str.replace(/\\\"/g,'"');
		str=str.replace(/\\\+/g,'+');
		str=str.replace(/\\\^/g,'^');
		str=str.replace(/\\\*/g,'*');
		return str;
	};
	
	this.prompt=prompt;
	this.lWin=$('<div/>').attr('id','emotewin').css({
		float: 'right',
		display: 'block',
		background: '#FFF',
		padding: '2px 2px 2px 2px',
		border: '#999 solid thin',
		'-moz-box-shadow': '0 0 8px 1px #888',
		'-webkit-box-shadow': '0 0 8px 1px #888',
		'box-shadow': '0 0 8px 1px #888',
	}).appendTo($('.prompt')).hide();
	
	var j=0;
	var lineHeight=24, height=lineHeight;
	for (var i in emoticonMap) {
		if (j%12==0 && j>0) {
			$('<br/>').appendTo(this.lWin);
			height+=lineHeight;
		}
		var that=this;
		emoteCode=escape(this.sanitizeCode(i));
		emote=emoticonMap[i];
		$('<a/>').attr('href','#').attr('emoteCode',emoteCode).attr('emote',emote).addClass('emote').click(function(){
			that.prompt.val(that.prompt.val().substr(0,that.prompt[0].selectionStart)+unescape($(this).attr('emoteCode'))+that.prompt.val().substr(that.prompt[0].selectionStart)+'');
			Terminal.prompt.val(Terminal.prompt.val().replace('\n',''))
			that.close();
			return false;
		}).append($('<img/>').attr('src','images/emoticons/'+emote).addClass('emoticon')).appendTo(this.lWin);
		++j;
	}
	
	
	var marginTop=-50-height;
	this.lWin.css({ margin: marginTop+'px 10px 0 0' });
	
	this.open=function(){
		this.lWin.show();
		this.lWin.css({	});
	};
	this.close=function(){ this.lWin.hide(); };
	this.isopen=function(){

		return this.lWin.css('display')!='none';
	};
	
}
/* End of File -- terminal.js */