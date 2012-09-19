// JavaScript Document


/*
	
*/
		//****************************************************************************************//
		//*******************************     SETTINGS     ***************************************//
		
		(function(configs){
			
			var use_unstable_jquery=true,
				kJQUERY_STABLE_SOURCE='http://code.jquery.com/mobile/1.0.1/jquery.mobile-1.0.1.min.js',
				kJQUERY_UNSTABLE_SOURCE='http://code.jquery.com/mobile/1.1.0/jquery.mobile-1.1.0.min.js',
				kJQUERY_STABLE_CSS='http://code.jquery.com/mobile/1.0.1/jquery.mobile-1.0.1.min.css',
				kJQUERY_UNSTABLE_CSS='http://code.jquery.com/mobile/1.1.0/jquery.mobile-1.1.0.min.css';
			
			configs.use_unstable_jquery=use_unstable_jquery;
			configs.jquery_mob_src=(use_unstable_jquery==true?kJQUERY_UNSTABLE_SOURCE:kJQUERY_STABLE_SOURCE);
			configs.jquery_mob_css=(use_unstable_jquery==true?kJQUERY_UNSTABLE_CSS:kJQUERY_STABLE_CSS);
		}(settings));
		
		
		var pre_setup=(function(){
				
		});
		

		/********************************************************************************************************/
		/*********************************** Mobile-Specific Prototyping ****************************************/
		
		Message.prototype.getClassesFromType=(function(type){ 
			var details={ user:[], time:[], message:[], container:[] };
		
			if (type.match(/error/)) { details.message=['message-error']; }
			else if (type.match(/success/)) { details.container=details.message=['message-success','ui-link']; }
			else if (type.match(/action/)) { details.container=details.message=details.user=['message-action']; }
			else if (type.match(/message/)) { details.container=['ui-link']; }
			else if (type.match(/whisper/)) { }
			else if (type.match(/event/)) { details.container=['ui-link']; details.time=['hidden']; }
			else { }
			
			if (type.match(/self/)) { details.container=details.user=['message-self','bold']; }
			if (type.match(/old/)) { details.container=['message-old']; }
			return details;
		});
		
		
		Terminal.scrollToBottom=(function(forceToBottom) {
			// Check to Scroll
			var kTHRESHOLD_TO_AUTOSCROLL=250, // Don't forget to add predicted size of appended content
				kTIMEOUT_AUTOSCROLL=150, // Slight lag in reflow; 150 appears safe, 100 is too fast for the reflow (tries to scroll before page is reflowed)
				kAUTOSCROLL_SAFEGUARD=-3; // To safely reach the bottom, scroll this extra amount (document.body.scrollHeight is always off slightly)
			if (forceToBottom || document.body.scrollHeight-window.innerHeight<=window.pageYOffset+kTHRESHOLD_TO_AUTOSCROLL) {
				setTimeout(function(){
					window.scrollTo(0,(document.body.scrollHeight+kAUTOSCROLL_SAFEGUARD));
					try { JQueryMobWrap.showToolbars(); } catch(e) { }
				},kTIMEOUT_AUTOSCROLL);
			}
			else
				try { JQueryMobWrap.showToolbars(); } catch(e) { }
		});
		
		
		Terminal.resizePage=(function(){
			var consoleOffset=($('#console').outerHeight(false)-$('#console').outerHeight(true))-8;
			$('#console').css({'min-height':(window.innerHeight-$('#fPrompt').height()-$('header').height()+consoleOffset)});
		});
		
		Terminal.removeChannelWin=(function(chanid) { });
		Terminal.removeChannelWins=(function(chanid) { });
		
		Terminal.hk_swapChannel_post=(function(){ setTimeout(function(){ try { Terminal._headerFix.refresh(); } catch(e){ } },1500); });
		
		
		//****************************************************************************************//
		//********************************     INITIALIZED     ***********************************//
		
		client.hk_initialize_post=(function(){
			document.body.style.display='none';
			pre_setup();
			JQueryMobWrap.showPageLoadingMsg();
			setupPage();
			Terminal.swapChannel(0);
			document.body.style.display='';


			
			Terminal.print_preset('loaded_mobile');
			(new Event()).fromObject({ eventid:ECMD_STATUS }).request(function(data){
				if (data.identification) {
					client.usrNick=data.nick;
					client.usrIdentification=data.identification;	
					client.usrid=data.userid;

					Terminal.print_preset('logon_mobile');
					Terminal.scrollToBottom(true);
				
					client.longpoll();
				} else if (localStorage && localStorage.getItem('identification')) {
					(new Event()).fromObject({ eventid:ECMD_IDENTIFY, id:(localStorage.getItem('identification')) }).request(function(data){
						client.usrNick=data.nick;
						client.usrIdentification=data.identification;
						client.usrid=data.userid;

						Terminal.print_preset('logon_mobile');
						Terminal.scrollToBottom(true);
					
						client.longpoll();
					});
				} else {
					Terminal.print_preset('loaded_loggedout_mobile');
				}
				return false;
			});
			
			
			
			
		});	
		
		//****************************************************************************************//
		

var setupPage=(function(){
	var setupHooks=(function(){
		//****************************************************************************************//
		//*******************************  Event Handlers  ***************************************//
		Events.Event[ECMD_LOGIN].hooks.reqSuccess=Events.Event[ECMD_IDENTIFY].hooks.reqSuccess=(function(data){
			// Successful Login
			Terminal.print_preset('logon_mobile');
			Terminal.scrollToBottom(true);
		});
		Events.Event[ECMD_LOGIN].hooks.reqSuccessError=Events.Event[ECMD_IDENTIFY].hooks.reqSuccessError=(function(evt,data){
			// Error Login
		});
		Events.Event[ECMD_LOGOUT].hooks.reqSuccess=(function(evt,data){
			// Logged Out
		});
		Events.Event[ECMD_STATUS].hooks.reqSuccess=(function(evt,data){
			// Status Retrieved
		});
		Events.Event[ECMD_LEAVE].hooks.reqSuccess=(function(evt,data){
			// Left Channel
			
			for (chanid in client.channels) {
				if (chanid!=0)
					return;
			}
			
			try {
				JQueryMobWrap.disable($('#chanPrev'));
				JQueryMobWrap.disable($('#chanNext'));
				JQueryMobWrap.disable($('#chanHome'));
			} catch(e) { }
		});
		
		Events.Event[ECMD_JOIN].hooks.reqSuccess=(function(evt,data){
			// Joined Channel
		
			try {
				JQueryMobWrap.enable($('#chanPrev'));
				JQueryMobWrap.enable($('#chanNext'));
				JQueryMobWrap.enable($('#chanHome'));
			} catch(e) { }
		});
		
		Events.Event[ECMD_MESSAGE].hooks.reqSuccess=(function(evt,data){
			// Message Successfully Sent  (used for Testing server/client messaging speeds)
		
			/*var _date2=new Date();
			var _tFinish=_date2.getTime();
			console.log("=========================================================================");
			console.log(":::::::::: TOTAL TIME FROM ENTER TO SENT MESSAGE: "+((_tFinish-client._tMessageCreated)*0.001));
			console.log(":::::::::: TOTAL TIME FOR SERVER TO LOAD MESSAGE: "+(data['totaltime']));*/
		});
		
		//****************************************************************************************//
		//*******************************  Server Hook Events  ***********************************//
		hk_server_event_append_message=(function(){ Terminal.print_message(this.arguments.chanid,this.arguments,false,false); });
		hk_server_event_prepend_message=(function(){ Terminal.print_message(this.arguments.chanid,this.arguments,true,false); });
		hk_server_event_append_whisper=(function(){ Terminal.print_message(null,this.arguments,false,false); });
		hk_server_event_append_log=(function(evt,args){ Terminal.print(client.activeChanRef.chanid,args['message'],args['type']); Terminal.scrollToBottom(true); });
		hk_server_event_add_messages_completed=(function(){ Terminal.scrollToBottom(); });
		
		hk_server_event_from_undefined_event=(function(){ }); // Received unknown event from server
		hk_event_request_from_undefined_event=(function(){ Terminal.print(client.activeChanRef.chanid,"We're not exactly sure what you're trying to do.. ^o)",'error'); Terminal.scrollToBottom(); }); // Unknown Request made
		hk_server_event_exception_thrown=(function(evt,e){ Terminal.print(client.activeChanRef.chanid,"exception thrown: "+e.message,'error'); Terminal.scrollToBottom(); }); // Exception thrown
		hk_event_request_exception_thrown=(function(evt,e){ Terminal.print(client.activeChanRef.chanid,"exception thrown: "+e.message,'error'); Terminal.scrollToBottom(); }); // Exception thrown (in request)
		hk_event_parsed_bad_format=(function(){ Terminal.print(client.activeChanRef.chanid,"Error parsing command: "+this.evtref.help,'error'); Terminal.scrollToBottom(); }); // Bad Parse
		hk_event_unknown_command=(function(evt,cmd){ Terminal.print(client.activeChanRef.chanid,"Unknown command (^15"+(cmd)+"^1).. ^o)",'error'); Terminal.scrollToBottom(); }); // Unknown Command
		hk_server_response_error=(function(evt,errmsg){ }); // Server Response Error (message handled in client/Events)



		
		//****************************************************************************************//
		//***********************************  Client Events  ************************************//
		client.hk_messagesreceived_post=(function(){ Terminal.scrollToBottom(); });
		client.hk_longpoll_post=(function(){
			//var scrollY=window.scrollY;
			//setTimeout(function() { window.scrollTo(0, scrollY+1); }, 100);
		});
		
		

	});
	
	var setupLayout=(function(){
		var header=$('<div/>').attr({'id':'header','data-theme':'a','data-role':'header','data-position':'fixed','data-fullscreen':'true'}).addClass('ui-header-fixed');
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
		
		
		try {
			JQueryMobWrap.disable($('#chanPrev'));
			JQueryMobWrap.disable($('#chanNext'));
			JQueryMobWrap.disable($('#chanHome'));
			JQueryMobWrap.disable($('#chanInfo'));
			JQueryMobWrap.disable($('#chanSettings'));
			JQueryMobWrap.disable($('#chanUsers'));
		} catch(e) { }

		
		$(btnChanPrev).bind('tap',(function(){ Terminal.swapChannel(getChanIDFromOffset(-1)); }));
		$(btnChanNext).bind('tap',(function(){ Terminal.swapChannel(getChanIDFromOffset(1)); }));
		$(btnChanHome).bind('tap',(function(){ Terminal.swapChannel(0); }));

		$(btnChanPrev).bind('click',(function(){$(this).trigger('tap')}));
		$(btnChanHome).bind('click',(function(){$(this).trigger('tap')}));
		$(btnChanNext).bind('click',(function(){$(this).trigger('tap')}));
		
		
	});
	
	
	
	var setupScripts=(function(){
		var fragment=document.createDocumentFragment();
		
		// Meta/Content
		var metaViewport=document.createElement('meta');
		metaViewport.setAttribute('name','viewport');
		metaViewport.setAttribute('content','width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
		fragment.appendChild(metaViewport);
		
		// Meta/StatusBar-Style
		var metaStatusBar=document.createElement('meta');
		metaStatusBar.setAttribute('name','apple-mobile-web-app-status-bar-style');
		metaStatusBar.setAttribute('content','red');
		fragment.appendChild(metaStatusBar);
		
		// Meta/HideUI
		var metaHideUI=document.createElement('meta');
		metaHideUI.setAttribute('name','apple-mobile-web-app-capable');
		metaHideUI.setAttribute('content','yes');
		fragment.appendChild(metaHideUI);
		
		// Link/StartupImage
		var lnkImage=document.createElement('link');
		lnkImage.setAttribute('rel','apple-touch-startup-image');
		lnkImage.setAttribute('href','/images/ruby.png');
		fragment.appendChild(lnkImage);
		
		// Stylesheet/jQuery-Mobile
		var linkJQueryMobile=document.createElement('link');
		linkJQueryMobile.setAttribute('rel','stylesheet');
		linkJQueryMobile.setAttribute('href',settings.jquery_mob_css);
		fragment.appendChild(linkJQueryMobile);
		
		// Script/jQuery-Mobile
		var scriptJQueryMobile=document.createElement('script');
		scriptJQueryMobile.type='text/javascript';
		scriptJQueryMobile.src=settings.jquery_mob_src;
		scriptJQueryMobile.onload=function(){ finalizeSetup(); };
		fragment.appendChild(scriptJQueryMobile);
		
		
		document.getElementsByTagName('head').item(0).appendChild(fragment);
	});
	
	var setupEventHandlers=(function(){
		
		// Setup Header Toolbar (position:fixed)
		// Setup LoadOlder messages
		Terminal._headerFix=(function(){
			
			var details={
				refresh:null,	
			},
			_header=document.getElementById('header'),
			yOffset=0;//60;
			
			
			details.refresh=(function(){
				_header.style.top=(window.scrollY+yOffset)+'px !important';
			});
			
			
			$(document).bind('scrollstop',function(){
				if (Terminal._disconnected==true) return;
				if (window.scrollY<=0 && client.activeChanRef.chanid!=0) {
					JQueryMobWrap.showPageLoadingMsg();
					var winHeight=document.body.scrollHeight,
						scrollY=null;
						_hk_add_messages=hk_server_event_add_messages_completed,
						_hk_add_messages_pre=hk_server_event_add_messages_started;
					hk_server_event_add_messages_completed=null;
					hk_server_event_add_messages_started=function(){
						scrollY=window.scrollY;
					};
					Terminal.loadOlder.load(function(){
						setTimeout(function(){
							JQueryMobWrap.hidePageLoadingMsg();
							window.scrollTo(0,(document.body.scrollHeight-winHeight-100+scrollY));	
							details.refresh();
						},150);
						hk_server_event_add_messages_completed=_hk_add_messages;
						hk_server_event_add_messages_started=_hk_add_messages_pre;
					});	
				}
				details.refresh();
			});
			
			return details;
		}());
		
		
		// =========================================================
		//	PING
		// ==================
		(function(){
			if (!settings.pingEnabled) return false;
			// Ping/Connection Details
			var consecutiveFailures=0,
				numFailuresToDisconnect=settings.minPingTimeoutsToDisconnect,
				timeConnected=null,
				lastPingTime=null,
				disconnect=(function(){}),
				checkIfActive=(function(){});
			
			
			// Logged In
			var _func=Events.Event['ECMD_LOGIN'].hooks.reqSuccess;
			Events.Event['ECMD_LOGIN'].hooks.reqSuccess=(function(data){ _func(data); 
				timeConnected=(new Date()).getTime();
			});
			
			// Joined 1st Channel
			_func=Events.Event['ECMD_JOIN'].hooks.reqSuccess;
			Events.Event['ECMD_JOIN'].hooks.reqSuccess=(function(data){ _func(data);
				// Is this our FIRST channel joined?
				var chanCount=getChanCount();
				if (chanCount==2) {
					console.log("This is FIRST channel Joined!");
					timeConnected=(new Date()).getTime();
				}
			});
		
			// Disconnect
			//	Auto logout, close channels, etc.
			disconnect=(function(){
				(new Event()).fromObject({ eventid:ECMD_LOGOUT }).request();
				lastPingTime=null;
			});
			
			
			// checkIfActive
			//	Checks if the page is still active (eg. laptop lid is closed?)
			//	If this suddenly executes and it's been way too long since our
			//	last successful ping, then it could be that the laptop lid was 
			//	closed, and thus we should auto d/c
			checkIfActive=(function(){
				if (client.usrid!=null && !Terminal._disconnected && lastPingTime!=null && getChanCount()>=2) {
	
					// Check the last time we've successfully pinged the server -- IF time has exceeded, then auto-logout before even asking the server
					//	eg. the laptop lid has closed, and reopened
					if ((new Date()).getTime()-lastPingTime>settings.maxTimeSinceLastPingToDisconnect &&
							timeConnected!=null && (new Date()).getTime()-timeConnected>settings.maxTimeSinceLastPingToDisconnect) {
						// Disconnect
						window['console'].log("D/C!  time:"+((new Date()).getTime())+"-"+lastPingTime+">"+settings.maxTimeSinceLastPingToDisconnect);
						disconnect();
					}
				} else {
					// If we're not inside any channels, then set lastPingTime to null to avoid the checking (its unecessary)
					var _lastPingTime=lastPingTime;
					lastPingTime=null;
					for (var chanid in client.channels) {
						if (chanid!=null) {
							lastPingTime=_lastPingTime;
							break;
						}
					}
				}
				
				setTimeout(checkIfActive,settings.checkIfActiveTimer);
			});
			checkIfActive();
			
			pingSuccess=(function(totalTime){
				if (Terminal._disconnected==true) {
					// Reconnected
					Terminal._disconnected=false;
					$('body').removeClass('disconnected');
					$('#prompt').attr({disabled:false});
					JQueryMobWrap.hidePageLoadingMsg();
				}
				
				consecutiveFailures=0;
				lastPingTime=(new Date()).getTime();
			});
			
			pingFail=(function(){
				consecutiveFailures++;
				if (consecutiveFailures>=numFailuresToDisconnect) {
					Terminal._disconnected=true;
					$('body').addClass('disconnected');
					//$('#prompt').attr({disabled:'disabled'});  // NOTE: This would be nice for the effect, but if the user is holding down BACKSPACE it will defocus and send to the browser
					JQueryMobWrap.showPageLoadingMsg();
				}
			});
			
			if (settings.useLongpollPing) {
				// AUTO PINGING
				//	USED FROM LONGPOLLING SCRIPT
					var now;
					client.hk_longpoll_success=function(data){
						var delay=data.timeReceived-now;
						pingSuccess(parseInt(delay));
					};
					client.hk_longpoll_error=function(data){
						pingFail();
					};
					client.hk_longpoll_post=function(){
						// set ping sent time
						now=Date.now().toString();
						now=now.substr(0,now.length-3)+'.'+now.substr(now.length-3);
						now=parseFloat(now);
					};
			} else {
				// MANUAL PINGING
				//  USED FROM PINGCHAN
					Events.Event[ECMD_PINGCHAN].hooks.reqSuccess=(function(evt,totalTime){
						pingSuccess(totalTime);
					});
				
					Events.Event[ECMD_PINGCHAN].hooks.reqSuccessError=(function(evt,data){
						pingFail();
					});
			}
			
		
			/*
			Events.Event[ECMD_PINGCHAN].hooks.reqSuccess=(function(evt,totalTime){
				if (Terminal._disconnected==true) {
					// Reconnected
					Terminal._disconnected=false;
					$('body').removeClass('disconnected');
					$('#prompt').attr({disabled:false});
					JQueryMobWrap.hidePageLoadingMsg();
				}
				
				consecutiveFailures=0;
				
			});
		
			Events.Event[ECMD_PINGCHAN].hooks.reqSuccessError=(function(evt,data){
				consecutiveFailures++;
				if (consecutiveFailures>=numFailuresToDisconnect) {
					Terminal._disconnected=true;
					$('body').addClass('disconnected');
					//$('#prompt').attr({disabled:'disabled'});  // NOTE: This would be nice for the effect, but if the user is holding down BACKSPACE it will defocus and send to the browser
					JQueryMobWrap.showPageLoadingMsg();
				}
			});*/
		
		}());
		
		
		// Hide the address bar (because of longpolling)
		window.addEventListener("load",function() {
		  // NOTE: Timeout 0 is required for this to work
		  setTimeout(function(){
			window.scrollTo(0, 1);
		  }, 0);
		});
	});
	
	var tranformPage=(function(){
		document.getElementById('main').setAttribute('data-role','page');
		document.getElementById('console').setAttribute('data-role','content');
		var footer=document.getElementById('footer');
		footer.setAttribute('data-role','footer');
		footer.setAttribute('data-position','fixed');
		footer.setAttribute('class','ui-footer ui-footer-fixed');
		footer.className='ui-bar';
		
		var prompt=document.getElementById('prompt');
		prompt.setAttribute('autocorrect','on');
		prompt.setAttribute('autocomplete','on');
		prompt.setAttribute('autocapitalize','sentences');
	});
	
	var setupForm=(function(){
		$('#fPrompt').submit(function(){
var _date1=new Date();
client._tMessageCreated=_date1.getTime();
			var msg=$('#prompt').val();
			$('#prompt').val('');
			
			var evt=new Event(),
				ready=evt.parse(msg);
			if (ready)
				ready.request();
			
			return false;	
		});
		
		var maxlen=settings.message_maxlen;
		$('#prompt').keyup((function(){
			var _val=($('#prompt').val()),
				_valSlashed=_val.replace(/(\\|'|")/g,function(m){ return "\\"+m; });
			if (_valSlashed.length>maxlen) {
				$(this).val($(this).attr('safeguard'));
			} else {
				$(this).attr('safeguard',_val);	
			}
		}));
	});
	
	var finalizeSetup=function(){ 
	
		setTimeout((function(){	Terminal.resizePage(); }), 1000);
		
		$(document).bind('tap',function(){
			if (Terminal._disconnected==true) return;
			JQueryMobWrap.toggleToolbars();
		});
		
		JQueryMobWrap.hidePageLoadingMsg();
	};
	
	
	setupHooks();
	setupLayout(); 
	setupScripts();
	setupEventHandlers();
	tranformPage();
	setupForm();
});



var JQueryMobWrap=(function(){
	
	var interface={
		
		// Enable/Disable buttons
		enable:null, disable:null,
		
		showPageLoadingMsg:null,
		hidePageLoadingMsg:null,
		
		showToolbars:null, 
		hideToolbars:null,
		triggerToolbars:null,
	};
	
	(function(){
		interface.enable=(function(obj){
			obj.attr( "disabled", false )
				.removeClass( "ui-disabled" )
				.attr( "aria-disabled", false );
		});
		interface.disable=(function(obj){
			obj.attr( "disabled", true )
				.addClass( "ui-disabled" )
				.attr( "aria-disabled", true );
		});
		
		// turn on/off page loading message.
		interface.showPageLoadingMsg=(function( theme, msgText, textonly ) {
			$('body').addClass( "ui-loading" );

			/*if ( $.mobile.loadingMessage ) {
				// text visibility from argument takes priority
				var textVisible = textonly || $.mobile.loadingMessageTextVisible;

				theme = theme || $.mobile.loadingMessageTheme,

				$loader
					.attr( "class", loaderClass + " ui-corner-all ui-body-" + ( theme || "a" ) + " ui-loader-" + ( textVisible ? "verbose" : "default" ) + ( textonly ? " ui-loader-textonly" : "" ) )
					.find( "h1" )
						.text( msgText || $.mobile.loadingMessage )
						.end()
					.appendTo( $.mobile.pageContainer );

				checkLoaderPosition();
				$window.bind( "scroll", checkLoaderPosition );
			}*/
		});

		interface.hidePageLoadingMsg=(function() {
			$('body').removeClass( "ui-loading" );

			/*if( $.mobile.loadingMessage ){
				$loader.removeClass( "ui-loader-fakefix" );
			}

			$( window ).unbind( "scroll", fakeFixLoader );*/
		});
		
		interface.showToolbars=(function(){
			//$("#header").fixedtoolbar('show');
			$('#header').show().data({showing:true});
		});
		
		interface.hideToolbars=(function(){
			//$("#header").fixedtoolbar('hide');
			$('#header').hide().data({showing:false});
		});
		
		interface.toggleToolbars=(function(){
			var _header=$('#header'),
				showing=_header.data('showing');
			if (showing) _header.hide().data({showing:false});
			else  _header.show().data({showing:true});
		});
		
	})();
	
	return interface;
})();



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

client.initialize();