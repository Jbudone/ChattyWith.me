<?php
	
	/*


	*/



	///////////
	///
	///
	///   ENVIRONMENT
	///
	/// Environment for ChattyWith.me
	/////////////////////////////////
	/////////////////////////////////
	
	
	///
	///  INCLUDES
	//////////////////
	
	// NOTE: To anybody viewing this file OTHER than JB (myself), you will need access to the secret/encryption file which will decode any encrypted passwords found here
	require_once('secret/encryption.php');
	
	
	
	
	
	
	/// 
	///
	///  ENVIRONMENTS
	////////////////////
	
	$localEnv = array('LOCAL' => array('chattywith.me.local', 'www.chattywith.me.local'));
	$onlineEnv = array('ONLINE' => array('chattywith.me', 'www.chattywith.me'));
	$environments = array($localEnv, $onlineEnv);
	$defaultEnvironment = 'ONLINE';
	$environment = array();
	
	



	
	///
	///
	///  GENERAL SETTINGS
	////////////////////
	
	// ....
	
	
	
	
	
	
	
	
	///
	///
	///  DIRECTORY STRUCTURE
	////////////////////
	
	$environment['LOCAL']['DIRECTORY_ROOT']='J:\\JStuff\\Work\\Personal\\ChattyWithMe\\summit\\';
	$environment['ONLINE']['DIRECTORY_ROOT']='http://www.chattywith.me/';
	$environment['LOCAL']['DIRECTORY_SYSTEM']=$environment['LOCAL']['DIRECTORY_ROOT'].'system';
	$environment['ONLINE']['DIRECTORY_SYSTEM']=$environment['ONLINE']['DIRECTORY_ROOT'].'system';
	
	
	
	
	
	
	
	
	///
	///
	///  DATABASE
	////////////////////
	
	$environment['LOCAL']['DB_HOST']='localhost';
	$environment['LOCAL']['DB_USER']='root';
	$environment['LOCAL']['DB_PASS']='';
	$environment['LOCAL']['DB_DB']='chattywithme';
	
	$environment['ONLINE']['DB_HOST']='mysql.jbud.me';
	$environment['ONLINE']['DB_USER']='jbudone';
	$environment['ONLINE']['DB_PASS']=decrypt('ho98D4GvuvRebSwcy8QrrQMSMp4dANk2ZLuOKEAQLQU=');
	$environment['ONLINE']['DB_DB']='chattywithme';
	
	
	
	
	
	
	
	
	///
	///
	///  WARNINGS
	////////////////////
	
	$environment['LOCAL']['WARNINGS']=FALSE;
	
	$environment['ONLINE']['WARNINGS']=TRUE;
	$environment['ONLINE']['WARNINGS_MAILTO']='Jbud@live.ca';
	$environment['ONLINE']['WARNINGS_MAILSUBJ']='ChattyWith.me -- ERROR REPORTS';
	
	


	
	///
	///
	///  SETUP ENVIRONMENT
	////////////////////
	
	$serverType=$defaultEnvironment;
	if ($_SERVER)
	{
		foreach($environments as $environment_names) {
			
			foreach ($environment_names as $environment_type => $server_name) {
				if (in_array($_SERVER['SERVER_NAME'], $server_name)) {
					$serverType=$environment_type;
					break;
				}
			}
		}
	}
	
	
	if (isset($environment['BOTH']))
		$environment = array_merge($environment[$serverType], $environment['BOTH']);
	else
		$environment = $environment[$serverType];
	foreach($environment as $key=>$val) {
		define($key,$val);
	}
	
	
	
	function getMySQLIi() {
		return new mysqli(constant('DB_HOST'),constant('DB_USER'),constant('DB_PASS'),constant('DB_DB'));
	}
	
	function mailWarning($message) {
		if (constant('WARNINGS')===TRUE and constant('WARNINGS_MAILTO')) {
			mail(constant('WARNINGS_MAILTO'), constant('WARNINGS_MAILSUBJ'), $message);	
		}
	}




/* End of File -- environment.php */