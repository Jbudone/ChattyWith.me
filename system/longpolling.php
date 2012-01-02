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
	if (isset($_GET['identification']))
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
	$kRETRIEVAL_SLEEPTMR=400000; // Sleep time between retrieval-attempts
	$kRETRIEVAL_MAXTRIES=10; // Maximum number of tries to retrieve messages before returning (good for D/C's)
	

/************************************ END OF ADMIN MANAGEMENT AREA *****************************************/



	// Retrieve from Multiple Channels
	if (!$user->userid)
		err($evINVALID_USER);
		
	$mysqli=getMySQLIi();
	
	
	
	
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
			echo json_encode(array('response'=>$kRESPONSE_SUCCESS,'channels'=>array()));
			exit;
		}
	} while(--$maxRuns and !usleep($kRETRIEVAL_SLEEPTMR));
	echo json_encode(array('response'=>$kRESPONSE_SUCCESS,'channels'=>array()));
	exit;
				
				
				
				
	
	//	err
	//	Return with an error message
	function err($errDetails) {
		echo json_encode(array('response'=>$kRESPONSE_ERROR,'error'=>$errDetails));
		exit;
	}