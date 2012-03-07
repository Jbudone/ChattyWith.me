// JavaScript Document
console.log('mobile.new.js loaded');
setupHooks=function() {
	Events.Event[ECMD_LOGIN].hooks.parsed=Events.Event[ECMD_IDENTIFY].hooks.parsed=function(data){ console.log("Logging in as "+this.user); if (this.pass) console.log("Oo wowee you have a password: "+this.pass); };
	Events.Event[ECMD_LOGIN].hooks.reqSuccess=Events.Event[ECMD_IDENTIFY].hooks.reqSuccess=function(data){  console.log("Login success.."); console.log(data); };
	Events.Event[ECMD_LOGIN].hooks.reqSuccessError=Events.Event[ECMD_IDENTIFY].hooks.reqSuccessError=function(evt,data){ console.log("You idiot, you can't login with those credentials! "+this.user+"/"+this.pass); console.log(data); if (data.error) console.log(errCodes[data.error].message); };
	Events.Event[ECMD_STATUS].hooks.reqSuccess=function(evt,data){ console.log("Your status, sir:"); console.log(data); };
	Events.Event[ECMD_LEAVE].hooks.reqSuccess=function(evt,data){
		for (var chanid in client.channels) {
			if (chanid!=0)
				return;
		}
		$('#chanPrev').button('disable');
		$('#chanNext').button('disable');
	};
	
	hk_server_event_append_message=function(){ addMessage(this.arguments.chanid,this.arguments.message); endMessageAppendage(); };
	hk_server_event_prepend_message=function(){ addMessage(this.arguments.chanid,this.arguments.message,true); endMessageAppendage(); };
	hk_server_event_append_whisper=function(){ addMessage(null,this.arguments.message); endMessageAppendage(); };
	hk_server_event_from_undefined_event=function(){ addMessage(client.activeChanRef.chanid,"Unsure of this event from server.."); endMessageAppendage(); };
	hk_server_event_exception_thrown=function(evt,e){ addMessage(client.activeChanRef.chanid,e.message); endMessageAppendage(); };
	hk_event_request_exception_thrown=function(evt,e){ addMessage(client.activeChanRef.chanid,e.message); endMessageAppendage(); };
	hk_event_request_from_undefined_event=function(){ addMessage(client.activeChanRef.chanid,"Request from undefined event!!"); endMessageAppendage(); };
	hk_event_parsed_bad_format=function(){ addMessage(client.activeChanRef.chanid,this.evtref.help); endMessageAppendage(); };
	hk_event_unknown_command=function(){ addMessage(client.activeChanRef.chanid,"Unknown command"); endMessageAppendage(); };
	hk_server_response_error=function(evt,errmsg){ addMessage(client.activeChanRef.chanid,"ERROR: "+errmsg); endMessageAppendage(); };
	
	Events.Event[ECMD_JOIN].hooks.reqSuccess=function(evt,data){
		console.log("Join response: "+data.response);
		try {
			if (data.response==2) {
				console.log("Join chanid: "+data.channel.chanid);
				console.log('Channel topic is: '+data.topic);
				client.activeChanRef=client.channels[data.channel.chanid];
				swapChannel(data.channel.chanid);
				$('#chanPrev').button('enable');
				$('#chanNext').button('enable');
				endMessageAppendage(true);
			}
		} catch(e) {
			
		}
	};
	
	Events.Event[ECMD_MESSAGE].hooks.reqSuccess=function(evt,data){
		var _date2=new Date();
		var _tFinish=_date2.getTime();
		console.log("=========================================================================");
		console.log(":::::::::: TOTAL TIME FROM ENTER TO SENT MESSAGE: "+((_tFinish-client._tMessageCreated)*0.001));
		console.log(":::::::::: TOTAL TIME FOR SERVER TO LOAD MESSAGE: "+(data['totaltime']));
	};
};

console.log('mobile still __loading..');
var keyboardInFocus=false;
setupPage=(function(){
	
	
	var setupScripts=function(){
		var fragment=document.createDocumentFragment();
		
		// Meta/Content
		var metaViewport=document.createElement('meta');
		metaViewport.setAttribute('name','viewport');
		metaViewport.setAttribute('content','width=device-width; initial-scale=1.0; user-scalable=0;');
		fragment.appendChild(metaViewport);
		
		// Stylesheet/jQuery-Mobile
		var linkJQueryMobile=document.createElement('link');
		linkJQueryMobile.setAttribute('rel','stylesheet');
		linkJQueryMobile.setAttribute('href','http://code.jquery.com/mobile/1.0.1/jquery.mobile-1.0.1.min.css');
		//linkJQueryMobile.setAttribute('href','http://code.jquery.com/mobile/1.1.0-rc.1/jquery.mobile-1.1.0-rc.1.min.css');
		fragment.appendChild(linkJQueryMobile);
		
		// Script/jQuery-Mobile
		var scriptJQueryMobile=document.createElement('script');
		scriptJQueryMobile.type='text/javascript';
		scriptJQueryMobile.src='http://code.jquery.com/mobile/1.0.1/jquery.mobile-1.0.1.min.js';
		//scriptJQueryMobile.src='http://code.jquery.com/mobile/1.1.0-rc.1/jquery.mobile-1.1.0-rc.1.min.js';
		scriptJQueryMobile.onload=function(){ finalizeSetup(); };
		fragment.appendChild(scriptJQueryMobile);
		
		document.getElementsByTagName('head').item(0).appendChild(fragment);
	};
	
	var setupEventHandlers=function(){
	};
	
	var tranformToMobile=function(){
		document.getElementById('main').setAttribute('data-role','page');
		document.getElementById('console').setAttribute('data-role','content');
		var footer=document.getElementById('footerPrompt');
		footer.setAttribute('data-role','footer');
		footer.setAttribute('data-position','fixed');
		footer.setAttribute('class','ui-footer ui-footer-fixed');
		
		var prompt=document.getElementById('prompt');
		prompt.setAttribute('autocorrect','on');
		prompt.setAttribute('autocomplete','on');
		prompt.setAttribute('autocapitalize','sentences');
	};
	
	var setupForm=function(){
		$('#fPrompt').submit(function(){
var _date1=new Date();
client._tMessageCreated=_date1.getTime();
			var msg=$('#prompt').val();
			$('#prompt').val('');
			
			var evt=new Event();
			evt.parse(msg).request();
			
			return false;	
		});
	};
	
	var setupHeader=function(){
		var header=$('<header/>').attr({'data-role':'header','data-position':'fixed'});
		var ctrlGroupLeft=$('<div/>').attr({id:'header_button_group_left','data-role':'controlgroup','data-type':'horizontal','data-inline':'true'}).addClass('ui-btn-left');
		var ctrlGroupRight=$('<div/>').attr({id:'header_button_group_right','data-role':'controlgroup','data-type':'horizontal','data-inline':'true'}).addClass('ui-btn-right');
		var btnChanPrev=$('<a/>').attr({id:'chanPrev',href:'#','data-iconpos':'notext','data-icon':'arrow-l','data-role':'button'}).appendTo(ctrlGroupLeft);
		var btnChanHome=$('<a/>').attr({id:'chanHome',href:'#','data-iconpos':'notext','data-icon':'home','data-role':'button'}).appendTo(ctrlGroupLeft);
		var btnChanNext=$('<a/>').attr({id:'chanNext',href:'#','data-iconpos':'notext','data-icon':'arrow-r','data-role':'button'}).appendTo(ctrlGroupLeft);
		
		var btnChanInfo=$('<a/>').attr({id:'chanInfo',href:'#','data-iconpos':'notext','data-icon':'grid','data-role':'button'}).appendTo(ctrlGroupRight);
		var btnChanSettings=$('<a/>').attr({id:'chanSettings',href:'#','data-iconpos':'notext','data-icon':'gear','data-role':'button'}).appendTo(ctrlGroupRight);
		var btnChanUsers=$('<a/>').attr({id:'chanUsers',href:'#','data-iconpos':'notext','data-icon':'search','data-role':'button'}).appendTo(ctrlGroupRight);
		
		ctrlGroupLeft.appendTo(header);
		var heading=$('<h1/>').attr({id:'chan-title',role:'heading'}).addClass('ui-title').text(client.activeChanRef.channame).appendTo(header);
		ctrlGroupRight.appendTo(header);
		
		header.prependTo($('#main'));

		/*$(btnChanPrev).appendTo($('#header_button_group_left'));
		//$('#chanPrev').button().button('disable');
		
		$(btnChanPrev).bind('tap',function(){ swapChannel(getChanIDFromOffset(-1)); });
		$(btnChanNext).bind('tap',function(){ swapChannel(getChanIDFromOffset(1)); });
		$(btnChanNext).bind('tap',function(){ swapChannel(0); });

		$(btnChanPrev).bind('click',$(this).trigger('tap'));
		$(btnChanHome).bind('click',$(this).trigger('tap'));
		$(btnChanNext).bind('click',$(this).trigger('tap'));*/
		
		
	};
	
	var finalizeSetup=function(){ 
	
		//$('#chanPrev').button();
		//$('#console').bind('tap',client.hk_messagesreceived_post);
	};
	
	
	var resize=function(){
		resizePage();
	};
	
	
	client.activeChanRef=client.channels[0];
	setupHeader(); 
	setupScripts();
	setupEventHandlers();
	tranformToMobile();
	setupForm();
	resize();
});
console.log('mobile still loading..');

var mobi_testing=function(){
console.log('mobi-testing');
	var evt_join=new Event();
	Events.Event[ECMD_JOIN].hooks.reqSuccessError=function(data){
		
	};
	evt_join.fromObject({ eventid:'ECMD_JOIN', channelname:'autoclear' }).request(function(data){
		console.log('joined..');
	});
};



client.hk_initialize_post=function(){
	setupHooks();
	setupPage();
	
	
	var evt_status=new Event();
	evt_status.fromObject({ eventid:ECMD_STATUS }).request(function(data){
		
		if (data.identification) {
			client.usrNick=data.nick;
			client.usrIdentification=data.identification;	
			mobi_testing();
console.log("About to longpoll..");
			client.longpoll();
console.log("longpoll..");
		} else {
			var evt_login=new Event();
			var usr=(navigator.userAgent.match(/(android|webos|phone|pod|touch|pad|kindle)/i)?'iOS':'PC')
			evt_login.fromObject({ eventid:ECMD_LOGIN, user:usr }).request(function(data){
				client.usrNick=data.nick;
				client.usrIdentification=data.identification;
				mobi_testing();
			});
		}
	});
	
};

var resizePage=function(){
	$('#console').css({'min-height':($(window).height()-$('#fPrompt').height()-$('header').height())});
};

client.hk_messagesreceived_post=function(){
	endMessageAppendage();
};

// Called whenever a SET of messages is finished being appended to the console
var endMessageAppendage=function(forceToBottom) {
	// Check to Scroll
	var kTHRESHOLD_TO_AUTOSCROLL=150; // Don't forget to add predicted size of appended content
	if (forceToBottom || document.body.scrollHeight-window.innerHeight<=document.body.scrollTop+kTHRESHOLD_TO_AUTOSCROLL)
		scrollToBottom();
	else {
		try { $.mobile.fixedToolbars.show(true); } catch(e) { }
	}
};

var addMessage=function(chanid,msg,prepend) {
	if (chanid==null) {
		for (var chanid in client.channels) {
			addMessage(chanid,msg,prepend);	
		}
		return;
	}
	var span=$('<span/>').addClass('chanitem').addClass('chanid-'+chanid).text(msg).css({clear:'both',float:'left'});
	if (prepend)
		span.prependTo('#console');
	else
		span.appendTo('#console');
};

var getChanIDFromOffset=function(offset) {
	if (offset==0)
		return client.activeChanRef.chanid;
		
	var chanlist=[];
	for (var chanid in client.channels) {
		chanlist.push(chanid);
	}
	var iPos=client.channels.indexOf(client.activeChanRef.chanid);
	iPos+=offset;
	if (iPos>=chanlist.length)
		iPos=0;
	else if (iPos<0)
		iPos=chanlist.length-1;
	return chanlist[iPos];
};

var swapChannel=function(chanid,leftTransition) {
	client.activeChanRef=client.channels[chanid];
	
	try {
		var chanDisplay=document.getElementById('styleChanDisplay');
		chanDisplay.innerText=".chanitem { display:block; } .chanitem:not(.chanid-"+chanid+") { display:none !important; } ";
		document.getElementsByTagName('head').item(0).removeChild(chanDisplay);
		document.getElementsByTagName('head').item(0).appendChild(chanDisplay);
	} catch(e) {
		$('#console').css({display:'none'});
		$('.chanitem:not(.chanid-'+chanid+')').css({display:'none'});
		$('.chanid-'+chanid).css({display:'block !important'});
		$('#console').css({display:'block'});
		
	}
	
	var header=document.getElementById('chan-title');
	header.textContent=client.activeChanRef.channame;
};



/**
	NOTES
	Keyboard Heights for common Devices
	
	Device     Portrait     Landscape
	iPhone/iPod	216px		162px
	iPad		264pt		352pt
	Android
	Windows Mob
	Playbook
	Kindle eRea
	
 */
var MobDevice=(function(){
	
	var details={
		device:'',
		keyboardInFocus:false,
		orientation:'portrait',
		keyboard_height:0 };
	
	(function(){
		var kDEVICE_IPHONE=0x00,
			kDEVICE_IPAD=0x01,
			deviceDimensions=[];
			deviceDimensions[kDEVICE_IPHONE]={portrait:216,landscape:162};
			deviceDimensions[kDEVICE_IPAD]={portrait:264,landscape:352};
		var kUNKNOWN_FULLSCREEN_OFFSET_HEIGHT=236;
		if (navigator.userAgent.match(/(phone|mobile|pod|android)/) ||
			screen.width<=480 && screen.height<=800) {
			details.device='iphone';
			deviceDimensions=deviceDimensions[kDEVICE_IPHONE];	
		} else {
			details.device='ipad';
			deviceDimensions=deviceDimensions[kDEVICE_IPAD];	
		}
		$('#prompt').bind('focus',function(){ details.keyboardInFocus=true; details.keyboard_height=deviceDimensions[details.orientation]; });
		$('#prompt').bind('blur',function(){ details.keyboardInFocus=false; details.keyboard_height=kUNKNOWN_FULLSCREEN_OFFSET_HEIGHT; });
	})();
	return details;
})();
var scrollToBottom=function() {
	// timeout used since there seems to be a lag in the reflow; using 150ms appears safe, 100 is pretty sketchy, and 50 is too fast every time
	setTimeout(function(){
		window.scrollTo(0,(document.body.scrollHeight));
		try { $.mobile.fixedToolbars.show(true); } catch(e) { }
	},150);
};

client.initialize();