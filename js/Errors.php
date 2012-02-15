<?php

require_once './system/utilities.php';
echo "
			var iError=function(msg,handler) {
				this.message=msg;
				this.handler=handler;
			};
			
			var errCodes={";
				foreach($uERROR_LIST as $error) {
					echo $error[0].': {
						message:\''.$error[1].'\',
						handler:null },';
				}
			echo "};";
			