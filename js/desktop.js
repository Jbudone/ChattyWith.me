// JavaScript Document


/*
	

*/
		//****************************************************************************************//
		//*******************************     SETTINGS     ***************************************//
		
		(function(configs){
			// Changes/Additions to settings
			
			configs.reflowTime=100;
			configs.safeReflowTime=500; // Used after a heavy reflow
			configs.cubeSettings={
				transitionTime:400,	
			};
			configs.userOptionsSettings={
				waitModeTimer:700,
				offsetTop:225,
				offsetLeft:330,
				minTop:0,
				animationTime:120,
			};
			configs.windowResizeSettings={
				interval:350,
				enabled:false,
			};
			
			configs._promptPlaceholder="Type Inside of Me!";
		}(settings));
		
		
		var pre_setup=(function(){
			// TODO: Presetup
		});
		

		/********************************************************************************************************/
		/*********************************** Desktop-Specific Prototyping ***************************************/
		
		Message.prototype.getClassesFromType=(function(type){ 
			var details={ user:[], time:[], message:[], container:[] };
		
			if (type.match(/error/)) { details.message=['message-error']; }
			else if (type.match(/success/)) { details.container=details.message=['message-success','ui-link']; }
			else if (type.match(/action/)) { details.container=details.message=details.user=['message-action']; }
			else if (type.match(/message/)) { }
			else if (type.match(/whisper/)) { }
			else if (type.match(/event/)) { details.container=['ui-link']; details.time=['hidden']; }
			else if (type.match(/startup/)) { details.container=['message-startup']; }
			else { details.container=['ui-link']; }
			
			if (type.match(/self/)) { details.container=details.user=['message-self']; }
			if (type.match(/old/)) { details.container=['message-old']; }
			return details;
		});
		
		
		Terminal.scrollToBottom=(function(forceToBottom) {
			// Check to Scroll
			var kTHRESHOLD_TO_AUTOSCROLL=250, // Don't forget to add predicted size of appended content
				kTIMEOUT_AUTOSCROLL=150; // Slight lag in reflow; 150 appears safe, 100 is too fast for the reflow (tries to scroll before page is reflowed)
			if (forceToBottom || document.getElementById('console-cube-front').scrollHeight-document.getElementById('console-cube-front').offsetHeight<=document.getElementById('console-cube-front').scrollTop+kTHRESHOLD_TO_AUTOSCROLL) {
				setTimeout(function(){
					document.getElementById('console').scrollIntoView(false);
				},kTIMEOUT_AUTOSCROLL);
			}
		});
		
		Terminal.hk_swapChannel_pre=(function(chanid,leftTransition) {
			// Channel Details
			
			var transitionTime=settings.cubeSettings.transitionTime;
			try {	
				document.getElementById('channels-selected').setAttribute('id','');
				
				// Cube Effect
				this._prevChanid=client.activeChanRef['chanid'];
				/*
				var console=document.getElementById('console'),
					clone=console.cloneNode(true),
					face=(leftTransition?document.getElementById('console-cube-left'):document.getElementById('console-cube-right')),
					transitionName=(leftTransition?'left':'right');
				console.setAttribute('id','_console');
				face.appendChild(clone); // OLD Channel is appended to left/right face
				
				//face.style.left='0px';
				document.getElementById('console-cube').className='console-cube-turntocube console-cube-animate-'+(transitionName)+'1';
				document.getElementById('console-cube').className='console-cube-turntocube console-cube-animate-'+(transitionName)+'2';
				//face.style.left='-500px';
				setTimeout(function(){
					document.getElementById('_console').parentNode.removeChild(document.getElementById('_console')); // ORIGINAL CONSOLE REMOVED
					var console=document.getElementById('console'),
						clone=console.cloneNode(true);
					//document.getElementById('wrapper-cube').style.height=(document.getElementById('wrapper-cube').offsetHeight)+'px';
					//document.getElementById('wrapper-cube').style.width=(document.getElementById('wrapper-cube').offsetWidth)+'px';
					document.getElementById('console-cube').className='console-cube-reset';
					console.parentNode.removeChild(console); // ORIGINAL CLONED CONSOLE REMOVED
					document.getElementById('console-cube-front').appendChild(clone);
					setTimeout(function(){
						document.getElementById('console-cube').className='';
						document.getElementById('console-cube-front').style.left='';
						//document.getElementById('wrapper-cube').style.height='';
						//document.getElementById('wrapper-cube').style.width='';
					},transitionTime);
				},transitionTime);
			*/	
				
			} catch (e) { window['console'].log(e); } finally {
				setTimeout(function(){
					leftPos=$('.channels-chanitem[chanid="'+chanid+'"]').attr({id:'channels-selected'}).position().left;
					document.getElementById('channels-selector').style.left=leftPos+'px';
				},settings.reflowTime);
			}
		});
		
		Terminal.hk_swapChannel_post=(function(chanid,leftTransition) {
			var chanDisplay=document.getElementById('styleChanDisplay');
			chanDisplay.innerHTML+="#_console .chanitem:not(.chanid-"+(this._prevChanid)+") { display:none !important; } ";
			document.getElementsByTagName('head').item(0).removeChild(chanDisplay);
			document.getElementsByTagName('head').item(0).appendChild(chanDisplay);
			
			var userlist=document.getElementById('rc-userlist'),
				userid,
				users=client.activeChanRef.users,
				fragment,
				channelLegend=document.getElementById('rc-details-channame'),
				channelUsersList=client.activeChanRef.users;
			channelLegend.innerHTML=client.channels[chanid].channame;
			while (userlist.children.length>0) {
				userlist.removeChild(document.getElementById('rc-userlist').children[0])
			}
			if (users) {
				fragment=document.createDocumentFragment();
				for (userid in users) {
					var user=this._addUser(chanid,userid,users[userid].status,users[userid].nick,true);
					fragment.appendChild(user);
				}
				userlist.appendChild(fragment);
			}
			
			setTimeout(function(){
				Terminal.scrollToBottom(true);
			},settings.safeReflowTime);
			
			Terminal.messageNotification.openChan(chanid);
		});
		
		Terminal._addUser=(function(chanid,userid,status,nick,suspendAppend){
			if (client.activeChanRef.chanid!=chanid) return;
			var user=document.createElement('a'),
				chanUsers=client.channels[chanid].users;
			user.setAttribute('href','#');
			user.setAttribute('status',status);
			user.userdetails={userid:userid,status:status,nick:nick,element:user};
			user.appendChild(document.createTextNode(nick));
			user.className='channel-user';
			user.onclick=user.oncontextmenu=(function(){
				if (Terminal._isUserBoxShowing) Terminal._switchUserBox(this.userdetails);
				else Terminal._showUserBox(this.userdetails);
				return false;
			});
			chanUsers[userid]._element=user;
			if (suspendAppend)
				return user;
			else
				document.getElementById('rc-userlist').appendChild(user);
		});
		
		Terminal._remUser=(function(chanid,userid){
			if (client.activeChanRef.chanid!=chanid) return;
			var chanref=client.channels[chanid];
			$(chanref.users[userid]._element).remove();
		});
		
		Terminal._changeUser=(function(chanid,userid,status){
			if (client.activeChanRef.chanid!=chanid) return;
			var chanUsers=client.channels[chanid].users;
			chanUsers[userid].status=status;
			chanUsers[userid]._element.setAttribute('status',status);
		});
		
		
		Terminal.openChannelWin=(function(title,chanid) {
			var chan=document.createElement('div'),
				chanLink=document.createElement('a');
			chan.className='channels-chanitem';
			chan.setAttribute('chanid',''+chanid);
			chanLink.className='channels-chanitem-link';
			chanLink.setAttribute('chanid',''+chanid);
			chanLink.setAttribute('href','#');
			chan.appendChild(chanLink);
			document.getElementById('channels').appendChild(chan);
			
			chanLink.onclick=(function(){
				var leftTransition=(function(){
					var _client=client, _chanid, curchanid=client.activeChanRef['chanid'];
					for(_chanid in _client.channels) {
						if (_chanid==chanid) return true;	
						else if (_chanid==curchanid) return false;
					}
				}());
				Terminal.swapChannel(chanid,leftTransition);
				
				return false;
			});
		});
		
		Terminal.removeChannelWin=(function(chanid) {
			$('.channels-chanitem[chanid="'+chanid+'"]').remove();
		});
		
		Terminal.removeChannelWins=(function() {
			for (var chanid in client.channels) {
				if (chanid==0) continue;
				Terminal.removeChannelWin(chanid);
			}
		});
		
		Terminal._isUserBoxShowing=false;
		Terminal._showUserBox=(function(elUser){
			this._isUserBoxShowing=true;
			this._userBoxOnWaitMode=true;
			setTimeout(function(){ Terminal._userBoxOnWaitMode=false; },settings.userOptionsSettings.waitModeTimer);
			Terminal._userSelected=elUser;
			document.getElementById('user-optionscontainer').setAttribute('powermode',(client.activeChanRef.users[client.usrid].status));
			var top=Math.max(settings.userOptionsSettings.minTop, $(elUser.element).offset().top-settings.userOptionsSettings.offsetTop),
				left=$(elUser.element).offset().left-settings.userOptionsSettings.offsetLeft,
				stringOffset=Math.min(0,$(elUser.element).offset().top-settings.userOptionsSettings.offsetTop-settings.userOptionsSettings.minTop);
			document.getElementById('user-optionscontainer').style.top=(top)+'px';
			document.getElementById('user-optionscontainer').style.left=(left)+'px';
			document.getElementById('user-optionscontainer').className='';
			
			document.getElementById('ob-container-string1').style.marginTop=(stringOffset)+'px';
			document.getElementById('ob-container-string2').style.marginTop=(stringOffset)+'px';
			document.getElementById('ob-container-string3').style.marginTop=(stringOffset)+'px';
			setTimeout(function(){
				document.getElementById('ob-container-string1').className='';
				document.getElementById('ob-container-string2').className='';
				document.getElementById('ob-container-string3').className='';
				document.getElementById('user-optionsbox').className='';
			},settings.reflowTime);
			
		});
		Terminal._hideUserBox=(function(){
			if (!this._isUserBoxShowing) return;
			this._isUserBoxShowing=false;
			document.getElementById('ob-container-string1').className='off';
			document.getElementById('ob-container-string2').className='off';
			document.getElementById('ob-container-string3').className='off';
			document.getElementById('user-optionsbox').className='off';
			setTimeout(function(){	document.getElementById('user-optionscontainer').className='off'; },settings.userOptionsSettings.animationTime);
		});
		Terminal._switchUserBox=(function(elUser){
			this._hideUserBox();
			setTimeout(function(){
				Terminal._showUserBox(elUser);
			},settings.userOptionsSettings.animationTime);
		});
		(function(){
			$("*:not(#user-optionscontainer>*):not(.channel-user)").click(function(){
				if (Terminal._userBoxOnWaitMode) return;
				Terminal._hideUserBox();
			});
		}());
		
		
		//****************************************************************************************//
		//********************************     INITIALIZED     ***********************************//
		
		client.hk_initialize_post=(function(){
			document.body.style.display='none';
			pre_setup();
			setupPage();
			Terminal.openChannelWin('server',0);
			document.body.style.display='';
			
			
			setTimeout(function(){ 
				Terminal.swapChannel(0);
				
				setTimeout(function(){
					// NOTE: Slight lag cause this to not work in swapChannel, so do it a second time here
					leftPos=$('.channels-chanitem[chanid="0"]').attr({id:'channels-selected'}).position().left;
					document.getElementById('channels-selector').style.left=leftPos+'px';
				},settings.reflowTime);
			},settings.reflowTime); // delay to allow the reflow to occur

			
			Terminal.print_preset('loaded');
			(new Event()).fromObject({ eventid:ECMD_STATUS }).request(function(data){
				if (data.identification) {
					client.usrNick=data.nick;
					client.usrIdentification=data.identification;	
					client.usrid=data.userid;

					Terminal.print_preset('logon');
					Terminal.scrollToBottom(true);
				
					client.initialReconnect=true;
					client.longpoll();
				} else if (localStorage && localStorage.getItem('identification')) {
					(new Event()).fromObject({ eventid:ECMD_IDENTIFY, id:(localStorage.getItem('identification')) }).request(function(data){
						client.usrNick=data.nick;
						client.usrIdentification=data.identification;
						client.usrid=data.userid;

						Terminal.print_preset('logon');
						Terminal.scrollToBottom(true);
						client.initialReconnect=true;
						client.longpoll();
					});
				} else {
					Terminal.print_preset('loaded_loggedout');
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
			Terminal.print_preset('logon');
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
		});
		
		Events.Event[ECMD_JOIN].hooks.reqSuccess=(function(evt,data){
			// Joined Channel
		});
		
		Events.Event[ECMD_MESSAGE].hooks.reqSuccess=(function(evt,data){
			// Message Successfully Sent  (used for Testing server/client messaging speeds)
			// TODO properly implement message-speed testing
		
			/*var _date2=new Date();
			var _tFinish=_date2.getTime();
			console.log("=========================================================================");
			console.log(":::::::::: TOTAL TIME FROM ENTER TO SENT MESSAGE: "+((_tFinish-client._tMessageCreated)*0.001));
			console.log(":::::::::: TOTAL TIME FOR SERVER TO LOAD MESSAGE: "+(data['totaltime']));*/
		}); 
		
		//****************************************************************************************//
		//*******************************  Server Hook Events  ***********************************//
		hk_server_event_append_message=(function(){ Terminal.print_message(this.arguments.chanid,this.arguments,false,false); if (!this.arguments.old && this.arguments.userid!=client.usrid) Terminal.messageNotification.message(this.arguments.chanid); });
		hk_server_event_prepend_message=(function(){ Terminal.print_message(this.arguments.chanid,this.arguments,true,false); });
		hk_server_event_append_whisper=(function(){ Terminal.print_message(null,this.arguments,false,false); if (!this.arguments.old && this.arguments.userid!=client.usrid) Terminal.messageNotification.message(this.arguments.chanid); });
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
		client.hk_user_joined_post=(function(){
			Terminal._addUser(this.arguments.chanid,this.arguments.suserid,this.arguments.status,this.arguments.nick,false);
		});
		client.hk_user_left_pre=(function(){
			Terminal._remUser(this.arguments.chanid,this.arguments.userid);
		});
		client.hk_user_changed_post=(function(){
			console.log(this.arguments);
			Terminal._changeUser(this.arguments.chanid,this.arguments.duserid,this.arguments.status);
		});
		client.hk_channel_changed_post=(function(){
			
		});
		

	});
	
	var setupLayout=(function(){
		// Setup the Page Header
		
		
		// Containers
		var _cFragment=document.createDocumentFragment(),
			_cWrapper1=document.createElement('div'),
			_cWrapper2=document.createElement('div'),
			_cWrapper3=document.createElement('div'),
			_cWrapper4=document.createElement('div'),
			_cWrapperConsole=document.createElement('div'),
			mainElement=document.getElementById('main'),
			mainClone=mainElement.cloneNode(true),
			consoleElement=mainClone.children[0],
			consoleClone=consoleElement.cloneNode(true),
			_cubeWrapper=document.createElement('div'),
			_cube=document.createElement('div'),
			_cubeTop=document.createElement('div'),
			_cubeFront=document.createElement('div'),
			_cubeLeft=document.createElement('div'),
			_cubeRight=document.createElement('div'),
			_cubeBack=document.createElement('div'),
			_cubeBottom=document.createElement('div'),
			_loadingIndicator=document.createElement('div');
		_cWrapper1.setAttribute('id','wrapper1');
		_cWrapper2.setAttribute('id','wrapper2');
		_cWrapper3.setAttribute('id','wrapper3');
		_cWrapper4.setAttribute('id','wrapper4');
		_cWrapperConsole.setAttribute('id','wrapper-console');
		_cubeWrapper.setAttribute('id','wrapper-cube');
		_cube.setAttribute('id','console-cube');
		_cubeTop.setAttribute('id','console-cube-top');
		_cubeFront.setAttribute('id','console-cube-front');
		_cubeLeft.setAttribute('id','console-cube-left');
		_cubeRight.setAttribute('id','console-cube-right');
		_cubeBack.setAttribute('id','console-cube-back');
		_cubeBottom.setAttribute('id','console-cube-bottom');
		_loadingIndicator.setAttribute('id','loading-indicator');
		_cubeTop.className=_cubeFront.className=_cubeLeft.className=_cubeRight.className=_cubeBottom.className=_cubeBack.className='face';
		_cubeFront.appendChild(_loadingIndicator);
		_cubeFront.appendChild(consoleClone);
		_cube.appendChild(_cubeTop);
		_cube.appendChild(_cubeLeft);
		_cube.appendChild(_cubeRight);
		_cube.appendChild(_cubeBack);
		_cube.appendChild(_cubeBottom);
		_cube.appendChild(_cubeFront);
		_cubeWrapper.appendChild(_cube);
		document.body.removeChild(mainElement);
		mainClone.removeChild(consoleElement);
		_cWrapperConsole.appendChild(_cubeWrapper);
		mainClone.insertBefore(_cWrapperConsole, mainClone.getElementsByTagName('footer')[0]);
		_cWrapper4.appendChild(mainClone);
		_cWrapper3.appendChild(_cWrapper4);
		_cWrapper2.appendChild(_cWrapper3);
		_cWrapper1.appendChild(_cWrapper2);
		_cFragment.appendChild(_cWrapper1);
		document.body.appendChild(_cFragment);
		
		
		// Header
		var _hFragment=document.createDocumentFragment(),
			header=document.createElement('header'),
			_hTitle=document.createElement('img'),
			_hSocials=document.createElement('div'),
			_hPortal=document.createElement('img'),
			_hTwitter=document.createElement('img'),
			_hFacebook=document.createElement('img'),
			_hGithub=document.createElement('img');
		_hSocials.appendChild(_hPortal);
		_hSocials.appendChild(_hTwitter);
		_hSocials.appendChild(_hFacebook);
		_hSocials.appendChild(_hGithub);
		header.appendChild(_hTitle);
		header.appendChild(_hSocials);
		_hFragment.appendChild(header);
		document.body.insertBefore(_hFragment, document.body.childNodes[0]);
		
		
		// Channel-Details (in the upper-right corner of the console)
		var _cdFragment=document.createDocumentFragment(),
			chanDetails=document.createElement('div'),
			_cdDoor=document.createElement('div'),
			_cdChanName=document.createElement('div'),
			_cdChannels=document.createElement('div'),
			_cdChannelsSelector=document.createElement('div');
		chanDetails.setAttribute('id','channel-details');
		_cdDoor.setAttribute('id','cd-channel-door');
		_cdChanName.setAttribute('id','chan-title');
		_cdChannels.setAttribute('id','channels');
		_cdChannelsSelector.setAttribute('id','channels-selector');
		_cdChannels.appendChild(_cdChannelsSelector);
		chanDetails.appendChild(_cdDoor);
		chanDetails.appendChild(_cdChanName);
		chanDetails.appendChild(_cdChannels);
		_cdFragment.appendChild(chanDetails);
		document.getElementById('wrapper-console').appendChild(_cdFragment);//, document.getElementById('console'));
		
		
		// Form/Prompt Extras
		var _gdFragment=document.createDocumentFragment(),
			promptGoodies=document.createElement('div'),
			_gdColours=document.createElement('a'),
			_gdColoursImg1=document.createElement('div'),
			_gdColoursImg2=document.createElement('div'),
			_gdColoursImg3=document.createElement('div'),
			_gdColoursImg4=document.createElement('div'),
			_gdEmoticons=document.createElement('a'),
			_gdEmoticonsImg=document.createElement('img');
		promptGoodies.setAttribute('id','prompt-goodies');
		_gdColours.setAttribute('id','gd-colours');
		_gdColours.setAttribute('href','#');
		_gdColoursImg1.className='gd-colours-img';
		_gdColoursImg2.className='gd-colours-img';
		_gdColoursImg3.className='gd-colours-img';
		_gdColoursImg4.className='gd-colours-img';
		_gdColoursImg1.style.background='blue';
		_gdColoursImg2.style.background='green';
		_gdColoursImg3.style.background='orange';
		_gdColoursImg4.style.background='yellow';
		_gdEmoticons.setAttribute('id','gd-emoticons');
		_gdEmoticons.setAttribute('href','#');
		_gdEmoticonsImg.setAttribute('src','images/emoticons/happy.gif');
		_gdColours.appendChild(_gdColoursImg1);
		_gdColours.appendChild(_gdColoursImg2);
		_gdColours.appendChild(_gdColoursImg3);
		_gdColours.appendChild(_gdColoursImg4);
		promptGoodies.appendChild(_gdColours);
		_gdEmoticons.appendChild(_gdEmoticonsImg);
		promptGoodies.appendChild(_gdEmoticons);
		_gdFragment.appendChild(promptGoodies);
		document.getElementById('footer').insertBefore(_gdFragment, document.getElementById('fPrompt'));
			
		
		// Right Container
		var _rcFragment=document.createDocumentFragment(),
			rightContainer=document.createElement('div'),
			_rcSectionTop=document.createElement('div'),
			_rcSectionMidUpper=document.createElement('div'),
			_rcSectionMidLower=document.createElement('div'),
			_rcSectionBottom=document.createElement('fieldset'),
			_rcSectionBottomLogo=document.createElement('div'),
			_rcLogoRuby=document.createElement('img'),
			_rcLogo=document.createElement('img'),
			_rcDetails=document.createElement('div'),
			_rcChanOptions=document.createElement('div'),
			_rcUserlist=document.createElement('div'),
			_rcChanLegend=document.createElement('legend'),
			_rcDetails_Server=document.createElement('div'),
			_rcDetails_Ping=document.createElement('div'),
			_rcChan_Leave=document.createElement('a'),
			_rcChan_LeaveImg=document.createElement('img');
			_rcChan_List=document.createElement('a'),
			_rcChan_ListImg=document.createElement('img');
		rightContainer.setAttribute('id','right-container');
		_rcSectionTop.setAttribute('id','rc-section-top');
		_rcSectionMidUpper.setAttribute('id','rc-section-midupper');
		_rcSectionMidLower.setAttribute('id','rc-section-midlower');
		_rcSectionBottom.setAttribute('id','rc-section-bottom');
		_rcSectionBottomLogo.setAttribute('id','rc-section-bottomlogo');
		_rcLogo.setAttribute('id','rc-logo');
		_rcLogoRuby.setAttribute('id','rc-logoruby');
		_rcDetails.setAttribute('id','rc-details');
		_rcChanOptions.setAttribute('id','rc-chanoptions');
		_rcChanLegend.setAttribute('id','rc-details-channame');
		_rcUserlist.setAttribute('id','rc-userlist');
		_rcLogo.setAttribute('src','images/logo-2.png');
		_rcLogoRuby.setAttribute('src','images/ruby2.png');
		_rcDetails_Server.setAttribute('id','rc-details-server');
		_rcDetails_Ping.setAttribute('id','rc-details-ping');
		_rcChan_Leave.setAttribute('id','rc-chan-leave');
		_rcChan_Leave.setAttribute('href','#');
		_rcChan_LeaveImg.setAttribute('src','images/icon-leave.png');
		_rcChan_List.setAttribute('id','rc-chan-list');
		_rcChan_List.setAttribute('href','#');
		_rcChan_ListImg.setAttribute('src','images/icon-list.png');
		_rcDetails_Server.innerHTML='Server: '+(location.hostname);
		_rcDetails.appendChild(_rcDetails_Server);
		_rcDetails.appendChild(_rcDetails_Ping);
		_rcChan_Leave.appendChild(_rcChan_LeaveImg);
		_rcChan_List.appendChild(_rcChan_ListImg);
		_rcChanOptions.appendChild(_rcChan_Leave);
		_rcChanOptions.appendChild(_rcChan_List);
		_rcSectionTop.appendChild(_rcLogo);
		_rcSectionMidUpper.appendChild(_rcDetails);
		_rcSectionMidLower.appendChild(_rcChanOptions);
		_rcSectionBottom.appendChild(_rcChanLegend);
		_rcSectionBottom.appendChild(_rcUserlist);
		_rcSectionBottomLogo.appendChild(_rcLogoRuby);
		rightContainer.appendChild(_rcSectionTop);
		rightContainer.appendChild(_rcSectionMidUpper);
		rightContainer.appendChild(_rcSectionMidLower);
		rightContainer.appendChild(_rcSectionBottom);
		rightContainer.appendChild(_rcSectionBottomLogo);
		_rcFragment.appendChild(rightContainer);
		document.getElementById('wrapper-console').insertBefore(_rcFragment, document.getElementById('consosole'));
		
		
		// User-Option Box
		var _obFragment=document.createDocumentFragment(),
			_obOptionsContainer=document.createElement('div'),
			_obOptionsBox=document.createElement('div'),
			_obStringContainer1=document.createElement('div'),
			_obStringContainer2=document.createElement('div'),
			_obStringContainer3=document.createElement('div'),
			_obString1=document.createElement('div'),
			_obString2=document.createElement('div'),
			_obString3=document.createElement('div');
			_obString1i=document.createElement('div'),
			_obString2i=document.createElement('div'),
			_obString3i=document.createElement('div'),
			_cbOption_Whois=document.createElement('a'),
			_cbOption_Kick=document.createElement('a'),
			_cbOption_Ban=document.createElement('a'),
			_cbOption_Voice=document.createElement('a'),
			_cbOption_Chanop=document.createElement('a'),
			_cbOption_Stripop=document.createElement('a');
		_obOptionsContainer.setAttribute('id','user-optionscontainer');
		_obOptionsBox.setAttribute('id','user-optionsbox');
		_obStringContainer1.setAttribute('id','ob-container-string1');
		_obStringContainer2.setAttribute('id','ob-container-string2');
		_obStringContainer3.setAttribute('id','ob-container-string3');
		_obString1.setAttribute('id','ob-string1');
		_obString2.setAttribute('id','ob-string2');
		_obString3.setAttribute('id','ob-string3');
		_obString1i.setAttribute('id','ob-string1i');
		_obString2i.setAttribute('id','ob-string2i');
		_obString3i.setAttribute('id','ob-string3i');
		_cbOption_Whois.setAttribute('id','ob-option-whois');
		_cbOption_Kick.setAttribute('id','ob-option-kick');
		_cbOption_Ban.setAttribute('id','ob-option-ban');
		_cbOption_Voice.setAttribute('id','ob-option-voice');
		_cbOption_Chanop.setAttribute('id','ob-option-chanop');
		_cbOption_Stripop.setAttribute('id','ob-option-stripop');
		_obOptionsContainer.className='off';
		_obOptionsBox.className='off';
		_obStringContainer1.className='off';
		_obStringContainer2.className='off';
		_obStringContainer3.className='off';
		_cbOption_Whois.setAttribute('href','#');
		_cbOption_Kick.setAttribute('href','#');
		_cbOption_Ban.setAttribute('href','#');
		_cbOption_Voice.setAttribute('href','#');
		_cbOption_Chanop.setAttribute('href','#');
		_cbOption_Stripop.setAttribute('href','#');
		_cbOption_Whois.className='user-option';
		_cbOption_Kick.className='user-option powermode-operator';
		_cbOption_Ban.className='user-option powermode-operator';
		_cbOption_Voice.className='user-option powermode-operator';
		_cbOption_Chanop.className='user-option powermode-operator';
		_cbOption_Stripop.className='user-option powermode-operator';
		_cbOption_Whois.innerHTML='Who Are You';
		_cbOption_Kick.innerHTML='Kick User';
		_cbOption_Ban.innerHTML='Ban User';
		_cbOption_Voice.innerHTML='Give Voice Status';
		_cbOption_Chanop.innerHTML='Give Channel Operator Status';
		_cbOption_Stripop.innerHTML='Strip User Status';
		_obOptionsBox.appendChild(_cbOption_Whois);
		_obOptionsBox.appendChild(_cbOption_Kick);
		_obOptionsBox.appendChild(_cbOption_Ban);
		_obOptionsBox.appendChild(_cbOption_Voice);
		_obOptionsBox.appendChild(_cbOption_Chanop);
		_obOptionsBox.appendChild(_cbOption_Stripop);
		_obStringContainer1.appendChild(_obString1);
		_obStringContainer2.appendChild(_obString2);
		_obStringContainer3.appendChild(_obString3);
		_obStringContainer1.appendChild(_obString1i);
		_obStringContainer2.appendChild(_obString2i);
		_obStringContainer3.appendChild(_obString3i);
		_obOptionsContainer.appendChild(_obOptionsBox);
		_obOptionsContainer.appendChild(_obStringContainer1);
		_obOptionsContainer.appendChild(_obStringContainer2);
		_obOptionsContainer.appendChild(_obStringContainer3);
		_obFragment.appendChild(_obOptionsContainer);
		document.body.appendChild(_obFragment);
		
		
		// Colours Window
		var _cwFragment=document.createDocumentFragment(),
			_cwColoursContainer=document.createElement('div');
		_cwColoursContainer.setAttribute('id','cw-colours-container');
		_cwColoursContainer.style.display='none';
		_cwFragment.appendChild(_cwColoursContainer);
		document.getElementById('wrapper4').appendChild(_cwFragment);
		
		
		// Emoticons Window
		var _ewFragment=document.createDocumentFragment(),
			_ewEmoticonsContainer=document.createElement('div');
		_ewEmoticonsContainer.setAttribute('id','ew-emoticons-container');
		_ewEmoticonsContainer.style.display='none';
		_ewFragment.appendChild(_ewEmoticonsContainer);
		document.getElementById('wrapper4').appendChild(_ewFragment);
	});
	
	
	
	var setupScripts=(function(){
		// Add Extra Scripts
		var fragment=document.createDocumentFragment();
		
		var linkDesktop=document.createElement('link');
		linkDesktop.setAttribute('rel','stylesheet/less');
		linkDesktop.setAttribute('type','text/css');
		linkDesktop.setAttribute('href','styles/desktop.css');
		fragment.appendChild(linkDesktop);
		
		var lessJS=document.createElement('script');
		lessJS.setAttribute('src','js/less-1.3.0.min.js');
		fragment.appendChild(lessJS);
		
		document.getElementsByTagName('head').item(0).appendChild(fragment);
	});
	
	var setupEventHandlers=(function(){
		// Setup Event Handlers
		document.getElementById('ob-option-whois').onclick=(function(){
			(new Event()).fromObject({ eventid:ECMD_WHOIS, nick:Terminal._userSelected.nick }).request();
			return false;
		});
		document.getElementById('ob-option-kick').onclick=(function(){
			(new Event()).fromObject({ eventid:ECMD_KICK, chanid:client.activeChanRef.chanid, kickid:Terminal._userSelected.nick, reason:"meh" }).request();
			return false;
		});
		document.getElementById('ob-option-ban').onclick=(function(){
			(new Event()).fromObject({ eventid:ECMD_BAN, chanid:client.activeChanRef.chanid, username:Terminal._userSelected.nick }).request();
			return false;
		});
		document.getElementById('ob-option-voice').onclick=(function(){
			(new Event()).fromObject({ eventid:ECMD_CHANOP, chanid:client.activeChanRef.chanid, opid:Terminal._userSelected.nick, optype:'1' }).request();
			return false;
		});
		document.getElementById('ob-option-chanop').onclick=(function(){
			(new Event()).fromObject({ eventid:ECMD_CHANOP, chanid:client.activeChanRef.chanid, opid:Terminal._userSelected.nick, optype:'0' }).request();
			return false;
		});
		document.getElementById('ob-option-stripop').onclick=(function(){
			(new Event()).fromObject({ eventid:ECMD_CHANOP, chanid:client.activeChanRef.chanid, opid:Terminal._userSelected.nick, optype:'2' }).request();
			return false;
		});
		document.getElementById('rc-chan-leave').onclick=(function(){
			(new Event()).fromObject({ eventid:ECMD_LEAVE, chanid:client.activeChanRef.chanid }).request();
			return false;
		});
		document.getElementById('rc-chan-list').onclick=(function(){
			var evt=new Event();
				evt.fromObject({ eventid:ECMD_LIST }).request(function(data) {
				var i,
					message='^13CHANNEL LIST\\n      ';
				for(i in data.channels) {
					message+='^8#'+data.channels[i].name+' ^1(^0'+data.channels[i].users+'^1)'+(data.channels[i].topic?' - ^11'+data.channels[i].topic:'')+'\\n      ';
				}
				client.handle_evtMessage.call(evt,{
					type:'',
					data:'',
					message:message,
				});
			});
			return false;
		});
		(function(){
			
			var _el=document.getElementById('console-cube-front'),
				thresholdScroll=0,
				ajaxLoader=document.getElementById('loading-indicator');
			$(document.getElementById('console-cube-front')).scroll(function(){
				if (client.activeChanRef.chanid==0 || client.activeChanRef._reachedEnd==true) return;
				var offsetFromTop=_el.scrollHeight,
					chanid=client.activeChanRef.chanid;
				if (_el.scrollTop<=thresholdScroll) {
					ajaxLoader.style.visibility='visible';
					Terminal.loadOlder.load(function(data){
						ajaxLoader.style.visibility='hidden';
						if (data.end!=true) {
							if (client.activeChanRef.chanid==chanid)
								_el.scrollTop=(_el.scrollHeight-offsetFromTop);	
						} else {
							client.channels[chanid]._reachedEnd=true;
						}
					});	
				}
			});
		}());
		
		
		// =========================================================
		//	PING
		// ==================
		(function(){
			if (!settings.pingEnabled) return false;
			// Ping/Connection Details
			var _rcDetails_Ping=document.getElementById('rc-details-ping'),
				_rcDetails=document.getElementById('rc-details'),
				getConnectionStrength=(function(ping){
					if (ping<=90) return 5;
					else if (ping<=150) return 4;
					else if (ping<=250) return 3;
					else if (ping<=500) return 2;
					else if (ping<=800) return 1;
					else return 0;
				}),
				consecutiveFailures=0,
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
				}
				
				consecutiveFailures=0;
				_rcDetails.style.display='none';
				_rcDetails_Ping.innerHTML='Ping: '+totalTime+'ms';
				_rcDetails_Ping.setAttribute('connection-level',getConnectionStrength(totalTime));
				_rcDetails.style.display='';
			});
			
			pingFail=(function(){
				consecutiveFailures++;
				if (consecutiveFailures>=numFailuresToDisconnect) {
					Terminal._disconnected=true;
					$('body').addClass('disconnected');
					//$('#prompt').attr({disabled:'disabled'});  // NOTE: This would be nice for the effect, but if the user is holding down BACKSPACE it will defocus and send to the browser
				}

				_rcDetails.style.display='none';
				_rcDetails_Ping.innerHTML='x';
				_rcDetails_Ping.setAttribute('connection-level','0');
				_rcDetails.style.display='';
			});
			
			if (settings.useLongpollPing) {
				// AUTO PINGING
				//	USED FROM LONGPOLLING SCRIPT
					var now;
					client.hk_longpoll_success=function(data){
						var delay=data.timeReceived-now;
						if (data.totalTime>=10) {
						console.log('============hk_longpoll_success===========');
							console.log(data);
						console.log('==========================================');
						}
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
		
		var winMoveChecker=(function(){
			if (settings.windowResizeSettings.enabled==false) return null;
			var capScreenX=window.screenX,
				capScreenY=window.screenY,
				interval=settings.windowResizeSettings.interval,
				checker=(function(){
					if (window.screenX!=capScreenX || window.screenY!=capScreenY) {
						//console.log("MOVED ("+capScreenX+","+capScreenY+")");
						if (window.screenX<0) {
							document.body.style.display='none';
							document.getElementById('wrapper2').style.left=(-window.screenX)+'px';
							document.getElementById('wrapper2').style.right='0px';
							document.getElementById('wrapper2').style.width='auto';
							document.getElementById('wrapper4').style.margin='0';
							document.body.style.display='';
						} else if (capScreenX<0) {
							document.body.style.display='none';
							document.getElementById('wrapper2').style.left='';
							document.getElementById('wrapper2').style.right='';
							document.getElementById('wrapper2').style.width='';
							document.getElementById('wrapper4').style.margin='';
							document.body.style.display='';
						}
						
						
						capScreenX=window.screenX;
						capScreenY=window.screenY;
					}
					setTimeout(checker,interval);
				});
				
				setTimeout(checker,interval);
		}());
		
		var colourWin=(function(){
			var coloursContainer=document.getElementById('cw-colours-container'),
				fragment=document.createDocumentFragment(),
				colourList=settings.colourMap,
				interface={
					showWindow:null,
					hideWindow:null,
					triggerWindow:null,
					_windowShowing:false,
				}, i;
				
				for(i in colourList) {
					var _aColour=document.createElement('a');
					_aColour.style.background=colourList[i];
					_aColour.setAttribute('href','#');
					_aColour.details={colour:colourList[i],index:i};
					_aColour.onclick=(function(){
						var prompt=document.getElementById('prompt'),
							selectionStart=prompt.selectionStart,
							value=prompt.value,
							insert='^'+this.details.index;
						if (isNaN(selectionStart)) value+=insert;					
						else value=(value.substr(0,selectionStart))+insert+(value.substr(selectionStart));
						prompt.value=value;
						interface.hideWindow();
						return false;
					});
					fragment.appendChild(_aColour);
				}
				
				coloursContainer.appendChild(fragment);
				
				interface.showWindow=(function(){
					setTimeout(function(){
						coloursContainer.style.display='block';
						interface._windowShowing=true;
					},50);
				});
				interface.hideWindow=(function(){
					coloursContainer.style.display='none';
					interface._windowShowing=false;
				});
				interface.triggerWindow=(function(){
					if (interface._windowShowing) interface.hideWindow();
					else interface.showWindow();
				});
				
				
				return interface;
		}());
		Terminal.colourWin=colourWin;
		document.getElementById('gd-colours').onclick=(function(){
			colourWin.triggerWindow();
			return false;
		});
		
		
		
		
		var emoticonsWin=(function(){
			var emoticonContainer=document.getElementById('ew-emoticons-container'),
				fragment=document.createDocumentFragment(),
				emoticonList=settings.emoticonMap,
				interface={
					showWindow:null,
					hideWindow:null,
					triggerWindow:null,
					_windowShowing:false,
				}, i;
				
				for(i in emoticonList) {
					var _aEmoticon=document.createElement('a'),
						_imgEmoticon=document.createElement('img'),
						code=i;
					
					code=code.replace(/\\:/g,':').replace(/\\;/g,';').replace(/\\@/g,'@').replace(/\\\(/g,'(').replace(/\\\)/g,')')
							.replace(/\\\[/g,'[').replace(/\\\]/g,']').replace(/\\{/g,'{').replace(/\\}/g,'}').replace(/\\\\/g,'\\')
							.replace(/\\\//g,'/').replace(/\\=/g,'=').replace(/\\\'/g,'\'').replace(/\\\"/g,'"').replace(/\\\+/g,'+')
							.replace(/\\\^/g,'^').replace(/\\\*/g,'*');
						
					_imgEmoticon.setAttribute('src','images/emoticons/'+emoticonList[i]);
					_aEmoticon.setAttribute('href','#');
					_aEmoticon.details={emoticon:emoticonList[i],index:code};
					_aEmoticon.onclick=(function(){
						var prompt=document.getElementById('prompt'),
							selectionStart=prompt.selectionStart,
							value=prompt.value,
							insert=this.details.index;
						if (isNaN(selectionStart)) value+=insert;					
						else value=(value.substr(0,selectionStart))+insert+(value.substr(selectionStart));
						prompt.value=value;
						interface.hideWindow();
						return false;
					});
					_aEmoticon.appendChild(_imgEmoticon);
					fragment.appendChild(_aEmoticon);
				}
				
				emoticonContainer.appendChild(fragment);
				
				interface.showWindow=(function(){
					setTimeout(function(){
						emoticonContainer.style.display='block';
						interface._windowShowing=true;
					},50);
				});
				interface.hideWindow=(function(){
					emoticonContainer.style.display='none';
					interface._windowShowing=false;
				});
				interface.triggerWindow=(function(){
					if (interface._windowShowing) interface.hideWindow();
					else interface.showWindow();
				});
				return interface;
		}());
		Terminal.emoticonsWin=emoticonsWin;
		document.getElementById('gd-emoticons').onclick=(function(){
			emoticonsWin.triggerWindow();
			return false;
		});
		
		$('*').click(function(){
			// Auto close emoticons/colours windows
			Terminal.emoticonsWin.hideWindow();
			Terminal.colourWin.hideWindow();
			
			// Auto focus on prompt
			document.getElementById('prompt').focus();
		});
		
		
		// Message Notification
		// Can trigger when messages are received (and channel is not active OR page is not in focus), or
		//	when the channel becomes active, or page comes into focus
		var messageNotification=(function(){
			var interface={
				off:(function(){}), on:(function(){}),
				notify:(function(){}), stopNotify:(function(){}),
				message:(function(){}), openChan:(function(){}),
				dbg:(function(){}),
			},
			settings={
				sounds:true,
				message:true,
				
				flashOnTime:1000,
				flashOffTime:1000,
				flashMessage:"New Message Notification",
				flashChannelColour:"green",
				
				beepSound:"beep.wav",//"sounds-900-you-know.mp3",
			},
			beep=(new Audio(settings.beepSound)),
			flashStoredMessage, // Current window title (saved during flashes)
			storeSettings,
			unread=[], // channel id's which have unread messages
			notifying=false, // TRUE if message notification is currently being handled
			inFocus=true;
			
			beep.load();
			// Load Settings from localStorage
			if (typeof localStorage == 'object') {
				if (localStorage.getItem('notification-sound')) settings.sounds=localStorage.getItem('notification-sound');
				if (localStorage.getItem('notification-message')) settings.message=localStorage.getItem('notification-message');
			}
			
			
			// Interface Setup
			storeSettings=(function(){
				if (typeof localStorage=='object') {
					return (function(){
						localStorage.setItem('notification-sound',settings.sounds);
						localStorage.setItem('notification-message',settings.message);
					});
				} else return (function(){return;}); // Store Settings does nothing (localStorage DNE)
			}());
			interface.dbg=(function(){
				console.log("DEBUG");
				console.log(settings);
				console.log(unread);
				console.log("notifying: "+notifying);
				console.log("focus: "+inFocus);
			});
			interface.off=(function(){
				settings.sounds=false;
				settings.message=false;
				storeSettings();
			});
			interface.on=(function(){
				settings.sounds=true;
				settings.message=true;
				storeSettings();
			});
			interface.notify=(function(){
				// NOTE: If notifying is true, then only cause a sound/beep
				
				beep.play();
				if (notifying) return;
				notifying=true;
				flashStoredMessage=window.document.title;
				(function(){
					var flashOn=(function(){
						if (!notifying) return;
						window.document.title=settings.flashMessage;
						setTimeout(flashOff,settings.flashOnTime);
						
						for (var i=0; i<unread.length; i++) {
							$('.channels-chanitem[chanid="'+unread[i]+'"]')[0].style.background=settings.flashChannelColour;
						}
					}), flashOff=(function(){
						if (!notifying) return;
						window.document.title=flashStoredMessage;
						setTimeout(flashOn,settings.flashOffTime);
						
						for (var i=0; i<unread.length; i++) {
							$('.channels-chanitem[chanid="'+unread[i]+'"]')[0].style.background='';
						}
					});
					flashOn();
				}());
			});
			interface.stopNotify=(function(){
				notifying=false;
				window.document.title=flashStoredMessage; // To appear responsive/immediate
				
				for (var i=0; i<unread.length; i++) {
					$('.channels-chanitem[chanid="'+unread[i]+'"]')[0].style.background='';
				}
			});
			interface.message=(function(chanid){
				// Are we currently in focus AND in this channel?
				if (inFocus && chanid==client.activeChanRef.chanid) return;
				
				// Does chanid exist in unread?		
				for (var i=0; i<unread.length; i++) {
					if (parseInt(unread[i])==chanid) {
						interface.notify();
						return;
					}
				}
				unread.push(chanid);
				interface.notify();
			});
			interface.openChan=(function(chanid){
				var unreadId=-1, i;
				for (i=0; i<unread.length; i++) {
					if (parseInt(unread[i])==chanid) {
						unreadId=i;
						break;
					}
				}
				if (unreadId>-1) {
					$('.channels-chanitem[chanid="'+unread[unreadId]+'"]')[0].style.background='';
					unread.splice(unreadId,1);
				}
				if (unread.length==0) interface.stopNotify();
			});
			
			
			
			// Event Handling Here
			// NOTE: Receive message in channel (implemented in Server Hooks)
			// NOTE: Channel Opened (implemented elsewhere)
			window.addEventListener('focus',(function(){
				inFocus=true;
				interface.openChan(client.activeChanRef.chanid);
			}));
			window.addEventListener('blur',(function(){
				inFocus=false;
			}));
			
			flashStoredMessage=window.document.title;
			return interface;
		}());
		Terminal.messageNotification=messageNotification;
		
	});
	
	var onResize=(function(){
		// TODO
		
	});
	
	var tranformPage=(function(){
		// Transformations and Mutations of the Page here
		// note: Do these transformation in an order that is most appealing
		
		
		// Transform the Right Container
		document.getElementById('rc-section-bottom').oncontextmenu=(function(){ return false; })
		document.getElementById('user-optionscontainer').oncontextmenu=(function(){ return false; })
		
		// Transform the Prompt
		document.getElementById('prompt').setAttribute('placeholder',settings._promptPlaceholder);
		
		
	});
	
	var setupForm=(function(){
		$('#fPrompt').submit(function(){
var _date1=new Date();
client._tMessageCreated=_date1.getTime();
			var msg=$('#prompt').val();
			$('#prompt').val('');
			if (msg=='') return false;
			
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
	};
	
	
	setupHooks();
	setupLayout(); 
	setupScripts();
	setupEventHandlers();
	tranformPage();
	onResize();
	setupForm();
});


	client.initialize();