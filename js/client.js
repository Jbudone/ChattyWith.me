// JavaScript Document


var settings=(function(){
	
	var details={
		
		message_maxlen:512,
		pingTimer:750,
		pingTimeout:3000,
		longpollRetry:750,
		longpollTimeout:8000,
		
		colourMap:['white','','navy','green','red','maroon','purple','olive','orange','lime','teal','aqua','royalBlue','fuchsia','grey','silver'],
		emoticonMap:{
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
		},
		messages:{
			loaded:{chanid:0,type:'startup',messages:[
					"Welcome to ^8ChattyWith.me ^14!!!,",
					"^14  An AJAX approach to IRC",
					" ",
					]},
			loaded_mobile:{chanid:0,type:'startup',messages:[
					"Welcome to ^8ChattyWith.me ^14!!!,",
					"^14  An AJAX approach to IRC",
					"^15  The ^0mobile^15 edition",
					" ",
					]},
			loaded_loggedout:{chanid:0,type:'startup',messages:[
					"Now that ^8ChattyWith^15.^8me ^1has loaded",
					"\tyou may pick a nickname to start chatting by. Type ^0/nick ^15[^9username^15] ^1to choose your username.",
					"\texample, ^0/nick ^9superman",
					"\tor perhaps ^0/nick ^9leeroyjenkins",
					]},
			loaded_loggedout_mobile:{chanid:0,type:'startup',messages:[
					"Now that ^8ChattyWith^15.^8me ^11has loaded",
					"Pick a nickname to start chatting, like this: ^0/nick ^15[^9username^15] ^1to choose your username.",
					"  example, ^0/nick ^9superman",
					"  or perhaps ^0/nick ^9leeroyjenkins",
					]},
			logon:{chanid:0,type:'startup',messages:[
					"Now that you have logged in it is time to start chatting",
					"Type the following to join the room called 'lolfun': ^0/join ^9#lolfun",
					"Or otherwise, click the list icon on the right to display a list of all public chatrooms",
					"Have fun, stay a while and make some friends.",
					" ",
					" ",
					"\tAuthor: ^0JB Braendel",
					"   You can find me on,",
					"   ^15Portal^1: http://jbud.me",
					"   ^15Twitter^1: https://twitter.com/#!/thatsjb",
					"   ^15Facebook^1: http://www.facebook.com/jb.braendel",
					"   ^15Github^1: #",
					" ",
					"Thanks go out to: ^0jQuery^1, ^0LESS",
					"Beautiful Background from: http://fullhdwallpapers.info/abstract/colorful-abstract-wallpaper-2/",
					]},
			logon_mobile:{chanid:0,type:'startup',messages:[
					" ",
					"Now that you have logged in it is time to start chatting",
					"Type the following to join the room called 'lolfun': ^0/join ^9#lolfun",
					"Have fun, stay a while and make some friends.",
					" ",
					" ",
					"\tAuthor: JB Braendel",
					" ",
					"Thanks go out to: ^0jQuery^1, ^0jQuery-Mobile",
					" ",
					"Supported Devices: ^0iOS3",
					"Untested Devices: ^0iOS4+^1, ^0Android^1, ^0Blackberry^1, ^0Windows Phone^1, ^0Symbian",
					" ",
					]},
		},
	};
	
	return details;
})();


var client={
	
	// Object Handles
	lConsole: null,
	
	
	// Client Properties
	// ...
	
	// Data Properties
	usrIdentification: null,
	usrNick: null,
	usrid: null,
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
		this.call_hook(this.hk_initialize_pre);
		
		this.activeChanRef=this.channels[0];
		
		// Parse the Events (#_events)
		lEvents=$('#_events');
		var script=document.createElement('script');
		script.defer=true;
		script.innerHTML=lEvents.html().slice(2,-2);
		script.innerHTML+=" client.initialize_finalize();";
		document.getElementsByTagName('head').item(0).appendChild(script);
		lEvents.remove();
		//this.initialize_finalize();
		
		
	},
	
	
	initialize_finalize: function() {
		// Finalize some of the Command Events
		Events.Event[ECMD_JOIN].hooks.parsed=client.hevt_join_parse;
		Events.Event[ECMD_LEAVE].hooks.reqPre=client.hevt_leave_parse; // Note: Cannot use hooks.parsed since /leave does not go into parsing mode
		Events.Event[ECMD_CHANOP].hooks.parsed=client.hevt_chanop_parse;
		Events.Event[ECMD_MESSAGE].hooks.parsed=client.hevt_message_parse;
		Events.Event[ECMD_ACTION].hooks.parsed=client.hevt_message_parse;
		
		
		this.auto_ping();
		
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
		var channels=this.channels, chanid, _chanlist={};
		for(chanid in channels) {
			_chanlist[chanid]={chanid:chanid, maxmsgid:channels[chanid].maxmsgid};
		}
		$.ajax({
			async:'true',
			cache:'false',
			dataType:'json',
			type:'GET',
			url:'system/longpolling.php',
			data:{
				channels:_chanlist,
				ignore:this.ignoreChannels,
				identification:this.usrIdentification},
			context:this,
			success:this._cblongpoll,
			error:this.hk_longpoll_error,
			timeout:settings.longpollTimeout });
		this.call_hook(this.hk_longpoll_post);
	},
	_cblongpoll: function(data) { 
		//document.body.style.display='none';
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
		//document.body.style.display='';  // NOTE: Commented out since an in-focus prompt is de-focused on mobile when this is done
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
	
	auto_ping: function() {
		var _channels=[], _chanid=0, evt=null;
		for (_chanid in client.channels) {
			if (_chanid==0) continue;
			_channels.push(_chanid);	
		}
		if (_channels.length==0) {
			setTimeout(client.auto_ping, settings.pingTimer);
			return;	
		}
		evt=((new Event).fromObject({ eventid:'ECMD_PINGCHAN' }));
		
		try {
			if (evt.evtref.hooks)
				evt.call_hook(evt.evtref.hooks.reqPre);
			var data={
				request:'pingchan',
				identification:client.usrIdentification,
				args:{
					channels:_channels
				}
			};
			$.ajax({
				async:'true',
				cache:'false',
				dataType:'json',
				type:'GET',
				url:'system/requests.json.php',
				data:data,
				context:evt,
				success:client.auto_ping_cb,
				error:client.auto_ping_err,
				timeout:settings.pingTimeout });
			if (evt.evtref.hooks)
				evt.call_hook(evt.evtref.hooks.reqPost);
			evt.args=data;
			evt.args.sent=(new Date()).getTime();
		} catch(e) {
			evt.call_hook(hk_event_request_exception_thrown,e);
			return false;
		}
	},
	
	auto_ping_cb: function(data) {
		if (data.response==2 && !(data.pinged=='0' && this.args.args.channels.length>0)) {	
			var totalTime=(new Date()).getTime()-this.args.sent;
			this.call_hook(this.evtref.hooks.reqSuccess,totalTime);
		} else {
			//==============
			// PING ERROR
			//==============
			
			var autoRejoin=(function(){
				// NOTE: Best way is to use the automated requests since
				//	there's overhead in attempting a silent re-join,
				//	eg. users send messages since you've left, passwords
				//		on channels, modifications on channel, users
				//		join/leave/change since you've left
				for (var chanid in client.channels) {
					if (chanid==0) continue;
					(new Event()).fromObject({ eventid:'ECMD_JOIN', channelname:client.channels[chanid].channame}).request();
					
					delete client.channels[chanid];
					Terminal.removeChannel(chanid);
					Terminal.removeChannelWin(chanid);
				}
				Terminal.swapChannel(0,true);
				Terminal.scrollToBottom();
			});
			
			
			if (data.error) {
				if (data.error==0x0A) {
					// Error on Server Side, retry again below
				} else if (client.usrIdentification) {
					// We were probably logged out on the server due to lag
					// Since the ping worked, we may silently re-login,
					// and attempt to rejoin each channel	
					
					
					// Relogin (Note: this is here for absolute backup scenario; I can't see where an auto server-side logout would occur though)
					var attemptRelogin=(function(){
						$.ajax({
						async:'true',
						cache:'false',
						dataType:'json',
						type:'GET',
						url:'system/requests.json.php',
						data:{request:'identify', args:{id:client.usrIdentification}},
						context:this,
						success:function(data){
							console.log("Successful Response on Re-login request..");	
							if (data.response==2) {
								console.log("Silently Re-logged in");
								console.log("Attempting to rejoin channels after disconnect");
								autoRejoin();
							} else
								attemptRelogin();
						},
						error:function(data){
							console.log("ERROR re-attemping login..trying again");
							attemptRelogin();
						},
						timeout:settings.pingTimeout });
						this.call_hook(this.evtref.hooks.reqSuccessError,totalTime);
					});
					attemptRelogin();
					return; // Avoid further pings (so to avoid multiple relogin-attempts
				}
			} else {
				// Check that we've pinged the proper number of channels
				if (data.pinged=='0' && this.args.args.channels.length>0) {
					console.log("Attempting to rejoin channels after disconnect");
					autoRejoin();
				}
			}
		}
		
		setTimeout(client.auto_ping,settings.pingTimer);
	},
	
	auto_ping_err: function(data) {
		//console.log('auto_ping_err');
		this.call_hook(this.evtref.hooks.reqSuccessError,data);
		setTimeout(client.auto_ping,settings.pingTimer);
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
		this.call_hook(hk_server_event_add_messages_started);
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
				msgRef.old=old;
				evt=new Event();
				evt.read(msgRef,old);
				if (prepend)
					evt.call_hook(hk_server_event_prepend_message);
				else
					evt.call_hook(hk_server_event_append_message);
				delete evt;
			}
		}
		this.call_hook(hk_server_event_add_messages_completed);
	},
	
	handle_evtMessage:function(args) {
		var message=args['message'],
			type=args['type'],
			data=args['data'];
		
		// Parse Message into multiple messages ( use \n )
		var messages=message.split('\\n'),
		
		// Parse Messages with variables
		regArg=(function(m){
			m=m.slice(1);
			if (data[m]) return data[m];
			return '';
		});
		for (var i=0; i<messages.length; i++) {
			messages[i]=messages[i].replace(/(%\w+)/g, regArg);
		}
						
		// Parse Error Message (if necessary)
		if (data.error) {
			try {
				var _errMsg='';
				_errMsg=errCodes[data.error].message.replace(/(%\w+)/g, regArg);
				data.errMsg=_errMsg;
				
				// Replace $ERRMSG and $ERRID
				for (i=0; i<messages.length; i++) {
					messages[i]=messages[i].replace(/\$ERRMSG/gi,_errMsg);
					messages[i]=messages[i].replace(/\$ERRID/gi,data.error);
				}
			} catch(e) { data.errMsg=''; }
		}
		for (i=0; i<messages.length; i++) {
			this.call_hook(hk_server_event_append_log,{message:messages[i],type:type});
		}
	},
	
	
	// Event Handlers
	evt_handle_success:function(data){
		if (data && data.response==2) {
			if (this.evtref.hSuccess) this.call_hook(this.evtref.hSuccess,data);
			if (this.evtref.hooks) this.call_hook(this.evtref.hooks.reqSuccess,data);
			_callSuccessMessage=true;
			if (this.cb_success) _callSuccessMessage=this.cb_success.call(this.cb_success_context,data);
			if (_callSuccessMessage && this.evtref.mSuccess) client.handle_evtMessage.call(this,{data:data,message:this.evtref.mSuccess,type:'success'});
		} else {
			if (typeof data.error!='undefined')
				this.call_hook(hk_server_response_error,errCodes[data.error]);
			if (this.evtref.hooks) this.call_hook(this.evtref.hooks.reqSuccessError,data);
			if (this.evtref.mError) client.handle_evtMessage.call(this,{data:data,message:this.evtref.mError,type:'error'});
		}
	},
	evt_handle_error:function(jqXHR, textStatus, errorThrown){
		this.request(); // Resend Request
	},
	hevt_chanop_parse:function(){
		var optype=this.arguments.optype;
		if (optype.match(/^(\+o|chanop|ops|op|operator|\+op|chanops|owner|chanowner|\+owner|\+chanowner|o|\+ops)$/i)) {
			optype='0';	
		} else if (optype.match(/^(\+v|voice|chanvoice|v|\+voice)$/i)) {
			optype='1';	
		} else
			optype='2';
		this.arguments.optype=optype;
	},
	hevt_message_parse:function(){
		this.arguments['message']=encodeURIComponent(this.arguments['message']);
	},
	hevt_join_parse:function(){
		if (this.arguments['channelname'][0]=='#') {
			this.arguments['channelname']=this.arguments['channelname'].slice(1);
			return (this.arguments['channelname']!=='');
		}
	},
	hevt_leave_parse:function(){
		this.arguments['chanid']=client.activeChanRef.chanid;
	},
	hevt_login:function(evt,data){
		client.usrNick=data.nick;
		client.usrIdentification=data.identification;
		client.usrid=data.userid;
		client.longpoll();
		localStorage.setItem('identification',data.identification);
	},
	hevt_logout:function(evt,data){
		client.usrIdentification=null;
		client.usrid=null;
		
		Terminal.swapChannel(0,true);
		Terminal.removeChannels();
		Terminal.removeChannelWins();
		Terminal.scrollToBottom();
		client.channels={0:client.channels[0]};
		localStorage.removeItem('identification');
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
		
		//client.activeChanRef=client.channels[data.chanid];
		Terminal.openChannelWin(data.title,data.chanid);
		Terminal.swapChannel(data.chanid,false);
		Terminal.scrollToBottom();
	},
	hevt_leave:function(evt,data){
		
		//client.activeChanRef=client.channels[0];
		Terminal.swapChannel(getChanIDFromOffset(-1),true);
		delete client.channels[data.chanid];
		Terminal.removeChannel(data.chanid);
		Terminal.removeChannelWin(data.chanid);
		Terminal.scrollToBottom();
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
	hevt_whisper:function(evt,data){
		evt.arguments.timestamp=evt.timestamp;
		Terminal.print_whisper(evt.arguments,false);
		Terminal.scrollToBottom();
	},
	hsrv_join:function(){
		this.call_hook(client.hk_user_joined_pre,this.arguments);
		var chanid=this.arguments.chanid;
		var chanRef=client.channels[chanid];
		if (typeof chanRef=='undefined') return;
		var usrRef=chanRef.users[this.arguments.suserid]={};
		usrRef.userid=this.arguments.suserid;
		usrRef.nick=this.arguments.susernick;
		usrRef.status=null;
		this.call_hook(client.hk_user_joined_post,this.arguments);
	},
	hsrv_leave:function(){
		this.call_hook(client.hk_user_left_pre,this.arguments);
		var chanid=this.arguments.chanid;
		var chanRef=client.channels[chanid];
		if (typeof chanRef=='undefined') return;
		if (this.arguments.duserid==client.usrid) {
			// Kicked from channel
			client.hevt_leave.apply(this,(new Array(this,this.arguments)));
			return;	
		}
		delete chanRef.users[this.arguments.duserid];
		this.call_hook(client.hk_user_left_post,this.arguments);
	},
	hsrv_modify_ops:function(){
		this.call_hook(client.hk_user_changed_pre,this.arguments);
		var chanid=this.arguments.chanid;
		var chanRef=client.channels[chanid];
		if (typeof chanRef=='undefined') return;
		var usrRef=chanRef.users[this.arguments.duserid];
		if (typeof usrRef=='undefined') return;
		usrRef.status=(	(this.evtref._eventid)==ESRV_SETOPS_CHANOPS_ON?'operator':
						(this.evtref._eventid)==ESRV_SETOPS_VOICE_ON?'voice':'');
		this.arguments.status=usrRef.status;
		this.call_hook(client.hk_user_changed_post,this.arguments);
	},
	hsrv_modify_chan:function(){
		this.call_hook(client.hk_channel_changed_pre,this.arguments);
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
		this.call_hook(client.hk_channel_changed_post,this.arguments);
	},
	
	
	// Hooks (may be used for whatever reason in the future)
	//	Use call_hook(__hook_function__) to call the hook IF set, and under this context
	call_hook: function(func) { if (typeof func == 'function') func.call(this); },
	hk_initialize_pre:null,
	hk_initialize_post:null,
	hk_longpoll_pre:null,
	hk_longpoll_post:null,
	hk_longpoll_error: function(data){
		//console.log('longpoll error..');
		setTimeout(function(){
			client.longpoll.apply(client);
		},settings.longpollRetry);
	},
	hk_messagesreceived_post:null,
	hk_user_left_pre:null,
	hk_user_left_post:null,
	hk_user_joined_pre:null,
	hk_user_joined_post:null,
	hk_user_changed_pre:null,
	hk_user_changed_post:null,
	hk_channel_changed_pre:null,
	hk_channel_changed_post:null,
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
		var command=string.match(/^\/(\S*)/);
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
						if (this.call_hook(this.evtref.hooks.parsed)==false) {
							this.call_hook(hk_event_parsed_bad_format,{string:string,command:command,event:this.evtref});
							return false;	
						}					
						
						
						// Execute Command?
						if (this.evtref.flags&EFLG_EXECUTE)
							this.execute();	
					} else {
						this.call_hook(hk_event_parsed_bad_format,{string:string,command:command,event:this.evtref});
						return false;
					}
				}
			} else {
				// Could not find matching Command
				this.call_hook(hk_event_unknown_command,string);
				return false;
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


	/************************************************************************************************************************/
	/************************************************************************************************************************/



/**
	Message
	-------------
	
	Message takes in all the details for a given message, builds up the
	object of the message, and parses it for further effects (eg. color,
	emoticons, etc.)
*/
var Message=(function(chanid,message,type,timestamp,user,suspendEffects){
	var lContainer=$('<span/>')
				.addClass('chanitem')
				.addClass('chanid-'+chanid),
		lMessage=$('<span/>')
				.addClass('msg-message')
				.appendTo(lContainer),
		classes=Message.prototype.getClassesFromType(type);
	
	
	var clearXSS=(function(message){
		message=message.replace(/</g,'&lt;').replace(/>/g,'&gt;');
		return message;
	}),
	applyClasses=(function(obj,classes){
		if (obj && classes) {
			for (var i=0; i<classes.length; i++) {
				obj.addClass(classes[i]);	
			}
		}
	}),	
	replaceColors=(function(message){
		
		// Replace with Colours
		var colourMap=settings.colourMap; // cache the colourMap
		message=message.replace(/\^(1[0-5]|[0-9])/g,function(c){ return "<a style='color: "+colourMap[arguments[1]]+"'>"; });
		message=message+'</a>';
		return message;
	}),
	replaceEmotes=(function(message){
		
		// Replace with Emoticons
		var emoticonMap=settings.emoticonMap; // cache the emoticonMap
		for(var i in emoticonMap) {
			var regexp=new RegExp(i,'gi');
			message=message.replace(regexp,'<img class="emoticon" src="images/emoticons/'+emoticonMap[i]+'" />');
		}
		return message;
	}),
	replaceLinks=(function(message){
		
		// Replace Links
		message=message.replace(/((https?:\/\/|(www\.))([\da-z\-\Q_.\E]+\.[a-z]+[a-z\d\-\Q_!.?=&%#*\/\E]*))/gi,"<a href='http://$3$4' target='_blank'>$1</a>");
		return message;
	});
	
	applyClasses(lContainer,classes.container);
	applyClasses(lMessage,classes.message);
	if (user) {
		var lUser=$('<span/>')
				.addClass('msg-user')
				.prependTo(lContainer);
		if (type.match(/action/)) lUser.text('*'+user+' ');
		else if (type.match(/whisper/)) lUser.text('-'+user+'-');
		else if (type.match(/event/)) lUser.text('');
		else  lUser.text(user+' says: ');
		applyClasses(lUser,classes.user);
	}
	if (timestamp) {
		var _timestamp=new Date(timestamp.replace(/-/g,'/')), // ISO 8601 Extended Format
			date=(isNaN(_timestamp.getSeconds())?new Date(timestamp):_timestamp),
			sec, minute, hour;
		// TODO server/client offset
		//date.setSeconds(date.getSeconds()-kOFFSET_TIMEFROMSERVER);
		sec=date.getSeconds();
		if ((''+sec).length==1) sec='0'+sec;
		minute=date.getMinutes();
		if ((''+minute).length==1) minute='0'+minute;
		hour=date.getHours();
		if (hour>12) hour-=12;
		timestamp=''+hour+':'+minute+':'+sec+'  ';
		
		
		
		var lTime=$('<span/>')
				.addClass('msg-time')
				.text(timestamp)
				.prependTo(lContainer);
		applyClasses(lTime,classes.time);
	}
	
	if (!suspendEffects && message) {
		message=(replaceLinks(
				 replaceEmotes(
				 replaceColors(
				 clearXSS(
				 	message
				 )))));
	}
	lMessage.html(message);
	return lContainer;
});


/**
	Terminal
	----------------
	
	All console stuff (printing, auto-scrolling, changing channel, removing channel, etc.)
*/
var Terminal=(function(){
	var interface={
		// Print -- manual printing options
		print:null,
		print_0:null,
		print_all:null,
		print_preset:null,	// Print a preset message (written under settings object)
		
		// Print_Message -- automated printing of messages
		print_message:null,
		print_whisper:null,
		
		// Terminal-Based stuff
		scrollToBottom:null,
		swapChannel:null,
		removeChannel:null,
		removeChannels:null,
		resizePage:null,		
		
		// Channel-Window
		openChannel:null,
		
		// hooks
		hk_swapChannel_pre:null,
		hk_swapChannel_post:null,
		
		// Loader-Older
		loadOlder:null,
	};
	
	(function(){
		interface.print=(function(chanid,message,type,time,user,prepend,suspendEffects){
			var msg=new Message(chanid,message,type,time,user,suspendEffects);
			if (prepend) msg.prependTo('#console');
			else msg.appendTo('#console');
		});
		interface.print_all=(function(message,type,time,user,prepend,suspendEffects){
			for (var i in client.channels) { interface.print(client.channels[i].chanid,message,type,time,user,prepend,suspendEffects); }
		});
		interface.print_0=(function(message,type,time,user,prepend,suspendEffects){
			interface.print(0,message,type,time,user,prepend,suspendEffects);
		});
		interface.print_preset=(function(message_key){
			var msg=settings.messages[message_key], i, msgLen;
			if (!msg) throw new Error('Could not find settings.message['+message_key+']');
			msgLen=msg.messages.length;
			for (i=0; i<msgLen; i++) {
				if (msg.chanid==0)
					interface.print(0,msg.messages[i],msg.type);
				else
					interface.print(client.activeChanRef.chanid,msg.messages[i],msg.type);	
			}
		});
		
		
		interface.print_message=(function(chanid,details,prepend,suspendEffects){
			if (chanid==null) {
				for (var i in client.channels) { interface.print_message(client.channels[i].chanid,details,prepend,suspendEffects); }
				return;	
			}
			if (details.userid==client.usrid) details.type='self-'+details.type;
			if (details.old==true) details.type='old-'+details.type;
			var msg=new Message(chanid,details.message,details.type,details.timestamp,details.nick,suspendEffects);
			if (prepend) msg.prependTo('#console');
			else msg.appendTo('#console');
		});
		
		interface.print_whisper=(function(details,suspendEffects){
			var timestamp=new Date(details.timestamp),
				type='whisper';
			for (var i in client.channels) {
				var msg=new Message(i,details.message,type,timestamp.toString(),details.nick);
				msg.appendTo('#console');	
			}
		});
		
		
		
		interface.swapChannel=(function(chanid,leftTransition) {
			if (typeof interface.hk_swapChannel_pre=='function') interface.hk_swapChannel_pre.apply(this,[chanid,leftTransition]);
			client.activeChanRef=client.channels[chanid];
			
			try {
				var chanDisplay=document.getElementById('styleChanDisplay');
				chanDisplay.innerHTML=".chanitem { display:block; } #console .chanitem:not(.chanid-"+chanid+") { display:none !important; } ";
				document.getElementsByTagName('head').item(0).removeChild(chanDisplay);
				document.getElementsByTagName('head').item(0).appendChild(chanDisplay);
			} catch(e) {
				// NOTE: iOS throws, NO_MODIFICATION_ALLOWED_ERR  on above
				$('#console').css({display:'none'});
				$('.chanitem:not(.chanid-'+chanid+')').css({display:'none !important'});
				$('.chanid-'+chanid).css({display:'block !important'});
				$('#console').css({display:'block'});
			}
			
			try {
				var header=document.getElementById('chan-title');
				header.textContent=client.activeChanRef.channame;
			} catch(e) { }
			setTimeout((function(){	interface.resizePage(); interface.scrollToBottom(true); }), 200);
			if (typeof interface.hk_swapChannel_post=='function') interface.hk_swapChannel_post.apply(this,[chanid,leftTransition]);
			
		});
		
		interface.removeChannel=(function(chanid) {
			$('.chanid-'+chanid).remove();
		});
		
		interface.removeChannels=(function() {
			$('.chanitem:not(.chanid-0)').remove();
		});
		
		interface.openChannelWin=(function(){});
		interface.closeChannelWin=(function(){});
		interface.scrollToBottom=(function(){});
		interface.resizePage=(function(){});
		
		
		// ***************************************************************************
		// ************************      LOAD    OLDER      **************************
		interface.loadOlder=(function(client){
			var details={
				load:null,
				
				
			},
			_client=client;
			
			details.load=(function(callback){
				if (_client.activeChanRef.chanid==0) return;
				(new Event()).fromObject({ eventid:'ECMD_RETRIEVEOLD', maxmsgid:(_client.activeChanRef.minmsgid), chanid:(_client.activeChanRef.chanid) }).request(callback);
			});
			
			return details;
		}(client));
	})();
	return interface;
})();