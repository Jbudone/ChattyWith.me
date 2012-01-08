// JavaScript Document


/*
 *		CommandStation		js
 *
 *	Author: JB Braendel
 *
 *	 ChattyWith.me's Front-End Requests Handler script.
 *	 Any and all request handling will be made locally
 *	 here, and results will be handled here accordingly
 *	 This includes both server-side requests, as well as
 *	 local requests (eg. block/ignore, change settings,
 *	 etc.)
 *
 ****************************************************/

	
	
	/********************
		TODO LIST
			
		* ...
	
	********************/


/************************************ ADMIN MANAGEMENT AREA BELOW *****************************************/




// Set verbose to true for testing/debugging
var verbose=true;
var kRETRIEVAL_COMET_IFRAME=0x01;
var kRETRIEVAL_COMET_LONGPOLLING=0x02;
var kRETRIEVAL_NOCOMET=0x03;
var retrieval_mode=kRETRIEVAL_COMET_IFRAME;
var kCOMET_IFRAME_PINGTIMER=2500;
var kPING_TIMER=5000; // Ping all channels under this timer




var kRESPONSE_ERROR=0x01;
var kRESPONSE_SUCCESS=0x02;





// Event Codes (NOTE: This is in SYNC with channel.php)
var kCHANNEL_EVENT_JOIN=0x01; // join [suserid] [susernick]
var kCHANNEL_EVENT_LEAVE=0x02; // leave [suserid] [susernick]
var kCHANNEL_EVENT_DC=0x03; // dc [suserid] [susernick]
var kCHANNEL_EVENT_KICK=0x04; // kick [suserid] [susernick] [duserid] [dusernick] [reason]  :: suser is the user requesting kick
var kCHANNEL_EVENT_BAN_SET=0x05; // ban [suserid] [susernick] [ip] [until] [strict] [reason]
var kCHANNEL_EVENT_BAN_MODIFY=0x06; // ban [suserid] [susernick] [ip] [until] [strict] [reason]
var kCHANNEL_EVENT_BAN_REMOVE=0x07; // ban [suserid] [susernick] [ip] [reason]
var kCHANNEL_EVENT_SETOPS_CHANOPS_ON=0x08; // setops [suserid] [susernick] [duserid] [dusernick]  :: suser is the user setting chanops
var kCHANNEL_EVENT_SETOPS_CHANOPS_OFF=0x09; // setops [suserid] [susernick] [duserid] [dusernick]  :: suser is the user setting chanops
var kCHANNEL_EVENT_SETOPS_VOICE_ON=0x0A; // setops [suserid] [susernick] [duserid] [dusernick]  :: suser is the user setting voiceops
var kCHANNEL_EVENT_SETOPS_VOICE_OFF=0x0B; // setops [suserid] [susernick] [duserid] [dusernick]  :: suser is the user setting voiceops
var kCHANNEL_EVENT_MODIFY_TOPIC=0x0C; // modify [suserid] [susernick] [topic]
var kCHANNEL_EVENT_MODIFY_PASSWORD=0x0D; // modify [suserid] [susernick]
var kCHANNEL_EVENT_MODIFY_MODERATED_ON=0x0E; // modify [suserid] [susernick]
var kCHANNEL_EVENT_MODIFY_MODERATED_OFF=0x0F; // modify [suserid] [susernick]
var kCHANNEL_EVENT_MODIFY_PRIVATE_ON=0x10; // modify [suserid] [susernick]
var kCHANNEL_EVENT_MODIFY_PRIVATE_OFF=0x11; // modify [suserid] [susernick]
var kCHANNEL_EVENT_JOINOPS_CHANOPS=0x012; // joinops [suserid] [susernick]
var kCHANNEL_EVENT_JOINOPS_VOICEOPS=0x013; // joinops [suserid] [susernick]
var kCHANNEL_EVENT_MODIFY_AUTOCLEAR_ON=0x14; // modify [suserid] [susernick]
var kCHANNEL_EVENT_MODIFY_AUTOCLEAR_OFF=0x15; // modify [suserid] [susernick]



/************************************ END OF ADMIN MANAGEMENT AREA *****************************************/

/************************************ CLASS DEFINITION BELOW *****************************************/
// CommandStation class below here
//	All front end request-based handling functionality in here



/* CommandStation   (class)
 * 
 *		All requests and commands will be sent to
 *	and handled here. Any server-side requests and
 *	responses will be formated, sent to, and handled
 *	accordingly; and any local-side commands will too
 *	be handled correctly.
 *
 *
 *
 *  requirements:   jQuery (tested on 1.6.2)
 *
 *	usage:	...
 ****************************/
var CommandStation={
	
	// Fieldset
	serverFile: "system/requests.json.php",
	msgRetrievePong: false, // msgRetrieve.php sets this to true during every loop,
							// CommandStation.pingCheckMessage() checks if this is
							// false, and restarts the Comet iframe if its false. 
							//	otherwise sets this to false
	
	
	
	// message
	//	Send a message to the given channelid
	message: function(message,chanid) {
		if (chanid==0) {
			Terminal.rcvError(0,null,{error:'Cannot send message to the server channel!'});
			return;	
		}
		CommandStation._request('message',{'chanid':chanid,'message':encodeURIComponent(message)},CommandStation.cbresult);
	},
	
	
	// ping
	//	Auto ping the server
	ping: function() {
		if (Terminal.userid) {
			// Logged In
			var channels=[]; // Simple hack since 0 is not a legal chanid
			for (var chanid in Terminal.channels) {
				if (chanid==0 || chanid=='chanlist')
					continue;
				channels.push(chanid);
			}
			$.getJSON(CommandStation.serverFile,{ request: 'pingchan', args: { channels: channels } },function(data){
				if (!data) { CommandStation.serverError(); return; }
				if (CommandStation.handleError(data)) { return; }
				
				if (data.response==kRESPONSE_SUCCESS && data.pinged) {
					//CommandStation.whine("Pinged "+data.pinged+" channels");
				}
			});
		}
		
		setTimeout(CommandStation.ping,kPING_TIMER);
	},
	
	
	
	// pingCheckMessage
	//	Checks if msgRetrieve.php has pinged the CommandStation, and if not
	//	then assume the script has finished, closed or broke, and restart it
	//
	//	NOTE: Only START this function when its ready to begin
	pingCheckMessage: function() {
		if (!CommandStation.msgRetrievePong && Terminal.identification && retrieval_mode==kRETRIEVAL_COMET_IFRAME) {
			$('iframe').remove();
			$('body').append('<iframe style="display:none;" src="./msgRetrieve.php?identification='+Terminal.identification+'"></iframe>');
		}
		CommandStation.msgRetrievePong=false;
		setTimeout(CommandStation.pingCheckMessage,kCOMET_IFRAME_PINGTIMER);
	},
	
	
	
	
	// command
	//	Use THIS command in just about every instance/need. This will hack apart a
	//	given request, figure out what its requesting, and handle it accordingly
	//		eg. "/nick Jbudone", "/join #newbies"
	//
	//	@request: The full message sent in its form entirety
	// return: NULL
	// NOTE: This function will handle all necessary actions - callbacks, localside
	//		commands, error handling, and terminal communication
	command: function(request,chanid) {
		
		// Break apart the request into ::   command [arg0 [arg1 [arg2 ...]]]
		_parts=request.split(' ');
		args=[];
		for (var i in _parts) {
			if (_parts[i])
				args.push($.trim(_parts[i]));
		}
		cmd=args.shift();
		if (chanid || chanid===0)
			args.chanid=chanid;
		
		// Execute the command
		CommandStation.execute(cmd,args);
	},
	
	
	
	
	
	// execute
	//	Execute one of the commands from within `commands`
	//
	//	@args: The arguments associated with this command
	// return: NULL
	execute: function(key,args) {
		
		key=key.toLowerCase();
		if (!in_array(commands,key)) {
			Terminal.rcvError(args.chanid,null,{'error':'"Bad command...type  /help  for a list of commands"'});
			return;
		}
		var command=commands[key];
		// Setup the Arguments
		var interargs={}; // An intermediate argument list
		if (args) {
			var lastArg=null;
			for (var i in args) {
				if (in_array(command.args,i)) {
					if (!isNaN(i)) lastArg=i; // This is the last argument, all proceeding args may append to this one
					interargs[i]=args[i];
				} else if (lastArg && !isNaN(i))
					interargs[lastArg]+=" "+args[i]; // Append to last Argument (message, reason, etc.)
			}
			if (exists(args.chanid) && !exists(command.args['chanid']))
				interargs['chanid']=args.chanid;
		}
		var args={};
		for (var i in command.argdefs) {
			if (interargs[command.argdefs[i]])
				args[i]=interargs[command.argdefs[i]];
		}
		if (!exists(args.chanid) && exists(interargs.chanid))
			args.chanid=interargs.chanid;
		// Execute the command
		command.execute(command.cmd,args,command.callback);
	},
	
	
	
	// _request
	//	Base request method; this is a JSON-request function stripped down to its bare essentials
	//
	//	@request
	//	@args
	//	@callback
	// return: NULL
	_request: function(request,args,callback) {
		$.getJSON(CommandStation.serverFile, { request: request, args: args }, callback);
console.log("Request: \""+request+"\"  --  "+args);
	},
	
	
	
	// _longpoll
	//	JSON Request to the longpolling script
	//
	//	@request
	//	@args
	//	@callback
	// return: NULL
	_longpoll: function(request,args,callback) {
		var ret=$.getJSON('./system/longpolling.php', { request: request, args: args, identification: Terminal.identification }, callback).error(function(e){
			console.log("Longpoll error! Attempting to retry Terminal.update()");
			Terminal.update();
		});
	},
	
	
		
	
	// handleResponse
	//	Handles a response from the server. All this functinon does is check if there's
	//	an error, then prints out that error to the terminal, otherwise leave it
	//
	//	@data
	handleResponse: function(data) {
console.log("HandleResponse..");
		if (!data) return;
		var chanid=data.chanid?data.chanid:0;
		if (data.error)
			Terminal.rcvError(chanid,null,data);
		else
			Terminal.rcvData(chanid,data);
	},
	
	
	// autoLogout
	//	This function is called when the user has been automatically logged out
	autoLogout: function(forceQuit) {
		if (retrieval_mode==kRETRIEVAL_COMET_IFRAME && !forceQuit) {
			// NOTE: For unknown reasons, COMET_IFRAME seems to fail *sometimes* (repeatedly),
			//	so before logging out, simply swap to COMET_LONGPOLLING and try that method instead
			$('iframe').remove();
			
			CommandStation.event("Communication with the server has gone bonkers! Attempting to switch to Comet (Longpolling) message retrieval..");
			retrieval_mode=kRETRIEVAL_COMET_LONGPOLLING;
			if (typeof localStorage!='undefined')
				localStorage.setItem('retrieval_mode',kRETRIEVAL_COMET_LONGPOLLING);
			Terminal.update();
		} else if (!forceQuit && Terminal.identification) {
			// Attempt to reconnect, otherwise forceQuit
			CommandStation.event("Attempting to reconnect to server..");
			$.getJSON('system/requests.json.php', { request: 'login', args: { id: Terminal.identification } }, function(data) {
				if (data.response==kRESPONSE_SUCCESS) {
					Terminal.update();
				} else {
					CommandStation.event("Could not reconnect to server. Please try to login manually..");
					CommandStation.autoLogout(true);	
				}
			}).error(function(){
				// Error ..  Attempt to reconnect in 1500
				CommandStation.event("Error reconnecting, trying again...");
				setTimeout(function(){CommandStation.autoLogout(false);},2500);
			});
		} else {
			Terminal.userid=null;
			Terminal.usernick=null;
			Terminal.identification=null;
				
			for (var i in Terminal.channels) {
				if (i==0) continue;
				Terminal.closeWin(i);	
			}
			CommandStation.event("Error identifying with server. You have been automatically logged out..");
		}
	},
	
	
	
	
	
		
	/////////////////////////
	///  COMMAND-SPECIFIC FUNCTIONS
	/////////////////////////
	
	
	// multiRetrieval
	//	Handle an array of messages retrieved from the server, for multiple channels
	//
	//	@data: {response, channels: {1:{..}, 2:{..}, ... }}
	multiRetrieval: function(data) {
		if (!data) { CommandStation.serverError(); return; }
		if (data.channels) {
			for(var chanid in data.channels) {
				if (!exists(Terminal.channels[chanid])) continue;
				var chan=data.channels[chanid];
				for(var i in chan) {
					var message=chan[i];
					if (message.id<=Terminal.channels[chanid].msgid) continue;
					Terminal.updateMsgID(chanid,message.id);
					if (message.type=='message') {
						Terminal.rcvMessage(chanid,message);
					}
					else if (message.type=='action')
						Terminal.rcvAction(chanid,message);
					else if (message.type=='event') {
						CommandStation.setupEvent(message,false);
						Terminal.rcvEvent(chanid,null,message);
						if (exists(message.exec)) {
							eval(message.exec); }
					}
				}	
			}
		}
		if (data.whispers) {
			for(var whisper in data.whispers) {
				Terminal.rcvWhisper(data.whispers[whisper]);	
			}
		}
	},
	
	
	// help
	//	Get help for a given command
	//
	//	@request
	//	@args: { .cmd: [Command] }
	// 
	//	NOTE: Parameters are left as request, args and callback since this is called 
	//		just like any other command which automatically provides these arguments
	help: function(request,args,callback) {
		if (args.cmd) {
			if (exists(commands[args.cmd])) {
				var cmd=commands[args.cmd];
				Terminal.rcvHelp(args.chanid,{help:cmd.help,def:cmd.def,example:cmd.example});
			} else {
				return;
				Terminal.rcvError(args.chanid,null,{error:"Command not found \""+args.cmd+"\""});
			}
		} else {
			var str="/help [command]";
			for (var i in commands) {
				str+="\n   /"+i+" ";
				for (var x in commands[i].argdefs) {
					str+=" ["+x+"] ";	
				}
				str+=" -- "+commands[i].def;
			}
			Terminal.rcvHelp(args.chanid,{help:str,example:commands['help'].example});
		}
	},
	
	_reqJoin: function(request,args,callback) {
		if (args.channelname[0]!='#') {
			args.channelname[0]='#'+args.channelname[0];
			return CommandStation._reqJoin(request,args,callback);
			//Terminal.rcvError(0,null,{error:"Could not join channel \""+args.channelname+"\".. try  \"#"+args.channelname+"\"  instead"});
			//return false;	
		}
		args.channelname=args.channelname.substring(1);
		CommandStation._request(request,args,callback);
	},
	
	_reqLeave: function(request,args,callback) {
		if (args.chanid=='chanlist') {
			Terminal.closeWin('chanlist');
			return false;	
		}
		CommandStation._request(request,args,callback);
	},
	
	_reqSetops: function(request,args,callback) {
		
		var ot=args.optype;
		if (ot=='operator' || ot=='ops' || ot=='+ops' || ot=='+O' || ot=='+o' || ot=='chanop' || ot=='+chanops' || ot=='O' || ot=='o') { args.optype=0; }
		else if (ot=='voice' || ot=='+voice' || ot=='+v' || ot=='chanvoice' || ot=='v' || ot=='V' || ot=='+V') { args.optype=1; }
		else if (ot=='none' || ot=='-none' || ot=='-v' || ot=='-O' || ot=='0' || ot=='-o' || ot=='-V') { args.optype=2; }
		else { Terminal.rcvError(0,null,{error:"Error setting operator status  \""+ot+"\""}); return; }
		CommandStation._request(request,args,callback);
	},
	
	_reqBan: function(request,args,callback) {
		if (!exists(args) || !exists(args.arg)) { CommandStation.autoHelp(0,'ban'); return; }
		var str=args.arg;
		

		// Get IP/Username
		////////////
		result=str.match(/\*(\d*\.\d*\.\d*\.\d*)\*/);
		if (result && result[1]) {
			// IP Address	
			args.ip=result[1];
		} else {
			result=str.match(/^([A-z0-9]*)/);
			if (result && result[1]) {
				// Username	
				args.username=result[1];
			} else {
				CommandStation.autoHelp(Terminal.curChanID,'ban');
				return;
			}
		}
		
		// Get Strict-Level
		result=str.match(/[A-z0-9\*\.]* !(\w*)/);
		if (result && result[1]) args.strict=result[1];	 else args.strict='ipnow';
		
		// Get duration
		result=str.match(/for:"([\w .\-]*)"/);
		if (result && result[1]) args.until=result[1];
		
		// Get reason
		result=str.match(/reason:"(.*)"/);
		if (result && result[1]) args.reason=result[1];	else args.reason='Banned!';
		
		CommandStation._request(request,args,callback);
	},
	
	_reqAction: function(request,args,callback) {
		CommandStation._request(request,args,callback);
	},
	
	_reqWhisper: function(request,args,callback) {
		CommandStation._request(request,args,function(data) {
			if (!data) { CommandStation.serverError(); return; }
			if (CommandStation.handleError(data)) { return; }
			Terminal.rcvWhisperSend(args);
			callback(data);	
		});
	},
	
	cblogin: function(data) {
		if (!data) { CommandStation.serverError(); return; }
		CommandStation.whine(data);
		if (CommandStation.handleError(data)) { return; }
		
		if (data.response==kRESPONSE_SUCCESS && data.nick && data.userid) {
			
			Terminal.userid=data.userid;
			Terminal.usernick=data.nick;
			Terminal.identification=data.identification;
			CommandStation.event("You have successfully logged in as "+data.nick+" ["+data.userid+"]");
			if (retrieval_mode==kRETRIEVAL_COMET_IFRAME) { CommandStation.pingCheckMessage(); }
			else if (retrieval_mode==kRETRIEVAL_COMET_LONGPOLLING) Terminal.update();
			$('.prompt input[type="text"]').attr('placeholder','');
			if (data.identification && typeof localStorage) {
				localStorage.setItem('id',data.identification);
			}
			
			Terminal.printMsg("^5Welcome to ChattyWith.me !!!\n  An ^2AJAX^5-based chatroom with ^2IRC^5 protocol.\n\n\n\tNow that you have logged in, you may ^2register^5 your username by typing  ^2/register ^15[^6password^15]^5  This will prevent anybody else from using your username. The next time you want to login simply type  ^2/login ^15[^6username^15] ^15[^6password^15] ^5Now that you are logged in to the world of ChattyWith.me, you are ready to begin chatting and making new friends! Type ^2/list^5 to retrieve a list of all the currently online channels, or ^2/join #^15[^6channel^15]^5 to join any channel. If you ever get stuck, feel free to type  ^2/help ^15[^6cmd^15]^5  for help with any available command. Enjoy!\n\n\n\tauthor: JB Braendel\n\n\n\n^8tip: ^2/join #chat");
		}
	},
	
	cblogout: function(data) {
		if (!data) { CommandStation.serverError(); return; }
		CommandStation.whine(data);
		if (CommandStation.handleError(data)) { return; }
		
		if (data.response==kRESPONSE_SUCCESS) {
			if (retrieval_mode==kRETRIEVAL_COMET_IFRAME) $('iframe').remove();
			Terminal.userid=null;
			Terminal.usernick=null;
			Terminal.identification=null;
			if (typeof localStorage)
				localStorage.removeItem('id');
			
			for (var i in Terminal.channels) {
				if (i==0) continue;
				Terminal.closeWin(i);	
			}
			CommandStation.event("You have successfully logged out");
		}
	},
	
	cbregister: function(data) {
		if (!data) { CommandStation.serverError(); return; }
		CommandStation.whine(data);
		if (CommandStation.handleError(data)) { return; }
		
		if (data.response==kRESPONSE_SUCCESS) {
			CommandStation.event("You have successfully registered this username");
		}
	},
	
	cbresult: function(data) {
		if (!data) { CommandStation.serverError(); return; }
		if (CommandStation.handleError(data)) { return; }
		
		if (data.response==kRESPONSE_SUCCESS) { }
	},
	
	cbchanlist: function(data) {
		if (!data) { CommandStation.serverError(); return; }
		CommandStation.whine(data);
		if (CommandStation.handleError(data)) { return; }
		
		if (data.response==kRESPONSE_SUCCESS && data.channels) {
			//	{channels[] => .id, .name, .topic, .users}
			Terminal.rcvChanlist(data);
		}
	},
	
	cbjoin: function(data) {
		if (!data) { CommandStation.serverError(); return; }
		CommandStation.whine(data);
		if (CommandStation.handleError(data)) { return; }
		
		if (data.response==kRESPONSE_SUCCESS && data.channel) {
			var channel=data.channel;
			CommandStation.event("You have successfully joined #"+channel.title);
			Terminal.openWin(channel.chanid,channel.title,channel.users,true);
			for(var i in channel.messages) {
				var message=channel.messages[i];
				if (message.type=='message')
					Terminal.rcvMessage(channel.chanid,message);
				else if (message.type=='action')
					Terminal.rcvAction(channel.chanid,message);	
				else if (message.type=='event') {
					CommandStation.setupEvent(message,true);
					Terminal.rcvEvent(channel.chanid,null,message);
				}
			}
			Terminal.channels[channel.chanid].minmsgid=channel.messages[0].id;
			Terminal.updateMsgID(channel.chanid,channel.msgid);
			Terminal.setChanTopic(channel.chanid,channel.topic);
			if (channel.moderated)
				Terminal.setChanMode(channel.chanid,channel.moderated);
		}
	},
	
	cbleave: function(data) {
		if (!data) { CommandStation.serverError(); return; }
		CommandStation.whine(data);
		if (CommandStation.handleError(data)) { return; }
		
		if (data.response==kRESPONSE_SUCCESS && data.chanid) {
			CommandStation.event("You have left #"+data.channame);
			Terminal.closeWin(data.chanid);
		}
	},
	
	cbretrieve: function(data) {
		if (!data) { CommandStation.serverError(); return; }
		if (CommandStation.handleError(data)) { return; }

		if (data.response==kRESPONSE_SUCCESS && data.messages && data.msgid) {
			if (data.msgid<=Terminal.channels[data.chanid].msgid)
				return; // We've already received this message
			Terminal.updateMsgID(data.chanid,data.msgid);
			for(var i in data.messages) {
				var message=data.messages[i];
				if (message.type=='message')
					Terminal.rcvMessage(data.chanid,message);	
				else if (message.type=='event') {
					message.chanid=data.chanid;
					CommandStation.setupEvent(message,false);
					Terminal.rcvEvent(data.chanid,null,message);
					if (exists(message.exec)) {
						eval(message.exec); }
				}
			}
		}
	},
	
	cbretrieveold: function(data) {
		if (!data) { CommandStation.serverError(); return; }
		if (CommandStation.handleError(data)) { return; }
		if (data.response==kRESPONSE_SUCCESS && data.messages && exists(data.messages[0]) && data.msgid) {
			Terminal.channels[data.chanid].minmsgid=data.messages[0].id;
			for(var i=data.messages.length-1; i>=0; i--) {
				var message=data.messages[i];
				if (message.type=='message')
					Terminal.rcvOldMessage(data.chanid,message);	
				else if (message.type=='action')
					Terminal.rcvOldAction(data.chanid,message);	
				else if (message.type=='event') {
					CommandStation.setupEvent(message,true);
					Terminal.rcvOldEvent(data.chanid,null,message);
				}
			}
		}
		if (data.end==true) {
			Terminal.channels[data.chanid].reachedStart=true;
			Terminal.channels[data.chanid].backToStart();
		}
	},
	
	cbmultiretrieve: function(data) {
		if (!data) { CommandStation.serverError(); Terminal.update(); return; }
		
		if (!data.response || data.response==kRESPONSE_ERROR) {
			if (data.error && data.error==0x1D) { CommandStation.autoLogout(false); } 
			else if (CommandStation.handleError(data)) {  Terminal.update(); return; }
		}
		
		try {
			if (data.response==kRESPONSE_SUCCESS && data.channels) {
				for(var j in data.channels) {
					var channel=data.channels[j];
					if (!exists(Terminal.channels[channel.chanid]))
						break;
					if (channel.msgid<=Terminal.channels[channel.chanid].msgid)
						continue; // We've already received this message
					Terminal.updateMsgID(channel.chanid,channel.msgid);
					for(var i in channel.messages) {
						var message=channel.messages[i];
						if (message.type=='message')
							Terminal.rcvMessage(channel.chanid,message);	
						else if (message.type=='action')
							Terminal.rcvAction(channel.chanid,message);	
						else if (message.type=='event') {
							CommandStation.setupEvent(message,false);
							Terminal.rcvEvent(channel.chanid,null,message);
							if (exists(message.exec)) {
								eval(message.exec); }
						}
					}
				}
			} else if (data.response==kRESPONSE_SUCCESS && data.whispers) {
				for(var whisper in data.whispers) {
					Terminal.rcvWhisper(data.whispers[whisper]);	
				}
			} else if (data.numrows)
				Terminal.spitback(data.numrows);
		} finally {
			// Send another multiretrieval request immediately
			Terminal.update();
		}
	},
	
	cbgetlist: function(data) {
		if (!data) { CommandStation.serverError(); return; }
		CommandStation.whine(data);
		if (CommandStation.handleError(data)) { return; }
		
		if (data.response==kRESPONSE_SUCCESS && data.chanid && data.listcode && data.list) {
			if (data.list.length==0) {
				
			}
			Terminal.rcvList(data.chanid, data.listcode, data.list);
		}
	},
	
	cbwhois: function(data) {
		if (!data) { CommandStation.serverError(); return; }
		CommandStation.whine(data);
		if (CommandStation.handleError(data)) { return; }
		
		if (data.response==kRESPONSE_SUCCESS && data.whois) {
			// Cleanup the Channels Listing
			var chanstr=''
			for (var i in data.whois.channels) {
				chanstr+='#'+data.whois.channels[i]+', ';
			}
			if (chanstr)
				chanstr=chanstr.substring(0,chanstr.length-2);
			data.whois.channels=chanstr;
			
			
			Terminal.rcvData(Terminal.curChanID, data.whois);
		}
	},
	
	
		
	/////////////////////////
	///  HELPER FUNCTIONS
	/////////////////////////
	
	
	serverError: function() {
		if (verbose && typeof console == 'object')
			console.log("Error receiving data from server!!");
	},
	
	handleError: function(data) {
		if (!data.response || data.response==kRESPONSE_ERROR) {
			if (exists(errCodes[data.error])) {
				var err=errCodes[data.error];
				if (err.handler)
					err.handler();
				else
					Terminal.rcvError((data.chanid?data.chanid:Terminal.curChanID),data.error,{error:err.message});
			} else
				Terminal.rcvError((data.chanid?data.chanid:Terminal.curChanID),"unknown error code "+data.error,data);
			return 1;
		}
		return 0;
	},
	
	whine: function(data) {
		if (verbose && typeof console == 'object')
			console.log(data);
	},
	
	event: function(evtMessage) {
		Terminal.rcvEvent(0,null,{'message':evtMessage});
	},
	
	autoHelp: function(chanid,cmd) {
		CommandStation.help(null,{chanid:chanid,cmd:cmd},null);
	},
	
	
	// setupEvent
	//	Take an event { .message } and convert it into a proper event object (ready for proper handling)
	//
	//	@data { .message }
	setupEvent: function(data,oldMessage) {
		var message=data.message;
		message=message.split(' ');
		
		// Retrieve all the proper arguments for the given event
		data.evt=message[0];
		data.srcuserid=message[1];
		data.srcusernick=message[2];
	
	
	
		// Compile the message for the given event
		if (data.evt==kCHANNEL_EVENT_JOIN) { if (!oldMessage) data.exec="Terminal.addUser("+data.chanid+",{id:"+data.srcuserid+",nick:'"+data.srcusernick+"',status:'',ip:''})"; data.message=data.srcusernick+" has joined the channel"; }
		else if (data.evt==kCHANNEL_EVENT_LEAVE) { if (!oldMessage) data.exec="Terminal.remUser("+data.chanid+","+data.srcuserid+")"; data.message=data.srcusernick+" has left the channel"; }
		else if (data.evt==kCHANNEL_EVENT_DC) { 
			if (!oldMessage) {
				if (data.srcuserid==Terminal.userid) {
					// We've unexpectedly disconnected!
					CommandStation.autoLogout(false);
				} else {
					data.exec="Terminal.remUser("+data.chanid+","+data.srcuserid+")"; data.message=data.srcusernick+" has been disconnected"; 
				}
			} else {
				data.message=data.srcusernick+" has been disconnected"; 
			}
		}
		else if (data.evt==kCHANNEL_EVENT_KICK) { 
			data.destuserid=message[3]; data.destusernick=message[4]; data.reason=join(message,5);
			if (data.destuserid==Terminal.userid) {
				 if (!oldMessage) {
					if (!data.channame)
						data.channame=Terminal.channels[data.chanid].name;
					 data.exec="Terminal.closeWin("+data.chanid+"); Terminal.rcvEvent(0,null,{message:'You were kicked from channel #"+data.channame+" by "+data.nick+(!data.reason?"'})":" for reason: '+unescape('"+(data.reason)+"')})");
				 }
				 else data.message=data.destusernick+" has been kicked by "+data.srcusernick+(!data.reason?'':" ["+data.reason+"]");
			}
			else
				if (!oldMessage) data.exec="Terminal.remUser("+data.chanid+","+data.destuserid+")"; 
				data.message=data.destusernick+" has been kicked by "+data.srcusernick+(!data.reason?'':" ["+data.reason+"]");
			}
		else if (data.evt==kCHANNEL_EVENT_BAN_SET) { data.ip=message[3]; data.strict=message[4]; data.until=message[5]; data.reason=join(message,6); data.message=data.srcusernick+" has banned ["+data.strict+"|"+data.ip+"] from channel, until "+data.until+" for reason \""+data.reason+"\""; }
		else if (data.evt==kCHANNEL_EVENT_BAN_MODIFY) { data.ip=message[3]; data.strict=message[4]; data.until=message[5]; data.reason=join(message,6); data.message=data.srcusernick+" has modified ban ["+data.strict+"|"+data.ip+"], until "+data.until+" for reason \""+data.reason+"\""; }
		else if (data.evt==kCHANNEL_EVENT_BAN_REMOVE) { data.ip=message[3]; data.reason=join(message,4); data.message=data.srcusernick+" has removed ban ["+data.ip+"]"; }
		else if (data.evt==kCHANNEL_EVENT_SETOPS_CHANOPS_ON) { data.destuserid=message[3]; data.destusernick=message[4]; data.exec="Terminal.setUserStatus("+data.chanid+","+data.destuserid+",'operator')"; data.message=data.destusernick+" has been given +O chanops by "+data.srcusernick; }
		else if (data.evt==kCHANNEL_EVENT_SETOPS_CHANOPS_OFF) { data.destuserid=message[3]; data.destusernick=message[4]; data.exec="Terminal.setUserStatus("+data.chanid+","+data.destuserid+",'')"; data.message=data.destusernick+" has been stripped of +O chanops by "+data.srcusernick; }
		else if (data.evt==kCHANNEL_EVENT_SETOPS_VOICE_ON) { data.destuserid=message[3]; data.destusernick=message[4]; data.exec="Terminal.setUserStatus("+data.chanid+","+data.destuserid+",'voice')"; data.message=data.destusernick+" has been given +v voice by "+data.srcusernick; }
		else if (data.evt==kCHANNEL_EVENT_SETOPS_VOICE_OFF) { data.destuserid=message[3]; data.destusernick=message[4]; data.exec="Terminal.setUserStatus("+data.chanid+","+data.destuserid+",'')"; data.message=data.destusernick+" has been stripped of +v voice by "+data.srcusernick; }
		else if (data.evt==kCHANNEL_EVENT_JOINOPS_CHANOPS) { data.exec="Terminal.setUserStatus("+data.chanid+","+data.srcuserid+",'operator')"; data.message=data.srcusernick+" has been given +O chanops by ChanServ"; }
		else if (data.evt==kCHANNEL_EVENT_JOINOPS_VOICEOPS) { data.exec="Terminal.setUserStatus("+data.chanid+","+data.srcuserid+",'voice')"; data.message=data.srcusernick+" has been given +v chanops by ChanServ"; }
		else if (data.evt==kCHANNEL_EVENT_MODIFY_TOPIC) { data.topic=join(message,3); data.exec="Terminal.setChanTopic("+data.chanid+",unescape('"+escape(data.topic)+"'))"; data.message=data.srcusernick+" has changed topic to \""+data.topic+"\""; }
		else if (data.evt==kCHANNEL_EVENT_MODIFY_PASSWORD) { data.message=data.srcusernick+" has modified the channel password"; }
		else if (data.evt==kCHANNEL_EVENT_MODIFY_MODERATED_ON) { data.exec="Terminal.setChanMode("+data.chanid+",1)"; data.message=data.srcusernick+" has set channel to +m (moderated mode)"; }
		else if (data.evt==kCHANNEL_EVENT_MODIFY_MODERATED_OFF) { data.exec="Terminal.setChanMode("+data.chanid+",0)"; data.message=data.srcusernick+" has set channel to -m (non-moderated mode)"; }
		else if (data.evt==kCHANNEL_EVENT_MODIFY_PRIVATE_ON) { data.message=data.srcusernick+" has set channel to +p (private)"; }
		else if (data.evt==kCHANNEL_EVENT_MODIFY_PRIVATE_OFF) { data.message=data.srcusernick+" has set channel to -p (public)"; }
		else if (data.evt==kCHANNEL_EVENT_MODIFY_AUTOCLEAR_ON) { data.message=data.srcusernick+" has set channel to +c (autoclear)"; }
		else if (data.evt==kCHANNEL_EVENT_MODIFY_AUTOCLEAR_OFF) { data.message=data.srcusernick+" has set channel to -c (persistant)"; }
		else { data.message="unknown event occured.. "; }

	},
	
}


/************************************ END OF CLASS DEFINITION *****************************************/

/************************************ COMMANDS AREA BELOW *****************************************/
// The full list of client commands given here
//	All aliases for each command is listed BELOW the `commands` object



// COMMANDS
//	The Commands object, listing every client side command
//
//	usage: Each individual command MUST consist of a basic template,
//		.execute: The command that will be executed when this is called
//		.nospit: OPTIONAL value, if included then spitback() will NOT be called with this cmd
//		.args: A placeholder for all arguments (only list the maximum number of arguments for
//												this specific command)
//		.argdefs: Argument definitions, ie. what is the name of each indexes argument in .args
//					List this like,
//					.argsdefs['foo']=0  ;  where,  .args[0]="Bar", as a given argument
//		.callback: Callback function
//		.help
//		.def
//		.example
//
//	WARNING WARNING WARNING WARNING
//		An argdef may NOT be labelled as a number (must be a string-name)
var commands={
	status: {
		cmd: 'status',
		nospit: 1,
		execute: CommandStation._request,
		args: { 0: null, 1: null, },
		argdefs: { tossme: 0, foo: 1, },
		callback: CommandStation.handleResponse,
		def: "Get your current login/identification status",
		help: "/status",
	},
	
	login: {
		cmd: 'login',
		nospit: 1,
		execute: CommandStation._request,
		args: { 0: null, 1: null, },
		argdefs: { user: 0, pass: 1, },
		callback: CommandStation.cblogin,
		def: "Login to the server",
		help: "/login [username] [password] ;; note: If you do not have a username, you may create one here. You may not set a password on new usernames (use /register instead). Usernames are ALPHANUMERIC only",
		example: "/login newbie ; /login admin 123",
	},
	
	identify: {
		cmd: 'login',
		execute: CommandStation._request,
		args: { 0: null },
		argdefs: { id: 0 },
		callback: CommandStation.cblogin,
		def: "Identify yourself to the server, and login to the specified user",
		help: "/identify [identification]",
		example: "/identify hjh20najzns820a11nhawer",
	},
	
	logout: {
		cmd: 'logout',
		execute: CommandStation._request,
		args: { },
		argdefs: { },
		callback: CommandStation.cblogout,
		def: "Logout from the server. If you quit without logging out the server will automatically disconnect you from all connected channels after a few minutes",
		help: "/logout",
	},
	
	register: {
		cmd: 'register',
		execute: CommandStation._request,
		args: { 0: null },
		argdefs: { password: 0 },
		callback: CommandStation.cbregister,
		def: "Register your username with a given password (provide no password to unregister it)",
		help: "/register [password]  ;; password is optional, providing no password will set the username to not require a password",
		example: "/register 123",
	},
	
	list: {
		cmd: 'list',
		nospit: 1,
		execute: CommandStation._request,
		args: { },
		argdefs: { },
		callback: CommandStation.cbchanlist,
		def: "Retrieve a list of all the public channels. Note: Some channels are set to private, and will not appear in this list",
		help: "/list",
	},
	
	join: {
		cmd: 'join',
		nospit: 1,
		execute: CommandStation._reqJoin,
		args: { 0: null, 1: null },
		argdefs: { channelname: 0, password: 1 },
		callback: CommandStation.cbjoin,
		def: "Join a channel",
		help: "/join #[channel]",
		example: "/join #noobzone ; /join #teens",
	},
	
	joinid: {
		cmd: 'join',
		nospit: 1,
		execute: CommandStation._request,
		args: { 0: null, 1: null },
		argdefs: { chanid: 0, password: 1 },
		callback: CommandStation.cbjoin,
	},
	
	leave: {
		cmd: 'leave',
		nospit: 1,
		execute: CommandStation._reqLeave,
		args: { 0: null },
		argdefs: { chanid: 0 },
		callback: CommandStation.cbleave,
		def: "Leave a channel",
		help: "/leave [chanid]  ;; providing a channel id is optional, not providing one will simply /leave whatever channel you have currently opened",
		example: "/leave ; /leave 13",
	},
	
	message: {
		cmd: 'message',
		nospit: 1,
		execute: CommandStation._request,
		args: { 0: null, 1: null },
		argdefs: { chanid: 0, message: 1 },
		callback: CommandStation.cbresult,
		def: "Send a message to a given channel. Note: You do not need to send messages using this command, you can simply type in the channel with your given message instead",
		help: "/message [chanid] [message]",
		example: "/message 13 Hello, World!",
	},
	
	action: {
		cmd: 'action',
		nospit: 1,
		execute: CommandStation._reqAction,
		args: { 0: null },
		argdefs: { message: 0 },
		callback: CommandStation.cbresult,
		def: "Send an action message to a given channel.",
		help: "/action [message]",
		example: "/action decides to ponder the meaning of life..",
	},
	
	retrieve: {
		cmd: 'retrieve',
		execute: CommandStation._request,
		args: { 0: null, 1: null },
		argdefs: { chanid: 0, msgid: 1 },
		callback: CommandStation.cbretrieve,
		def: "WARNING: This command is here for automated use ONLY; using it manually may cause unexpected results",
	},
	
	retrieveold: {
		cmd: 'retrieveold',
		execute: CommandStation._request,
		args: { 0: null, 1: null },
		argdefs: { chanid: 0, maxmsgid: 1 },
		callback: CommandStation.cbretrieveold,
		def: "WARNING: This command is here for automated use ONLY; using it manually may cause unexpected results",
	},
	
	multiretrieve: {
		cmd: 'multiretrieve',
		execute: CommandStation._longpoll,
		args: { 0: null },
		argdefs: { args: 0 },
		callback: CommandStation.cbmultiretrieve,
		def: "WARNING: This command is here for automated use ONLY; using it manually may cause unexpected results",
	},
	
	getlist: {
		cmd: 'getlist',
		execute: CommandStation._request,
		args: { 0: null },
		argdefs: { listid: 0 },
		callback: CommandStation.cbgetlist,
		def: "Retrieve a given list from the channel",
		help: "/getlist [users|operators|bans]",
		example: "/getlist bans ; /getlist operators",
	},
	
	kick: {
		cmd: 'kick',
		execute: CommandStation._request,
		args: { 0: null, 1: null },
		argdefs: { kickid: 0, reason: 1 },
		callback: CommandStation.cbresult,
		def: "Kick a given user from the channel",
		help: "/kick [user] [reason] ;; Note: providing a reason is optional",
		example: "/kick Trollster For being a troll",
	},
	
	ban: {
		cmd: 'ban',
		execute: CommandStation._reqBan,
		args: { 0: null },
		argdefs: { arg: 0 },
		callback: CommandStation.cbresult,
		def: "Ban a given IP address, or user, from the channel",
		help: "/ban [user:*IP*] [!strict] for:\"[timelength]\" reason:\"[reason]\" ;; strict levels include (ipnow|ipany|ipday|ipweek|ipmonth|remove) which affect which users can join depending on if ever the banned IP address has been connected on through their username. Setting strict level to 'remove' will simply remove the given ban. To modify a ban, simply set a ban on the same IP/user with the new details. Until uses PHP's strtotime() function, which means you can write dates such as 'tomorrow', 'next wednesday', '27 hours from yesterday'",
		example: "/ban *127.0.0.1* !ipnow for:\"tomorrow\" reason:\"Channel flooding\"; /ban Trollster !ipany for:\"3 hours\" reason:\"Trolling\"; /ban newbie !remove",		
	},
	
	setops: {
		cmd: 'chanop',
		execute: CommandStation._reqSetops,
		args: { 0: null, 1: null },
		argdefs: { optype: 0, opid: 1 },
		callback: CommandStation.cbresult,
		def: "Give, Modify or Remove channel operator status from user",
		help: "/setops [optype] [username] ;; optype +O (chanops), +v (voice), -o (none)",
		example: "/setops +v newbie",
	},
	
	modify: {
		cmd: 'modify',
		execute: CommandStation._request,
		args: { 0: null, 1: null },
		argdefs: { setting: 0, value: 1 },
		callback: CommandStation.cbresult,
		def: "Modify one of the channel settings (topic, password, moderated, private, autoclear)",
		help: "/modify [topic|password|moderated|private|autoclear] [value] ;; for moderated/private/autoclear use 1/0 for On/Off, to unset a password simply don't provide a value",
		example: "/modify topic Hello, World! ; /modify password adminsonly ; /modify private 1",
	},
	
	help: {
		cmd: 'help',
		execute: CommandStation.help,
		args: { 0: null },
		argdefs: { cmd: 0 },
		def: "Get help with one of the commands in the CommandStation, or otherwise list all of the commands available",
		help: "/help [command]",
		example: "/help setops",
	},
	
	whois: {
		cmd: 'whois',
		execute: CommandStation._request,
		args: { 0: null },
		argdefs: { nick: 0 },
		callback: CommandStation.cbwhois,
		def: "Retrieve the details of a given online user",
		help: "/whois [nickname]",
		example: "/whois JB",
	},
	
	whisper: {
		cmd: 'whisper',
		nospit: 1,
		execute: CommandStation._reqWhisper,
		args: { 0: null, 1: null },
		argdefs: { nick: 0, message: 1 },
		callback: CommandStation.cbresult,
		def: "Whisper a message to somebody",
		help: "/whisper [nickname] [message]",
		example: "/whisper JB all of my problems have now been solved with ChattyWith.me!",
	},
	
	
};


////
// Command Aliases
/////////////////////////
commands.test=commands['status'];
commands.now=commands['status'];
commands.log=commands['login'];
commands.nick=commands['login'];
commands.nickname=commands['login'];
commands.id=commands['identify'];
commands.quit=commands['logout'];
commands.op=commands['setops'];
commands.chanop=commands['setops'];
commands.ops=commands['setops'];
commands.chanops=commands['setops'];
commands.channels=commands['list'];
commands.me=commands['action'];
commands.send=commands['whisper'];
commands.msg=commands['whisper'];
commands.tell=commands['whisper'];



/************************************ END OF COMMANDS AREA *****************************************/

/* End of File -- requests.js */