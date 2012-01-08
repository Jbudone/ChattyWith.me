<?php
	require_once './system/utilities.php';
?>
	<!DOCTYPE html>
    <html>
	<head>
        
	
		<meta name="viewport" content="width=device-width; initial-scale=1.0; maximum-scale=1.0; user-scalable=0;">
        <meta name="apple-mobile-web-app-capable" content="yes" /> 
		<meta name="apple-mobile-web-app-status-bar-style" content="black">
        <link rel="apple-touch-startup-image" href="/images/logo-2.png">
        <title>ChattyWith.me -- An AJAX approach to IRC</title>
        
        
        
    	<link href="styles/template.css" type="text/css" rel="stylesheet" />
        <link rel="stylesheet" href="http://code.jquery.com/mobile/1.0b3/jquery.mobile-1.0b3.min.css" />
    	<link href="styles/mobile.css" type="text/css" rel="stylesheet" />
            
		<script type="text/javascript" src="js/jquery-1.6.2.min.js"></script>
        <script type="text/javascript" src="http://code.jquery.com/mobile/1.0b3/jquery.mobile-1.0b3.min.js"></script>
        <script type="text/javascript" src="js/utilities.js"></script>
        <script type="text/javascript" src="js/terminal.js"></script>
        <script type="text/javascript" src="js/commandstation.js"></script>
        <script type="text/javascript">
			
			var iError=function(msg,handler) {
				this.message=msg;
				this.handler=handler;
			};
			
			var errCodes={
				<?php
				foreach($uERROR_LIST as $error) {
					echo $error[0]; ?>: new iError('<?php echo $error[1]; ?>',<?php 
						echo $error[2]?$error[2]:'null'; ?>),
					<?php
				}
				?>
			};
		</script>
        <script type="text/javascript" src="js/main.js"></script>
        <script type="text/javascript" src="js/mobile.js"></script>
	</head>
	
    <body>		
        
        <!-- Topic / Buttons -->
    	<header data-role="header" data-position="fixed">
        	<h1 role="heading" class="ui-title">#server - The Topic of the Day</h1> 
           <div data-role="controlgroup" data-type="horizontal" class="ui-corner-all ui-controlgroup ui-controlgroup-horizontal ui-btn-right" data-inline="true">
                <a href="#" data-role="button" data-icon="gear" data-iconpos="notext"></a>
                <a href="#" data-role="button" data-icon="home" data-iconpos="notext"></a>
                <a href="#" data-role="button" data-icon="gear" data-iconpos="notext"></a>
            </div>
        </header>
        
        <!-- Chatspace -->
        <section class="console">
        </section>
        <channels id="console-hidden">
        </channels>
        
        
        <!-- Footer -->
        <footer data-role"footer" data-position="fixed" class="ui-footer ui-footer-fixed">
            <form name="prompt">
                <input type="text" />
            </form>
        </footer>
    
    
    
    	
    </body>
	</html>