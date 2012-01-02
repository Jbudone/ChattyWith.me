<?php



	define('ENCRYPTION_KEY','saltypepper');
	
	
	function encrypt($string) {
		return base64_encode(mcrypt_encrypt(MCRYPT_RIJNDAEL_256, md5(constant('ENCRYPTION_KEY')), $string, MCRYPT_MODE_CBC, md5(md5(constant('ENCRYPTION_KEY')))));
	}
	
	function decrypt($string) {
		return rtrim(mcrypt_decrypt(MCRYPT_RIJNDAEL_256, md5(constant('ENCRYPTION_KEY')), base64_decode($string), MCRYPT_MODE_CBC, md5(md5(constant('ENCRYPTION_KEY')))), "\0");
	}

