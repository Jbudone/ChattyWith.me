<?php


/*
 *		Utilities		php
 *
 *	Author: JB Braendel
 *
 *	 ChattyWith.me's Utility script. This script provides
 *	all the helper functions and utility tools necessary
 *	between all serverside scripts on this web app
 *
 ****************************************************/


	// DEPENDENCIES
	////////////////
	require_once "environment.php";




/************************************ ADMIN MANAGEMENT AREA BELOW *****************************************/

$kVERBOSE=TRUE; // Verbose mode

// User Details
$kMIN_PASSWORD_LEN=4;
$kMAX_PASSWORD_LEN=15;
$kMIN_USERNAME_LEN=3;
$kMAX_USERNAME_LEN=15;


// Character Sets
$kCHARSET_ALPHANUMERIC=0x01<<0;
$kCHARSET_DOSCHAR=0x01<<1; // Standard American Keyboard set


// Log Types
$kLOG_MESSAGE=0x01<<0;
$kLOG_ACTION=0x01<<1;
$kLOG_EVENT=0x01<<2;
$kLOG_IMAGE=0x01<<3;
$kLOG_AUDIO=0x01<<4;
$kLOG_VIDEO=0x01<<5;


// Channel Collections
$kCHANLIST_USERS=0x01<<0;
$kCHANLIST_OPERATORS=0x01<<1;
$kCHANLIST_BANS=0x01<<2;


// Actions
$kACTION_CREATE=0x01<<0;
$kACTION_MODIFY=0x01<<1;
$kACTION_REMOVE=0x01<<2;


// Error Codes
$eMYSQLI_QUERY=0x01<<0;
$eILLEGAL_ARGUMENT=0x01<<1;
$eBAD_ARGUMENT_FORMAT_LENGTH=0x01<<2;
$eBAD_ARGUMENT_FORMAT_CHARSET=0x01<<3;
$eALREADY_EXISTS=0x01<<4;
$eILLEGAL_MEMBER=0x01<<5;
$eINSUFFICIENT_PRIVILEGES=0x01<<6;
	
	
// Error-Returnable Values
$evBAD_CHANID=array(0x00,
	"You have provided an invalid Channel ID");
$evINVALID_USER=array(0x01,
	"Bad user! You should be logged in to make that sort of request");
$evMISSING_ARGS=array(0x02,
	"There are missing arguments for your request call");
$evINVALID_ARGS=array(0x03,
	"One or more of the given arguments are invalid");
$evALREADY_LOGGED_IN=array(0x04,
	"You are already logged in!");
$evCOULD_NOT_IDENTIFY=array(0x05,
	"Could not identify user");
$evCOULD_NOT_LOGIN=array(0x06,
	"Could not login to the given user");
$evCOULD_NOT_USE_NICKNAME=array(0x07,
	"Could not use the given nickname");
$evCOULD_NOT_LOGOUT=array(0x08,
	"Could not logout","function(){ Terminal.spitback('You are already logged out you doofus!'); }");
$evCOULD_NOT_REGISTER=array(0x09,
	"Could not register");
$evMYSQLI=array(0x0A,
	"Error on the server..");
$evCOULD_NOT_CREATE_CHANNEL=array(0x0B,
	"Could not create channel");
$evCOULD_NOT_JOIN_CHANNEL=array(0x0C,
	"Could not join channel");
$evCOULD_NOT_RETRIEVE_USERS=array(0x0D,
	"Could not retrieve user list");
$evCOULD_NOT_RETRIEVE_MESSAGES=array(0x0E,
	"Could not retrieve message(s) from channel");
$evCOULD_NOT_LEAVE_CHANNEL=array(0x0F,
	"Could not leave channel");
$evCOULD_NOT_SEND_MESSAGE=array(0x10,
	"Could not send message to channel");
$evCOULD_NOT_RETRIEVE_LIST=array(0x11,
	"Could not retrieve list from channel");
$evCOULD_NOT_KICK_USER=array(0x12,
	"Could not kick user from channel");
$evCOULD_NOT_APPLY_BAN=array(0x13,
	"Could not apply ban");
$evCOULD_NOT_APPLY_OPS=array(0x14,
	"Could not apply operator status modification");
$evCOULD_NOT_APPLY_SETTINGS=array(0x15,
	"Could not apply channel settings");
$evBAD_PASSWORD=array(0x16,
	"You have entered the wrong password");
$evCOULD_NOT_REIDENIFY_RECENTPING=array(0x17,
	"Could not reidentify the user - someone else is currently logged in!");
$evBAD_USERNAME=array(0x18,
	"Could not create username - usernames MUST be alphanumeric (ie. letters and numbers only), and between ".$kMIN_USERNAME_LEN." and ".$kMAX_USERNAME_LEN." characters");
$evUNKNOWN_USER=array(0x19,
	"Could not find given user");
$evCANNOT_MESSAGE_SELF=array(0x1A,
	"Why not try sending a message to somebody else, you doofus!");
$evUNKNOWN_OR_HIDDEN_USER=array(0x1B,
	"Could not find the given user..perhaps he or she is hiding ??");
$evBANNED=array(0x1C,
	"(Banned)  ");
$evMODERATED=array(0x1D,
	"You may not talk in a channel that is currently moderated, unless you have +v voice or +o chanop status!");
$uERROR_LIST=array($evBAD_CHANID,$evINVALID_USER,$evMISSING_ARGS,$evINVALID_ARGS,$evALREADY_LOGGED_IN,$evCOULD_NOT_IDENTIFY,$evCOULD_NOT_LOGIN,
	$evCOULD_NOT_USE_NICKNAME,$evCOULD_NOT_LOGOUT,$evCOULD_NOT_REGISTER,$evMYSQLI,$evCOULD_NOT_CREATE_CHANNEL,$evCOULD_NOT_JOIN_CHANNEL,
	$evCOULD_NOT_RETRIEVE_USERS,$evCOULD_NOT_RETRIEVE_MESSAGES,$evCOULD_NOT_LEAVE_CHANNEL,$evCOULD_NOT_SEND_MESSAGE,$evCOULD_NOT_RETRIEVE_LIST,
	$evCOULD_NOT_KICK_USER,$evCOULD_NOT_APPLY_BAN,$evCOULD_NOT_APPLY_OPS,$evCOULD_NOT_APPLY_SETTINGS,$evBAD_PASSWORD,$evCOULD_NOT_REIDENIFY_RECENTPING,
	$evBAD_USERNAME, $evUNKNOWN_USER, $evCANNOT_MESSAGE_SELF, $evUNKNOWN_OR_HIDDEN_USER,$evBANNED,$evMODERATED);
		
		
// Response Codes
$kRESPONSE_ERROR=0x01;
$kRESPONSE_SUCCESS=0x02;

/************************************ END OF ADMIN MANAGEMENT AREA *****************************************/




	//////////////////////////
	//// STRING Manipulation
	//////////////
	
	
	// containsBadChars
	//	Does the given string contain any characters OUTSIDE
	//		the limitations of the provided character set
	//
	//	@str
	//	@charset: Default AlphaNumeric
	// return: X index of the first-found bad character, or FALSE otherwise
	function containsBadChars($str,$charset=NULL) {
		
		// Setup our Character Set
		$baseset=array('a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z',
					   'A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z',
						   '1','2','3','4','5','6','7','8','9','0');
		if ($charset==NULL or $charset==$GLOBALS[kCHARSET_ALPHANUMERIC])
			$charset=$baseset;
		else if ($charset==$GLOBALS[kCHARSET_DOSCHAR]) {
			$charset=array_merge($baseset,array(
						' ','`','~','!','@','#','$','%','^','&','*','(',')','-','_','+','=','<',',','>','.','/','?','"',"'",';',':','[','{',']','}','\\','|'));
		}
		else
			return FALSE;
			
		
		// Search through the String
		$i=0;
		$str=str_split($str);
		foreach($str as $char) {
			if(!in_array($char,$charset))
				return $i;
			$i++;
		}
		return FALSE;
	}
	
	
	// starts_with
	//	Checks if a given string starts with another string
	//
	//	@str
	//	@needle
	// return: TRUE/FALSE
	function starts_with($str,$needle) {
		return (substr($str,0,strlen($needle))==$needle);	
	}
	
	
	// key_implode
	//	Mimics PHP's implode() function using the array's keys rather
	//	than the values
	//
	//	@glue
	//	@arr
	// return: An imploded string built from the provided array/glue
	function key_implode($glue,$arr) {
		$str='';
		foreach($arr as $key=>$val) {
			$str.=$key.$glue;
		}
		if ($arr)
			$str=substr($str,0,strlen($str)-1);
		return $str;
	}
	
	
	// key_not_in
	//	Detects all the keys from one array that isn't in another array
	//	and returns those keys
	//
	//	@arrsrc: The array in which we want to loop through all keys
	//	@arrcmp: The array in which we're detecting missing keys
	// return: An array of all missing keys, otherwise an empty array
	function key_not_in($arrsrc,$arrcmp) {
		$missing=array();
		if (empty($arrsrc))
			return $missing; // Nothing to compare against
		if (empty($arrcmp)) {
			foreach($arrsrc as $key=>$val) {
				array_push($missing,$key);	
			}
			return $missing; // All of arrsrc is missing	
		}
		foreach($arrsrc as $key=>$val) {
			$found=FALSE;
			foreach ($arrcmp as $cmpkey=>$val) { 
				if ($cmpkey==$key) {
					$found=TRUE;
					break;	
				}
			}
			if (!$found)
				array_push($missing,$key);
		}
		return $missing;
	}
	
	
	
	// getIPID
	//		Gets the ID of a given IP from `ip_list`
	//	@IP
	//  @nullAdd :: Set to TRUE if you want this to automatically add the IP if it can't be found, and return its ID (otherwise returns NULL)
	// return: ipid on success, 0 for nonexistent, or -1 for error
	function getIPID($IP,$nullAdd=TRUE) {
		
		$mysqli=getMySQLIi();
		if ($result=$mysqli->query(sprintf("SELECT id FROM `ip_list` WHERE ip='%s' LIMIT 1",$mysqli->real_escape_string($IP)))) {
			if ($row=$result->fetch_assoc())
				return $row['id'];
		} else
			return -1;
		
		// IP was NOT found -- nullAdd to add it
		if ($nullAdd) {
			if ($result=$mysqli->query(sprintf("INSERT INTO `ip_list` (ip) VALUES('%s')",$mysqli->real_escape_string($IP))))
				return $this->mysqli->insert_id;
			return -1;
		}
		return 0;
		
	}
	
	
	// getChanID
	//		Gets the ID of a given channel name
	//
	//	@channel
	// return: chanid on success, 0 for nonexistent, or -1 for error
	function getChanID($channel) {
		$mysqli=getMySQLIi();
		if (!$result=$mysqli->query(sprintf("SELECT id FROM `channels` WHERE name='%s' LIMIT 1",$mysqli->real_escape_string($channel))))	
			return -1;
		if ($row=$result->fetch_assoc())
			return $row['id'];
		return 0;
	}
	
	
	// getUserNick
	//	Gets a given user's nickname from their userid
	//
	//	@userid
	// return: nickname, 0 for nonexistent, -1 for error
	function getUserNick($userid) {
		$mysqli=getMySQLIi();
		if (!$result=$mysqli->query(sprintf("SELECT nick FROM `users` WHERE id='%s' LIMIT 1",$mysqli->real_escape_string($userid))))	
			return -1;
		if ($row=$result->fetch_assoc())
			return $row['nick'];
		return 0;
	}
	
	
	// getUserID
	//	Gets a given user's id from their nickname
	//
	//	@nick
	// return: userid, 0 for nonexistent, -1 for error
	function getUserID($nick) {
		$mysqli=getMySQLIi();
		if (!$result=$mysqli->query(sprintf("SELECT id FROM `users` WHERE nick='%s' LIMIT 1",$mysqli->real_escape_string($nick))))	
			return -1;
		if ($row=$result->fetch_assoc())
			return $row['id'];
		return 0;
	}
	
	
	// getUserIP
	//	Gets a given user's last-used IP address
	//
	//	@nick
	// return: IP, NULL for nonexistent or error
	function getUserIP($nick) {
		$mysqli=getMySQLIi();
		if (!$result=$mysqli->query(sprintf("SELECT ip_list.ip FROM `ip_list` JOIN `users` ON ip_list.id=users.ipid WHERE users.nick='%s' LIMIT 1",$mysqli->real_escape_string($nick))))
			return NULL;
		if ($row=$result->fetch_assoc())
			return $row['ip'];
		return NULL;
	}
	


/* End of File -- utilities.php */