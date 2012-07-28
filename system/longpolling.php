<?php

/*
 *		Comet Longpolling			php
 *
 *	Author: JB Braendel
 *
 *	 ChattyWith.me's Comet-based LongPolling Multi-Channel
 *	 request manager. When Longpolling is used as the method
 *	 of message retrieval, this script is called via. JSON,
 *	 providing all the user's identification, along with all of
 *	 the requested channels, and returns any new messages when
 *	 new logs are detected, or after a maximum number of loops,
 *	 (kRETRIEVAL_MAXTRIES)
 *
 ****************************************************/


	// DEPENDENCIES
	////////////////
	if (!isset($_SESSION['identification']) and isset($_GET['identification']))
		$_SESSION['identification']=$_GET['identification'];
	else {
		echo json_encode(array('error'=>"Identification not included in longpoll request"));
		exit;
	}
	require_once "environment.php";
	require_once "utilities.php";
	require_once "channel.php";
	require_once "user.php";
	$user=new User(); // The user should be created here automatically -- via. SESSION[identification]
	
	
	/********************
		TODO LIST
		
		* ...
	
	********************/



/************************************ ADMIN MANAGEMENT AREA BELOW *****************************************/
	
	
	
	// Message Retrieval Control
	$kRETRIEVAL_SLEEPTMR=100000; // Sleep time between retrieval-attempts
	$kRETRIEVAL_MAXTRIES=50; // Maximum number of tries to retrieve messages before returning (good for D/C's)
	

/************************************ END OF ADMIN MANAGEMENT AREA *****************************************/

				
	
	//	err
	//	Return with an error message
	function err($errDetails) {
		echo json_encode(array('response'=>$kRESPONSE_ERROR,'error'=>$errDetails));
		exit;
	}
	
	// Setup the proper query for retrieving the messages from channels
	function getChanQuery(&$mysqli,$chanlist) {
		if (count($chanlist)==0) return NULL;
		$query='SELECT logs.chanid, logs.id, logs.userid, logs.message, logs.type, logs.timestamp, users.nick, 0 as newchan FROM `logs` JOIN `users` ON logs.userid=users.id LIMIT 0'; // A simple hack to allow us to repeatedly use the .='UNION ...' when looping through
																																														// each of the channels; NOTE we must match each of the same columns
		foreach($chanlist as $channel) {
			if ($channel['chanid']=='0') continue;
			$query.=sprintf(" UNION (SELECT logs.chanid, logs.id, logs.userid, logs.message, logs.type, logs.timestamp, users.nick, %d as newchan FROM `logs` JOIN `users` ON logs.userid=users.id WHERE logs.chanid='%d' AND logs.id>'%d' ORDER BY logs.id DESC LIMIT %d)",
							($channel['newchan']),$mysqli->real_escape_string($channel['chanid']),$mysqli->real_escape_string($channel['maxmsgid']),$GLOBALS[kMESSAGE_RETRIEVAL_MAX]);
		}
		return $query.';';
	}
	
	function getUserchanQuery(&$mysqli,$chanlist,$userid) {
		$query="SELECT chanid, msgid FROM `userchan` WHERE userid=".$userid." AND chanid NOT IN (";
		foreach($chanlist as $channel) {
			$query.=$channel['chanid'].',';	
		}
		$query.='0);'; // Minor hack to complete our , delimited query
		return $query;	
	}


	// No User found
	if (!$user->userid)
		err($evINVALID_USER);
	$mysqli=getMySQLIi();
	if (!$mysqli) {
		$_err=$evMYSQLI;
		$_err[1].=': ('.$mysqli->connect_errno.') '.$mysqli->connect_error;
		err($_err);
	}
	
	
	// channels {
	//	channel[] {
	//		.chanid
	//		.msgid
	$chanlist=$_GET['channels']; // NOTE: No channels given? No problem! This will automatically search `usechan` for new channels
	//$ignorelist=$_GET['ignoreChannels']; // In case the user is listed somewhere under `userchan` still (the garbage collector hasn't gotten around to it yet),
										// user will tell us to ignore these channels
	$chan_query=getChanQuery($mysqli,$chanlist);
	$whisper_query=sprintf("SELECT users.nick, whispers.message, whispers.timestamp FROM `whispers` JOIN `users` ON whispers.useridsnd=users.id WHERE whispers.useridrcv='%d' ORDER BY timestamp DESC; ",$user->userid);
	$whisper_del_query=sprintf("DELETE FROM `whispers` WHERE useridrcv='%d'",$user->userid);
	$userchan_query=getUserchanQuery($mysqli,$chanlist,$user->userid);
	$messages_found=array('response'=>$kRESPONSE_SUCCESS);
	$kCALL_ORDER_MESSAGE_QUERIES=array('channels','whispers','userchan');
	$CALL_i=0;
	$time_to_return=FALSE;
	while (!$time_to_return) {
		
		$CALL_i=0;
		$mysqli->multi_query($chan_query.$whisper_query.$userchan_query);
		do {
			if ($res=$mysqli->store_result()) {
				if ($res->num_rows>0) {
					if ($kCALL_ORDER_MESSAGE_QUERIES[$CALL_i]=='channels') {
						// Channel Messages
						$time_to_return=TRUE;
						while ($result=$res->fetch_assoc()) {
							$chanid=$result['chanid'];
							$key=($result['newchan']==1?'newchannels':'channels');
							
							if (!$messages_found[$key]) $messages_found[$key]=array();
							if ($messages_found[$key][$chanid]==NULL) $messages_found[$key][$chanid]=array();
							array_unshift($messages_found[$key][$chanid], $result);
						}
					}
					else if ($kCALL_ORDER_MESSAGE_QUERIES[$CALL_i]=='whispers') {
						// Whisper Messages
						$time_to_return=TRUE;
						$messages_found['whispers']=array();
						while ($result=$res->fetch_assoc()) {
							array_unshift($messages_found['whispers'],$result);
						}
					} 
					else if ($kCALL_ORDER_MESSAGE_QUERIES[$CALL_i]=='userchan') {
						// User Channels
						while ($result=$res->fetch_assoc()) {
							$chanlist[$result['chanid']]=array('chanid'=>$result['chanid'],'maxmsgid'=>$result['msgid'],'newchan'=>1);
						}
						$userchan_query=getUserchanQuery($mysqli,$chanlist,$user->userid);
						$chan_query=getChanQuery($mysqli,$chanlist);
					} 
				}
				$res->free();
				
			} else {
				// store_result error	
				$_err=$evMYSQLI;
				$_err[1].=': ('.$mysqli->connect_errno.') '.$mysqli->connect_error;
				err($_err);
			}
		} while($mysqli->more_results() and $mysqli->next_result() and ++$CALL_i);
		
		//o { if ($res=$mysqli->store_result()) { $result=$res->$fetch_(all|array|assoc|field|fields|object|row); $res->free(); } } while($mysqli->more_results() and $mysqli->next_result());
		usleep($kRETRIEVAL_SLEEPTMR);
		if (!--$kRETRIEVAL_MAXTRIES) break;
	}
	
	if ($messages_found['whispers']) {
		// Delete Whispers from db
		$mysqli->query($whisper_del_query);
	}
	
	$mysqli->close();
	
	echo json_encode($messages_found);
	
	/*
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	// Setup the Channel ID's / MSG ID's
	$channels=array();
	$args=explode(' ',$_GET['args']['args']);
	$i=-1;
	$_chanid=NULL;
	foreach($args as $arg) {
		++$i;
		if ($i%2==0)
			$_chanid=$arg;
		else
			$channels[$_chanid]=$mysqli->real_escape_string($arg);
	}
		
	
	// Multiple Retrieval
	if (!empty($channels))  {
		$query='SELECT logs.chanid, logs.id, logs.userid, logs.message, logs.type, logs.timestamp, users.nick FROM `logs` JOIN `users` ON logs.userid=users.id LIMIT 0';
		foreach($channels as $chanid=>$msgid) {
			$query.=sprintf(" UNION (SELECT logs.chanid, logs.id, logs.userid, logs.message, logs.type, logs.timestamp, users.nick FROM `logs` JOIN `users` ON logs.userid=users.id WHERE logs.chanid='%d' AND logs.id>'%d' ORDER BY logs.id DESC LIMIT %d)",
							$mysqli->real_escape_string($chanid),$msgid,$kMESSAGE_RETRIEVAL_MAX);
			$channels[$chanid]=array();
			$channels[$chanid]['msgid']=$msgid;
			$channels[$chanid]['chanid']=$chanid;
			$channels[$chanid]['messages']=array();
		}
	}
	$maxRuns=$kRETRIEVAL_MAXTRIES;
	do {
	
	
		// Check for Whispers (they take priority)
		$whispers=array();
		if (!$result=$mysqli->query(sprintf("SELECT users.nick, whispers.message, whispers.timestamp FROM `whispers` JOIN `users` ON whispers.useridsnd=users.id WHERE whispers.useridrcv='%d' ORDER BY timestamp DESC",$user->userid))) {
			// ERROR... that sucks, but we're not going to let it ruin the rest of the request
			echo json_encode(array('response'=>$kRESPONSE_SUCCESS,'errwhisper'=>$whispers));
			exit;
		} else if ($result->num_rows) {
			while($row=$result->fetch_assoc()) {
				array_unshift($whispers,$row);
			}
			$result->close();
			$mysqli->query(sprintf("DELETE FROM `whispers` WHERE useridrcv='%d'",$user->userid));
			
			// Return ONLY whispers here, to keep whispers and channel messages separate (for ease and abstraction)
			echo json_encode(array('response'=>$kRESPONSE_SUCCESS,'whispers'=>$whispers));
			exit;
		}
		
	
		// NOTE: YES this is inefficient, but really the only way (non-silly) way that we can handle a situation
		//	where the user is in no channels but still NEEDS to be able to send/receive whispers..
		if (empty($channels)) {
			echo json_encode(array('response'=>$kRESPONSE_SUCCESS,'channels'=>array()));
			exit;
		}
		
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
			$maxRuns=min(array($maxRuns,5));
			continue;
			echo json_encode(array('response'=>$kRESPONSE_SUCCESS,'channels'=>array()));
			exit;
		}
	} while(--$maxRuns and !usleep($kRETRIEVAL_SLEEPTMR));
	echo json_encode(array('response'=>$kRESPONSE_SUCCESS,'channels'=>array()));
	exit;*/