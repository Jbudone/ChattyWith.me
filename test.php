<?php

	echo "Name: ".$_SERVER[SERVER_NAME].'<br/>';
	echo "Addr: ".$_SERVER[SERVER_ADDR].'<br/>';
	echo 'Environment, <br/>';
	foreach($_ENV as $key=>$val) {
		echo '..'.$key.' => '.$val.'<br/>';	
	}