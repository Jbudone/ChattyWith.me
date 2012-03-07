<?php

	phpinfo();
	exit;
	$fp = fsockopen("udp://127.0.0.1", 13, $errno, $errstr);
	if ($fp) {
		fwrite($fp, "\n");
		echo fread($fp, 26);
		fclose($fp);
	} else {
		echo 'error..<br/>';	
	}