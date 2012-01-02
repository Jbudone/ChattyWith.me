<?php
	$browser=$_SERVER[HTTP_USER_AGENT];
	if (preg_match('/MSIE/i',$browser)) {
		// Internet Explorer Sucks!!
		require_once 'iesucks.php';
		exit;	
	}

	require_once './system/utilities.php'; 
?>
	<!DOCTYPE html>
    <html>
	<head>
        <title>ChattyWith.me -- An AJAX approach to IRC</title>
        
        
        
    	<link href="styles/template.css" type="text/css" rel="stylesheet" />
    	<link href="styles/template-test.css" type="text/css" rel="stylesheet" />
    	<link href="styles/jquery-ui-1.8.16.custom.css" type="text/css" rel="stylesheet" />
        
            
		<script type="text/javascript" src="js/jquery-1.6.2.min.js"></script>
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
        <!-- <script type="text/javascript" src="http://code.jquery.com/mobile/1.0b3/jquery.mobile-1.0b3.min.js"></script> -->
	</head>
	
    <BODY>
    	
    
    	<!--  Title, logo -->
        <header>
        
        	<div class="logo">
            	<img src="images/logo-2.png" alt="ChattyWith.me" />
            </div>
                
            <div class="socials">
                <a id="jbud" href="http://jbud.me" target="_blank"><img src="images/jbud.png" /></a>
                <a id="twitter" href="https://twitter.com/#!/thatsjb" target="_blank"><img src="images/twitter.png" /></a>
                <a id="facebook" href="http://www.facebook.com/jb.braendel" target="_blank"><img src="images/facebook.png" /></a>
                <a id="github" href="#" target="_blank"><img src="images/github.png" /></a>
            </div>
        </header>
    <!---->
    
    
    
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
                <div class="console">
                </div>
             <!---->
                 
                 
                <!-- Textbar -->
                <div class="prompt">
                	<form name="prompt">
                        <!--<textarea cols="82" rows="1" name=""></textarea> -->
                        <input type="text" placeholder="/nickname [nickname here]" />
                        <a href="#" id="emoteButton"><img src="images/emoticons/happy.gif" /></a>
                        <input type="submit" name="submit" />
                    </form>
                </div>
             <!---->
         
         	</div>
         	</div>
         
         
         	<!-- Right Panel -->
            <div class="rightpanel">
         	
                
                <!-- Mentions -->
                <div class="mentions">
                	<img src="images/ruby.png" alt="" id="img-ruby" />
                	<img src="images/jquery.png" alt="" id="img-jquery" />
                	<img src="images/comet.png" alt="" id="img-comet" />
                </div>
             <!---->
             
             
                <!-- Users -->
                <div class="users">
                
                </div>
             <!---->
             
             
                <!-- Actions -->
                <div class="actions">
                	<form name="settings">
                        <div class="options">
	                        <span class="description">These are your message retrieval systems (Comet protocol). Forever iFrame's are slightly uglier, but slightly faster, while Longpolling is a little cleanlier.</span>
                            <input type="radio" name="comet_mode" value="iframe" />Forever iFrame
                            <input type="radio" name="comet_mode" value="longpoll" />Longpolling<br/>
                            
                            <br/><br/>
                            Theme:
                            <select name="theme">
                            </select>
                        </div>
                        
                        
                    </form>
                </div>
            </div>
            
        </section>
        <div class="toosmall">
        	Really ..?
        </div>
    </BODY>
</html>