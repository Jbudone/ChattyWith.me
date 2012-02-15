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
   
   * NoScript reload to alternate page
   * IE page
   * Auto move to Mobile page (mobile page should be m.chattywith.me[.local])
   * Implement AJAX.error
   * Longpolling.php -- auto exits on count mismatch between args & db
   * Pooled Requests sent out in mass (array of objects in JSON -- requests.json.php handles accordingly)
    	

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

<script async type="text/javascript" src="js/jquery.1.7.1.min.js"></script>
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
<script async id="_events">/* <?php  require_once('js/Events.php');  require_once('js/Errors.php');  ?> */</script>

</body>
</html>