// JavaScript Document

var client={
	
	// Object Handles
	lConsole: null,
	
	
	// Client Properties
	// ...
	
	// Data Properties
	usrIdentification: null,
	usrNick: null,
	channels: { 0:{ channame:'server',
					chanid:0,
				}},	// channels {
					// 			chanid[]: {
					//				.channame
					//				.chanid
					//				.maxmsgid
					//				.minmsgid
					//				.settings { .moderated, .topic, .private, .password }
					//				.users[] {
					//					.userid
					//					.nick
					//					.status (chanop,voice, )
					//	
	ignoreChannels:[],  // NOTE: If you come back to the server, and are still logged in
						// to another channel, longpolling.php will still find and return
						// those channels/messages; anonChannels allows it to add the
						// channel/msgid here, while hiding it from client.channels --
						// this ultimately allows us to continue the longpoll properly
	activeChanRef: null,
	
	
	// Called directly by the platform-specific script when it is fully prepared to begin
	//	the client (eg. desktop.js, mobile.js, unixterminal.js)
	initialize: function() {
console.log('client initializing');
		this.call_hook(this.hk_initialize_pre);
		
		// Parse the Events (#_events)
		lEvents=$('#_events');
		var script=document.createElement('script');
		script.defer=true;
		script.innerHTML=lEvents.html().slice(2,-2);
		script.innerHTML+=" client.initialize_finalize();";
console.log("client loading internal script");
		try {
		document.getElementsByTagName('head')[0].appendChild(script);
		} catch(e) {
// NOTE TO SELF: Parse Error does not throw exception :(
console.log("ERROR LOADING INTERNAL SCRIPT!!!");
$('body').text(script.innerHTML);
document.write(script.innerHTML);
		}
console.log("client loaded internal script");
		lEvents.remove();
console.log('client initialized');
	},
	
	
	initialize_finalize: function() {
		// Finalize some of the Command Events
		Events.Event[ECMD_JOIN].hooks.parsed=client.hevt_join_parse;
		Events.Event[ECMD_CHANOP].hooks.parsed=client.hevt_chanop_parse;
		Events.Event[ECMD_MESSAGE].hooks.parsed=client.hevt_message_parse;
		Events.Event[ECMD_ACTION].hooks.parsed=client.hevt_message_parse;
		
		this.call_hook(this.hk_initialize_post);
	},
	
	
	getActiveChanID:function(){
		return (this.activeChanRef==null?0:this.activeChanRef.chanid);
	},
	getChanNameFromID:function(chanid){
		return (this.channels[chanid]?this.channels[chanid].channame:'');
	},
	
	longpoll: function() {
		this.call_hook(this.hk_longpoll_pre);
		
		// Request Format:
		//	{ args: [chanid msgid [chanid msgid [...]]
		//	  identification: [id] }
		$.ajax({
			async:'true',
			cache:'false',
			dataType:'json',
			type:'GET',
			url:'system/longpolling.php',
			data:{
				channels:this.channels,
				ignore:this.ignoreChannels,
				identification:this.usrIdentification},
			context:this,
			success:this._cblongpoll,
			error:this.hk_longpoll_error });
			
		this.call_hook(this.hk_longpoll_post);
	},
	_cblongpoll: function(data) { 
		var messages_received=false;
		if (data.channels) {
			messages_received=true;
			for (var chanid in data.channels) {
				this.handle_messages(data.channels[chanid], chanid, false, false);
			}
		} else
		if (data.whispers) {
			messages_received=true;
			this.handle_whispers(data.whispers);
		}
		if (data.newchannels) {
			// NOTE: These are channels that we have NOT passed to it (eg. channels we joined AFTER
			//	beginning the longpoll, or channels that we've d/c'd from that haven't been garbage
			//	collected just yet)
			for (var chanid in data.channels) {
				if (typeof this.channels[chanid]!='undefined') {
					messages_received=true;
					this.handle_messages(data.channels[chanid], chanid, false, false);
				}
				else if (this.ignoreChannels.indexOf(chanid)==-1)
					this.ignoreChannels.push(chanid);
			}
		}
		
		if (messages_received)
			this.call_hook(this.hk_messagesreceived_post);
		if (this.usrIdentification)
			this.longpoll();
	},
	
	
	request: function(evt) {
		if (evt.evtref==null) {
			evt.call_hook(hk_event_request_from_undefined_event);
			return false;
		}
		
		try {
			if (evt.evtref.hooks)
				evt.call_hook(evt.evtref.hooks.reqPre);
			var data={
				request:evt.evtref.request,
				identification:this.usrIdentification,
			};
			if (evt.arguments)
				data.args=evt.arguments;
			$.ajax({
				async:'true',
				cache:'false',
				dataType:'json',
				type:'GET',
				url:'system/requests.json.php',
				data:data,
				context:evt,
				success:this.evt_handle_success,
				error:this.evt_handle_error });
			if (evt.evtref.hooks)
				evt.call_hook(evt.evtref.hooks.reqPost);
		} catch(e) {
			evt.call_hook(hk_event_request_exception_thrown,e);
			return false;
		}
				
		return true;
	},
	
	handle_whispers:function(uWhispers) {
		var whisperLength=null, whisper=null, evt=null;
		for (var i=0, whisperLength=uWhispers.length; i<whisperLength; i++) {
			whisper=uWhispers[i];
			whisper.type='whisper';
			evt=new Event();
			evt.read(whisper,false);
			evt.call_hook(hk_server_event_append_whisper);
			delete evt;
		}
	},
	
	handle_messages:function(uMessages, chanid, old, prepend) {
		var localChanRef=null, msgRef=null, evt=null, channame=null, i=null, msg=null;
		localChanRef=this.channels[chanid];
		if (typeof localChanRef!='undefined') {
			channame=this.getChanNameFromID(chanid);
			for (i=0, msgLength=uMessages.length; i<msgLength; i++) {
				msgRef=uMessages[i];
				if (msgRef.id>localChanRef.maxmsgid) {
					localChanRef.maxmsgid=msgRef.id;	
					if (localChanRef.minmsgid==null)
						localChanRef.minmsgid=msgRef.id;
				}
				else if (old==true && msgRef.id<localChanRef.minmsgid)
					localChanRef.minmsgid=msgRef.id;
				else
					continue;
				msgRef.chanid=chanid;
				msgRef.channame=channame;
				evt=new Event();
				evt.read(msgRef,old);
				if (prepend)
					evt.call_hook(hk_server_event_prepend_message);
				else
					evt.call_hook(hk_server_event_append_message);
				delete evt;
			}
		}
	},
	
	
	// Event Handlers
	evt_handle_success:function(data){
		if (data && data.response==2) {
			if (this.evtref.hSuccess) this.call_hook(this.evtref.hSuccess,data);
			if (this.evtref.hooks) this.call_hook(this.evtref.hooks.reqSuccess,data);
			if (this.cb_success) this.cb_success.call(this.cb_success_context,data);
		} else {
			if (typeof data.error!='undefined')
				this.call_hook(hk_server_response_error,errCodes[data.error]);
			if (this.evtref.hooks) this.call_hook(this.evtref.hooks.reqSuccessError,data);
		}
	},
	evt_handle_error:function(data){
		this.request();
	},
	hevt_chanop_parse:function(){
		var optype=this.arguments.optype;
		if (optype.match(/^(\+o|chanop|ops|op|operator|\+op|chanops|owner|chanowner|\+owner|\+chanowner|o|\+ops)$/i)) {
			optype='operator';	
		} else if (optype.match(/^(\+v|voice|chanvoice|v|\+voice)$/i)) {
			optype='voice';	
		} else
			optype='';
		this.arguments.optype=optype;
	},
	hevt_message_parse:function(){
		this.arguments['message']=encodeURIComponent(this.arguments['message']);
	},
	hevt_join_parse:function(){
		if (this.arguments['channelname'][0]=='#')
			this.arguments['channelname']=this.arguments['channelname'].slice(1);
	},
	hevt_login:function(evt,data){
		client.usrIdentification=data.identification;
console.log("Login success -- longpoll()")
		client.longpoll();
	},
	hevt_logout:function(evt,data){
		client.usrIdentification=null;
		client.channels={};
	},
	hevt_join:function(evt,data){
		// data {
		//	.channel {
		//		.chanid, .title, .topic, .msgid, .private, .moderated, .autoclear
		//		.users[] {
		//			.id, .ip, .nick, .status(operator, voice, null)
		//		.messages[] { 
		//			.id, .message, .nick, .timestamp, .type, .userid
		data=data.channel;
		client.channels[data.chanid]={};
		var chanRef=client.channels[data.chanid];
		chanRef.settings={};
		chanRef.users={};
		
		chanRef.chanid=data.chanid;
		chanRef.channame=data.title;
		chanRef.maxmsgid=0;
		chanRef.minmsgid=null;
		
		chanRef.settings.topic=data.topic;
		chanRef.settings.private=(data.private=="1"?true:false);
		chanRef.settings.moderated=(data.moderated=="1"?true:false);
		chanRef.settings.autoclear=(data.autoclear=="1"?true:false);
		
		var dataUsrRef=null, localUsrRef=null, userid=null;
		for (var i in data.users) {
			dataUsrRef=data.users[i];
			userid=dataUsrRef.id;
			chanRef.users[userid]={};
			localUsrRef=chanRef.users[userid];
			localUsrRef.userid=userid;
			localUsrRef.nick=dataUsrRef.nick;
			localUsrRef.status=dataUsrRef.status;
		}
		
		client.handle_messages(data.messages, data.chanid, true, false);
	},
	hevt_retrieveold:function(evt,data){
		// data {
		//	.messages[] {
		//		.id, .message, .nick, .timestamp, .type, .userid
		//	.chanid
		//	.end -- true if we've reached the very first message
		//	.msgid -- msgid of the earliest message provided
		data.messages.reverse(); // Reverse the messages, so that prepending works the way we want
		client.handle_messages(data.messages, data.chanid, true, true);
	},
	hsrv_join:function(){
		var chanid=this.arguments.chanid;
		var chanRef=client.channels[chanid];
		if (typeof chanRef=='undefined') return;
		var usrRef=chanRef.users[this.arguments.suserid]={};
		usrRef.userid=this.arguments.suserid;
		usrRef.nick=this.arguments.susernick;
		usrRef.status=null;
	},
	hsrv_leave:function(){
		var chanid=this.arguments.chanid;
		var chanRef=client.channels[chanid];
		if (typeof chanRef=='undefined') return;
		delete chanRef.users[this.arguments.suserid];
	},
	hsrv_modify_ops:function(){
		var chanid=this.arguments.chanid;
		var chanRef=client.channels[chanid];
		if (typeof chanRef=='undefined') return;
		var usrRef=chanRef.users[this.arguments.duserid];
		if (typeof usrRef=='undefined') return;
		usrRef.status=(this.evtid==ESRV_SETOPS_CHANOPS_ON?'operator':
						this.evtid==ESRV_SETOPS_VOICE_ON?'voice':'');
	},
	hsrv_modify_chan:function(){
		var chanid=this.arguments.chanid;
		var chanRef=client.channels[chanid];
		if (typeof chanRef=='undefined') return;
		if (this.evtid==ESRV_MODIFY_TOPIC)
			chanRef.settings.topic=this.arguments.topic;
		else if (this.evtid==ESRV_MODIFY_MODERATED_ON)
			chanRef.settings.moderated=true;
		else if (this.evtid==ESRV_MODIFY_MODERATED_OFF)
			chanRef.settings.moderated=false;
		else if (this.evtid==ESRV_MODIFY_PRIVATE_ON)
			chanRef.settings.private=true;
		else if (this.evtid==ESRV_MODIFY_PRIVATE_OFF)
			chanRef.settings.private=false;
		else if (this.evtid==ESRV_MODIFY_AUTOCLEAR_ON)
			chanRef.settings.autoclear=true;
		else if (this.evtid==ESRV_MODIFY_AUTOCLEAR_OFF)
			chanRef.settings.autoclear=false;
		
	},
	
	
	// Hooks (may be used for whatever reason in the future)
	//	Use call_hook(__hook_function__) to call the hook IF set, and under this context
	call_hook: function(func) { if (typeof func == 'function') func.call(this); },
	hk_initialize_pre:null,
	hk_initialize_post:null,
	hk_longpoll_pre:null,
	hk_longpoll_post:null,
	hk_longpoll_error: function(data){
		console.log('longpoll error..');
		console.log(data);
		if (typeof data == 'object') {
			for (var key in data) {
				if (typeof key == 'function') continue;
				console.log(key+' => '+data[key]);	
			}
			$('body').css({ background:'#FFF' });
			$('body').html('<span>'+data.responseText+'</span>');
			document.write(data.responseText);
		}
	},
	hk_messagesreceived_post:null,
_tMessageCreated:null,
};



var Event=(function(){
	this.eventid=0;
	this.evtref=null;	// Reference to associated Event object (Events.Event[eventid])
	this.timestamp=Date.now();
	this.client=client;
	
	this.fromObject=function(data){
		this.arguments={};
		for (var key in data) {
			this[key]=data[key];	
			this.arguments[key]=data[key];
		}
		if (data.eventid)
			this.evtref=Events.Event[data.eventid];
		return this;
	};
	// Read Data
	//	Reads and parses a message object received from the server
	//		
	//	data {  .chanid
	//			.id
	//			.message*
	//			.nick  (the user who initiated this event)
	//			.timestamp
	//			.type*
	//			.userid
	//
	//		.message
	//			The actual message stored inside the database, this string describes the whole event here, whether its a
	//			join event, a leave/dc event, a kick/ban, or even a simple message or action from a user. The type of
	//			the event is stored in .type (see below), and this .message string will be formatted according to the
	//			type of event,
	//			
	//			Message: "%s"
	//			Action: "%s"
	//			Event: "%evtid [%arg0 [%arg1 [%arg2 [ ...]]]]"  Arguments vary depending on the event type
	//
	//		.type
	//			message, action, event
	this.read=function(data,suspendExecution){
		try {
			this.arguments={};
			for (var key in data) {
				this.arguments[key]=data[key];	
			}
			if (data.type=='event') {
				// Server Event
				var evtid=data.message.match(/^\S+/);
				if (evtid.length==1) {
					evtid=evtid[0]; 
					this.evtref=Events.ServerEvent[evtid];
					if (this.evtref!=undefined) {
						// Get Variables from evtref.parseFormat/this.message
						var format=this.evtref.parseFormat;
						var pattern='^\\S+';
						var formatLen=format.length;
						var i;
						for (i=0; i<formatLen; i++) {
							pattern+='(?:\\s+('+((i+1)==formatLen?'.+':'\\S+')+'))?';
						}		
						var variables=data.message.match(pattern);	
						variables.shift();
						for (i=0; i<variables.length; i++) {
							this.arguments[this.evtref.parseFormat[i]]=variables[i];
						}
						
						
						// Set this.message=evtref.message.replace(variables)
						var args=this.arguments;
						this.arguments.message=this.evtref.message.replace(/(%\w+)/g, function(m){
							m=m.slice(1);
							if (args[m]) return args[m];
							return '';
						});
						
						if (!suspendExecution) {
							// Execute
							this.call_hook(this.evtref.handler);
							this.call_hook(hk_server_event_append_message);
						}
					} else hk_server_event_from_undefined_event();
				}
				else hk_server_event_from_undefined_event();
			}
		} catch (e) {
			this.call_hook(hk_server_event_exception_thrown,e);
		}
		return this;
	};
	// Parse String
	//	Parses a given string given by the user
	this.parse=function(string){
		var command=string.match(/^\/(\S*)/)
		if (command && command.length>=2) {
			command=command[1];
			if (this.eventid=Events.getCommandID(command)) {
				this.evtref=Events.Event[this.eventid];
				this.arguments={};
				
				// Parse the string based off the parse format listed within the associated Event object;
				//	A pattern will be built to include every variable listed within the parseFormat object, specifying the
				//	variable (as a group) in terms of whether it is a single-word variable, an optional variable, and or a
				//	continuous multi-worded variable. All of the variables parsed from string will be stored inside an
				//	array (variables) with each index matching that index of the associated variable from Event.parseFormat
				//	Any optional variables that are not found will still be listed under variables, however it will be an
				//	undefined object (typeof==undefined)
				var format;
				if (format=this.evtref.parseFormat) {
					var pattern='^\\/\\S+';
					var formatLen=format.length;
					var i;
					for (i=0; i<formatLen; i++) {
						if (format[i].value) continue;
						pattern+='(?:\\s+('+((i+1)==formatLen&&format[i].continuous?'.+':'\\S+')+(format[i].optional?'))?':'))');
					}
					var variables=string.match(pattern);
					if (variables) {
						variables.shift();
						
						// Set each variable to this Object
						for (i=0; i<variables.length; i++) {
							if (typeof variables[i]=='undefined')
								continue;
							this[format[i].name]=variables[i];	
							this.arguments[format[i].name]=variables[i];
						}
						
						// Set any preset arguments to this Object
						for (i=0; i<formatLen; i++) {
							if (format[i].value) {
								this[format[i].name]=format[i].value;
								this.arguments[format[i].name]=format[i].value;	
							}
						}
						
						// Add argument chanid if necessary
						if (this.evtref.flags&EFLG_APPENDCHANID) {
							var chanid=client.getActiveChanID();	
							this['chanid']=chanid;
							this.arguments['chanid']=chanid;	
						}
						this.call_hook(this.evtref.hooks.parsed);
						
						
						// Execute Command?
						if (this.evtref.flags&EFLG_EXECUTE)
							this.execute();	
					} else
						this.call_hook(hk_event_parsed_bad_format,{string:string,command:command,event:this.evtref});
				}
			} else {
				// Could not find matching Command
				this.call_hook(hk_event_unknown_command,string);
			}
		} else if (string.length>0) {
			// Message to Channel
			return this.parse('/message '+string);
		}
		
		return this;
	};
	this.execute=function(){
		this.call_hook(this.evtref.hSuccess);
		return this;
	};
	this.request=function(callback){
		if (callback) {
			this.cb_success=callback;
			this.cb_success_context=arguments.callee;
		}
		this.client.request(this);
		return this;
	};
	
	
	// Hooks
	//	NOTE: Implement hooks in platform-specific script (eg. Desktop.js, Mobile.js) - used for triggering events to the terminal
	//	NOTE: Hooks that require more arguments than just this event object, will have a single arguments object passed (ie. arguments[1])
	//	NOTE: Event-specific hooks are listed under Events.php
	this.hook_context=this;
	this.call_hook=function(func,args) { if (typeof func=='function') return func.call(this.hook_context,this,args); return true; };
	
	return this;
});