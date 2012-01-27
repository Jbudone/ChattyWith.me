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

-->
<!DOCTYPE html>
<html>
<head>
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

<script async type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js"></script>
</head>

<body>

	<div id="console">
    </div>

	<input type="text" />

<!--
EVENT HANDLERS

Did You Know?
	Google uses a cool hack to load Javascript without even parsing it -- they load the script within Comments like so,
    	/* Javascript Code Goes Here */
    And when ready, strip out the /**/ comment tags to begin parsing the Javascipt. Needless to say, thats what happened
    down here. (don't believe me? try checking it yourself,
    	UNIX: curl <?php echo $_SERVER['SERVER_NAME'].$_SERVER['PHP_SELF']; ?>
        Windows: ....get cygwin/mingw, then use UNIX
-->
<script async id="_events">/* <?php require_once('js/Events.php'); ?> */</script>
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
	
	var init=function(){
		(function($){
			// Loader Stuff Here
			$('<script/>').attr({
				defer:true,
				src:'js/utilities.js'
			}).appendTo('head');
			
			$('<script/>').attr({
				defer:true,
				src:'js/client.js'
			}).appendTo('head');
			
			$('<script/>').attr({
				defer:true,
				src:'js/unixterminal.js'
			}).appendTo('head');
			
			
			// Remove This Script
			$('#_checkjqueryloaded').remove();
		})(jQuery);
	};
	
	checkIfLoaded();
</script>

</body>
</html>