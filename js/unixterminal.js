// JavaScript Document
setupHooks=function() {
	Events.Event['ECMD_LOGIN'].hooks.parsed=Events.Event['ECMD_IDENTIFY'].hooks.parsed=function(data){ console.log("Logging in as "+this.user); if (this.pass) console.log("Oo wowee you have a password: "+this.pass); };
	Events.Event['ECMD_LOGIN'].hooks.reqSuccess=Events.Event['ECMD_IDENTIFY'].hooks.reqSuccess=function(data){  console.log("Login success.."); console.log(data); };
	Events.Event['ECMD_LOGIN'].hooks.reqSuccessError=Events.Event['ECMD_IDENTIFY'].hooks.reqSuccessError=function(data){ console.log("You idiot, you can't login with those credentials! "+this.user+"/"+this.pass); console.log(data); console.log(errCodes[data.error].message); };
	Events.Event['ECMD_STATUS'].hooks.reqSuccess=function(evt,data){ console.log("Your status, sir:"); console.log(data); };
	
	hk_server_event_append_message=function(){ addMessage(this.arguments.message); };
	hk_server_event_prepend_message=function(){ addMessage(this.arguments.message,true); };
	hk_server_event_append_whisper=function(){ addMessage(this.arguments.message); };
	hk_server_event_from_undefined_event=function(){ addMessage("Unsure of this event from server.."); };
	hk_server_event_exception_thrown=function(evt,e){ addMessage(e.message); };
	hk_event_request_exception_thrown=function(evt,e){ addMessage(e.message); };
	hk_event_request_from_undefined_event=function(){ addMessage("Request from undefined event!!"); };
	hk_event_parsed_bad_format=function(){ addMessage(this.evtref.help); };
	hk_event_unknown_command=function(){ addMessage("Unknown command"); };
	
	Events.Event[ECMD_JOIN].hooks.reqSuccess=function(evt,data){
		console.log(data);
		try {
			if (data.response==2) {
				client.activeChanRef=client.channels[data.channel.chanid];
			}
		} catch(e) {
			
		}
	};
}
client.hk_initialize_post=function(){
	setupHooks();
	var evt_status=new Event();
	evt_status.fromObject({ eventid:'ECMD_STATUS' }).request(function(data){
console.log(data);
		if (data.identification) {
			console.log("You are logged in as: "+data.nick);
			client.usrIdentification=data.identification;	
		}
	});
	
	$('#fPrompt').submit(function(){
		var msg=$('#prompt').val();
		$('#prompt').val('');
		
		var evt=new Event();
		evt.parse(msg).request();
		
		return false;	
	});
};

var addMessage=function(msg,prepend) {
	var span=$('<span/>').text(msg).css({clear:'both',float:'left',display:'block'});
	if (prepend)
		span.prependTo('#console');
	else
		span.appendTo('#console');
}
client.initialize();