// JavaScript Document


/*
	
*/

var _body=null,
	_logo=null,
	startLoading=function(){
		_body.style.display='none';
	}, finishLoading=function(){
		if (_logo) _logo.style.display='none';
		_body.style.display='';
	};
	_body=(MOBILE_LOADING?document.getElementsByTagName('innerBody')[0]:document.body);
	_logo=(MOBILE_LOADING?document.getElementById('top-logo'):null);
		//****************************************************************************************//
		//*******************************     SETTINGS     ***************************************//
		(function(configs){
			
			var use_unstable_jquery=true,
				kJQUERY_STABLE_SOURCE='http://code.jquery.com/mobile/1.1.0/jquery.mobile-1.1.0.min.js',
				kJQUERY_UNSTABLE_SOURCE='http://code.jquery.com/mobile/1.4.0-beta.1/jquery.mobile-1.4.0-beta.1.min.js',
				kJQUERY_STABLE_CSS='http://code.jquery.com/mobile/1.1.0/jquery.mobile-1.1.0.min.css',
				kJQUERY_UNSTABLE_CSS='http://code.jquery.com/mobile/1.4.0-beta.1/jquery.mobile-1.4.0-beta.1.min.css';
				
			
			configs.use_unstable_jquery=use_unstable_jquery;
			configs.jquery_mob_src=(use_unstable_jquery==true?kJQUERY_UNSTABLE_SOURCE:kJQUERY_STABLE_SOURCE);
			configs.jquery_mob_css=(use_unstable_jquery==true?kJQUERY_UNSTABLE_CSS:kJQUERY_STABLE_CSS);
			
			// TESTING AUTOCORRECT ERROR IN JQUERY MOBILE JS
			// configs.jquery_mob_src="js/jquery.mobile-1.2.0.js";
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
			
			if (type.match(/self/)) { details.container=details.user=['mob-message-self','bold']; }
			else if (type.match(/message/)) { details.container=details.user=['mob-message-friend']; }

			if (type.match(/old/)) { details.container=['message-old']; }
			return details;
		});
		
		
		Terminal.scrollToBottom=(function(){
			var kTHRESHOLD_TO_AUTOSCROLL=250, // Don't forget to add predicted size of appended content
				kTIMEOUT_AUTOSCROLL=150, // Slight lag in reflow; 150 appears safe, 100 is too fast for the reflow (tries to scroll before page is reflowed)
				kAUTOSCROLL_SAFEGUARD=0, // To safely reach the bottom, scroll this extra amount (document.body.scrollHeight is always off slightly)
				fScroll=function(forceToBottom){
					// Check to Scroll
					if (forceToBottom || document.body.scrollHeight-window.innerHeight<=window.pageYOffset+kTHRESHOLD_TO_AUTOSCROLL) {
						setTimeout(function(){
							window.scrollTo(0,(document.body.scrollHeight+kAUTOSCROLL_SAFEGUARD));
							//try { JQueryMobWrap.showToolbars(); } catch(e) { }
						},kTIMEOUT_AUTOSCROLL);
					}
					//else
					//	try { JQueryMobWrap.showToolbars(); } catch(e) { }
			};
			
			return fScroll;
		}());
		
		
		Terminal.resizePage=(function(){
			var consoleOffset=($('#console').outerHeight(false)-$('#console').outerHeight(true))-8;
			$('#console').css({'min-height':(window.innerHeight-$('#fPrompt').height()-$('header').height()+consoleOffset)});
		});
		

			if (settings.hideBodyOnMessage) {
				Terminal.hideBody=(function(){
					_console=document.getElementById('console');
					_hide=function(){
						_console.style.display='none';
					};
					return _hide;
				}());
				
				Terminal.showBody=(function(){
					_console=document.getElementById('console');
					_show=function(){
						_console.style.display='';
					};
					return _show;
				}());
			} else {
				Terminal.hideBody=(function(){ });
				Terminal.showBody=(function(){ });
			}
		
		Terminal.removeChannelWin=(function(chanid) { });
		Terminal.removeChannelWins=(function(chanid) { });
		
		// commented out in favour of placing WITHIN pageinit
		// Terminal.hk_swapChannel_pre =(function(chanid,slideLeft){ try { console.log('current chanid: '+client.getActiveChanID()); if (slideLeft) chanSlider.slideLeft(); else chanSlider.slideRight(); console.log(slideLeft); } catch(e){ }  });
		Terminal.hk_swapChannel_post=(function(){ setTimeout(function(){ try { Terminal._headerFix.refresh(); } catch(e){ } },1500); });
		
		
		//****************************************************************************************//
		//********************************     INITIALIZED     ***********************************//
		
		client.hk_initialize_post=(function(){
			pre_setup();
			JQueryMobWrap.showPageLoadingMsg();
			setupPage();
			Terminal.swapChannel(0);


			
			Terminal.print_preset('loaded_mobile');
			(new Event()).fromObject({ eventid:ECMD_STATUS }).request(function(data){
				if (data.identification) {
					client.usrNick=data.nick;
					client.usrIdentification=data.identification;	
					client.usrid=data.userid;

					Terminal.print_preset('logon_mobile');
					Terminal.scrollToBottom(true);

					client.initialReconnect=true;
					client.longpoll();
				} else if (localStorage && localStorage.getItem('identification')) {
					(new Event()).fromObject({ eventid:ECMD_IDENTIFY, id:(localStorage.getItem('identification')) }).request(function(data){
						client.usrNick=data.nick;
						client.usrIdentification=data.identification;
						client.usrid=data.userid;

						Terminal.print_preset('logon_mobile');
						Terminal.scrollToBottom(true);

						client.initialReconnect=true;
						client.longpoll();
					});
				} else {
					Terminal.print_preset('loaded_loggedout_mobile');
				}
				return false;
			});
			
			

			setTimeout(finishLoading, 200);
			
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
		hk_server_event_add_messages_completed=(function(){ Terminal.scrollToBottom(); setTimeout(Terminal.scrollToBottom, 800); });
		
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
			
			
			$(document).bind('scroll scrollstop',function(){
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
						
						lastPingTime=(new Date()).getTime();
					};
			} else {
				// MANUAL PINGING
				//  USED FROM PINGCHAN
					Events.Event[ECMD_PINGCHAN].hooks.reqSuccess=(function(evt,totalTime){
						pingSuccess(totalTime);
						lastPingTime=(new Date()).getTime();
					});
				
					Events.Event[ECMD_PINGCHAN].hooks.reqSuccessError=(function(evt,data){
						pingFail();
						lastPingTime=(new Date()).getTime();
					});
			}
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
		//footer.setAttribute('data-position','fixed');
		//footer.setAttribute('class','ui-footer ui-footer-fixed');
		footer.setAttribute('class','ui-footer');
		footer.className='ui-bar';
		
		var prompt=document.getElementById('prompt');
		prompt.setAttribute('autocorrect','on');
		prompt.setAttribute('autocomplete','on');
		prompt.setAttribute('autocapitalize','sentences');
		prompt.setAttribute('data-mini','true');
		prompt.style.width='100%';
		
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
			return;
			//$("#header").fixedtoolbar('show');
			$('#header').show().data({showing:true});
		});
		
		interface.hideToolbars=(function(){
			return;
			//$("#header").fixedtoolbar('hide');
			$('#header').hide().data({showing:false});
		});
		
		interface.toggleToolbars=(function(){
			return;
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
		$('#prompt').bind('focus',function(){ 
			details.keyboardInFocus=true; 
			details.keyboard_height=deviceDimensions[details.orientation];
			//try { $('#viewport').attr({content:'width=device-width; initial-scale=1.2; maximum-scale=1.2; user-scalable=no'}); } catch(e) { }
		});
		$('#prompt').bind('blur',function(){ 
			details.keyboardInFocus=false; 
			details.keyboard_height=kUNKNOWN_FULLSCREEN_OFFSET_HEIGHT;
			//try { $('#viewport').attr({content:'width=device-width; initial-scale=0.7; maximum-scale=0.7; user-scalable=no'}); } catch(e) { }
		});
	})();
	return details;
})();


/**
 * Channel Slider
 * 
 * Allows flicking between channels,
 * Show dots on bottom to resemble number of channels present (they become visible which slider activated)
 * Activate slider by flicking left/right
 * Manual usage to call channel slider (eg. when leaving/joining channels)
 ****/
var chanSlider = (function(){
	
	/*
	 * Ideas
	 * * create a fragment div (with styles similar to #console); insert before/after console and reposition so that clone shows instead (then slide into view)
	 */
	
	var interface={
		slideLeft:null,
		slideRight:null,
	}, configs={
		slideTime:1300,
		bubbleFadeTime:400,
		chanNameTimeToComeIn:600,
		chanNameFadeTime:400,
        
        animateSlider:false,
		testMode:false, // pauses after cloning (used for manual animation)
		swipeThreshold:200,
	}, chanSliding=false, // Do NOT allow sliding when this is true
	   chanBubbles=null;  // The bubbles which represent the channels
		
	/* 
	 * NOTES
	 *  * Deltas may be either positive or negative (one implies left, the other implies right)
	 *
	 *  TODO
     *  * request testers w/ faster phones
     *
	 *  * better looking dots
	 *  * make swipe settings easier 
	 */
	
	var chanBubbles=$('<div/>').addClass('chan-bubbles').appendTo('body'),
        chanName=$('<div/>').addClass('chan-name').appendTo('body'),
	    updateChanBubbles=function(){

			// Update the channels within the chan bubbles
			chanBubbles.html('');
			for (var i in client.channels) {
				$('<div/>').addClass('chan-bubble').attr('chanid',i).appendTo(chanBubbles);
			}
		
	},  cloneConsole=function(chanid){

			// Create a clone of the current console-Channel
			// Append the top 30 messages (so that you don't notice any difference)
			var _clone = $('<div/>').addClass('console-clone').attr('id','console-clone'),
				items = $('#console .chanitem.chanid-'+chanid).slice(-30);
			for (var i=0; i<items.length; i++) {
				$(_clone).append($(items[i]).clone(false));
			}

			return _clone;
	},  cloneToLeft=function(chanid){

			// Place clone to the LEFT of console
			var width=Math.min($('#console').width(),$(window).width()),
				height=$('#console').height(),
				clone=cloneConsole(chanid);
			$('#console').addClass('console-sliding').css({ width: width, height: height });
			$(clone).css({ width: width, height: height, 'margin-left':0 }).insertBefore('#console');
			$('#main').addClass('console-parent-slidemode');
			return clone;
	},  cloneToRight=function(chanid){

			// Place clone to the RIGHT of console
			var width=Math.min($('#console').width(),$(window).width()),
				height=$('#console').height(),
				// height=Math.min($('#console').height(),$(window).height()),
				clone=cloneConsole(chanid);
			$('#console').addClass('console-sliding').css({ width: width, height: height });
			$(clone).css({ width: width, height: height }).insertAfter('#console');
			$('#main').addClass('console-parent-slidemode');
			return clone;
	},  slide=function(toLeft) {
		//
		// Slide console (new channel) into place
		/////////////////

		if (chanSliding) return false;
		chanSliding=true;
		chanid=client._prevChanid;

        if (configs.animateSlider) {
			updateChanBubbles();
            var clone=(toLeft?cloneToLeft(chanid):cloneToRight(chanid)).addClass('console-anim-slider'),
                cons=$('#console'),
                width=cons.width(),
                selectedBubble=$('[chanid="'+chanid+'"]',chanBubbles).addClass('selected');

            if (!toLeft) $(cons).css({ 'margin-left':-width }); // console to the left (to slide right)
			if (configs.testMode)  {
				window['clone']=clone;
				window['cons']=cons;
				window['width']=width;
				return;
			}
            setTimeout(function(){ // we need a momentary pause in order for a DOM-refresh to update console.margin before adding in the animation class

				if (!toLeft) $(cons).addClass('console-anim-slider');
                chanBubbles.removeClass('hidden');

				var toAnim=(toLeft?clone:cons);
				$(toAnim).css({'margin-left':(toLeft?-width:0)});

				setTimeout(function(){ // chan name updates half-way through the transition
					chanName.text(client.activeChanRef.channame).removeClass('hidden');
				}, configs.chanNameTimeToComeIn);

				// slider is done via. CSS3; this is simply the callback routine
				setTimeout(function(){
                    clone.remove();
                    $('#console').removeClass('console-sliding').removeClass('console-anim-slider').css({ width: '', height: '' });
                    $('#main').removeClass('console-parent-slidemode');


                    chanBubbles.animate({
                        'opacity':0
                    }, configs.bubbleFadeTime, function(){
                        chanBubbles.addClass('hidden').css({'opacity':''});
                    });


                    chanName.animate({
                        'opacity':0
                    }, configs.chanNameFadeTime, function(){
                        chanName.addClass('hidden').css({'opacity':''});
                    });


                    selectedBubble.removeClass('selected');
                    $('[chanid="'+chanid+'"]',chanBubbles).addClass('selected');
                    chanSliding=false;
				}, configs.slideTime);
            },0);
        } else {
            $('[chanid="'+chanid+'"]',chanBubbles).addClass('selected');

            chanBubbles.removeClass('hidden');
            chanBubbles.animate({
                'opacity':0
            }, configs.bubbleFadeTime, function(){
                chanBubbles.addClass('hidden').css({'opacity':''});
            });


            chanName.animate({
                'opacity':0
            }, configs.chanNameFadeTime, function(){
                chanName.addClass('hidden').css({'opacity':''});
            });


            chanSliding=false;
        }
    };

	interface.slideLeft = function() {
        slide(true);
	};


	interface.slideRight = function() {
        slide(false);
	};

	
	$(document).bind('pageinit',function(){
			
		$.event.special.swipe.scrollSupressionThreshold = 50;
		$.event.special.swipe.horizontalDistanceThreshold = configs.swipeThreshold;
		$('#console').bind('swipeleft',function(e) {
			Terminal.swapChannel(getChanIDFromOffset(1),true);
		});


		$('#console').bind('swiperight',function(e) {
			Terminal.swapChannel(getChanIDFromOffset(-1),false);
		});

		// NOTE: issue with swapping channel while page isn't fully initialized
		setTimeout(function(){
			Terminal.hk_swapChannel_pre =(function(chanid,slideLeft){
				$('#console').hide();
				chanid=client._prevChanid;
				console.log('switching from channel: '+chanid);
				// setTimeout(function(){
					try {
						if (slideLeft) chanSlider.slideLeft();
						else chanSlider.slideRight();


					} catch(e){ }
				// },0); 
			});
			Terminal.hk_swapChannel_post = (function(chanid,slideLeft){

				Terminal.scrollToBottom();
				$('#console').show();
				Terminal.scrollToBottom();
			});
		},2500);
	});

	return interface;
}());

/**
 * Stealth Mode
 * 
 * Turn console into stealth mode (change font)
 * code stolen from: http://stackoverflow.com/questions/4475219/detect-a-shake-in-ios-safari-with-javascript
 ****/
var stealthMode = (function(){
	if (typeof window.DeviceMotionEvent != 'undefined') {

		var configs = {
			minThresholdOffset:12, // minimum x/y offset before considering it a new point
			maxDelayBeforeResult:150, // maximum wait before resetting the shake count
			checkShakeTimerWhileInactive:500,
			checkShakeTimer:60,
			minCountToShake:5, // minimum number of times to switch between +/- offset before shake
		}, interface = {

		}, x, y, z, x1, y1, z1, px, py, pz, cx, cy, cz,
		resetShakeCount, shakeCount, resetTimeout,
		shake = function() {
			Terminal.stealthMode(true);
			Terminal.scrollToBottom(true);
		}, resetShake = function() {
			// if the previous shake count is the same as now, then reset
			// NOTE: shakeCount could have been reset elsewhere (already succeeded)
			if (shakeCount<=resetShakeCount) {
				shakeCount=0;
				resetShakeCount=0;
				return;
			}
			resetShakeCount=shakeCount;
			resetTimeout = setTimeout(resetShake, configs.maxDelayBeforeResult);
		}, checkShake = function() {
			if ((Math.abs(x1-x)>configs.minThresholdOffset &&
					(shakeCount==0||px!=(x1>x)) &&
					(px=(x1>x)||true) && (x=x1||true) && ++cx) ||
				(Math.abs(y1-y)>configs.minThresholdOffset &&
					(shakeCount==0||py!=(y1>y)) &&
					(py=(y1>y)||true) && (y=y1||true) && ++cy) ||
				(Math.abs(z1-z)>configs.minThresholdOffset &&
					(shakeCount==0||pz!=(z1>z)) &&
					(pz=(z1>z)||true) && (z=z1||true) && ++cz)) {
				// switched between positive/negative offset for one of the axis
				clearTimeout(resetTimeout);
				shakeCount = Math.max(shakeCount, cx, cy, cz);
						console.log("switching positive/negative: "+shakeCount);
				resetTimeout = setTimeout(resetShake, configs.maxDelayBeforeResult);

				if (shakeCount >= configs.minCountToShake) {
					clearTimeout(resetTimeout);
					shakeCount=0;
					resetShakeCount=0;
					shake();
					setTimeout(checkShake, configs.checkShakeTimerWhileInactive);

				}
			}


			if (shakeCount > 0) setTimeout(checkShake, configs.checkShakeTimer);
			else setTimeout(checkShake, configs.checkShakeTimerWhileInactive);
		};

		window.addEventListener('devicemotion', function (e) {
			x1 = e.accelerationIncludingGravity.x;
			y1 = e.accelerationIncludingGravity.y;
			z1 = e.accelerationIncludingGravity.z;
		}, false);

		x = 0; y = 0; z = 0;
		x1 = 0; y1 = 0; z1 = 0;
		cx = 0; cy = 0; cz = 0;
		shakeCount = 0;

		setTimeout(checkShake, configs.checkShakeTimerWhileInactive);
		return interface;




		// Shake sensitivity (a lower number is more)
		var sensitivity = 50;

		// Position variables
		var x1 = 0, y1 = 0, z1 = 0, x2 = 0, y2 = 0, z2 = 0;

		// Listen to motion events and update the position

		// Periodically check the position and fire
		// if the change is greater than the sensitivity
		setInterval(function () {
			var change = Math.abs(x1-x2+y1-y2+z1-z2);

			if (change > sensitivity) {
				Terminal.stealthMode(true);
			}

			// Update new position
			x2 = x1;
			y2 = y1;
			z2 = z1;
		}, 250);
	}
}());

client.initialize();
