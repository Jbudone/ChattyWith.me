// JavaScript Document
setupHooks=function() {
	Events.Event[ECMD_LOGIN].hooks.parsed=Events.Event[ECMD_IDENTIFY].hooks.parsed=function(data){ console.log("Logging in as "+this.user); if (this.pass) console.log("Oo wowee you have a password: "+this.pass); };
	Events.Event[ECMD_LOGIN].hooks.reqSuccess=Events.Event[ECMD_IDENTIFY].hooks.reqSuccess=function(data){  console.log("Login success.."); console.log(data); };
	Events.Event[ECMD_LOGIN].hooks.reqSuccessError=Events.Event[ECMD_IDENTIFY].hooks.reqSuccessError=function(data){ console.log("You idiot, you can't login with those credentials! "+this.user+"/"+this.pass); console.log(data); if (data.error) console.log(errCodes[data.error].message); };
	Events.Event[ECMD_STATUS].hooks.reqSuccess=function(evt,data){ console.log("Your status, sir:"); console.log(data); };
	
	hk_server_event_append_message=function(){ addMessage(this.arguments.chanid,this.arguments.message); };
	hk_server_event_prepend_message=function(){ addMessage(this.arguments.chanid,this.arguments.message,true); };
	hk_server_event_append_whisper=function(){ addMessage(null,this.arguments.message); };
	hk_server_event_from_undefined_event=function(){ addMessage(client.activeChanRef.chanid,"Unsure of this event from server.."); };
	hk_server_event_exception_thrown=function(evt,e){ addMessage(client.activeChanRef.chanid,e.message); };
	hk_event_request_exception_thrown=function(evt,e){ addMessage(client.activeChanRef.chanid,e.message); };
	hk_event_request_from_undefined_event=function(){ addMessage(client.activeChanRef.chanid,"Request from undefined event!!"); };
	hk_event_parsed_bad_format=function(){ addMessage(client.activeChanRef.chanid,this.evtref.help); };
	hk_event_unknown_command=function(){ addMessage(client.activeChanRef.chanid,"Unknown command"); };
	hk_server_response_error=function(evt,errmsg){ addMessage(client.activeChanRef.chanid,"ERROR: "+errmsg); };
	
	Events.Event[ECMD_JOIN].hooks.reqSuccess=function(evt,data){
		console.log("Join response: "+data.response);
		try {
			if (data.response==2) {
				console.log("Join chanid: "+data.channel.chanid);
				client.activeChanRef=client.channels[data.channel.chanid];
				swapChannel(data.channel.chanid);
			}
		} catch(e) {
			
		}
	};
};

setupPage=(function(){
	
	var setupScripts=function(){
		var fragment=document.createDocumentFragment();
		
		// Meta/Content
		var metaViewport=document.createElement('meta');
		metaViewport.setAttribute('name','viewport');
		metaViewport.setAttribute('content','width=device-width; initial-scale=1.0; maximum-scale=1.0; user-scalable=0;');
		fragment.appendChild(metaViewport);
		
		// Stylesheet/jQuery-Mobile
		var linkJQueryMobile=document.createElement('link');
		linkJQueryMobile.setAttribute('rel','stylesheet');
		linkJQueryMobile.setAttribute('href','http://code.jquery.com/mobile/1.0b3/jquery.mobile-1.0b3.min.css');
		fragment.appendChild(linkJQueryMobile);
		
		// Script/jQuery-Mobile
		var scriptJQueryMobile=document.createElement('script');
		scriptJQueryMobile.type='text/javascript';
		scriptJQueryMobile.src='http://code.jquery.com/mobile/1.0b3/jquery.mobile-1.0b3.min.js';
		scriptJQueryMobile.onload=function(){ finalizeSetup(); };
		fragment.appendChild(scriptJQueryMobile);
		
		document.getElementsByTagName('head').item(0).appendChild(fragment);
	};
	
	var tranformToMobile=function(){
		document.getElementById('main').setAttribute('data-role','page');
		document.getElementById('console').setAttribute('data-role','content');
		var footer=document.getElementById('footerPrompt');
		footer.setAttribute('data-role','footer');
		footer.setAttribute('data-position','fixed');
		footer.setAttribute('class','ui-footer ui-footer-fixed');
	};
	
	var setupForm=function(){
		$('#fPrompt').submit(function(){
			var msg=$('#prompt').val();
			$('#prompt').val('');
			
			var evt=new Event();
			evt.parse(msg).request();
			
			return false;	
		});
	};
	
	var setupHeader=function(){
		var header=document.createElement('header');
		header.setAttribute('data-role','header');
		header.setAttribute('data-position','fixed');
		
		var ctrlGroupLeft=document.createElement('div');
		var ctrlGroupRight=document.createElement('div');
		ctrlGroupLeft.setAttribute('data-role','controlgroup');
		ctrlGroupRight.setAttribute('data-role','controlgroup');
		ctrlGroupLeft.setAttribute('data-type','horizontal');
		ctrlGroupRight.setAttribute('data-type','horizontal');
		ctrlGroupLeft.setAttribute('data-inline','true');
		ctrlGroupRight.setAttribute('data-inline','true');
		ctrlGroupLeft.setAttribute('class','ui-corner-all ui-controlgroup ui-controlgroup-horizontal ui-btn-left');
		ctrlGroupRight.setAttribute('class','ui-corner-all ui-controlgroup ui-controlgroup-horizontal ui-btn-right');
		
		
		
		var btnChanPrev=document.createElement('a');
		var btnChanNext=document.createElement('a');
		var btnChanHome=document.createElement('a');
		var btnChanInfo=document.createElement('a');
		var btnChanSettings=document.createElement('a');
		var btnChanUsers=document.createElement('a');
		
		
		btnChanPrev.setAttribute('id','chanPrev');
		btnChanNext.setAttribute('id','chanNext');
		btnChanHome.setAttribute('id','chanHome');
		btnChanInfo.setAttribute('id','chanInfo');
		btnChanSettings.setAttribute('id','chanSettings');
		btnChanUsers.setAttribute('id','chanUsers');
		
		btnChanPrev.setAttribute('href','#');
		btnChanNext.setAttribute('href','#');
		btnChanHome.setAttribute('href','#');
		btnChanInfo.setAttribute('href','#');
		btnChanSettings.setAttribute('href','#');
		btnChanUsers.setAttribute('href','#');
		
		btnChanPrev.setAttribute('data-role','button');
		btnChanNext.setAttribute('data-role','button');
		btnChanHome.setAttribute('data-role','button');
		btnChanInfo.setAttribute('data-role','button');
		btnChanSettings.setAttribute('data-role','button');
		btnChanUsers.setAttribute('data-role','button');
		
		btnChanPrev.setAttribute('data-iconpos','notext');
		btnChanNext.setAttribute('data-iconpos','notext');
		btnChanHome.setAttribute('data-iconpos','notext');
		btnChanInfo.setAttribute('data-iconpos','notext');
		btnChanSettings.setAttribute('data-iconpos','notext');
		btnChanUsers.setAttribute('data-iconpos','notext');
		
		btnChanPrev.setAttribute('data-icon','arrow-l');
		btnChanNext.setAttribute('data-icon','arrow-r');
		btnChanHome.setAttribute('data-icon','home');
		btnChanInfo.setAttribute('data-icon','grid');
		btnChanSettings.setAttribute('data-icon','gear');
		btnChanUsers.setAttribute('data-icon','search');
		
		
		var heading=document.createElement('h1');
		heading.setAttribute('id','chan-title');
		heading.setAttribute('role','heading');
		heading.setAttribute('class','ui-title');
		var headingTitle=document.createTextNode(client.activeChanRef.channame);
		heading.appendChild(headingTitle);
		
		ctrlGroupLeft.appendChild(btnChanPrev);
		ctrlGroupLeft.appendChild(btnChanHome);
		ctrlGroupLeft.appendChild(btnChanNext);
		ctrlGroupRight.appendChild(btnChanInfo);
		ctrlGroupRight.appendChild(btnChanSettings);
		ctrlGroupRight.appendChild(btnChanUsers);
		header.appendChild(ctrlGroupLeft);
		header.appendChild(heading);
		header.appendChild(ctrlGroupRight);
		document.getElementById('main').insertBefore(header,document.getElementById('console'));
		
		$(btnChanPrev).bind('tap',function(){ swapChannel(getChanIDFromOffset(-1)); });
		$(btnChanNext).bind('tap',function(){ swapChannel(getChanIDFromOffset(1)); });
		$(btnChanNext).bind('tap',function(){ swapChannel(0); });
	};
	
	var finalizeSetup=function(){ 
		
	};
	
	var resize=function(){
		$('#console').height(window.innerHeight-$('#fPrompt').height()-$('header').height());
		setFromBottom($('#console'),$('#fPrompt').height());
	};
	
	
	client.activeChanRef=client.channels[0];
	setupScripts();
	tranformToMobile();
	setupForm();
	setupHeader();
	resize();
});

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
		} else {
			var evt_login=new Event();
			evt_login.fromObject({ eventid:ECMD_LOGIN, user:'JBonIPhone' }).request(function(data){
				client.usrNick=data.nick;
				client.usrIdentification=data.identification;
				mobi_testing();
			});
		}
	});
	
};

var addMessage=function(chanid,msg,prepend) {
	if (chanid==null) {
		for (var chanid in client.channels) {
			addMessage(chanid,msg,prepend);	
		}
		return;
	}
	var span=$('<span/>').addClass('chanid-'+chanid).text(msg).css({clear:'both',float:'left',display:'none'});
	if (prepend)
		span.prependTo('#console');
	else
		span.appendTo('#console');
}

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
}

var swapChannel=function(chanid,leftTransition) {
	client.activeChanRef=client.channels[chanid];
	
	try {
		var chanDisplay=document.getElementById('styleChanDisplay');
console.log(chanDisplay.innerHTML);
		var chanTest=$('#styleChanDisplay');
console.log(chanTest.html());
		chanDisplay.innerHTML=".chanid-"+chanid+" { display:block !important; } ";
		document.getElementsByTagName('head').item(0).removeChild(chanDisplay);
		document.getElementsByTagName('head').item(0).appendChild(chanDisplay);
	} catch(e) {
		$('#console :not(.chanid-'+chanid+')').css({display:'none'});
		$('.chanid-'+chanid).css({display:'block !important'});
		
	}
	
	var header=document.getElementById('chan-title');
	header.textContent=client.activeChanRef.channame;
	
}
client.initialize();