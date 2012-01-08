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
        <link href="styles/mobile.portrait.css" type="text/css" rel="stylesheet" />
            
		<script type="text/javascript" src="js/jquery-1.6.2.min.js"></script>
        <script type="text/javascript" src="http://code.jquery.com/mobile/1.0b3/jquery.mobile-1.0b3.min.js"></script>
        <script type="text/javascript" src="js/iscroll.js"></script>
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
	
    <BODY>
    
    	<!--  Section of the website, user interface -->
    	<section>
         
         
         	<!-- Left Panel -->
            <div class="leftpanel">
            <div class="leftpanelinner">
             <!---->
             
                
                <!-- Channel Info -->
                <a class="channislide left" href=""><img src="images/arrow-left.png" alt="<-" /></a>
                <a class="channislide right" href=""><img src="images/arrow-right.png" alt="->" /></a>
                <div class="channelinfo">
                </div>
             <!---->
             
             
                <!-- Channel -->
                	<!-- Topic :: (btn|btn)    apply-new topic, remove topic (only show if operator)-->
                	<div class="topic">
                    	<span></span>
                    </div>
                    <div class="console" id="console" data-role"content" class="ui-content ui-scrollview-clip" role="main" data-scroll="y">
                		<div id="subconsole">
                    	</div>
                	</div>
                <div id="console-hidden" style="display:none;">
                </div>
             <!---->
                 
                 
                <!-- Textbar -->
                <div class="prompt">
                	<form name="prompt">
                        <!--<textarea cols="82" rows="1" name=""></textarea> -->
                        <input type="text" />
                    </form>
                </div>
             <!---->
         
         	</div>
         	</div>
         
         
         	<!-- Right Panel -->
            <div class="rightpanel">
          		

                <div class="displaysidebar">
                	<a href="#" shown="0"><img src="images/arrow-left.png" alt="<-" /></a>
                </div>
         	
                
                <!-- Mentions -->
                <div class="mentions">
                	<img src="images/ruby.png" name="ruby" alt="" />
                </div>
             <!---->
             
             
                <!-- Users -->
                <div class="users">
                
                </div>
             <!---->
             
             
                <!-- Actions -->
                <div class="actions">
                	<form name="settings">
                    
                    <div data-role="fieldcontain" class="options">
	                        <span class="description">These are your message retrieval systems (Comet protocol). Forever iFrame's are slightly uglier, but slightly faster, while Longpolling is a little cleanlier.</span>
                            <br/>
                            
                            <label for="comet_mode-iframe">Forever iFrame</label>
                            <input type="radio" name="comet_mode" id="comet_mode-iframe" value="iframe" />
                            <label for="comet_mode-longpoll">Longpolling</label>
                            <input type="radio" name="comet_mode" id="comet_mode-longpoll" value="longpoll" />
                            
                            <label for="theme" class="select">Choose a Theme:</label>
                            <select name="theme" title="Choose a Theme">
                            </select>
					</div>
                    </form>
                </div>
            </div>
            
        </section>
    </BODY>
</html>