// JavaScript Document


/*
 *		Main		js
 *
 *	Author: JB Braendel
 *
 *	 ChattyWith.me's Main javascript file, puts everything
 *	together, does any initializiation and setup of the
 *	other front-end scripts.
 *
 ****************************************************/

	
	
	/********************
		TODO LIST
		
		!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
		* Setup ALL Errors:
			$user->identify/login/register; test around to see if any more is necessary
		* FILE CLEANUP:
			NOTES
		* SERVER CLEANUP:
			chmod on garbagecollector (disallow general public to execute!)
		* Github / Open source
			

		ERROR: Firefox sent messages show up as NaN
			
			
		ERROR: Browser Checks
				- Chrome: Throbber of Doom (forever iFrame)
		
		
		
		TODO (low prior)
		
			*************
			** These Errors have been discovered, but only occur SOMETIMES. Fixes have been made which I presume have fixed these, but
			** there's no way of knowing for sure, other than waiting and seeing if they come up again
			* ERROR: msgRetrieval is getting Internal Server Error 500 *SOMETIMES* !?
			* ERROR: Sometimes multi-retrieval doesn't get activated under longpolling (usually after /leave, /join (bad/no password), /join (good password)
			* ERROR: Sometimes sent messages don't retrieve (EVEN after they were already retrieving...found after a flood of long-length messages)
			*************
			
			* On-Failure of using commands (eg. '/ban' without any args) auto-print help for that command
			* /reply
			* $.ajaxError() implementation, for requests that fail silently
			* Notification of not being connected properly (after 5 seconds of being connected to Comet, then show a green connection?)
			* Boss Key: Able to /set default bosskey website (using iframe that covers the whole page), then ctrl+b to boss in/out.. maybe auto-load page BEFORE hand for QUICK in/out
			* Change nickname WHILE in channel (auto change userchan DONT add leave/join logs)
			* Server Admin: Auto-chanop in any channel, remove channel, cannot be de-opped
			* /send File (or, drag over username -- auto-download from client, and send to user AS its downloading)
			* Send images (drag/drop from browser, iPhone/Android, image src/link?)
			* UPDATING mode (notification that the website is being updated/tested, to warn users who are just connecting)
			* On-Failure of using commands (eg. '/ban' without any args) auto-print help for that command
			* /ignore [userid]
			* Unread blinking
			* Right click channel buttons (save log)
			* Auto move cursor to end of Prompt/Input when cycling through messages
			* FLOOD CONTROL: message() checks your last messages sent within X timeframe.. if count>=Y then return flood error code, 
							and auto flood-block user (add to `userchan` floodblock DATETIME...next message checks the datetime
							and removes floodblock, and allows the message to send)
			* Terminal (rcv-redundancy -- this could be cleaned up; most rcv's could be merged into 1 method with flags to describe how to handle the arguments)
		!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	
	********************/



/************************************ ADMIN MANAGEMENT AREA BELOW *****************************************/



// Channel-Slider details
var channiSliderAmt=5;
var channiSliderSpd=20;
var channiSliderMin=-1000;
var channiSliderMax=10;


// Terminal details
var promptMaxlen=480; // Maximum length of the prompt
var promptCycleHome=null; // Set which keyCode may be used to skip through the message-cycles and go back to the bottom (null for none)
var serverChanTitle='Server'; // Title of the Server window
var mobileEnabled=false;
var consoleScroller=null;
var windowOpened=true;
var notify=false; // True if there are notifications appending and the user has the window blurred


/************************************ END OF ADMIN MANAGEMENT AREA *****************************************/


/* Document.ready
 * 
 *		All initialization and setup of the
 *	various scripts, elements and forms are
 *	done here
 *
 *
 *
 *  requirements:   jQuery (tested on 1.6.2)
 *
 ****************************/
$(document).ready(function() {
	
	
	
	if( navigator.userAgent.match(/Android/i) ||
		 navigator.userAgent.match(/webOS/i) ||
		 navigator.userAgent.match(/iPhone/i) ||
		 navigator.userAgent.match(/iPod/i)){
		 // some code
		 	if (window.location.pathname!='/mobile.php')
				window.location='/mobile.php';

			mobileEnabled=true;
		 }
	
	
	////////////////////////
	////	Load Briefcase
	////  Settings
	////////////////////////
	if (typeof localStorage != 'undefined') {
		
		// Retrieval Mode (Comet)
		retrieval_mode=localStorage.getItem('retrieval_mode');
		if (!retrieval_mode) {
			retrieval_mode=kRETRIEVAL_COMET_LONGPOLLING;
			localStorage.setItem('retrieval_mode',retrieval_mode);
		}
		
		// Theme
		theme=localStorage.getItem('theme');
		if (!theme) {
			theme=themeMap['default'];
			localStorage.setItem('theme','default');
		} else
			theme=themeMap[theme];
	} else {
		// Defaults	
		retrieval_mode=kRETRIEVAL_COMET_LONGPOLLING;
		theme=themeMap['default'];
	}
		 
	Terminal.setupTerminal();
	setupWinblurDetector();
	if (!mobileEnabled)  { $(window).bind('resize',function(){ resize(); }); resize(); }
	
	// Add page-back (backspace) protection
	$('*').bind('keydown',function(event){
		if (event.which==8) {
			Terminal.prompt.focus();	
		}
	});
	
	
	//
	// Initialize the Terminal-Server
	//////////////////////////
	Terminal.openWin(0,serverChanTitle,{},true);
	Terminal.console=$('div.console span');
	if (retrieval_mode==kRETRIEVAL_NOCOMET) {
		Terminal.printMsg("Message Retrieval Mode: ^8No^15-^8Comet");
		Terminal.update();
	} else {
		Terminal.printMsg("Message Retrieval Mode: ^8Comet");	
	}
	CommandStation.ping();
	
	
	////////////////////////
	////	IRC Connection
	////  Details
	////////////////////////
	Terminal.printMsg("Connected to ChattyWith.me (^2173.236.171.216^1)");
	
	
	
	//
	//	Setup our User-details
	// 		Check current Status (in case our Session is still set)
	////////////////////////////
	CommandStation._request('status', { }, function(data) {
		if (data && data.nick) {
			Terminal.userid=data.userid;
			Terminal.usernick=data.nick;
			Terminal.identification=data.identification;
			Terminal.rcvEvent(0,null,{message:"Logged in as "+data.nick});	
			if (retrieval_mode==kRETRIEVAL_COMET_IFRAME) setTimeout(function(){ CommandStation.pingCheckMessage(); },1500);
			else if (retrieval_mode==kRETRIEVAL_COMET_LONGPOLLING) Terminal.update();
			$('.prompt input[type="text"]').attr('placeholder','');
		} else if (typeof localStorage != 'undefined' && localStorage.getItem('id')) {
			Terminal.printMsg("Loading ^7briefcase^1..");
			var id=localStorage.getItem('id');
			Terminal.printMsg("Identifying as [^2"+id+"^1]");
			CommandStation._request('login',{id:id},function(data){
				
				if (data && data.response==kRESPONSE_SUCCESS && data.nick && data.userid) {
					CommandStation.cblogin(data);
				} else {
					Terminal.printMsg("Could not identify under the given credentials!");
					Terminal.printMsg("Removing identification from ^7briefcase");	
					localStorage.removeItem('id');
					Terminal.printMsg("^5You are not currently logged into the server. Please join in by picking a nickname with ^2/nickname ^15[^6nickname here^15]^5  without the ^15[brackets^15]^5 of course..  After you pick a nickname, you may register it under a set password, and can login next time with ^2/login ^15[^6nickname^15] [^6password^15]^5 . Please note that all nicknames nad passwords are strictly Alphanumeric.");
				}
			});
		} else {
			Terminal.printMsg("^5You are not currently logged into the server. Please join in by picking a nickname with ^2/nickname ^15[^6nickname here^15]^5  without the ^15[brackets^15]^5 of course..  After you pick a nickname, you may register it under a set password, and can login next time with ^2/login ^15[^6nickname^15] [^6password^15]^5 . Please note that all nicknames nad passwords are strictly Alphanumeric.");
		}
	});
	
	
	
	
	//
	//  Mobile Support
	///////////////////
	
	if (mobileEnabled) {
		Terminal.printMsg("Mobile Mode ^5Enabled^1..");
		mobileSetup();
	}
	

	$(function() {
		var availableTags = [
			"ActionScript",
			"AppleScript",
			"Asp",
			"BASIC",
			"C",
			"C++",
			"Clojure",
			"COBOL",
			"ColdFusion",
			"Erlang",
			"Fortran",
			"Groovy",
			"Haskell",
			"Java",
			"JavaScript",
			"Lisp",
			"Perl",
			"PHP",
			"Python",
			"Ruby",
			"Scala",
			"Scheme"
		];
		
		Terminal.prompt.autocomplete({
			source: availableTags,
			position: { my : "left bottom", at: "left top" } 
		}).autocomplete('enable');
	});
}); 