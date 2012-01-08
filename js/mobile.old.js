// JavaScript Document


function mobileSetup() {
	
	// Setup the view
	mobFitsizeH();
	mobFitsizeW();
	setupSidebarTrigger();
	
	
	// Bind the scroller
	setTimeout(function(){
		$(document).bind("touchmove",function(event){event.preventDefault();});
		$('body').bind("touchmove",function(event){event.preventDefault();});
		$('html').bind("touchmove",function(event){event.preventDefault();});
		$('div[data-role="page"]').bind("touchmove",function(event){event.preventDefault();});
		$(window).bind("touchmove",function(event){event.preventDefault();});
		$('section').bind("touchmove",function(event){event.preventDefault();});
		
		$(':not(.console)').each(function(){
			$(this).bind('touchmove',function(event){event.preventDefault();});
		});
		
		Terminal.printMsg("^8iScroller ^1Loaded");
		
	},0);
	
	$('.console').bind("tap",function(event){ window.scrollTo(0,1); });
	
	
	
	// Orientation-Changes
	$(document).bind("orientationchange",function(){
		var spinMessages=["weee we're spinning!!","and we go round and round..","round and round..","we keep on spinning","I'm getting dizzy!",
		"weee!!","you spin me right round baby right round..","ouch! don't spin me so fast >=[","twist it, spin it, turn it, pass it","I think we just took a wrong turn!",
		"that was one heck of a sharp turn","like a record baby, round, round, round round.."];
		Terminal.spitback(spinMessages[Math.floor(Math.random()*spinMessages.length)]);
		mobFitsizeH();
		mobFitsizeW();
	});
	
	$('#console').css({ position: 'absolute' });
	fix_prompt();
}



function mobFitsizeH() {
	
	var winHeight=$(window).height()+56; // NOTE: +56 for the address bar at the top

	
	var headHeight=$('.console').position().top;
	var promptHeight=$('.prompt').outerHeight();
	var consoleHeight=winHeight-(headHeight+promptHeight);
	var minActionHeight=200;
	
	
	$('html').css({height:winHeight, overflow:'hidden'});
	$('body').css({height:winHeight, overflow:'hidden'});
	$('.console').css({height:consoleHeight});
	$('.prompt').css({top:($('.console').position().top+consoleHeight+2),'z-index':999});//.hide().show();
	//$('.prompt input[type="text"]').hide().show();
	$('section').css({height:winHeight});
	$('div[data-role="page"]').css({height:winHeight});
	
	var usersHeight=winHeight-headHeight;
	var actionsHeight=(usersHeight*0.8)-$('.prompt').height();
	if (actionsHeight<minActionHeight) {
		usersHeight*=0.3;
		usersHeight+=actionsHeight;
		actionsHeight=0;
		$('.rightpanel .actions').css({ display: 'none' });
		$('.rightpanel .users').css({height:usersHeight});
	} else {
		$('.rightpanel .actions').css({ display: '' });
		$('.rightpanel .users').css({height:usersHeight*0.30});
	}
	$('.rightpanel .actions').css({height:actionsHeight});
	window.scrollTo(0,1);
	setTimeout(rescroll,250); 
}

function mobFitsizeW() {
	var winWidth=$(window).width(); // NOTE: The browser seems to change its width AFTER 1 ms of the page loading	
	
	$('section').css({width:winWidth});
	$('.prompt input[type="text"]').css({width:winWidth-25,'margin-left':5});
}


function setupSidebarTrigger() {
	$('.displaysidebar a').click(function(){
		var show=!parseInt($(this).attr('shown'));
		$(this).attr('shown',show?1:0);
		animateSidebar();
		
		return false;
	});
}

function animateSidebar() {
	var sidebar=$('.rightpanel');
	var speed=35;
	var timer=15;
	
	var maxWidth=240;
	var width=sidebar.width();
	if ($('.displaysidebar a').attr('shown')==0) {
		// Hide	
		if (width>0) {
			width-=speed;
			width=width+'px !important';
			sidebar.css({width:width,'margin-left':'-'+width});
			setTimeout(animateSidebar,timer);
		}
	} else {
		// Show	
		if (width<maxWidth) {
			width+=speed;
			width=width+'px !important';
			sidebar.css({width:width,'margin-left':'-'+width});
			setTimeout(animateSidebar,timer);
		}
	}
}
	
function rescroll() { 
	if (!$('.prompt input[type="text"]').is(':focus'))
		window.scrollTo(0,1); 
}

function fix_prompt() {
	$('.prompt').hide().show();
}
