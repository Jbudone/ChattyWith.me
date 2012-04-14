<?php
	
	// EVENT HANDLERS WRITTEN INTO JAVASCRIPT
	
/*
	WARNING WARNING WARNING
	
	Events.php echoes this JS script out into a commented field in news.php (for performance reasons, but mostly just for hacky fun). This means that
	/ * field comments * /  are completely FORBIDDEN within the script
*/
echo <<<EOF


	var EFLG_EXECUTE=0x01<<0,		// Force Execution immediately after parsing (Note: This sends the event object to the function, NO values from the server)
		EFLG_SPITBACK=0x01<<1,		// Print the executed command into the console
		EFLG_POOLREQUEST=0x01<<2,	// Pool request rather than making this request individually
		EFLG_APPENDCHANID=0x01<<3,	// Append the current channel-id that this request is being created within
		_x;
	
	var ECMD_LOGIN=0x01, // Start from 0x01 (if evtid fails when evtid==0)
		ECMD_IDENTIFY=0x02,
		ECMD_LOGOUT=0x03,
		ECMD_STATUS=0x04,
		ECMD_REGISTER=0x05,
		ECMD_LIST=0x06,
		ECMD_JOIN=0x07,
		ECMD_LEAVE=0x08,
		ECMD_MESSAGE=0x09,
		ECMD_ACTION=0x0A,
		ECMD_RETRIEVE=0x0B,
		ECMD_RETRIEVEOLD=0x0C,
		ECMD_GETLIST=0x0D,
		ECMD_KICK=0x0E,
		ECMD_BAN=0x0F,
		ECMD_BANREM=0x10,
		ECMD_CHANOP=0x11,
		ECMD_MODIFY=0x12,
		ECMD_WHOIS=0x13,
		ECMD_PINGCHAN=0x14,
		ECMD_WHISPER=0x15,
		_x;
		
		
		
	// Event Codes (NOTE: This is in SYNC with channel.php)
	var ESRV_JOIN=0x01, // join [suserid] [susernick]
		ESRV_LEAVE=0x02, // leave [suserid] [susernick]
		ESRV_DC=0x03, // dc [suserid] [susernick]
		ESRV_KICK=0x04, // kick [suserid] [susernick] [duserid] [dusernick] [reason]  :: suser is the user requesting kick
		ESRV_BAN_SET=0x05, // ban [suserid] [susernick] [ip] [until] [strict] [reason]
		ESRV_BAN_MODIFY=0x06, // ban [suserid] [susernick] [ip] [until] [strict] [reason]
		ESRV_BAN_REMOVE=0x07, // ban [suserid] [susernick] [ip] [reason]
		ESRV_SETOPS_CHANOPS_ON=0x08, // setops [suserid] [susernick] [duserid] [dusernick]  :: suser is the user setting chanops
		ESRV_SETOPS_CHANOPS_OFF=0x09, // setops [suserid] [susernick] [duserid] [dusernick]  :: suser is the user setting chanops
		ESRV_SETOPS_VOICE_ON=0x0A, // setops [suserid] [susernick] [duserid] [dusernick]  :: suser is the user setting voiceops
		ESRV_SETOPS_VOICE_OFF=0x0B, // setops [suserid] [susernick] [duserid] [dusernick]  :: suser is the user setting voiceops
		ESRV_MODIFY_TOPIC=0x0C, // modify [suserid] [susernick] [topic]
		ESRV_MODIFY_PASSWORD=0x0D, // modify [suserid] [susernick]
		ESRV_MODIFY_MODERATED_ON=0x0E, // modify [suserid] [susernick]
		ESRV_MODIFY_MODERATED_OFF=0x0F, // modify [suserid] [susernick]
		ESRV_MODIFY_PRIVATE_ON=0x10, // modify [suserid] [susernick]
		ESRV_MODIFY_PRIVATE_OFF=0x11, // modify [suserid] [susernick]
		ESRV_JOINOPS_CHANOPS=0x12, // joinops [suserid] [susernick]
		ESRV_JOINOPS_VOICEOPS=0x13, // joinops [suserid] [susernick]
		ESRV_MODIFY_AUTOCLEAR_ON=0x14, // modify [suserid] [susernick]
		ESRV_MODIFY_AUTOCLEAR_OFF=0x15, // modify [suserid] [susernick]
		_x;
	
	
	// Event-Specific Hooks
	//	Every event may contain hooks (listed within the hooks property object), and should be listed here for
	//	consistency. The Event object instance will call hooks properly from within it at the proper times. 
	//	Because of this, certain hooks are required to be created for Events with certain characteristics
	//	These include,
	//	
	//		Parsed Events: hooks.parsed   (occurs when the event is finished being parsed)
	//		Request Events: hooks.reqPre, hooks.reqPost (occurs before/after the event sends its request to the server)
	//						hooks.reqComplete, hooks.reqSuccess, hooks.reqError	(ajax request callbacks)
	//
	//	For further information about the Event-specific hooks, look under client.js Event object
	var hk_event_unknown_command=function(){ };
		hk_event_parsed_bad_format=function(){ },
		hk_event_request_from_undefined_event=function(){ },
		hk_event_request_exception_thrown=function(){ },
		hk_server_event_exception_thrown=function(){ },
		hk_server_event_from_undefined_event=function(){ },
		hk_server_event_append_message=function(){ },
		hk_server_event_prepend_message=function(){ },
		hk_server_event_append_whisper=function(){ },
		hk_server_event_append_log=function(){ },
		hk_server_response_error=function(){ },
		hk_server_event_add_messages_completed=function(){ },
		hk_server_event_add_messages_started=function(){ },
		
		evt_hooks=function(){
			var parsed=null,  // note: return false to throw parse error
			reqPre=null,
			reqPost=null,
			reqSuccess=null,
			reqSuccessError=null;
			return this; };

	
	// Events
	//	This describes every single possible event that could be written to or received from the server. Events
	//	are described as follows,
	//	
	//	ECMD_[EVENT_NAME_HERE]:{
	//		name:['command','alias_command','alias_command2', ...],
	//		[parseFormat]:[ command parsing details (explained below) ],
	//		request:'name_of_request',  (eg. 'login' -- server-side receives the request named 'login')
	//		[help]:'This is a description of the command, and an example of its usage',
	//		[hSuccess]:ptr_to_function,	(this gets called first on a successful request to server - with no
	//									errors received back)
	//		hooks:{		(hooks are described above)
	//			parsed:hk_name_listed_above,
	//			pre:hk_name_listed_above,
	//			post:hk_name_listed_above,
	//
	//
	//
	//	parseFormat
	//		Parse Format simply describes to the Event object how it should parse the given command. For example,
	//		/login username password		This should be parsed as a login command, with the given username and
	//										password. Clearly the username and password need to be parsed in order,
	//										that is to say that the username will always be written first, and the
	//										password will only come afterwards
	//		/login new_user					This should also allow the user to login, but since its a new user
	//										it is not necessary for them to provide a password. Obviously an
	//										optional setting is needed for the password argument
	//
	//		parseFormat will be written as follows,
	//		parseFormat:[{arg1},{arg2},{arg3}, ...]  to keep each argument listed in ORDER of where it will appear
	//		{arg1} --> {name:'argument_name',	this is the name of the argument that the server sees in the request
	//					[optional]:1			set this if the argument can be optionally set, NOTE that ONLY
	//											variables at the end of the argument list may include this optional
	//											setting. Placing an optional argument in-between two required
	//											arguments will result in unwanted effects
	//					[continuous]:1			set this to allow the rest of the string to be placed into this
	//											argument, NOTE that this MUST be placed at the absolute end of the
	//											argument list, doing otherwise will result in undesired effects
	//					[value]:"Preset Value"	set the preset value for this argument here, no parsing will be done
	//											for this specific argument. NOTE that any preset arguments MUST be
	//											placed at the END of the argument list, doing otherwise will cause
	//											undesirable effects
	//
	//		Note: If parseFormat is not written, then it will treat the event as a paramaterless command
	//
	//
	//
	//	ESRV_[EVENT_FROM_SERVER]:{
	//		parseFormat: A list of all parameters in this eventtype, in the order that they will be received, eg.
	//					['param1','param2','param3']  this an event received like so, "18 23 88 12" to be parsed
	//													as 18 being the eventid, 23 being placed as param1 (first
	//													parameter), 88 as param2, and 12 as param3
	//					Note that ALL parameters are optional, meaning that if the first paramter is given, and
	//					nothing more, then this event will be executed without raising an error. Also, the very
	//					last parameter will automatically be counted as continuous; meaning that any extended
	//					message will be included as apart of the same parameter
	//		message: The way to write out the event message to the console, eg. 
	//					"%susernick has kicked %dusernick from channel %channame", where the parameters
	//					['susernick','dusernick'] are both provided in parseFormat (note: 'channame' and
	//					'chanid' will automatically be included during the parse)
	//		[handler]: Function to be called as soon as this message has been parsed, but not yet sent to the 
	//					console as a message (ie. the execution function)
	//
	//
	var Events={
		Event: { ECMD_LOGIN:{		_eventid:ECMD_LOGIN,
									name:['login','nickname','nick'],
							 		request:'login',
							 		parseFormat:[{name:'user'},
												 {name:'pass',optional:1}],
							 		help:'/login [nickname], like this:  /login JB',
									mSuccess:'You have successfully logged in as ^14%nick^1; welcome back!',
									mError:'There was an error attempting to login (\$ERRID): \$ERRMSG',
									hSuccess:client.hevt_login,
									hooks:new evt_hooks(),
									flags:0x00 },
				 ECMD_IDENTIFY:{	_eventid:ECMD_IDENTIFY,
									name:['identify'],
									request:'login',
				 			 		parseFormat:[{name:'id'}],
									help:'/identify [identification] -- chances are you won\'t need to use this',
									mSuccess:'You have successfully been identified as ^14%nick^1; welcome back!',
									mError:'There was an error attempting to identify yourself (\$ERRID): \$ERRMSG',
									hSuccess:client.hevt_login,
									hooks:new evt_hooks(),
									flags:0x00 },
				 ECMD_LOGOUT:{		_eventid:ECMD_LOGOUT,
									name:['logout','quit'],
									request:'logout',
									help:'/logout -- this will log you out of the server, de-identify you, and force you to disconnect from all the channel you are connected to',
									hSuccess:client.hevt_logout,
									mSuccess:'You have successfully logged out',
									mError:'There was an error logging out (\$ERRID): \$ERRMSG',
									hooks:new evt_hooks(),
									flags:0x00 },
				 ECMD_STATUS:{		_eventid:ECMD_STATUS,
									name:['status'],
				 					request:'status',
									mSuccess:'Your status, \\n\\t^15[^8Nickname^15]: ^9%nick\\n\\t^15[^8Identification^15]: ^9%identification\\n\\t^15[^8userid^15]: ^9%userid',
									mError:'There was an error fetching your status (\$ERRID): \$ERRMSG',
				 					hooks:new evt_hooks(),
									flags:0x00 },
				 ECMD_REGISTER:{	_eventid:ECMD_REGISTER,
				 					name:['register'],
									request:'register',
									parseFormat:[{name:'password',optional:1},
												 {name:'passconfirm',optional:1}],
									help:'/register [password] [confirmed password] -- Registers a password to your current username; to remove registration, simply leave the password fields blank',
									mSuccess:'You have successfully registered your nickname',
									mError:'There was an error registering your nickname (\$ERRID): \$ERRMSG',
									hooks:new evt_hooks(),
									flags:0x00 },
				 ECMD_LIST:{		_eventid:ECMD_LIST,
				 					name:['list','channels'],
									request:'list',
									help:'/list -- Opens a new window with a list of all public chatrooms',
									mError:'There was an error fetching the server chatroom list (\$ERRID): \$ERRMSG',
									hooks:new evt_hooks(),
									flags:EFLG_EXECUTE },
				 ECMD_JOIN:{		_eventid:ECMD_JOIN,
				 					name:['join'],
									request:'join',
									parseFormat:[{name:'channelname'},
												 {name:'password',optional:1}],
									help:'/join #[channelname] [password] --  Like this,  /join #chat    or this,   /join #owner admin',
									mSuccess:'\\n\\n^14Welcome to ^11#%title\\n^14The topic of the day is, ^9%topic\\n\\n\\n\\n',
									mError:'There was an error joining the channel (\$ERRID): \$ERRMSG',
									hSuccess:client.hevt_join,
									hooks:new evt_hooks(),
									flags:EFLG_SPITBACK },
				 ECMD_LEAVE:{		_eventid:ECMD_LEAVE,
				 					name:['leave'],
									request:'leave',
									help:'/leave   -- Use it INSIDE of the channel you want to leave. This will NOT work in the server console',
									mSuccess:'You have left the channel #%channame',
									mError:'There was an error leaving the channel (\$ERRID): \$ERRMSG',
									hSuccess:client.hevt_leave,
									hooks:new evt_hooks(),
									flags:EFLG_EXECUTE|EFLG_APPENDCHANID },
				 ECMD_MESSAGE:{		_eventid:ECMD_MESSAGE,
				 					name:['message'],
									request:'message',
									parseFormat:[{name:'message',continuous:1}],
									help:'/message [message]',
									mError:'There was an error sending a message (\$ERRID): \$ERRMSG',
									hooks:new evt_hooks(),
									flags:EFLG_POOLREQUEST|EFLG_APPENDCHANID },
				 ECMD_ACTION:{		_eventid:ECMD_ACTION,
				 					name:['action','me'],
									request:'action',
									parseFormat:[{name:'message',continuous:1}],
									help:'/action [action message]',
									mError:'There was an error sending a message (\$ERRID): \$ERRMSG',
									hooks:new evt_hooks(),
									flags:EFLG_POOLREQUEST|EFLG_APPENDCHANID },
				 ECMD_RETRIEVEOLD:{	_eventid:ECMD_RETRIEVEOLD,
				 					name:['retrieveold'],
									request:'retrieveold',
									parseFormat:[{name:'maxmsgid'}],
									mError:'There was an error fetching the older messages (\$ERRID): \$ERRMSG',
									hSuccess:client.hevt_retrieveold,
									hooks:new evt_hooks(),
									flags:EFLG_APPENDCHANID },
				 ECMD_GETLIST:{		_eventid:ECMD_GETLIST,
				 					name:['get','show'],
									request:'getlist',
									parseFormat:[{name:'listid'}],
									mError:'There was an error fetching the data (\$ERRID): \$ERRMSG',
									hooks:new evt_hooks(),
									flags:EFLG_SPITBACK|EFLG_APPENDCHANID },
				 ECMD_KICK:{		_eventid:ECMD_KICK,
				 					name:['kick'],
									request:'kick',
									parseFormat:[{name:'kickid'},
												 {name:'reason',optional:1,continuous:1}],
									mError:'There was an error kicking user (\$ERRID): \$ERRMSG',
									hooks:new evt_hooks(),
									flags:EFLG_SPITBACK|EFLG_APPENDCHANID },
				 ECMD_BAN:{			_eventid:ECMD_BAN,
				 					name:['ban','punish'],
									request:'ban',
									parseFormat:[{name:'username'},
												 {name:'until',optional:1,continuous:1}],
									help:'/ban [username] [until] -- Like this, /ban admin 5 minutes   , or, /ban user January 13th 2015  , or, /ban thatguy tomorrow',
									mError:'There was an error banning user (\$ERRID): \$ERRMSG',
									hooks:new evt_hooks(),
									flags:EFLG_SPITBACK|EFLG_APPENDCHANID },
				 ECMD_BANREM:{		_eventid:ECMD_BANREM,
				 					name:['banrem','removeban','remban'],
									request:'ban',
									parseFormat:[{name:'username'},
												 {name:'strict',value:'remove'}],
									help:'/banrem [username] -- this will remove any ban on this username',
									mError:'There was an error removing ban on user (\$ERRID): \$ERRMSG',
									hooks:new evt_hooks(),
									flags:EFLG_SPITBACK|EFLG_APPENDCHANID },
				 ECMD_CHANOP:{		_eventid:ECMD_CHANOP,
				 					name:['chanop','op','setops'],
									request:'chanop',
									parseFormat:[{name:'opid'},
												 {name:'optype'}],
									help:'/op [username] [optype] -- optype use + for upgrading user\'s operator status, - for removing status; O for chanop, V for voice; eg. /op user +O to give user channel operator, /op user -V to remove voice ops from user',
									mError:'There was an error op-ing user (\$ERRID): \$ERRMSG',
									hooks:new evt_hooks(),
									flags:EFLG_SPITBACK|EFLG_APPENDCHANID },
				 ECMD_MODIFY:{		_eventid:ECMD_MODIFY,
				 					name:['modify','edit','change','settings'],
									request:'modify',
									parseFormat:[{name:'setting'},
												 {name:'value',optional:1,continuous:1}],
									help:'/modify [setting] [value] -- topic/[topic message], password/[password], private/[1/0], autoclear/[1/0]',
									mError:'There was an error in applying the channel modification (\$ERRID): \$ERRMSG',
									hooks:new evt_hooks(),
				 					flags:EFLG_SPITBACK|EFLG_APPENDCHANID },
				 ECMD_WHOIS:{		_eventid:ECMD_WHOIS,
				 					name:['whois'],
									request:'whois',
									parseFormat:[{name:'nick'}],
									help:'/whois [username]',
									mSuccess:'^14WHOIS ^8%nick \\n\\t^15[^8user^15]: ^9%nick\\n\\t^15[^8userid^15]: ^9%userid\\n\\t^15[^8ping^15]: ^9%ping\\n\\t^15[^8channels^15]: ^9%channels',
									mError:'There was an error fetching user details (\$ERRID): \$ERRMSG',
									hooks:new evt_hooks(),
									flags:EFLG_SPITBACK },
				 ECMD_PINGCHAN:{	_eventid:ECMD_PINGCHAN,
				 					name:['pingchan'],
									request:'pingchan',
									parseFormat:[{name:'channels'}],
									hooks:new evt_hooks(),
									flags:0x00 },
				 ECMD_WHISPER:{		_eventid:ECMD_WHISPER,
				 					name:['whisper','msg','tell'],
									request:'whisper',
									parseFormat:[{name:'nick'},
												 {name:'message',continuous:1}],
									mError:'There was an error sending whisper to user (\$ERRID): \$ERRMSG',
									hSuccess:client.hevt_whisper,
									hooks:new evt_hooks(),
									flags:0x00 },
		},
		
		
		ServerEvent: {
			ESRV_JOIN:{					_eventid:ESRV_JOIN,
										parseFormat:['suserid','susernick'],
										message:'%susernick has joined #%channame',
										handler:client.hsrv_join },
			ESRV_LEAVE:{				_eventid:ESRV_LEAVE,
										parseFormat:['suserid','susernick'],
										message:'%susernick has left #%channame',
										handler:client.hsrv_leave },
			ESRV_DC:{					_eventid:ESRV_DC,
										parseFormat:['suserid','susernick'],
										message:'%susernick has disconnected from the server',
										handler:client.hsrv_leave },
			ESRV_KICK:{					_eventid:ESRV_KICK,
										parseFormat:['suserid','susernick','duserid','dusernick','reason'],
										message:'%susernick has kicked %dusernick from #%channame   %reason',
										handler:client.hsrv_leave },
			ESRV_BAN_SET:{				_eventid:ESRV_BAN_SET,
										parseFormat:['suserid','susernick','ip','until','strict','reason'],
										message:'%susernick has banned IP [%ip] for %until   %reason' },
			ESRV_BAN_MODIFY:{			_eventid:ESRV_BAN_MODIFY,
										parseFormat:['suserid','susernick','ip','until','strict','reason'],
										message:'%susernick has modified ban on IP [%ip] for %until   %reason' },
			ESRV_BAN_REMOVE:{			_eventid:ESRV_BAN_REMOVE,
										parseFormat:['suserid','susernick','ip','reason'],
										message:'%susernick has removed ban on IP [%ip]   %reason' },
			ESRV_SETOPS_CHANOPS_ON:{	_eventid:ESRV_SETOPS_CHANOPS_ON,
										parseFormat:['suserid','susernick','duserid','dusernick'],
										message:'%susernick has has given channel operator status +O to %dusernick',
										handler:client.hsrv_modify_ops },
			ESRV_SETOPS_CHANOPS_OFF:{	_eventid:ESRV_SETOPS_CHANOPS_OFF,
										parseFormat:['suserid','susernick','duserid','dusernick'],
										message:'%susernick has has stripped %dusernick of channel operator status -O',
										handler:client.hsrv_modify_ops },
			ESRV_SETOPS_VOICE_ON:{		_eventid:ESRV_SETOPS_VOICE_ON,
										parseFormat:['suserid','susernick','duserid','dusernick'],
										message:'%susernick has has given voice operator status +v to %dusernick',
										handler:client.hsrv_modify_ops },
			ESRV_SETOPS_VOICE_OFF:{		_eventid:ESRV_SETOPS_VOICE_OFF,
										parseFormat:['suserid','susernick','duserid','dusernick'],
										message:'%susernick has has stripped %dusernick of any channel status',
										handler:client.hsrv_modify_ops },
			ESRV_MODIFY_TOPIC:{			_eventid:ESRV_MODIFY_TOPIC,
										parseFormat:['suserid','susernick','topic'],
										message:'%susernick has changed the channel topic to "%topic"',
										handler:client.hsrv_modify_chan },
			ESRV_MODIFY_PASSWORD:{		_eventid:ESRV_MODIFY_PASSWORD,
										parseFormat:['suserid','susernick'],
										message:'%susernick has modified the channel password',
										handler:client.hsrv_modify_chan },
			ESRV_MODIFY_MODERATED_ON:{	_eventid:ESRV_MODIFY_MODERATED_ON,
										parseFormat:['suserid','susernick'],
										message:'%susernick has turned channel Moderated mode (+m) On',
										handler:client.hsrv_modify_chan },
			ESRV_MODIFY_MODERATED_OFF:{	_eventid:ESRV_MODIFY_MODERATED_OFF,
										parseFormat:['suserid','susernick'],
										message:'%susernick has turned channel Moderated mode (+m) Off',
										handler:client.hsrv_modify_chan },
			ESRV_MODIFY_PRIVATE_ON:{	_eventid:ESRV_MODIFY_PRIVATE_ON,
										parseFormat:['suserid','susernick'],
										message:'%susernick has turned channel Private mode (+p) On',
										handler:client.hsrv_modify_chan },
			ESRV_MODIFY_PRIVATE_OFF:{	_eventid:ESRV_MODIFY_PRIVATE_OFF,
										parseFormat:['suserid','susernick'],
										message:'%susernick has turned channel Private mode (+p) Off',
										handler:client.hsrv_modify_chan },
			ESRV_MODIFY_AUTOCLEAR_ON:{	_eventid:ESRV_MODIFY_AUTOCLEAR_ON,
										parseFormat:['suserid','susernick'],
										message:'%susernick has turned channel Autoclear mode (+a) On',
										handler:client.hsrv_modify_chan },
			ESRV_MODIFY_AUTOCLEAR_OFF:{	_eventid:ESRV_MODIFY_AUTOCLEAR_OFF,
										parseFormat:['suserid','susernick'],
										message:'%susernick has turned channel Autoclear mode (+a) Off',
										handler:client.hsrv_modify_chan },
			ESRV_JOINOPS_CHANOPS:{		_eventid:ESRV_JOINOPS_CHANOPS,
										parseFormat:['suserid','susernick'],
										message:'%susernick has been given +O chanops by ChanServ' },
			ESRV_JOINOPS_VOICEOPS:{		_eventid:ESRV_JOINOPS_VOICEOPS,
										parseFormat:['suserid','susernick'],
										message:'%susernick has been given +v voiceops by ChanServ' },
		},
		
		
		getCommandID: function(command) {
			command=command.toLowerCase();
			for (var cmd in this.Event) {
				if (this.Event[cmd].name.indexOf(command)!=-1) return cmd;	
			}
			return null;
		},
	};

	// DUST OFF Events.ServerEvent and Events.Event
	//	Note how ServerEvent is an associative-array-like object which associates each server
	//	event id (eg. ESRV_JOIN) to an appropriately describing object. However, Javascript
	//	loads each key as a literal string, even though we prefer to list it as its associated
	//	eventid; this function will make the necessary adjustments for us. 
	for (var key in Events.ServerEvent) { Events.ServerEvent[Events.ServerEvent[key]._eventid]=Events.ServerEvent[key]; }
	for (var key in Events.Event) { Events.Event[Events.Event[key]._eventid]=Events.Event[key]; }
	

EOF;
