// JavaScript Document

var client={
	
	// Object Handles
	lConsole: null,
	
	
	// Client Properties
	// ...
	
	
	// Called directly by the platform-specific script when it is fully prepared to begin
	//	the client (eg. desktop.js, mobile.js, unixterminal.js)
	initialize: function() {
		this.hk_initialize_pre();
		
		// Parse the Events (#_events)
		lEvents=$('#_events');
		lEvents.html(lEvents.html().slice(2,-2));
		
		this.longpoll();
		
		this.hk_initialize_post();
	},
	
	longpoll: function() {
		this.hk_longpoll_pre();
		
		this.hk_longpoll_post();		
	},
	_cblongpoll: function() { 
	
	},
	
	// Hooks (may be used for whatever reason in the future)
	hk_initialize_pre:null,
	hk_initialize_post:null,
	hk_longpoll_pre:null,
	hk_longpoll_post:null,
};

var Event=(function(){
	this.eventid=0;
	this.datetime=Date.now();
	this.read=function(data){
		console.log("Date is: "+this.datetime);
	};
	this.execute=function(client){
		
	};
});
