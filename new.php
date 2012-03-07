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
   
   Current: 
   -------- ASAP ---------
   * BUG!! -- parseError on Line 1 (sometimes, unknown file)  -- happens during initial load?
   * BUG (jQuery) -- Scroll up, type/send message, then close keyboard and the prompt stays in middle of screen
   * BUG (jQuery) -- send message, keep keyboard up, cursors doesn't move down with the prompt
   * Longpolling -- TEST Whispers, Joining new channel WHILE polling
   * Longpolling -- auto exit on logout, fix newchan issue (ignorechannel when user may change his/her mind and re-join)
   * Styles between message types
   * Tap button to move between channels + server
   * Disabled channel-moving buttons when unecessary
   * Disabled settings buttons
   * Format messages: timestamp, colours, links, "nick says: "
   * Organize mobile.new.js
   * Console messages
   * Extra Messages: Join message (you have joined, topic is)
   * Retrieving messages from server is TOO SLOW
   
   -------- Semi-Important --------
   * Test iOS power consumption
   * Test against Android? Blackberry? Windows Mobile? downloaded mobile browsers?
   * NoScript reload to alternate page
   * IE page
   * Auto move to Mobile page (mobile page should be m.chattywith.me[.local])
   * Implement AJAX.error
   * Pooled Requests sent out in mass (array of objects in JSON -- requests.json.php handles accordingly)
   * Clean Dir + Github update
   * Web-release stuff -- JSLint, Spritesheet, LoadImpact, W3C Validity, Cache PHP, Minify JS/CSS files, Optimize Images
   * Cache settings
   * Desktop version
   * Security: User-account for mysql
   
   ------ Widgets/Features ------
   * Autocorrect
   * New Message Indicator
   * Ruby shine while loading
   * Load Older Messages
   * Pages -- Chan Settings, User List + Actions
   * Colours + Emoticons
   * LaTeX
   * Images (option to save to iPhone + load from iPhone?)
   * Tap username ("JB says:") like a link for popup on options to that user
   * LocalStorage
   * LocalStorage chache-scripting
   * Chanlist
   * Send Microphone/Webcam message+offlines
   * Chanops able to remove RANGE of messages, remove pictures/videos/sound/mic recordings
   * Store+Send/Rcv Files
   * Accounts/IP addresses have limited bandwidth/space usage
   * Connection Strength + AutoReconnect + Warn on D/C
   * Security: Encrypt/Decrypt messages sent/received; Encrypt/Decrypt logins
   
   ------ Easter Eggs for G --------
   * Auto colour on "( G | Gell | Gellz | Gellerz ),( JB )" specifically in #youandme
   * Randomly post a diamond beside the word "Gellz" specifically in #youandme from JB, to the upper-right corner of the word
    	

-->
<!DOCTYPE html>
<html>
<head>
<noscript><meta http-equiv="refresh" content="" /></noscript>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<title>ChattyWith.me</title>

<!--
Did You Know?
	CSS Stylesheets can all be loaded asynchronously; however Javascript scripts will by default STOP all execution of
    further code (eg. CSS, HTML, other Javascript), until it is fully downloaded, parsed and executed.
    
    Hence you should always consider loading CSS first, followed by Javascript scripts (preferably with HTML5's async
    attribute).
-->
<link href="styles/view_terminal.css" rel="stylesheet" type="text/css" />
<style type="text/css" id="styleChanDisplay">
	
</style>

<!--<script async type="text/javascript" src="http://code.jquery.com/jquery-1.7.1.min.js"></script>-->
<script async type="text/javascript" src="http://code.jquery.com/jquery-1.6.4.min.js"></script>
</head>

<body>

	<div id="main">
        <div id="console">
        </div>
    
    
        <footer id="footerPrompt">
            <form id="fPrompt">
            <input type="text" id="prompt" val="test" />
            </form>
        </footer>
    </div>

<script async id="_checkjqueryloaded">
	<!-- Check if jQuery is loaded yet -->
	var tmrCheckJQuery=50;
	var checkIfLoaded=function(){
		if (typeof jQuery == 'undefined') {
			setTimeout(checkIfLoaded,tmrCheckJQuery);
			return;
		}
		init();
	};
	
	// Script Initialization
	var init=function(){
		(function($){
			// Determine Scripts to load (including mobile/desktop)
			var scripts=['js/utilities.new.js','js/client.js'];
			if (navigator.userAgent.match(/(android|webos|phone|pod|touch)/i))
				scripts.push('js/mobile.new.js');
			else
				scripts.push('js/mobile.new.js');
			
			
			// Load Scripts (in order)
			loadScripts(function(){
				(function($){$('#_checkjqueryloaded').remove();})(jQuery)}, // Remove this inline script
				 scripts);
		})(jQuery);
	};
	
	// Load Individual Scripts
	var loadScripts=function(cb_finalize,scripts) {
		if (scripts.length==0) {
			if (typeof cb_finalize == 'function')
				cb_finalize();
			return;
		}
		var src=scripts.shift();
		var script=document.createElement('script');
			script.type="text/javascript";
			script.src=src;
			script.onload=function(){ loadScripts(cb_finalize,scripts); };
			document.getElementsByTagName('head')[0].appendChild(script);
	}
	
	checkIfLoaded();
</script>
<script async id="_events">/* <?php require_once('js/Events.php');  require_once('js/Errors.php');  ?> */</script>

</body>
</html>