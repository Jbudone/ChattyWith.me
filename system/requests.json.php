<?php
error_reporting(0);
$tStart=microtime(TRUE);

/*
 *		JSON Requests		php
 *
 *	Author: JB Braendel
 *
 *	 ChattyWith.me's JSON Request manager. ALL JSON
 *	 requests will be sent to, received by and handled
 *	 here; returning all data via. JSON Parsing.
 *
 ****************************************************/
 
 


	// DEPENDENCIES
	////////////////
	session_start();
	require_once "environment.php";
	require_once "utilities.php";
	require_once "channel.php";
	require_once "user.php";
	$error=NULL;
	$user=new User($_GET['identification']); // The user should be created here automatically -- via. SESSION[identification]
											// NOTE: sometimes SESSION[identification] is spontaneously destroyed!? I've included
											// 		the id as an arg for all request calls as a backup

	
	/********************
		TODO LIST
		
		* Remove user management (password lengths) here; all sanitizations and handling should be made WITHIN
			the user/channel class. This script is nothing but a request-portal
		* Clean User-Requests
	
	********************/



/************************************ ADMIN MANAGEMENT AREA BELOW *****************************************/
	
	
	
	// Event Codes
	$kEVENT_JOIN=0x01; // Somebody (not yourself) has joined the channel
	$kEVENT_LEAVE=0x02; // Somebody (not yourself) has left the channel
	$kEVENT_KICK=0x03; // Somebody (not yourself) has left the channel.. NOTE: This may not include yourself, since 
				//	upon retrieval you would already be OUT of the channel, and could not receive this event code
	$kEVENT_BAN=0x04; // An IP has been banned from the channel, OR a ban has been modified
	$kEVENT_OPS=0x05; // A user's operator status has been modified (given, taken, modified - chanops or voice ops)
	$kEVENT_SETTINGS=0x06; // One of the Channel's settings has been modified
	
	
	
	// Message Retrieval Control
	$kRETRIEVAL_SLEEPTMR=500000; // Sleep time between retrieval-attempts
	$kRETRIEVAL_MAXTRIES=1; // Maximum number of tries to retrieve messages before returning (good for D/C's)
	

/************************************ END OF ADMIN MANAGEMENT AREA *****************************************/

	/**
	 *  REQUEST FORMATS
	 *
	 *		Login: id
	 *				user, [pass]
	 *		Logout
	 *		Register: password
	 *
	 *		List
	 *		Join: channelname [password]
	 *				chanid [password]
	 *		Leave: chanid
	 *		Message: chanid, message
	 *		Retrieve: chanid, msgid
	 *		Getlist: chanid, listid={users,bans,operators}
	 *		Kick: chanid, kickid, [reason]
	 *		Ban: chanid, ip, [strict={none,now,any,day,week,month}], [until], [reason]
	 *		Chanop: chanid, opid, [optype={voice,operator}]
	 *		Modify: chanid, setting={password,topic,moderated,private}, value={1,0}
	 *
	 *************************************/

	if ($_GET) {
		
		if ($_GET['request']) {
			
			$request=$_GET['request'];
			$args=isset($_GET['args'])?$_GET['args']:NULL;
			
			// Decipher the arguments, and setup any required variables (eg. channel)
			if (isset($args['chanid'])) {
				// This is a channel-specific request
				$channel=new Channel($args['chanid'],$user->userid,$user->nick);	
				if (!$channel)
					err($evBAD_CHANID);
			}
			
			if ($request=='status') {
				echo json_encode(array('response'=>$kRESPONSE_SUCCESS,
										'userid'=>$user->userid,
										'nick'=>$user->nick,
										'identification'=>$user->id,
										'ip'=>$_SERVER['REMOTE_ADDR']));
				exit;
				
			} else if ($request=='login') {
				// Client Login request
				
				$err=NULL;
				if ($user->id) {
					// User logged in already (must logout first before logging in elsewhere)
					err($evALREADY_LOGGED_IN);
					exit;
				}
				if ($args['id']) {
					// Login via. ID	
					if ($user->identify($args['id']))
						echo json_encode(array('response'=>$kRESPONSE_SUCCESS,'nick'=>$user->nick,'userid'=>$user->userid,'identification'=>$args['id']));	// Successful Login
					else
						err($evCOULD_NOT_IDENTIFY);
				} else if ($args['user'] and $args['pass']) {
					// Login via. User/Pass
					if ($identification=$user->login($args['user'], $args['pass']))
						echo json_encode(array('response'=>$kRESPONSE_SUCCESS,'identification'=>$identification,'nick'=>$user->nick,'userid'=>$user->userid));	// Successful Login
					else
						err($evCOULD_NOT_LOGIN);
				} else if ($args['user']) {
					// Login with NO credentials (either create new name, or use an open-unregistered one)
					if ($identification=$user->openlogin($args['user'],$err))
						echo json_encode(array('response'=>$kRESPONSE_SUCCESS,'identification'=>$identification,'nick'=>$user->nick,'userid'=>$user->userid)); // Successful Login
					else
						err($err);
				} else
					err($evINVALID_ARGS);
			} else if ($request=='logout') {
				// Client Logout request
				if ($user->userid and $user->logout())
				{
					foreach($_SESSION as $key=>$val) {
						unset($_SESSION[$key]);	
					}
					unset($_SESSION);
					session_destroy();
					echo json_encode(array('response'=>$kRESPONSE_SUCCESS)); // Successful Logout
				}
				else
					err($evCOULD_NOT_LOGOUT);
			} else if ($request=='register') {
				// Client Register request
				
				if ($user->id) {
					if ($args['password'] and strlen($args['password'])>=$kMIN_PASSWORD_LEN and strlen($args['password'])<=$kMAX_PASSWORD_LEN) {
						if ($user->register($args['password']))
							echo json_encode(array('response'=>$kRESPONSE_SUCCESS)); // Successful Register
						else
							err($evCOULD_NOT_REGISTER);
					} else
						err($evINVALID_ARGS);
				}
				else
					err($evINVALID_USER);
			} else if ($request=='list') {
				// List of Channels
				if (!$user->userid)
					err($evINVALID_USER);
					
				$mysqli=getMySQLIi();
				if (!$result=$mysqli->query(sprintf("SELECT channels.id, channels.name, channels.topic, (SELECT COUNT(*) FROM `userchan` WHERE userchan.chanid=channels.id) AS users FROM `channels` WHERE private=0 ORDER BY users DESC")))
					err(getMysqliError($evMYSQLI,$mysqli));
				$list=array();
				while ($row=$result->fetch_assoc()) {
					$list[]=$row;	
				}
				echo json_encode(array('response'=>$kRESPONSE_SUCCESS,'channels'=>$list));
				exit;
				
			} else if ($request=='join') {
				// Join a Channel
				if (!$user->userid)
					err($evINVALID_USER);
				if ($user->num_channels($args['channelname'])>=$kMAX_USER_CHANNELS)
					err($evTOO_MANY_CHANNELS);
				if ($args['channelname']) {
					$chanid=getChanID($args['channelname']);
					if (!$chanid)
						if ($err=createChannel($chanid,$user->userid,$args['channelname'],$args['password'])!=0)
							err($evCOULD_NOT_CREATE_CHANNEL);
						
					$channel=new Channel($chanid,$user->userid,$user->nick);	
					if (!$channel)
						err($evBAD_CHANID);
				} else
					err($evBAD_CHANID);
					
				if ($err=$channel->join($args['password']))
				{
					if ($err==$evBANNED) {
						$reason=$channel->_isBanned();
						echo json_encode(array("response"=>$kRESPONSE_ERROR,"error"=>$err[1].$reason,"reason"=>$reason));
						exit;
					}
					else
						err($err);
				}
					
					
				// successfully joined channel..return its userlist + messages
				$userlist=$channel->getList($kCHANLIST_USERS);
				if (!is_array($userlist)) {
					// Error!
					$channel->leave();
					err($evCOULD_NOT_RETRIEVE_USERS);
				}
				
				// get the latest messages
				$msgid=NULL;
				$messages=$channel->retrieve($msgid);
				if (!is_array($messages)) {
					// Error!
					$channel->leave();
					err($evCOULD_NOT_RETRIEVE_MESSAGES);
				}
				
				$channame=$args['channelname']?$args['channelname']:getChannelName($channel->chanid);
				$chantopic=getChannelColumn($channel->chanid,'topic');
				$private=getChannelColumn($channel->chanid,'private');
				$moderated=getChannelColumn($channel->chanid,'moderated');
				$autoclear=getChannelColumn($channel->chanid,'autoclear');
				echo json_encode(array('response'=>$kRESPONSE_SUCCESS,'channel'=>array('chanid'=>$channel->chanid,'title'=>$channame,'topic'=>$chantopic,'users'=>$userlist,'messages'=>$messages,'msgid'=>$msgid,'private'=>$private,'moderated'=>$moderated,'autoclear'=>$autoclear),'chanid'=>$channel->chanid,'title'=>$channame,'topic'=>$chantopic,'users'=>$userlist,'private'=>$private,'moderated'=>$moderated,'autoclear'=>$autoclear));
				exit;
			} else if ($request=='leave') {
				// Leave a Channel
				if (!$user->userid)
					err($evINVALID_USER);
				if (!$channel)
					err($evBAD_CHANID);
					
				if ($err=$channel->leave())
					err($evCOULD_NOT_LEAVE_CHANNEL);
				$channame=$channel->_getChanname();
				echo json_encode(array('response'=>$kRESPONSE_SUCCESS,'chanid'=>$channel->chanid,'channame'=>$channame));
				exit;
			} 
			else if ($request=='message' or $request=='action') {
				// Message a Channel
				if (!$user->userid)
					err($evINVALID_USER);
				if (!$channel)
					err($evBAD_CHANID);
				if (!isset($args['message']))
					err($evMISSING_ARGS);
				
				$msgType=($request=='message')?$kLOG_MESSAGE:$kLOG_ACTION;
				if ($err=$channel->message(urldecode($args['message']),$msgType))
				{
					if ($err==$evMODERATED)
						err($evMODERATED);
					else
						err($evCOULD_NOT_SEND_MESSAGE);
				}
$tFinish=microtime(TRUE);
				echo json_encode(array('response'=>$kRESPONSE_SUCCESS,'totaltime'=>($tFinish-$tStart))); 
				exit;
			} else if ($request=='retrieve') {
				// Receive from a Channel
				if (!$user->userid)
					err($evINVALID_USER);
				if (!$channel)
					err($evBAD_CHANID);
					
					
				$msgid=$args['msgid'];
				$messages;
				$messages=$channel->retrieve($msgid);
				if (!is_array($messages)) // Error!
					err($evCOULD_NOT_RETRIEVE_MESSAGES);
					
				echo json_encode(array('response'=>$kRESPONSE_SUCCESS,'chanid'=>$channel->chanid,'messages'=>$messages,'msgid'=>$msgid));
				exit;
			} else if ($request=='retrieveold') {
				// Receive OLDER messages from a Channel
				if (!$user->userid)
					err($evINVALID_USER);
				if (!$channel)
					err($evBAD_CHANID);
					
					
				$msgid=$args['maxmsgid'];
				$messages;
				$messages=$channel->retrieveOld($msgid);
				if (!is_array($messages)) // Error!
					err($evCOULD_NOT_RETRIEVE_MESSAGES);
					
				echo json_encode(array('response'=>$kRESPONSE_SUCCESS,'chanid'=>$channel->chanid,'messages'=>$messages,'msgid'=>$msgid,'end'=>empty($messages)));
				exit;
			} else if ($request=='multiretrieve') {
				// Retrieve from Multiple Channels
				if (!$user->userid)
					err($evINVALID_USER);
					
				$mysqli=getMySQLIi();
				
				
				// Check for Whispers first
				$whispers=array();
				$query=sprintf("SELECT users.nick, whispers.message, whispers.timestamp FROM `whispers` JOIN `users` ON whispers.useridsnd=users.id WHERE whispers.useridrcv='%d' ORDER BY timestamp DESC; DELETE FROM `whispers` WHERE useridrcv='%d'",$userid,$userid);
				if (!$mysqli->multi_query($query)) {
					// ERROR... that sucks, but we're not going to let it ruin the rest of the request
				} else if (!$result=$mysqli->use_result() or !$result->num_rows) {
					while($row=$result->fetch_assoc()) {
						array_unshift($whispers,$row);
					}
					$result->close();
					$mysqli->next_result();	// Clear the appending query result (from DELETE--otherwise all subsequent queries won't work)
					
					// Return ONLY whispers here, to keep whispers and channel messages separate (for ease and abstraction)
					echo json_encode(array('response'=>$kRESPONSE_SUCCESS,'whispers'=>$whispers));
					exit;
				}
				
				
				
				// Setup the Channel ID's / MSG ID's
				$channels=array();
				$args=explode(' ',$args['args']);
				$i=-1;
				$_chanid=NULL;
				foreach($args as $arg) {
					++$i;
					if ($i%2==0)
						$_chanid=$arg;
					else
						$channels[$_chanid]=$mysqli->real_escape_string($arg);
				}
				
				if (empty($channels)) {
					echo json_encode(array('response'=>$kRESPONSE_SUCCESS,'channels'=>array()));
					exit;
				}
					
				
				// Multiple Retrieval
				$query='SELECT logs.chanid, logs.id, logs.userid, logs.message, logs.type, logs.timestamp, users.nick FROM `logs` JOIN `users` ON logs.userid=users.id LIMIT 0';
				foreach($channels as $chanid=>$msgid) {
					$query.=sprintf(" UNION (SELECT logs.chanid, logs.id, logs.userid, logs.message, logs.type, logs.timestamp, users.nick FROM `logs` JOIN `users` ON logs.userid=users.id WHERE logs.chanid='%d' AND logs.id>'%d' ORDER BY logs.id DESC LIMIT %d)",
									$mysqli->real_escape_string($chanid),$msgid,$kMESSAGE_RETRIEVAL_MAX);
					$channels[$chanid]=array();
					$channels[$chanid]['msgid']=$msgid;
					$channels[$chanid]['chanid']=$chanid;
					$channels[$chanid]['messages']=array();
				}
				$maxRuns=$kRETRIEVAL_MAXTRIES;
				do {
					if (!$result=$mysqli->query($query))  err($eMYSQLI_QUERY);
					
					
					// Setup and Return the messages (or otherwise wait and retry)
					$_any=FALSE;
					while ($message=$result->fetch_assoc()) {
						$_any=TRUE;
						$channels[$message['chanid']]['messages'][]=$message;
					}
					foreach($channels as &$channel) {
						$channel['messages']=array_reverse($channel['messages']);
						$channel['msgid']=$channel['messages'][count($channel['messages'])-1]['id'];
					}
					if ($result->num_rows) {
						echo json_encode(array('response'=>$kRESPONSE_SUCCESS,'channels'=>$channels));
						exit;
					} else if ($_any) {
						echo json_encode(array('response'=>$kRESPONSE_SUCCESS,'numrows'=>$result->num_rows));
						exit;
					}
					
					
					// If no messages, check the COUNT(*) of channels the user is in, see if we have the matching number.. if not then return a blank to allow a re-retrieval to perform
					if (!$result=$mysqli->query(sprintf("SELECT COUNT(*) AS count FROM `userchan` WHERE userid='%d'",$user->userid)))  err($eMYSQLI_QUERY);
					$row=$result->fetch_assoc();
					if ($row['count']!=count($channels)) {
						echo json_encode(array('response'=>$kRESPONSE_SUCCESS,'channels'=>array()));
						exit;
					}
				} while(--$maxRuns and !usleep($kRETRIEVAL_SLEEPTMR));
				exit;
				
			} else if ($request=='getlist') {
				// GetList from a Channel
				if (!$user->userid)
					err($evINVALID_USER);
				if (!$channel)
					err($evBAD_CHANID);
				if (!isset($args['listid']))
					err($evMISSING_ARGS);
				
				if ($args['listid']=='users') $listid=$kCHANLIST_USERS;
				else if ($args['listid']=='operators') $listid=$kCHANLIST_OPERATORS;
				else if ($args['listid']=='bans') $listid=$kCHANLIST_BANS;
				else $listid=$kCHANLIST_USERS;
				
				$chanlist=$channel->getList($listid);
				if (!is_array($chanlist)) // Error!
					err($evCOULD_NOT_RETRIEVE_LIST);
				
				echo json_encode(array('response'=>$kRESPONSE_SUCCESS,'chanid'=>$channel->chanid,'listcode'=>$listid,'list'=>$chanlist));
				exit;
			} else if ($request=='kick') {
				// Kick user from a Channel
				if (!$user->userid)
					err($evINVALID_USER);
				if (!$channel)
					err($evBAD_CHANID);
				if (!isset($args['kickid']))
					err($evMISSING_ARGS);
				
				
				$kickid=getUserID($args['kickid']);
				if (!$kickid)
					err($evUNKNOWN_USER);
				if ($kickid==$user->userid)
					err($evUSER_YOURSELF);
				if ($err=$channel->kick($kickid,$args['reason'])) // Error!
					err($evCOULD_NOT_KICK_USER);
				
				echo json_encode(array('response'=>$kRESPONSE_SUCCESS));
				exit;
			} else if ($request=='ban') {
				// Ban IP from a Channel
				if (!$user->userid)
					err($evINVALID_USER);
				if (!$channel)
					err($evBAD_CHANID);
				if (isset($args['username'])) {
					// Get IP address manually
					$args['ip']=getUserIP($args['username']);	
				}
				if (!isset($args['ip']))
					err($evMISSING_ARGS);
				
				// Sanitize the args
				if (isset($args['strict']) and $args['strict']=='remove')
					$args['strict']=NULL;
				else if (!isset($args['strict']))
					$args['strict']='ipnow';
				if (isset($args['until'])) {
					$args['until']=strtotime($args['until']);
					if ($args['until']<=time())
						err($evINVALID_ARGS);	
				} else
					$args['until']=strtotime($kCHANNEL_DEFAULT_BANTIME);
					
				if ($err=$channel->ban($args['ip'],$args['strict'],$args['until'],$args['reason'])) // Error!
					err($evCOULD_NOT_APPLY_BAN);
				
				echo json_encode(array('response'=>$kRESPONSE_SUCCESS,'args'=>$args));
				exit;
			} else if ($request=='chanop') {
				// SetOps for user from a Channel
				if (!$user->userid)
					err($evINVALID_USER);
				if (!$channel)
					err($evBAD_CHANID);
				if (!isset($args['opid']))
					err($evMISSING_ARGS);
				
				$opid=getUserID($args['opid']);
				if (!$opid)
					err($evUNKNOWN_USER);
				
				$optype;
				switch($args['optype']) {
					case 0: $optype='operator'; break;
					case 1: $optype='voice'; break;
					case 2: default: $optype=NULL; break;
				}
				
				if ($err=$channel->setOps($opid,$optype,NULL)) // Error!
					err($err);
					
				echo json_encode(array('response'=>$kRESPONSE_SUCCESS));
				exit;
			} else if ($request=='modify') {
				// Modify a Channel's settings
				if (!$user->userid)
					err($evINVALID_USER);
				if (!$channel)
					err($evBAD_CHANID);
				if (!isset($args['setting']))
					err($evMISSING_ARGS);
				
				if (!isset($args['setting']) or ($args['setting']!='password' and $args['setting']!='topic' and $args['setting']!='moderated' and $args['setting']!='private' and $args['setting']!='autoclear'))
					err($evINVALID_ARGS);
				
				if ($err=$channel->modify($args['setting'],$args['value'])) // Error!
					err($err);
					
				echo json_encode(array('response'=>$kRESPONSE_SUCCESS));
				exit;
			} else if ($request=='whois') {
				// Retrieve information on a given user
				if (!$user->userid)
					err($evINVALID_USER);	
				if (!isset($args['nick']))
					err($evMISSING_ARGS);
					
				$mysqli=getMySQLIi();
				$query=sprintf("SELECT users.nick, users.id AS userid, users.ping, ip_list.ip FROM `users` JOIN `ip_list` ON users.ipid=ip_list.id WHERE users.nick='%s'",
								$mysqli->real_escape_string($args['nick']));
				if (!$result=$mysqli->query($query) or !$whois=$result->fetch_assoc())
					err($evUNKNOWN_USER);
				$result->close();	
					
					
				$whois['channels']=array();
				$query=sprintf("SELECT channels.name FROM `channels` JOIN `userchan` ON channels.id=userchan.chanid JOIN `users` ON userchan.userid=users.id WHERE users.id='%s' AND channels.private=0",$whois['userid']);
				if (!$result=$mysqli->query($query)) {
						
				} else {
					while ($row=$result->fetch_assoc()) {
						array_push($whois['channels'],'#'.$row['name']);	
					}
				}
								
								
				/*$query=sprintf("SELECT users.nick, users.ping, channels.name AS channels, channels.private AS private, ip_list.ip FROM `users` JOIN `userchan` ON users.id=userchan.userid JOIN `channels` ON userchan.chanid=channels.id JOIN `ip_list` ON users.ipid=ip_list.id WHERE users.nick='%s'",
								$mysqli->real_escape_string($args['nick']));
				if (!$result=$mysqli->query($query) or !$whois=$result->fetch_assoc())
					err($evUNKNOWN_OR_HIDDEN_USER);
				$whois['channels']=array($whois['channels']);
				if ($row['private'])
					$whois['channels']=array();
				while ($row=$result->fetch_assoc()) {
					if ($row['private'])
						continue;
					array_push($whois['channels'],$row['channels']);
				}*/
				$result->close();
				$mysqli->close();
				
				//unset($whois['private']);
				echo json_encode(array('response'=>$kRESPONSE_SUCCESS,'whois'=>$whois,'nick'=>$whois['nick'],'userid'=>$whois['userid'],'ping'=>$whois['ping'],'channels'=>implode(', ',$whois['channels'])));
			} else if ($request=='pingchan') {
				// Ping all the provided channels for `userchan`.ping
				if (!$user->userid)
					err($evINVALID_USER);	
				if (!isset($args['channels'])) {
					echo json_encode(array('response'=>$kRESPONSE_SUCCESS,'pinged'=>'0'));
					exit;
				}
					
					
				$mysqli=getMySQLIi();
				$channels='0'; // Simple hack since no chanid=0 exists!
				foreach ($args['channels'] as $chan) {
					$channels.=','.$mysqli->real_escape_string($chan);	
				}
				$query=sprintf("UPDATE `userchan` SET ping=NOW() WHERE userid='%d' AND chanid IN (%s)",
								$user->userid,$channels);
				if (!$result=$mysqli->query($query))
					err(getMysqliError($evMYSQLI,$mysqli));
				$info=$mysqli->info; //affected_rows; NOTE: rows don't always get changed, therefore we check Rows matched instead				
				$mysqli->close();
				
				preg_match("/\\d+/",$info,$matches); // Rows matched: 1  Changed: 1  Warnings: 0
				$channels=$matches[0];
				
				echo json_encode(array('response'=>$kRESPONSE_SUCCESS,'pinged'=>$channels));
			} else if ($request=='whisper') {
				// Send a whisper to somebody
				if (!$user->userid)
					err($evINVALID_USER);	
				if (!isset($args['nick']) or !isset($args['message']))
					err($evMISSING_ARGS);
					
					
				$mysqli=getMySQLIi();
				if (!$result=$mysqli->query(sprintf("SELECT id FROM `users` WHERE nick='%s' LIMIT 1",
						$mysqli->real_escape_string($args['nick']))) or !$row=$result->fetch_assoc())
					err($evUNKNOWN_OR_HIDDEN_USER);
				$result->close();
				$useridrcv=$row['id'];
				if ($useridrcv==$user->userid)
					err($evCANNOT_MESSAGE_SELF);
				
				if (!$result=$mysqli->query(sprintf("INSERT INTO `whispers` (useridsnd,useridrcv,message,timestamp) VALUES ('%d','%d','%s',NOW())",
						$user->userid,$useridrcv,$mysqli->real_escape_string($args['message']))))
						err($getMysqliError($evMYSQLI,$mysqli));
				$mysqli->close();
				
				echo json_encode(array('response'=>$kRESPONSE_SUCCESS));
			}
			
		} else
			ret("No 'request' given!",-1);	
		
	} else
		return; // NOTE: Don't print out anything, this is probably an include from serverside
	
	
	
	
	//	ret
	// 	Return with the given message
	//	
	//	@msg
	//	@error: The error number to return
	// NOTE: This script will return the given error, and immediately
	//			terminate this script
	function ret($msg,$error=NULL) {
		$ret=array('response'=>$GLOBALS[kRESPONSE_ERROR],
					'message'=>$msg);
		if ($error)
			$ret['error']=$error;
		echo json_encode($ret);
		exit;
	}
	
	
	//	err
	//	Return with an error message
	function err($errDetails) {
		ret($errDetails[1],$errDetails[0]);	
	}


/* End of File -- ajax.php */
