<?php
	if(preg_match('/MSIE/i',$_SERVER['HTTP_USER_AGENT']))
		header("Location: iesucks.php"); // Relocate IE users
	
	//
	// Configurations (testing)
	////////////////////
	$TESTING_MODE=FALSE; // set to TRUE to use non-minified css and js files
	$MOBILE_MODE=FALSE;
	$MOBILE_LOADING=FALSE;
	
	// Attempt Mobile Loading Screen
	$phones=array('iphone','mobile','ipod','itunes',
				'blackberry','rim',
				'htc','nexus','dell','motorola','samsung','sony','asus','palm','vertu');
	if ($MOBILE_MODE or preg_match('/('.implode('|', $phones).')/i', $_SERVER['HTTP_USER_AGENT']) ){
		$MOBILE_LOADING=TRUE;
	}
	
	
	// Apply the configurations
	$file_postfix=($TESTING_MODE?'':'.min');
	$desktop_load_file=($MOBILE_MODE?'mobile':'desktop');
?>

<!--

Well Hello there, fellow Hackers!
Welcome to ChattyWith.me, my little personal webapp that I've created in my spare time. If you're reading this now, then
you are probably a scrappy little hacker like myself -- and for that, you will be rewarded! You may browse through all
of the source code here, and may even stumble into a few easter eggs like this below. The scripts have been built with
optimal optimization in mind; please read, study from, and learn from my scripts to gather new techniques for coding
your own sites. Remember that some of the best ways to learn is by learning from others,


(this is where you fullscreen the console)
   ******   **                   **    **             **       **  **    **    **     
  **////** /**                  /**   /**    **   ** /**      /** //    /**   /**     
 **    //  /**        ******   ************ //** **  /**   *  /**  **  ****** /**     
/**        /******   //////** ///**////**/   //***   /**  *** /** /** ///**/  /****** 
/**        /**///**   *******   /**   /**     /**    /** **/**/** /**   /**   /**///**
//**    ** /**  /**  **////**   /**   /**     **     /**** //**** /**   /**   /**  /**
 //******  /**  /** //********  //**  //**   **      /**/   ///** /**   //**  /**  /**
  //////   //   //   ////////    //    //   //       //       //  //     //   //   // 
                      
                      
    **********    ***** 
   //**//**//**  **///**
    /** /** /** /*******
 ** /** /** /** /**//// 
/** *** /** /** //******
/// //  //  //   ////// 

Created by: JB Braendel (2011-2012)
Portal: www.jbud.me


 ===========================
	 MASTER TODO LIST
   =======================
   
   
   -------- ASAP ---------
   ### Bugs in outside system
   * BUG (jQuery) -- send message, keep keyboard up, cursors doesn't move down with the prompt
   * BUG (jQuery) -- Typing in prompt auto scrolls up slightly
   * BUG (untested/jquerymob) -- https://github.com/scottjehl/Device-Bugs/issues/1
   
   ### BUGS TO FIX
   *** (desktop) Disconnected users (both when chan in view AND not in view) doesn't remove user 
   *** (mobile) TAP to swap channel isn't working
   *** (mobile) address-bar sometimes stays
   *** (mobile) Parse Error is back -- REMOVE PERMANENTLY!!!
   * (desktop) switching channel scrolls up to top
   * (desktop) resizing browser breaks scroll position
   * (mobile) Loading older messages improperly affects the window scroll (goes all over the place)
   * Garbage Collector clears up auto-clear channels (since messages get erased regularly)
   * (mobile) Scroll to bottom on init (note we MUST scroll to 0,1 first to hide address bar on LOAD)
   * Attempts to load older messages on channels with no older messages
   * Still receives messages from channels when you're not inside them
   * (desktop) double prints welcome message
   * (desktop) resize window still shows userlist (bring up top?)
   * (desktop) doesnt properly place hover over chan0
   * (desktop) chanhover shows all autojoin's as green
   * fix ping display (<0ms?)
   * message too long
   * /help
   
   ### TODO
   *** Messages Waiting
   *** Remove server-side checking if user is in new channels (otherwise issues with flooding longpoll requests; instead decrease longpoll time and show a join-wait time -- OR -- a request to CANCEL longpoll ON join (instead return to allow new longpoll))
   * CSS (desktop) -- links remove text-shadow, use rollover, remove text-decoration, add colour
   
   * Check that the Ping is as efficient as possible (minimal size)
   * Remove jQuery (bad for bandwidth hogging)
   * Minify JS/CSS files (can we minify LESS?)
   * Talk to DreamHost about enabling mod_gzip
   * Hover over channel to view channel name
   * Cache settings
   * RequireJS
   * Spritesheets
   * LoadImpact + Heavy Usage tests
   * W3c Validity
   * Manually cache PHP files?
   * JS "use strict"
   * Cache Longpolling.php & requests.php
   * Autocomplete
   * CREATE fragment, and set to RETURN fragment pieces in each buildMessage routine (in longpoll), hence no body.display=none needed
   * MOBILE: show header, swipe between channels, double tap for channel info + users + options, channel list
   * brighten up colours (no maroon or black background); arial font?
   * circle-gesture on mobile to convert all letters to symbols (elven? dwarven? different alphabet based off theme?)
   * battery status API for mobile -- adapt to battery.level && !battery.charing
   
   
   ### Bugs - Unable to Reproduce
   * (desktop) Swapping desktop windows makes the view spaz out (tries to load older messages, and ends up bouncing around)
   * On init, channel-selector doesn't hover over server chan
   * BUG -- "/leave #chan" on #chan for first time
   * BUG (mobile)-- on startup is slightly offset from the bottom
   * BUG (mobile) -- after sending message, prompt is offset slightly
   
   
   -------- Semi-Important --------
   * Make it VERY easy to start (on startup automatically assign nickname; auto-list most popular channels w/ click-to-join; on-join warn
   					that user is still using default username; warn that username is not saved)
   * Longpolling -- auto exit on logout, fix newchan issue (ignorechannel when user may change his/her mind and re-join) ;; perhaps auto
   					-join the new channels and have longpolling check new channels against recently left channels
   * Test iOS power consumption
   * Test against Android? Blackberry? Windows Mobile? downloaded mobile browsers?
   * NoScript reload to alternate page
   * Modern Browser Page (FF 11+, Chrome 17+, Opera 10+?, Safari 3.1+ --- these should be styled to
   									match the theme of the browser its being viewed in)
   * Pooled Requests sent out in mass (array of objects in JSON -- requests.json.php handles accordingly)
   * Security: User-account for mysql
   * Security: protection on garbage collector
   * Retrieving messages from server is TOO SLOW
   * Effects (mob) -- scroll-down animation for new messages (instead of instant scrollTo); Slide left/right to change channel
   * Register channels permanently (limited # per IP)
   * Fix ping to autologout after more reasonable time
   * Proper setup for testing speeds (for sending/receiving messages)
   * Avoid jQuery selectors? http://jsperf.com/getelementbyid-vs-jquery-id/5
   * Check if jQuery already included (ie. from plugins/extensions that we can use -- make sure they use acceptable version)
   * App Manifest (mobi) to auto add Chatty to homescreen
   * (desktop) Save previous messages, press up/down keys to iterate through them
   * Channel Options in Desktop (right container OR context menu) + Mobile (double-tap for settings/chan details)
   * Mobile userlist on right (small box that you can pull outwards to reveal userlist, able to pull it all the way out to see it *pop*; operator options)
   * Default topic for new channels
   * Mobile emoticons/colours box
   * Stop Mobile *flash* on new message received
   * Link   x.(com|net|...)
   * Allow selecting text
   * Ruby shine while loading
   * Load console (background) + ruby (front) instantaneously to show them loading while everything loads
   * SEO Search Terms
   * Images (option to save to iPhone + load from iPhone?)
   * Send Microphone/Webcam message+offlines
   
   ------ Widgets/Features ------
   * Effects (desktop) -- cube-transition, allow spammed clicking to make the cube go wild
   * Autocorrect
   * (mobile) New Message Indicator
   * Pages -- Chan Settings, User List + Actions
   * Show Colour/Emoticons within the textbox
   * LaTeX
   * Tap username ("JB says:") like a link for popup on options to that user
   * Double-Tap console for Settings/Chan details (only short list/immediate stuff)
   * Tap timestamp for details on time (full time + time according to the user who sent it + time settings)
   * LocalStorage cache-scripting
   * Chanlist (mobile implementation; desktop properly formated + links to join)
   * Chanops able to remove RANGE of messages, remove pictures/videos/sound/mic recordings
   * Store+Send/Rcv Files
   * Accounts/IP addresses have limited bandwidth/space usage
   * Connection Strength + AutoReconnect + Warn on D/C
   * Security: Encrypt/Decrypt messages sent/received; Encrypt/Decrypt logins
   * WebGL messages? (within a Sandbox)
   * Anti-flood
   * Limitations per IP (# users/channels / day)
   * Bot (K9; Game-bots? -- You choose to {open door 1|.msg door1}, {open door 2|.msg door2} -- on door1 reply with xxx, door2 reply with yyy) -- "open door 1" becomes a link to use that action
   * Emoticons morph from ASCII into images
   * Themes
   * Server/Client Accurate Time Offset (Localization)
   * Fixed Throbber of Doom
   * Encrypt messages in channels (animated shake the cube/box, and convert each letter to another symbol; then shake again to decrypt)
   * Node.js + MongoDB replacement on Amazon EC2
   * Small window: "Really?" -- "Now how do you possibly expect to read Chatty like this?"
   * (Desktop) Window dragging offscreen auto resizes/repositions elements to still display them properly
   * Custom scrollbar appearance
   * Implement WebWorkers
   * Garbage collector to automatically call the next garbage collector instance (in ~30 seconds, through terminal); use CRON as a regular checker that things are still going
   * Improve IE Sucks page (show clippy!)
   * Anti-porn scanner (for sending picture-messages)
   * Link to chattywith.me/#lolchan to auto connect (as random nick) and join #lolchan 
   * Submit code to be compiled by LLVM/Clang, run in a Sandbox (given certain permissions for safety reasons), and its output displayed in a little box
   
   
   ---- NOTES OF RECENT CHANGES ----
   * client.js (line 616) Event.read (after this.call_hook(this.evtref.handler);) removed line:    this.call_hook(hk_server_event_append_message);
   
-->
<!DOCTYPE html>
<html style="height:100%;">
<head>
<!--<noscript><meta http-equiv="refresh" content="" /></noscript> -->
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<meta id="viewport" name="viewport" content="initial-scale=0.7, maximum-scale=0.7, user-scalable=no" />
<title>ChattyWith.me</title>

<!--
Did You Know?
	CSS Stylesheets can all be loaded asynchronously; however Javascript scripts will by default STOP all execution of
    further code (eg. CSS, HTML, other Javascript), until it is fully downloaded, parsed and executed.
    
    Hence you should always consider loading CSS first, followed by Javascript scripts (preferably with HTML5's async
    attribute).
-->
<style type="text/css" id="styleChanDisplay">
	
</style>

<!--<script async src="js/require.min.js" data-main="js/main.new.js"></script>-->
<?php if (!$MOBILE_LOADING) { ?>
 <link href="styles/main.css" rel="stylesheet" type="text/css" />
<?php } ?>

<?php if ($TESTING_MODE) { ?>
 <script async src="http://code.jquery.com/jquery-1.8.2.js"></script>
<?php } else { ?>
 <script async src="http://code.jquery.com/jquery-1.8.2.min.js"></script>
<?php } ?>
</head>

<body style="height:100%;">
<?php if ($MOBILE_LOADING) { ?>
 <div style="position:absolute; width:150px; height:150px; overflow:hidden; left:28%; top:26%;">
	<img id="top-logo" style="width:100%; height:100%" src="<?php include_once('logo-datasrc'); ?>" />
 </div>
 <link href="styles/main.css" rel="stylesheet" type="text/css" />
 <innerBody style="display:none;">
<?php } ?>


	<div id="main">
        <div id="console">
        </div>
    
    
        <footer id="footer">
            <form id="fPrompt" >
            <input type="text" id="prompt" autocomplete="off" />
            </form>
        </footer>
    </div>

<!--
CGI-Generated Scripts
	Well, it was a little too much of a hassle to copy/paste event and error codes between PHP
    and JS scripts; so instead I have them generated on server files. Note that these scripts
    are wrapped in /* comments */ so they can be manually setup later, and minimize startup
    -downtime
    
    NOTE: If you don't see the scripts below, then they have already been cleverly-dynamically
    removed after parsing ;)
-->
<script id="_events">/* <?php require_once('js/Events.php');  require_once('js/Errors.php'); ?> */</script>

<script id="_checkjqueryloaded">
	<!-- Check if jQuery is loaded yet -->
	var tmrCheckJQuery=50,
	    TESTING_MODE=<?php echo ($TESTING_MODE?'true':'false'); ?>,
		MOBILE_LOADING=<?php echo ($MOBILE_LOADING?'true':'false'); ?>,
		checkIfLoaded=function(){
		if (typeof jQuery == 'undefined') {
			setTimeout(checkIfLoaded,tmrCheckJQuery);
			return;
		}
		init();
	},
	
	// Script Initialization
	init=function(){
		(function($){
			// Determine Scripts to load (including mobile/desktop)
			var scripts=['js/utilities<?php echo $file_postfix; ?>.js','js/client<?php echo $file_postfix; ?>.js'];
			if (navigator.userAgent.match(/(android|webos|phone|pod|touch)/i))
				scripts.push('js/mobile<?php echo $file_postfix; ?>.js');
			else
				scripts.push('js/<?php echo $desktop_load_file; ?><?php echo $file_postfix; ?>.js');
			
			
			// Load Scripts (in order)
			loadScripts(function(){
				(function($){$('#_checkjqueryloaded').remove();})(jQuery)}, // Remove this inline script
				 scripts);
		}(jQuery));
	},
	
	// Load Individual Scripts
	loadScripts=function(cb_finalize,scripts) {
		if (scripts.length==0) {
			if (typeof cb_finalize == 'function')
				cb_finalize();
			return;
		}
		var src=scripts.shift();
		var script=document.createElement('script');
			script.src=src;
			script.onload=function(){ loadScripts(cb_finalize,scripts); };
			document.getElementsByTagName('head')[0].appendChild(script);
	}
	
	checkIfLoaded();
</script>

<?php if ($MOBILE_LOADING) { ?>
</innerBody>
<?php } ?>
</body>
</html>
