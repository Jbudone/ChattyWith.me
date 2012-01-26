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
		<script type="text/javascript" src="js/jquery-ui-1.8.16.custom.min.js"></script>
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
    
    	<div data-role="page" id="main">	
        
            <!-- Topic / Buttons -->
            <header data-role="header" data-position="fixed"> 
               <div data-role="controlgroup" data-type="horizontal" class="ui-corner-all ui-controlgroup ui-controlgroup-horizontal ui-btn-left" data-inline="true">
                    <a id="chanPrev" href="#" data-role="button" data-icon="arrow-l" data-iconpos="notext"></a>
                    <a id="chanHome" href="#" data-role="button" data-icon="home" data-iconpos="notext"></a>
                    <a id="chanNext" href="#" data-role="button" data-icon="arrow-r" data-iconpos="notext"></a>
                </div>
                <h1 role="heading" class="ui-title">Server Console</h1> 
               <div data-role="controlgroup" data-type="horizontal" class="ui-corner-all ui-controlgroup ui-controlgroup-horizontal ui-btn-right" data-inline="true">
                    <a href="#chaninfo" data-transition="flip" data-role="button" data-icon="grid" data-iconpos="notext"></a>
                    <a href="#settings" data-transition="flip" data-role="button" data-icon="gear" data-iconpos="notext"></a>
                    <a href="#users" data-transition="pop" data-role="button" data-rel="dialog" data-icon="search" data-iconpos="notext"></a>
                </div>
            </header>
            
            <!-- Chatspace -->
            <section data-role="content" class="console">
            </section>
            <channels id="console-hidden">
            </channels>
            
            
            <!-- Footer -->
            <footer data-role"footer" data-position="fixed" class="ui-footer ui-footer-fixed">
                <form name="prompt">
                    <input type="text" />
                </form>
            </footer>
    
    	</div>
    	<div data-role="page" id="chaninfo">
        	
            <header data-role="header" data-position="fixed"> 
            	<a href="#main" data-transition="flip" data-direction="reverse" data-role="button" data-icon="gear">Back</a>
                <h1 role="heading" class="ui-title">Channel #</h1> 
            </header>
                
                <div id="chansettings" permissions="chanop">
                	<label for="topic">Topic </label><input id="topic" type="text" value="" /><br/>
                    
                    <fieldset data-role="controlgroup" data-type="horizontal">
                    	<input type="checkbox" name="private" id="private" class="custom" />
	   					<label for="private">Private</label>
                    	<input type="checkbox" name="autoclear" id="autoclear" class="custom" />
	   					<label for="autoclear">Autoclear</label>
                    	<input type="checkbox" name="moderated" id="moderated" class="custom" />
	   					<label for="moderated">Moderated</label>
                    </fieldset>
                    <a href="#password" data-transition="pop">Password</a>
                </div>
                <hr/>
        </div>
    	<div data-role="page" id="settings">
        	Settings!! Woo
            <a href="#main" data-transition="flip" data-direction="reverse" data-role="button" data-icon="gear">Back</a>
        </div>
        <div data-role="page" id="password">
            PASSWORD SHIT HERE
            <a href="#chaninfo" data-transition="pop" data-direction="reverse" data-role="button" data-rel="back">Okay!</a>
        </div>
        <div data-role="dialog" role="dialog" id="users">
        	USERS WEE
            <a href="#main" data-transition="pop" data-direction="reverse" data-role="button" data-rel="back">Okay!</a>
            <div id="chanusers" permissions="all">
                <select value="Users List">
                    <option username="glitter" userid="7">@glitter [79.382.38.372]</option>
                    <option username="JB" userid="1">+JB [24.932.385.283]</option>
                </select>
            </div>
            <hr/>
        </div>
    	
    </body>
	</html>