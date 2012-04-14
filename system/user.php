<?php

/**
 *	USER file
 *	  Handle user account related requests
 *
 *
 */


	require_once('environment.php');
	require_once('channel.php');
	require_once('utilities.php');



/******
  TODO LIST
  
  * Clean the HELL out of this file
  * Error Flags
  * $result->close() on all result/mysqli vars


*******/


/************************************ ADMIN MANAGEMENT AREA BELOW *****************************************/

	// User Details
	$kREIDENTIFICATION_PINGTIME="10 minutes";
	
	

/************************************ END OF ADMIN MANAGEMENT AREA *****************************************/



class User
{
	// User Details
	var $id=NULL; // Personal Identification for this user (used for easier & safer access)
	var $userid=NULL;
	var $nick=NULL;
	
	
	//
	var $mysqli=NULL;
	
	
	function __construct($identification=NULL) {
		$this->id=NULL;
		$this->nick=NULL;
		$this->userid=NULL;
		
		$this->mysqli=getMySQLIi();
		
		// Attempt to auto-login with $_SESSION['identification']
		if (isset($_SESSION['identification']))
			$this->identify($_SESSION['identification']);
		else if ($identification)
			$this->identify($identification);
	}
	
	
	// login
	//   @username: Either the username OR email
	//	 @password: Cleartext password
	function login($username,$password) {
		
		
		// Select user w/ password (id, identification)
		// Set identification, OR (if none retrieved) Create unique identification
		// Return identification for storage use
		$ERROR=FALSE;
		if ($result=$this->mysqli->query(sprintf("SELECT nick, identification, id FROM `users` WHERE nick='%s' AND (password IS NULL OR password=PASSWORD('%s')) LIMIT 1", $this->mysqli->escape_string($username), $this->mysqli->escape_string($password)))) {
			
			if ($row=$result->fetch_assoc()) {
				
				$this->nick=$row['nick'];
				$this->id=$row['identification'];
				$this->userid=$row['id'];
				if (!$this->id) {
					// No Identification already set, create one now	
					if ($this->id=$this->_createUniqueID()) {
						if (!$this->mysqli->query(sprintf("UPDATE `users` SET identification='%s', ping=NOW() WHERE nick='%s' AND (password IS NULL OR password=PASSWORD('%s')) LIMIT 1", $this->mysqli->escape_string($this->id), $this->mysqli->escape_string($username), $this->mysqli->escape_string($password))))
							$ERROR=TRUE;
					} else
						$ERROR=TRUE;
				}
			} else if ($id=$this->openlogin($username,$ERROR)) {
				return $id;
			}
			$result->close();
		} else
			$ERROR=TRUE;
			
		if ($ERROR)
			return NULL;
			
		$this->_touch();
		$ipid=$this->_getIPID($_SERVER['REMOTE_ADDR']);
		$this->_updateUserIP($ipid,$this->userid);
		$_SESSION['identification']=$this->id;
		return $this->id;
	}
	
	// identify
	//		Login with a given identification id
	//   @identification
	function identify($identification) {
		$ERROR=FALSE;
		if ($result=$this->mysqli->query(sprintf("SELECT nick,id FROM `users` WHERE identification='%s' LIMIT 1",$this->mysqli->escape_string($identification)))) {
			
			if ($row=$result->fetch_assoc()) {
				$this->id=$identification;
				$this->nick=$row['nick'];
				$this->userid=$row['id'];
			} else
				$ERROR=TRUE;
			
			$result->close();
		} else
			$ERROR=TRUE;
			
		if ($ERROR)
			return NULL;
		
		$this->_touch();
		$ipid=$this->_getIPID($_SERVER['REMOTE_ADDR']);
		$this->_updateUserIP($ipid,$this->userid);
		$_SESSION['identification']=$this->id;
		return $this->id;
	}
	
	
	// openlogin
	//		Attempt to login with no password (an open user), or otherwise create the user
	//	@username
	function openlogin($username,&$ERROR) {
		
		$ERROR=FALSE;
		if ($result=$this->mysqli->query(sprintf("SELECT password, identification, ping, id FROM `users` WHERE nick='%s' LIMIT 1",$this->mysqli->escape_string($username)))) {
			
			if ($row=$result->fetch_assoc()) {
				if ($row['password']) {
					$ERROR=$GLOBALS[evBAD_PASSWORD]; // User already in-use  OR   password is set
				} else {
					if ($row['identification']) {
						// Identification set...when was the last ping sent?
						if (strtotime($row['ping'])>strtotime($GLOBALS[kREIDENTIFICATION_PINGTIME]))	
						{
							// Ping is too recent to reidentify!
							$ERROR=$GLOBALS[evCOULD_NOT_REIDENIFY_RECENTPING];	
						}
					}
					// User set, open, and free to use	
					if (!$ERROR and $this->id=$this->_createUniqueID()) {
						if (!$this->mysqli->query(sprintf("UPDATE `users` SET identification='%s' WHERE nick='%s' LIMIT 1", $this->mysqli->escape_string($this->id), $this->mysqli->escape_string($username))))
							$ERROR=$GLOBALS[evMYSQLI];
						else {
							$this->userid=$row['id'];
							$this->_touch();
						}
					} else if (!$ERROR)
						$ERROR=$GLOBALS[evMYSQLI];
				}
			} else {
				// No user set, open-register this user
				if ($this->id=$this->_createUniqueID()) {
					if (containsBadChars($username,$GLOBALS[kCHARSET_ALPHANUMERIC])!==FALSE or
						strlen($username)<$GLOBALS[kMIN_USERNAME_LEN] or strlen($username)>$GLOBALS[kMAX_USERNAME_LEN] or
						!$this->mysqli->query(sprintf("INSERT INTO `users` (nick,ping,identification) VALUES('%s',NOW(),'%s')", $this->mysqli->escape_string($username), $this->mysqli->escape_string($this->id))))
						$ERROR=$GLOBALS[evBAD_USERNAME];
					else
						$this->userid=$this->mysqli->insert_id;
				} else
					$ERROR=$GLOBALS[evMYSQLI];
			}
			$result->close();
		} else
			$ERROR=$GLOBALS[evMYSQLI];
			
		if ($ERROR)
			return NULL;
			
			
		$ipid=$this->_getIPID($_SERVER['REMOTE_ADDR']);
		$this->_updateUserIP($ipid,$this->userid);
		$this->nick=$username;
		$_SESSION['identification']=$this->id;
		return $this->id;
	}
	
	
	// logout
	function logout() {
		
		// Unset identification (locally and in db)
		if (!$this->mysqli->query(sprintf("UPDATE `users` SET identification=NULL WHERE id='%s' LIMIT 1",$this->mysqli->escape_string($this->userid))))
			return NULL;
			
		// Remove from All channels (D/C) and add logs
		if (!$result=$this->mysqli->query(sprintf("SELECT userchan.chanid, userchan.userid FROM `userchan` WHERE userchan.userid='%d'",$this->userid))) {
			return NULL;
		}

		// Go through EACH pre-D/C user, and D/C them manually from the given channel
		if ($result->num_rows) {
			$queryRem="DELETE FROM `userchan` WHERE (";
			$queryLog="INSERT INTO `logs` (chanid,userid,message,type,timestamp) VALUES";
			while ($row=$result->fetch_assoc()) {
				$queryRem.=sprintf("(chanid='%d' AND userid='%d') OR ",$row['chanid'],$row['userid']);
				$queryLog.=sprintf("('%d','%d','%d %d %s','event',NOW()),",$row['chanid'],$row['userid'],$GLOBALS[kCHANNEL_EVENT_DC],$row['userid'],$this->mysqli->real_escape_string($this->nick));
			}
			$queryRem=substr($queryRem,0,strlen($queryRem)-4).')';
			$queryLog=substr($queryLog,0,strlen($queryLog)-1);
			
			$result->close();
			if (!$result=$this->mysqli->query($queryRem) or !$result=$this->mysqli->query($queryLog)) {
					// Error
				}
		} else
			$result->close();
		
		return TRUE;
	}
	
	
	// register
	//	 @password: Cleartext password
	function register($password) {
		
		// Attempt to set a password for this user
		if (!$this->mysqli->query(sprintf("UPDATE `users` SET password=PASSWORD('%s'), ping=NOW() WHERE identification='%s' LIMIT 1",$this->mysqli->escape_string($password),$this->mysqli->escape_string($this->id))))
			return NULL;
		return TRUE;
	}
	
	
	// num_channels
	//	 @channelname: Name of the channel we're attempting to join (in case we're re-joining a channel that we've already entered previously)
	function num_channels($channelname) {
		if (!$result=$this->mysqli->query(sprintf("SELECT COUNT(*) AS count FROM `userchan` JOIN `channels` ON userchan.chanid=channels.id WHERE userid='%s' AND channels.name!='%s'",$this->mysqli->escape_string($this->userid),$this->mysqli->escape_string($channelname))))
			return NULL;
		$row=$result->fetch_row();
		return $row[0];
	}
	
	
	
	// _touch
	//		touch the user's lastaccessed date
	private function _touch() {
		if ($result=$this->mysqli->query(sprintf("UPDATE `users` SET ping=NOW() WHERE identification='%s' LIMIT 1",$this->mysqli->escape_string($this->id)))) {
			return TRUE;
		} else
			return NULL;
	}
	
	
	// _createUniqueID
	//		create a unique identification id for the given user
	private function _createUniqueID($x=0) {
		// TODO: Create a unique ID
		//  ID --    md5('_nick_' . microtime() . x)   : x++ if non-unique
		$_id=$this->nick . microtime(TRUE) . $x;
		$_id=md5($_id);
		if ($result=$this->mysqli->query(sprintf("SELECT COUNT(*) AS count FROM `users` WHERE identification='%s' LIMIT 1",$this->mysqli->escape_string($_id)))) {
			if ($row=$result->fetch_assoc() and $row['count']>0) {
				$result->close();
				return $this->_createUniqueID($x++);
			}
			else {
				$result->close();
				return $_id;
			}
		} else
			return NULL;
	}
	
	
	
	// _updateUserIP
	//		Updates the User/IP association
	//  @ipid
	//	@userid
	private function _updateUserIP($ipid,$userid) {
			
		if (!$result=$this->mysqli->query(sprintf("INSERT INTO `ip_connections` (ipid,userid,timestamp) VALUES('%s','%s',NOW())",$this->mysqli->real_escape_string($ipid),$this->mysqli->real_escape_string($userid))) and
			!$result=$this->mysqli->query(sprintf("UPDATE `ip_connections` SET timestamp=NOW() WHERE ipid='%s' AND userid='%s' LIMIT 1",$this->mysqli->real_escape_string($ipid),$this->mysqli->real_escape_string($userid))))
			return FALSE;
		if (!$result=$this->mysqli->query(sprintf("UPDATE `users` SET ipid='%s' WHERE id='%s' LIMIT 1",$this->mysqli->real_escape_string($ipid),$this->mysqli->real_escape_string($userid))))
			return FALSE;
		return TRUE;
	}
	
	
	
	// _getIPID
	//		Gets the ID of a given IP from `ip_list`
	//	@IP
	//  @nullAdd :: Set to TRUE if you want this to automatically add the IP if it can't be found, and return its ID (otherwise returns NULL)
	private function _getIPID($IP,$nullAdd=TRUE) {
		if ($result=$this->mysqli->query(sprintf("SELECT id FROM `ip_list` WHERE ip='%s' LIMIT 1",$this->mysqli->real_escape_string($IP)))) {
			if ($row=$result->fetch_assoc()) {
				$result->close();
				return $row['id'];
			}
			$result->close();
		} else
			return NULL; // Unable to make query
		
		// IP was NOT found -- nullAdd to add it
		if ($nullAdd and $result=$this->mysqli->query(sprintf("INSERT INTO `ip_list` (ip) VALUES('%s')",$this->mysqli->real_escape_string($IP))))
			return $this->mysqli->insert_id;
		else
			return NULL;
		
	}
	
	
	
}






/* End of File -- user.php */