<?php


/*
 *		Channel CLASS		php
 *
 *	Author: JB Braendel
 *
 *	 ChattyWith.me's Channel Class, where all channel-related
 *  requests be made and handled through this file. All
 *	requests will be made by a specific user(id), and results
 * 	will be dependent on that user's permissions with the given
 *	channel(id).
 *
 ****************************************************/


	// DEPENDENCIES
	////////////////
	require_once "environment.php";
	require_once "utilities.php";
	
	
	/********************
		TODO LIST
		
		* ...
	
	********************/



/************************************ ADMIN MANAGEMENT AREA BELOW *****************************************/


// Channel Name and Password format
$kCHANNEL_NAME_MINLEN=1;
$kCHANNEL_NAME_MAXLEN=30;
$kCHANNEL_PASSWORD_MINLEN=1;
$kCHANNEL_PASSWORD_MAXLEN=250;
$kCHANNEL_TOPIC_MINLEN=0;
$kCHANNEL_TOPIC_MAXLEN=80;

// Channel Defaults
$kCHANNEL_DEFAULT_TOPIC='';
$kCHANNEL_DEFAULT_PRIVATE=0;
$kCHANNEL_DEFAULT_MODERATED=0;
$kCHANNEL_DEFAULT_BANTIME="1 day";


$kDATE_FORMAT='D, d M Y g:i:sa';
$kMESSAGE_RETRIEVAL_MAX=30;
$kALLOW_DOUBLE_JOIN=TRUE; // If user is already in a channel, set this to FALSE to disallow access


// Event Codes (NOTE: This is in SYNC with /js/Events.php)
$kCHANNEL_EVENT_JOIN=0x01; // join [suserid] [susernick]
$kCHANNEL_EVENT_LEAVE=0x02; // leave [suserid] [susernick]
$kCHANNEL_EVENT_DC=0x03; // dc [suserid] [susernick]
$kCHANNEL_EVENT_KICK=0x04; // kick [suserid] [susernick] [duserid] [dusernick] [reason]  :: suser is the user requesting kick
$kCHANNEL_EVENT_BAN_SET=0x05; // ban [suserid] [susernick] [ip] [until] [strict] [reason]
$kCHANNEL_EVENT_BAN_MODIFY=0x06; // ban [suserid] [susernick] [ip] [until] [strict] [reason]
$kCHANNEL_EVENT_BAN_REMOVE=0x07; // ban [suserid] [susernick] [ip] [reason]
$kCHANNEL_EVENT_SETOPS_CHANOPS_ON=0x08; // setops [suserid] [susernick] [duserid] [dusernick]  :: suser is the user setting chanops
$kCHANNEL_EVENT_SETOPS_CHANOPS_OFF=0x09; // setops [suserid] [susernick] [duserid] [dusernick]  :: suser is the user setting chanops
$kCHANNEL_EVENT_SETOPS_VOICE_ON=0x0A; // setops [suserid] [susernick] [duserid] [dusernick]  :: suser is the user setting voiceops
$kCHANNEL_EVENT_SETOPS_VOICE_OFF=0x0B; // setops [suserid] [susernick] [duserid] [dusernick]  :: suser is the user setting voiceops
$kCHANNEL_EVENT_MODIFY_TOPIC=0x0C; // modify [suserid] [susernick] [topic]
$kCHANNEL_EVENT_MODIFY_PASSWORD=0x0D; // modify password [password]
$kCHANNEL_EVENT_MODIFY_MODERATED_ON=0x0E; // modify moderated [1|0]
$kCHANNEL_EVENT_MODIFY_MODERATED_OFF=0x0F; // modify moderated [1|0]
$kCHANNEL_EVENT_MODIFY_PRIVATE_ON=0x10; // modify private [1|0]
$kCHANNEL_EVENT_MODIFY_PRIVATE_OFF=0x11; // modify private [1|0]
$kCHANNEL_EVENT_JOINOPS_CHANOPS=0x012; // joinops [suserid] [susernick]
$kCHANNEL_EVENT_JOINOPS_VOICEOPS=0x013; // joinops [suserid] [susernick]
$kCHANNEL_EVENT_MODIFY_AUTOCLEAR_ON=0x14; // modify autoclear [1|0]
$kCHANNEL_EVENT_MODIFY_AUTOCLEAR_OFF=0x15; // modify autoclear [1|0]
$kCHANNEL_EVENT_RECONNECT=0x16; // join [suserid] [susernick]


// msgBan
//	Compile together the "You are Banned" message with the provided details
//
//	@details: Assoc Array
//		bans.usertype, bans.reason, bans.until, ip_connections.timestamp, bans.ipid, ip_list.ip
function msgBan($details) {
	return sprintf("Current IP address [%s] is banned from this channel until (%s) for reason(s): %s",$details['id'],date($GLOBALS[kDATE_FORMAT],strtotime($details['until'])),$details['reason']);
}


// msgBadPass
//	Compile the message for a wrong password
function msgBadPass() {
	return sprintf("You have entered the wrong password for this channel");	
}

// msgBadJoin
//	Compile the message for an unsuccessful join to a channel
function msgBadJoin() {
	return sprintf("Error attempting to join the channel.. You're probably already inside this channel. If this is an error, please wait a moment for the garbage collector to clear you from the channel before rejoining");	
}

/************************************ END OF ADMIN MANAGEMENT AREA *****************************************/
/************************************ CLASS DEFINITION BELOW *****************************************/
// Channel class below here
//	All system and back-end functionality of the channel will be below here



// createChannel
//	Attempt to create a channel with the given name
//
//	@chanid: The channel ID gets placed in this refvar
//	@userid: The user attempting to create this channel
//	@name
//	@password
// return: 0 on Success, otherwise an Error flag
//	NOTE: The user that creates the channel becomes a channel operator
function createChannel(&$chanid,$userid,$name,$password=NULL) {
	
	// Check the name and password formats
	if (strlen($name)<$GLOBALS[kCHANNEL_NAME_MINLEN] or
		strlen($name)>$GLOBALS[kCHANNEL_NAME_MAXLEN] or
		($password and
		strlen($password)<$GLOBALS[kCHANNEL_PASSWORD_MINLEN] or
		strlen($password)>$GLOBALS[kCHANNEL_PASSWORD_MAXLEN]))
		return $GLOBALS[eBAD_ARGUMENT_FORMAT_LENGTH];
		
	
	// Check that the name and password fall under the associated alphanumeric character set
	if (containsBadChars($name,$GLOBALS[kCHARSET_ALPHANUMERIC])!==FALSE or
		($password and containsBadChars($password,$GLOBALS[kCHARSET_ALPHANUMERIC])!==FALSE)) {
		return $GLOBALS[eBAD_ARGUMENT_FORMAT_CHARSET];	
	}
	
	
	// Check if the channel already exists
	$chanid=getChannelID($name);
	if ($chanid)
		return $GLOBALS[eALREADY_EXISTS];
	
	// Create the Channel
	$mysqli=getMySQLIi();
	$query="INSERT INTO `channels` (name,password,topic,private,moderated) VALUES('%s',";
	$query.=$password?"PASSWORD('".$mysqli->real_escape_string($password)."')":"NULL";
	$query.=",'%s',%b,%b)";
	$query=sprintf($query,$mysqli->real_escape_string($name),$GLOBALS[kCHANNEL_DEFAULT_TOPIC],$GLOBALS[kCHANNEL_DEFAULT_PRIVATE],$GLOBALS[kCHANNEL_DEFAULT_MODERATED]);
	if ($result=$mysqli->query($query)) {
		$chanid=$mysqli->insert_id;
	} else {
		$mysqli->close();
		return $GLOBALS[eMYSQLI_QUERY];
	}
		
		
	// Chanop the user	
	$mysqli->query(sprintf("INSERT INTO `operators` (chanid,userid,status) VALUES(%d,%d,'operator')",$chanid,$mysqli->real_escape_string($userid)));
	$mysqli->close();
	return 0;
}


// getChannelID
//	Retrieves the channel id from its name
//
//	@name
// return: Channel ID, or FALSE if nonexistent
function getChannelID($name) {
	
	$mysqli=getMySQLIi();
	$name=$mysqli->real_escape_string($name);
	if ($result=$mysqli->query(sprintf("SELECT id FROM `channels` WHERE name='%s' LIMIT 1",$name)) and
		$row=$result->fetch_assoc()) {
		$result->close();
		$mysqli->close();
		return $row['id'];
	}
	
	$mysqli->close();
	return FALSE;
}


// getChannelName
//	Retrieves the channel name from its id
//
//	@chanid
// return: Channel name, or FALSE if nonexistent
function getChannelName($chanid) {
	
	$mysqli=getMySQLIi();
	$chanid=$mysqli->real_escape_string($chanid);
	if ($result=$mysqli->query(sprintf("SELECT name FROM `channels` WHERE id='%s' LIMIT 1",$chanid)) and
		$row=$result->fetch_assoc()) {
		$result->close();
		$mysqli->close();
		return $row['name'];
	}
	
	$mysqli->close();
	return FALSE;
}


// getChannelColumn
//	Retrieves a specific value from a given channel/column
//
//	@chanid
//	@column
// return: Value, or FALSE if nonexistent
function getChannelColumn($chanid,$column) {
	
	$mysqli=getMySQLIi();
	$chanid=$mysqli->real_escape_string($chanid);
	$column=$mysqli->real_escape_string($column);
	if ($result=$mysqli->query(sprintf("SELECT `%s` FROM `channels` WHERE id='%s' LIMIT 1",$column,$chanid)) and
		$row=$result->fetch_assoc()) {
		$result->close();
		$mysqli->close();
		return $row[$column];
	}
	
	$mysqli->close();
	return FALSE;
}


/* Channel   (class)
 * 
 *		All channel actions and events handling done
 *	here. This is the Channel as percieved by the user
 *	making a call (eg. a guest, someone outside of the
 *	channel, or a channel operator).
 *
 * USERS;
 *	join, leave
 *	message, retrieve, getList{users,bans,operators}
 *
 * OPERATORS
 *	kick, ban
 *	setOps{chanop,voice}
 *	modify{password,topic,moderated,private}
 *
 *
 *
 *  requirements:   MySQL 4.1.13+
 *					PHP 5.3.0+  OR  MySQLi
 *	usage:	Create an instance of this class with the requested
 *			channel id, and the user id making the request
 ****************************/
class Channel
{
	
	// Execution Details
	var $chanid=NULL, $safechanid=NULL;
	var $userid=NULL, $safeuserid=NULL; // Caller ID
	var $usernick=NULL, $safeusernick=NULL; // Caller Nickname
	var $mysqli=NULL;
	
	
	// Constructor
	//	The Channel class is functioned based on the perception of
	//	the user making the call(s); For this it is required to get
	//	both the specific Channel (id) and User (id) before making
	//	any calls.
	function __construct($chanid,$userid,$usernick) {
		
		$this->mysqli=getMySQLIi();
		
		$this->chanid=$chanid;
		$this->userid=$userid;
		$this->usernick=$usernick;
		$this->safechanid=$this->mysqli->real_escape_string($this->chanid);
		$this->safeuserid=$this->mysqli->real_escape_string($this->userid);
		$this->safeusernick=$this->mysqli->real_escape_string($this->usernick);
	}
	
	
	// Destructor
	//	Destroy all Instanced Objects (eg. Mysqli)
	function __destruct() {
		$this->mysqli->close();	
	}



	/************************************ START OF PUBLIC COMMANDS *****************************************/
	
	
	
	/////////////////////////
	///  JOIN . LEAVE
	/////////////////////////
	
	
	// join
	//	Attempt to join a channel
	//
	//	@password
	//	@reconnect
	// return: 0 on Success, or ERROR/Reason otherwise
	// NOTE: The channel to join is ALREADY selected, this means
	//		that the channel must already exist, otherwise it should
	//		be created BEFORE instantiating this class
	function join($password=NULL,$reconnect=FALSE) {
		
		// Check if this user/IP is banned
		if ($this->_isBanned())
			return $GLOBALS[evBANNED];
		
		// Check for a password
		if (!$reconnect) { // People who are reconnecting to this channel don't need a password
			if (!$result=$this->mysqli->query(sprintf("SELECT password FROM `channels` WHERE id='%d' AND (password IS NULL OR password=PASSWORD('%s')) LIMIT 1",$this->safechanid,$this->mysqli->real_escape_string($password))))
				return $GLOBALS[evBAD_PASSWORD];
			if (!$result->num_rows)
				return $GLOBALS[evBAD_PASSWORD];
		}
			
		// Get the Latest Message ID (used in `userchan` for communication with Comet msgRetrieve.php)
		$msgid=0;
		if (!$result=$this->mysqli->query(sprintf("SELECT id FROM `logs` WHERE chanid='%d' ORDER BY id DESC LIMIT 1",$this->safechanid)))
			return $GLOBALS[eMYSQLI_QUERY];
		if ($row=$result->fetch_assoc())
			$msgid=$row['id'];
			
		// Join channel
		$dblJoin=FALSE;
		if (!$result=$this->mysqli->query(sprintf("INSERT INTO `userchan` (chanid,userid,msgid,ping) VALUES('%d','%d','%d',NOW())",$this->safechanid,$this->safeuserid,$msgid)))
		{
			if (!$GLOBALS[kALLOW_DOUBLE_JOIN])
				return msgBadJoin();	
			else
				$dblJoin=TRUE;
		} else // Log Join/Event
			$this->_log((($reconnect)?$GLOBALS[kCHANNEL_EVENT_RECONNECT]:$GLOBALS[kCHANNEL_EVENT_JOIN]).' '.$this->safeuserid.' '.$this->safeusernick,$GLOBALS[kLOG_EVENT]);
			
		// Check for ChanOps or Voice
		if ($ops=$this->_isOperator(TRUE) and !$dblJoin) {
			// Op this User
			$this->_log(($ops=='operator'?$GLOBALS[kCHANNEL_EVENT_JOINOPS_CHANOPS]:$GLOBALS[kCHANNEL_EVENT_JOINOPS_VOICEOPS]).' '.$this->safeuserid.' '.$this->safeusernick,$GLOBALS[kLOG_EVENT]);
		}
		
		if ($reconnect) {
			$this->mysqli->query(sprintf("DELETE FROM `disconnects` WHERE chanid='%d' AND userid='%d'",$this->safechanid,$this->safeuserid));
		}
		
		return 0;
	}
	
	
	
	// leave
	//	Attempt to leave a channel
	//
	// return: 0 on success, or ERROR otherwise
	function leave() {
		
		if ($result=$this->mysqli->query(sprintf("DELETE FROM `userchan` WHERE chanid='%d' AND userid='%d' LIMIT 1",$this->safechanid,$this->safeuserid)) and 
			$this->mysqli->affected_rows>0) {
			
			// Log Leave/Event
			$this->_log($GLOBALS[kCHANNEL_EVENT_LEAVE].' '.$this->safeuserid.' '.$this->safeusernick,$GLOBALS[kLOG_EVENT]);
			
			return 0;
		}
		return $GLOBALS[eMYSQLI_QUERY];
	}
	
	
	
	
	
	/////////////////////////
	///  MESSAGE . RETRIEVE . GETLIST
	/////////////////////////
	
	
	// message
	//	Message a channel
	//
	//	@message
	//	@msgType
	// return: 0 on success, ERROR code otherwise
	function message($message,$msgType) {
		// TODO: Attempt to message the channel, depends on moderated/voice mode, and  if userid WITHIN `userchan`
		// TODO: Do any sanitization and message analysis and manipulation in an OUTSIDE function (eg. to EVENTUALLY 
		//			determine the difference between a string or media message)
		//if ($index=containsBadChars($message,$GLOBALS[kCHARSET_DOSCHAR]))
		//	return $GLOBALS[eBAD_ARGUMENT_FORMAT_CHARSET];
		if (!$this->_isParticipant($this->userid))
			return $GLOBALS[eILLEGAL_MEMBER];
		if (!$this->_isOperator(TRUE) and $this->_isModerated())
			return $GLOBALS[evMODERATED];
		return $this->_log($message,$msgType);
	}
	
	
	
	// retrieve
	//	Retrieve latest messages from a channel
	//
	//	@id: The latest ID of the message we last received (0 or NULL if you just joined)
	// return: LIST of X messages; X depends on how many new messages since your last @pingTime (X can hit a maximum
	//		of kMAXIMUM_RETRIEVALS). ALSO returns the last message.id received
	function retrieve(&$id) {
		if (!$this->_isParticipant()) {
			// NOT in the channel..perhaps we can retrieve a kick-event?
			if (!$result=$this->mysqli->query(sprintf("SELECT logs.id, logs.userid, logs.message, logs.type, logs.timestamp, users.nick FROM `logs` JOIN `users` ON logs.userid=users.id WHERE logs.chanid='%s' AND logs.id>'%d' AND logs.message LIKE '%d %%' ORDER BY logs.id DESC LIMIT %d",
													$this->safechanid,$this->mysqli->real_escape_string($id),$GLOBALS[kCHANNEL_EVENT_KICK],$GLOBALS[kMESSAGE_RETRIEVAL_MAX])))
														return $GLOBALS[eMYSQLI_QUERY];

			while($row=$result->fetch_assoc()) {
				$evt=explode(' ',$row['message'],5);
				if ($evt[3]==$this->userid) {
					// We were kicked!
					return array($row);
				}
			}
			return $GLOBALS[eILLEGAL_MEMBER];
		}
		else {
			if (!$result=$this->mysqli->query(sprintf("SELECT logs.id, logs.userid, logs.message, logs.type, logs.timestamp, users.nick FROM `logs` JOIN `users` ON logs.userid=users.id WHERE logs.chanid='%s' AND logs.id>'%d' ORDER BY logs.id DESC LIMIT %d",
													$this->safechanid,$this->mysqli->real_escape_string($id),$GLOBALS[kMESSAGE_RETRIEVAL_MAX])))
														return $GLOBALS[eMYSQLI_QUERY];
		}
		if (!$row=$result->fetch_assoc())
			return array();
		$row['timestamp']=date("Y-m-d g:i:s",strtotime($row['timestamp']));
		$id=$row['id']; // Currently the LATEST message(id)
		$messages=array($row);
		while($row=$result->fetch_assoc()) {
			$row['timestamp']=date("Y-m-d g:i:s",strtotime($row['timestamp']));
			array_push($messages,$row);	
		}
		$messages=array_reverse($messages);
		$result->close();
		
		// Add the msgid to `userchan`
		$this->mysqli->query(sprintf("UPDATE `userchan` SET msgid='%d' WHERE userid='%d' AND chanid='%d' LIMIT 1",$id,$this->safeuserid,$this->safechanid));
		return $messages;
	}
	
	
	// retrieveOld
	//	Retrieve older messages from a channel (from MAX retrievals to $id)
	//
	//	@id: The earliest ID received (at the time of this call)
	// return: LIST of X messages; (X can hit a maximum of kMAXIMUM_RETRIEVALS). 
	//			ALSO returns the earliest message.id received
	function retrieveOld(&$id) {
		if (!$this->_isParticipant()) {
			// NOT in the channel..
			return $GLOBALS[eILLEGAL_MEMBER];
		}
		else {
			if (!$result=$this->mysqli->query(sprintf("SELECT logs.id, logs.userid, logs.message, logs.type, logs.timestamp, users.nick FROM `logs` JOIN `users` ON logs.userid=users.id WHERE logs.chanid='%s' AND logs.id<'%d' ORDER BY logs.id DESC LIMIT %d",
													$this->safechanid,$this->mysqli->real_escape_string($id),$GLOBALS[kMESSAGE_RETRIEVAL_MAX])))
														return $GLOBALS[eMYSQLI_QUERY];
		}
		if (!$row=$result->fetch_assoc())
			return array();
		$row['timestamp']=date("Y-m-d g:i:s",strtotime($row['timestamp']));
		$messages=array($row);
		while($row=$result->fetch_assoc()) {
			$row['timestamp']=date("Y-m-d g:i:s",strtotime($row['timestamp']));
			array_push($messages,$row);	
			$id=$row['id']; // Currently the EARLIEST-RECEIVED message(id)
		}
		$messages=array_reverse($messages);
		$result->close();
		return $messages;
	}
	
	
	
	
	// getList
	//	Gets a USERs list from the channel, any one of: {Users,Bans,Operators}
	//
	//	@listType
	// return: LIST of Y, or ERROR code otherwise
	function getList($listType) {
		if (!$this->_isParticipant())
			return $GLOBALS[eILLEGAL_MEMBER];
		
		
		$query;
		if ($listType==$GLOBALS[kCHANLIST_USERS])
			$query=sprintf("SELECT users.id, users.nick, ip_list.ip, operators.status FROM `userchan` JOIN `users` ON userchan.userid=users.id LEFT JOIN `operators` ON userchan.chanid=operators.chanid AND userchan.userid=operators.userid JOIN `ip_list` ON ip_list.id=users.ipid WHERE userchan.chanid='%s'",$this->safechanid);
		else if ($listType==$GLOBALS[kCHANLIST_OPERATORS])
			$query=sprintf("SELECT users.id, users.nick, ip_list.ip, operators.status FROM `operators` JOIN `users` ON operators.userid=users.id JOIN `ip_list` ON users.ipid=ip_list.id WHERE operators.chanid='%s'",$this->safechanid);
		else if ($listType==$GLOBALS[kCHANLIST_BANS])
			$query=sprintf("SELECT bans.usertype, bans.timestamp, bans.until, bans.reason, ip_list.ip FROM `bans` JOIN `ip_list` ON bans.ipid=ip_list.id WHERE bans.chanid='%s'",$this->safechanid);	
		else
			return $GLOBALS[eILLEGAL_ARGUMENT];
		
		if (!$result=$this->mysqli->query($query))
			return $GLOBALS[eMYSQLI_QUERY];
		
		$list=array();
		while($row=$result->fetch_assoc()) {
			array_push($list,$row);	
		}
		
		$result->close();
		return $list;
	}
	
	
	
	
	/************************************ END OF PUBLIC COMMANDS *****************************************/
	
	/************************************ START OF CHANOPS COMMANDS *****************************************/
	
	
	
	
	/////////////////////////
	///  KICK . BAN
	/////////////////////////
	
	
	// kick
	//	Attempt to kick a user from the channel
	//
	//	@kickid
	//	@reason
	// return: 0 on success, ERROR code otherwise
	function kick($kickid,$reason="") {
		
		// Is this a legal action
		if (!$this->_isParticipant())
			return $GLOBALS[eILLEGAL_MEMBER];
		if (!$this->_isOperator(FALSE))
			return $GLOBALS[eINSUFFICIENT_PRIVILEGES];
		if (!$this->_isParticipant($kickid))
			return $GLOBALS[eILLEGAL_MEMBER];
		
		
		// Kick the user
		if (!$result=$this->mysqli->query(sprintf("DELETE FROM `userchan` WHERE chanid='%d' AND userid='%d' LIMIT 1",$this->safechanid,$this->mysqli->real_escape_string($kickid))) or
			$this->mysqli->affected_rows==0)
			return $GLOBALS[eMYSQLI_QUERY];
		
		// Log the event
		$this->_log($GLOBALS[kCHANNEL_EVENT_KICK].' '.$this->safeuserid.' '.$this->safeusernick.' '.$this->mysqli->real_escape_string($kickid).' '.$this->mysqli->real_escape_string(getUserNick($kickid)).' '.$this->mysqli->real_escape_string($reason),$GLOBALS[kLOG_EVENT]);
		
		return 0;
	}
	
	
	// ban
	//	Attempt to ban a given IP from the channel
	//	NOTE: In the case that this IP is already set in the ban list, modify it accordingly to these new settings
	//	NOTE: If the given IP does NOT exist, then add it to the `ip_list`
	//
	//	@ip
	//	@strict {none,now,any,day,week,month}: How strict the IP ban is (ie. anybody who has ever once been logged on with the given IP? Within the past week? etc.)
	//											NOTE: none means to REMOVE this ban
	//	@until: Use strtotime (NOTE: MUST be a time ahead of NOW()), NULL=Permanent
	//	@reason
	// return 0 on success, ERROR code otherwise
	function ban($ip,$strict,$until=NULL,$reason="") {
		
		// Do we have appropriate privileges?
		if (!$this->_isParticipant())
			return $GLOBALS[eILLEGAL_MEMBER];
		if (!$this->_isOperator(FALSE))
			return $GLOBALS[eINSUFFICIENT_PRIVILEGES];
		
		// Get the ipid of this ip (or otherwise create it)
		$ipid=getIPID($ip,TRUE);
		
		if ($strict and $strict!='ipnow' and $strict!='ipany' and $strict!='ipday' and $strict!='ipweek' and $strict!='ipmonth') $strict='ipnow';
		$until=date('Y-m-d H:i:s',$until);
		
		// Does a ban currently exist for this ipid? (modify/remove)
		$action=NULL;
		if (!$result=$this->mysqli->query(sprintf("SELECT ipid FROM `bans` WHERE chanid='%d' AND ipid='%d' LIMIT 1",$this->safechanid,$this->mysqli->real_escape_string($ipid))))
			return $GLOBALS[eMYSQLI_QUERY];
		if ($row=$result->fetch_assoc()) {
			// Modify/Remove current Ban
			if (!$strict) {
				// Remove this Ban	
				if (!$result=$this->mysqli->query(sprintf("DELETE FROM `bans` WHERE chanid='%d' AND ipid='%d' LIMIT 1",$this->safechanid,$this->mysqli->real_escape_string($ipid))))
					return $GLOBALS[eMYSQLI_QUERY];
				$action=$GLOBALS[kACTION_REMOVE];
			} else {
				// Modify this Ban
				$query=sprintf("UPDATE `bans` SET usertype='%s', until='%s', reason='%s', userid='%d' WHERE chanid='%d' AND ipid='%d' LIMIT 1",
						$this->mysqli->real_escape_string($strict), $this->mysqli->real_escape_string($until), $this->mysqli->real_escape_string($reason), 
						$this->safeuserid, $this->safechanid, $this->mysqli->real_escape_string($ipid));
				if (!$result=$this->mysqli->query($query))
					return $GLOBALS[eMYSQLI_QUERY];
				$action=$GLOBALS[kACTION_MODIFY];
			}
		} else {
			if (!$strict)
				return 0;
			// Create a new Ban
			$query=sprintf("INSERT INTO `bans` (chanid,userid,ipid,usertype,timestamp,until,reason) VALUES('%d','%d','%d','%s',NOW(),'%s','%s')",
						$this->safechanid, $this->safeuserid, $this->mysqli->real_escape_string($ipid), $this->mysqli->real_escape_string($strict),
						$this->mysqli->real_escape_string($until), $this->mysqli->real_escape_string($reason));
			if (!$result=$this->mysqli->query($query))
				return $GLOBALS[eMYSQLI_QUERY];
			$action=$GLOBALS[kACTION_CREATE];
		}
		
		
		// Log
		$log;
		if ($action==$GLOBALS[kACTION_CREATE])
			$log=sprintf($GLOBALS[kCHANNEL_EVENT_BAN_SET].' '."%d %s %s %s %d %s",
						$this->safeuserid, $this->safeusernick, $this->mysqli->real_escape_string($ip), $this->mysqli->real_escape_string($strict), 
						$this->mysqli->real_escape_string($until), $this->mysqli->real_escape_string($reason));
		else if ($action==$GLOBALS[kACTION_MODIFY])
			$log=sprintf($GLOBALS[kCHANNEL_EVENT_BAN_MODIFY].' '."%d %s %s %s %d %s",
						$this->safeuserid, $this->safeusernick, $this->mysqli->real_escape_string($ip), $this->mysqli->real_escape_string($strict), 
						$this->mysqli->real_escape_string($until), $this->mysqli->real_escape_string($reason));
		else if ($action==$GLOBALS[kACTION_REMOVE])
			$log=sprintf($GLOBALS[kCHANNEL_EVENT_BAN_REMOVE].' '."%d %s %s %s",
						$this->safeuserid, $this->safeusernick, $this->mysqli->real_escape_string($ip), $this->mysqli->real_escape_string($reason));
		$this->_log($log,$GLOBALS[kLOG_EVENT]);
		return 0;
	}
	
	
	
	
	
	
	/////////////////////////
	///  CHANNEL SETTINGS
	/////////////////////////
	
	
	// setOps
	//	Attempt to give/take ops to a given user
	//
	//	@opid
	//	@optype {chanop,voice}, or NULL to remove all operator status
	//	@set {1,0}
	// return: 0 on success, ERROR code otherwise
	function setOps($opid,$optype,$set) {
		
		// Verify our privileges
		if (!$this->_isParticipant())
			return $GLOBALS[evNOT_IN_CHANNEL];
		if (!$this->_isOperator(FALSE))
			return $GLOBALS[evINSUFFICIENT_PRIVILEGES];
		if (!$this->_isParticipant($opid))
			return $GLOBALS[evUNKNOWN_USER];
		if ($this->userid==$opid)
			return $GLOBALS[evUSER_YOURSELF];
		
		// What is the provided user's operator status
		$action;
		if (!$result=$this->mysqli->query(sprintf("SELECT status FROM `operators` WHERE chanid='%d' AND userid='%d' LIMIT 1",$this->safechanid,$this->mysqli->real_escape_string($opid))))
			return getMysqliError($GLOBALS[evMYSQLI],$this->mysqli);
		if ($row=$result->fetch_assoc()) {
			if ($optype) {
				// Update Operators Status
				if (($row['status']=='operator' and $optype=='operator') or
					($row['status']=='voice' and $optype=='voice'))
					return $GLOBALS[evUSER_ALREADY_HAS_STATUS];
				if (!$result=$this->mysqli->query(sprintf("UPDATE `operators` SET status='%s' WHERE chanid='%d' AND userid='%d' LIMIT 1",$this->mysqli->real_escape_string($optype),$this->safechanid,$this->mysqli->real_escape_string($opid))))
					return getMysqliError($GLOBALS[evMYSQLI],$this->mysqli);
				$action=$GLOBALS[kACTION_MODIFY];
			} else {
				// Remove Operators Status
				if (!$result=$this->mysqli->query(sprintf("DELETE FROM `operators` WHERE chanid='%d' AND userid='%d' LIMIT 1",$this->safechanid,$this->mysqli->real_escape_string($opid))))
					return getMysqliError($GLOBALS[evMYSQLI],$this->mysqli);
				$action=$GLOBALS[kACTION_REMOVE];
			}
		} else {
			// Create new Operator	
			if (!$result=$this->mysqli->query(sprintf("INSERT INTO `operators` (chanid,userid,status) VALUES('%d','%d','%s')",$this->safechanid,$this->mysqli->real_escape_string($opid),$this->mysqli->real_escape_string($optype))))
				return getMysqliError($GLOBALS[evMYSQLI],$this->mysqli);
			$action=$GLOBALS[kACTION_CREATE];
		}
		
		
		// Log
		$log=sprintf("%d %d %s %d %s",
			($action==$GLOBALS[kACTION_REMOVE]?($optype=='operator'?$GLOBALS[kCHANNEL_EVENT_SETOPS_CHANOPS_OFF]:$GLOBALS[kCHANNEL_EVENT_SETOPS_VOICE_OFF]):($optype=='operator'?$GLOBALS[kCHANNEL_EVENT_SETOPS_CHANOPS_ON]:$GLOBALS[kCHANNEL_EVENT_SETOPS_VOICE_ON])),
			$this->safeuserid, $this->safeusernick, $this->mysqli->real_escape_string($opid), $this->mysqli->real_escape_string(getUserNick($opid)));
		$this->_log($log,$GLOBALS[kLOG_EVENT]);
		return 0;
	}
	
	
	
	
	// modify
	//	Attempt to modify one of the settings of the channel
	//
	//	@setting {password,topic,moderated,private}
	//	@value
	// return: 0 on success, ERROR code otherwise
	function modify($setting,$value) {
		
		// Verify our Privileges
		if (!$this->_isParticipant())
			return $GLOBALS[evNOT_IN_CHANNEL];
		if (!$this->_isOperator(FALSE))
			return $GLOBALS[evINSUFFICIENT_PRIVILEGES];
		
		
		// Modify channel settings
		if ($setting=='password') {
			// Password change	
			
			// Sanitize the value
			if ($value and $value!="") {
				if (containsBadChars($value,$GLOBALS[kCHARSET_DOSCHAR])!==FALSE)
					return $GLOBALS[evBAD_FORMAT_CHARSET];
				if (strlen($value)<$GLOBALS[kCHANNEL_PASSWORD_MINLEN] or
					strlen($value)>$GLOBALS[kCHANNEL_PASSWORD_MAXLEN])
					return $GLOBALS[evBAD_FORMAT_LENGTH];
			}
				
			if (!$result=$this->mysqli->query("UPDATE `channels` SET password=".($value?"PASSWORD('".$this->mysqli->real_escape_string($value)."')":'NULL')." WHERE id=".$this->safechanid." LIMIT 1"))
				return getMysqliError($GLOBALS[evMYSQLI],$this->mysqli);
			$this->_log(sprintf("%d %d %s",$GLOBALS[kCHANNEL_EVENT_MODIFY_PASSWORD],$this->safeuserid,$this->safeusernick),$GLOBALS[kLOG_EVENT]);
		} else if ($setting=='topic') {
			// Topic change	
			if (containsBadChars($value,$GLOBALS[kCHARSET_DOSCHAR])!==FALSE)
				return $GLOBALS[evBAD_FORMAT_CHARSET];
			if (strlen($value)<$GLOBALS[kCHANNEL_TOPIC_MINLEN] or
				strlen($value)>$GLOBALS[kCHANNEL_TOPIC_MAXLEN])
				return $GLOBALS[evBAD_FORMAT_LENGTH];
				
			if (!$result=$this->mysqli->query(sprintf("UPDATE `channels` SET topic='%s' WHERE id='%d' LIMIT 1",$this->mysqli->real_escape_string($value),$this->safechanid)))
				return getMysqliError($GLOBALS[evMYSQLI],$this->mysqli);
			$this->_log(sprintf("%d %d %s %s",$GLOBALS[kCHANNEL_EVENT_MODIFY_TOPIC],$this->safeuserid,$this->safeusernick,$value),$GLOBALS[kLOG_EVENT]);
		} else if ($setting=='moderated') {
			// Moderated-Mode change	
			if (!($value==1 or $value==0))
				return $GLOBALS[evINVALID_ARGS];
				
			if (!$result=$this->mysqli->query(sprintf("UPDATE `channels` SET moderated='%s' WHERE id='%d' LIMIT 1",$this->mysqli->real_escape_string($value),$this->safechanid)))
				return getMysqliError($GLOBALS[evMYSQLI],$this->mysqli);
			$this->_log(sprintf("%d %d %s",($value==1?$GLOBALS[kCHANNEL_EVENT_MODIFY_MODERATED_ON]:$GLOBALS[kCHANNEL_EVENT_MODIFY_MODERATED_OFF]),$this->safeuserid,$this->safeusernick),$GLOBALS[kLOG_EVENT]);
		} else if ($setting=='private') {
			// Public Privacy change	
			if (!($value==1 or $value==0))
				return $GLOBALS[evINVALID_ARGS];
				
			if (!$result=$this->mysqli->query(sprintf("UPDATE `channels` SET private='%s' WHERE id='%d' LIMIT 1",$this->mysqli->real_escape_string($value),$this->safechanid)))
				return getMysqliError($GLOBALS[evMYSQLI],$this->mysqli);
			$this->_log(sprintf("%d %d %s",($value==1?$GLOBALS[kCHANNEL_EVENT_MODIFY_PRIVATE_ON]:$GLOBALS[kCHANNEL_EVENT_MODIFY_PRIVATE_OFF]),$this->safeuserid,$this->safeusernick),$GLOBALS[kLOG_EVENT]);
		} else if ($setting=='autoclear') {
			// Public Privacy change	
			if (!($value==1 or $value==0))
				return $GLOBALS[evINVALID_ARGS];
				
			if (!$result=$this->mysqli->query(sprintf("UPDATE `channels` SET autoclear='%s' WHERE id='%d' LIMIT 1",$this->mysqli->real_escape_string($value),$this->safechanid)))
				return getMysqliError($GLOBALS[evMYSQLI],$this->mysqli);
			$this->_log(sprintf("%d %d %s",($value==1?$GLOBALS[kCHANNEL_EVENT_MODIFY_AUTOCLEAR_ON]:$GLOBALS[kCHANNEL_EVENT_MODIFY_AUTOCLEAR_OFF]),$this->safeuserid,$this->safeusernick),$GLOBALS[kLOG_EVENT]);
		} else
			return $GLOBALS[evINVALID_ARGS];
			
		return 0;
	}
	
	
	
	/************************************ END OF CHANOPS COMMANDS *****************************************/
	
	/************************************ START OF HELPER COMMANDS *****************************************/
	
	
	
	// getUserID
	//	Retrieves the UserID of a given Nickname (ONLY searching those WITHIN the channel)
	//
	//	@nickname
	// return: userid/FALSE
	function getUserID($nickname) {
		$nickname=$this->mysqli->real_escape_string($nickname);
		if ($result=$this->mysqli->query(sprintf("SELECT userchan.userid FROM `userchan` INNER JOIN `users` ON userchan.userid=users.id WHERE users.nick='%s' LIMIT 1",$nickname)) and
			$row=$result->fetch_assoc()) {
			return $row['userid'];
		} else
			return FALSE;
	}
	
	
	
	// _isParticipant
	//	Is the given user a participant in the channel (within `userchan`)
	//
	//	@userid: The userid to check, or NULL for the current userid
	// return: TRUE/FALSE
	function _isParticipant($userid=NULL) {
		$userid=$userid?$this->mysqli->real_escape_string($userid):$userid=$this->safeuserid;
		if ($result=$this->mysqli->query(sprintf("SELECT userid FROM `userchan` WHERE chanid='%s' AND userid='%s' LIMIT 1",$this->safechanid,$userid))) {
			return (boolean)$result->num_rows;
		} else
			return FALSE;
	}
	
	
	// _isOperator
	//	Is the given user an operator within the channel
	//
	//	@includingVoice: Set this to TRUE if VOICE counts as an operator
	// return: Operator type or FALSE otherwise
	function _isOperator($includingVoice=FALSE) {
		if ($result=$this->mysqli->query(sprintf("SELECT status FROM `operators` WHERE chanid='%s' AND userid='%s' LIMIT 1",$this->safechanid,$this->safeuserid))) {
			if ($row=$result->fetch_assoc()) {
				$result->close();
				if ($includingVoice)
					return $row['status'];
				else if ($row['status']=='operator')
					return $row['status'];
				return FALSE;
			}
			else {
				$result->close();
				return FALSE;
			}
			$result->close();
		} else
			return FALSE;
	}
	
	
	// _isBanned
	//	Is this User/IP currently banned from the channel
	//
	// return: Ban description, otherwise FALSE
	function _isBanned() {
		
		// Get current IPID
		$ipid=NULL;
		if ($result=$this->mysqli->query(sprintf("SELECT ipid FROM `users` WHERE id='%d' LIMIT 1",$this->safeuserid)) and
			$row=$result->fetch_assoc()) {
				$ipid=$row['ipid'];
			} else
				return FALSE;
		
		// Find all bans that include ANY IP used with this user
		if ($result=$this->mysqli->query(sprintf("SELECT bans.usertype, bans.reason, bans.until, ip_connections.timestamp, bans.ipid, ip_list.ip AS id FROM `bans` JOIN `ip_connections` ON bans.ipid=ip_connections.ipid JOIN `ip_list` ON bans.ipid=ip_list.id WHERE bans.chanid='%d' AND ip_connections.userid='%d'",$this->safechanid,$this->safeuserid))) {
			while ($row=$result->fetch_assoc()) {
				// Check if the ban 
				$usertype=$row['usertype'];
				if ($usertype=='ipany') {
					$result->close();
					return msgBan($row);
				}
				else if ($usertype=='ipnow' and 
					$row['ipid']==$ipid) {
						$result->close();
						return msgBan($row);
				} else {
					// IP MUST have been accessed within: 1 day, 1 week, 1 month	
					$ipConnectionLimit=60*60*24; // 1 Day's time
					if ($usertype=='ipweek')
						$ipConnectionLimit*=7;
					else if ($usertype=='ipmonth')
						$ipConnectionLimit*=30; // Not exact, but good enough
						
					if ($row['timestamp']+$ipConnectionLimit>time())
						return msgBan($row);
					
				}
			}
			return FALSE;
		}
		return FALSE;
	}
	
	function _isModerated() {
		if ($result=$this->mysqli->query(sprintf("SELECT moderated FROM `channels` WHERE id='%s' LIMIT 1",$this->safechanid))) {
			if ($row=$result->fetch_assoc()) {
				$result->close();
				if ($row['moderated']==1)
					return TRUE;
				return FALSE;
			}
			else {
				$result->close();
				return FALSE;
			}
			$result->close();
		} else
			return FALSE;
	}
	
	
	// _log
	//	Log a given message for this channel
	//
	//	@message
	//	@messageType :: message, action, event, image, audio, video
	// return: 0 on success, or ERROR code otherwise
	// NOTE: This method offers NO sanitization or safety of insertions. Please do all of that OUTSIDE of this method
	function _log($message,$messageType) {
		
		$type;
		switch($messageType) {
			case $GLOBALS[kLOG_MESSAGE]: $type='message'; break;	
			case $GLOBALS[kLOG_ACTION]: $type='action'; break;	
			case $GLOBALS[kLOG_EVENT]: $type='event'; break;	
			case $GLOBALS[kLOG_IMAGE]: $type='image'; break;	
			case $GLOBALS[kLOG_AUDIO]: $type='audio'; break;	
			case $GLOBALS[kLOG_VIDEO]: $type='video'; break;	
			default: $type='message'; break;	
		}
		
		if ($result=$this->mysqli->query(sprintf("INSERT INTO `logs` (chanid,userid,message,type,timestamp) VALUES('%d','%d','%s','%s',NOW())",$this->safechanid,$this->safeuserid,$this->mysqli->real_escape_string($message),$type)))
			return 0;
		return $GLOBALS[eMYSQLI_QUERY];
	}
	
	// _getChanname
	function _getChanname() {
		if (!$result=$this->mysqli->query(sprintf("SELECT name FROM `channels` WHERE id='%d' LIMIT 1",$this->safechanid)) or
			!$row=$result->fetch_assoc())
			return FALSE;
		$result->close();
		return $row['name'];
	}
	
	
	/************************************ END OF HELPER COMMANDS *****************************************/
}






// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
/************************************ START TESTING ENVIRONMENT *****************************************/

// Do all Unit testing here (this is a TEMPORARY spot to removed once all testing completes successfully)
/*
?><html>
<head>
	<style type="text/css">
    	body {
			white-space:pre;	
		}
    </style>
</head>
<body>
<?php

$channel=new Channel(10,2,'Pilot');
$msgid=1176;
$retrieve=$channel->retrieve($msgid);
var_dump($retrieve);

exit;
$chanid=NULL;
$userid=2; // Pilot !!
//$result=createChannel($chanid,$userid,"Testy");
$chanid=getChannelID('Testy');
if ($chanid)
	echo '<br />Chan ID: '.$chanid.'<br /><br />';
$channel=new Channel($chanid,$userid);
$result=$channel->_isOperator();
echo $result?"Ops! ":"Guest!";
$result=$channel->_isParticipant();
echo $result?"IN CHANNEL! ":"NOT IN CHANNEL!";
$result=$channel->join();
echo $result==0?"Successful Join! ":"Couldnt Join!";

$pingTime=0;
$result=$channel->retrieve($pingTime);
if (is_array($result)) {
	var_dump($result);
} else
	echo "error retrieving latest messages :(";
$result=$channel->message("Why hel'lo there, @Mr.Worl\\d!");
echo $result==0?"Successful Message! ":"Couldnt Message!";
$result=$channel->retrieve($pingTime);
if (is_array($result)) {
	var_dump($result);
} else
	echo "error retrieving latest messages :(";


var_dump($channel->getList($GLOBALS[kCHANLIST_USERS]));
var_dump($channel->getList($GLOBALS[kCHANLIST_OPERATORS]));
var_dump($channel->getList($GLOBALS[kCHANLIST_BANS]));

$result=$channel->leave();
echo $result==0?"Successful Leave! ":"Couldnt Leave!";
$result=$channel->retrieve($pingTime);
if (is_array($result)) {
	var_dump($result);
} else
	echo "error retrieving latest messages :(";
$result=$channel->_isParticipant();
echo $result?"IN CHANNEL! ":"NOT IN CHANNEL!";
?>
</body>
</html><?php
*/
/************************************ END OF TESTING ENVIRONMENT *****************************************/
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!





/* End of File -- channel.php */