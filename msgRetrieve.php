<?php


/*
 *		Message Retrieval		php/comet (iframe)
 *
 *	Author: JB Braendel
 *
 *	 Comet-based Message Retrieval system for Chatty. Load this script
 *	with a forever-loading hidden iFrame in the main page. This script
 *	will begin an infinite loop to retrieve all the latest messages
 *	for each channel listed in `userchan` for the given user (loaded
 *	from SESSION[identification])
 *
 ****************************************************/


	// DEPENDENCIES
	////////////////
	//session_start();
	$identification=$_GET['identification'];
	if (!$identification)
		exit;
	$_SESSION['identification']=$identification;
	require_once './system/environment.php';
	require_once './system/utilities.php';
	require_once './system/user.php';
	require_once './system/channel.php';
	$user=new User($identification); // The user should be created here automatically -- via. SESSION[identification]
	
	
	/********************
		TODO LIST
		
		* ...
	
	********************/



/************************************ ADMIN MANAGEMENT AREA BELOW *****************************************/


// Control Management
$kSLEEP_TMR=200000; // Sleep time between retrievals
//$kMAX_LOOPS=3000;


//
$kKICK_DETECT_MAXTIME='30 seconds ago';

/************************************ END OF ADMIN MANAGEMENT AREA *****************************************/
?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
</head>
<body>



<!-- General Setup -->
<script type="text/javascript">
	var cmdStation=window.parent.CommandStation;
	var terminal=window.parent.Terminal;
		
	
	// firefox_hack
	//	A simple hack for firefox which adds a blank iframe to the document,
	//	then removes it, forcing firefox to stop its "throbber of death"
	//
	//	usage: call this before/after every output/flush
	var fake_iframe; 
	function firefox_hack() { 
		if (fake_iframe == null){  
			fake_iframe = window.parent.document.createElement('iframe');  
			fake_iframe.style.display = 'none';  
		}  
		window.parent.document.body.appendChild(fake_iframe);  
		window.parent.document.body.removeChild(fake_iframe);
		window.close();
	}
	
	window.parent.setTimeOffset('<?php echo date("G"); ?>');
</script>



<?php
	flush();




	// Get channel message ID's
	//	All your channels start with a default message ID of 0 (NULL), until messages are retrieved,
	//	and get added to this array. This means that upon joining a channel, the first set of messages
	//	will be retrieved through here
	$uChannelIDs=array(); 


	// Select messages within all channels
	$userid=$user->userid;
	if ($userid==NULL) {
		// Not Logged In!
		?>
        <script type="text/javascript">
        cmdStation.autoLogout(false);
        </script>
		<?php
		flush();
		exit;	
	}
	$mysqli=getMySQLIi();
	?><script type="text/javascript">cmdStation.whine("<?php echo "Loaded Comet (message retrieval system)"; ?>");</script><?php flush();
	
	
	
	function fetchWhispers($userid) {
		global $mysqli;
		$query=sprintf("SELECT users.nick, whispers.message, whispers.timestamp FROM `whispers` JOIN `users` ON whispers.useridsnd=users.id WHERE whispers.useridrcv='%d' ORDER BY timestamp DESC; DELETE FROM `whispers` WHERE useridrcv='%d'",$userid,$userid);
		if (!$mysqli->multi_query($query)) {
			?>
			terminal.spitback("<?php echo $mysqli->host_info; ?>");
			<?php
			if ($kVERBOSE) ?>terminal.rcvError(0,<?php echo $GLOBALS[eMYSQLI_QUERY]; ?>,{error:"Error retrieving whispers: <?php echo $query; ?>"});<?php
		} else if (!$result=$mysqli->use_result() or !$result->num_rows) {
			$whispers=array();
			while($row=$result->fetch_assoc()) {
				array_unshift($whispers,$row);
			}
			$result->close();
			$mysqli->next_result();	// Clear the appending query result (from DELETE--otherwise all subsequent queries won't work)
			return $whispers;
		}
		return NULL;
	}
	
	
	function fetchMessages(&$uChannelIDs,$userid) {
		global $mysqli;
		$query=sprintf("SELECT userchan.chanid, logs.id, logs.userid, logs.message, logs.type, logs.timestamp, users.nick FROM `userchan` JOIN `logs` ON userchan.chanid=logs.chanid JOIN `users` ON logs.userid=users.id WHERE userchan.userid='%d'",$userid);
		if (count($uChannelIDs)) {
			$query.=" AND ((logs.chanid NOT IN (";
			$query.=key_implode(',',$uChannelIDs);
			$query.="))";
			foreach($uChannelIDs as $chanid=>$msgid) {
				$query.=" OR (logs.chanid=".$chanid." AND logs.id>".$msgid.")";
			}
			$query.=")";
		}
		$query.=" ORDER BY logs.id DESC";
		
		if (!$result=$mysqli->query($query)) {
			if ($kVERBOSE) ?>terminal.rcvError(0,<?php echo $GLOBALS[eMYSQLI_QUERY]; ?>,{error:"Error retrieving messages: <?php echo $query; ?>"});<?php
		} else if ($result->num_rows) {
			$channels=NULL;
			while($row=$result->fetch_assoc()) {
				if (!isset($channels[$row['chanid']]))
					$channels[$row['chanid']]=array();
				$row['timestamp']=date('Y-m-d g:i:s',strtotime($row['timestamp'])); // Format the timestamp
				array_unshift($channels[$row['chanid']],$row);
				$uChannelIDs[$row['chanid']]=$row['id']; // This is EXPECTED to be overwritten multiple times in this loop, which is okay with ORDER BY
			}
			$result->close();
			return $channels;
		} else {
			return FALSE;
		}
	}
	
	
	function fetchChannels(&$uChannelIDs,$userid) {
		// Setup the uChannelIDs (only add new channels, or remove old channels)
		global $mysqli;
		$query=sprintf("SELECT userchan.chanid, userchan.msgid FROM `userchan` WHERE userchan.userid=%d",$userid);
		if (!$result=$mysqli->query($query)) {
			if ($kVERBOSE) ?>terminal.rcvError(0,<?php echo $GLOBALS[eMYSQLI_QUERY]; ?>,{error:"Error retrieving channels: <?php echo $query; ?>"});<?php
			return $uChannelIDs;
		}
		$_chaninfo=array();
		while ($row=$result->fetch_assoc()) {
			$_chaninfo[$row['chanid']]=$row['msgid'];	
		}
		$result->close();
		
		// Remove left channels
		foreach ($uChannelIDs as $chanid=>$msgid) {
			if (!isset($_chaninfo[$chanid]))
				unset($uChannelIDs[$chanid]);
		}
		// Add joined channels
		foreach ($_chaninfo as $chanid=>$msgid) {
			if (!isset($uChannelIDs[$chanid]) and intval($msgid)>0)
				$uChannelIDs[$chanid]=$msgid;
		}
		
		//$mysqli->close();
	}
	
	
	function detectKicked($chanid,$userid) {
		global $mysqli;
		$kick=FALSE;
		$max_timestamp=date("Y-m-d H:i:s",strtotime($GLOBALS[kKICK_DETECT_MAXTIME]));
		$query=sprintf("SELECT logs.id, logs.message, logs.timestamp, users.nick, channels.name AS channame FROM `logs` JOIN `users` ON logs.userid=users.id JOIN `channels` ON logs.chanid=channels.id WHERE logs.chanid='%d' AND logs.type='event' AND timestamp>'%s' ORDER BY id DESC",
						$chanid,$mysqli->real_escape_string($max_timestamp));
		if (!$result=$mysqli->query($query)) {
			if ($kVERBOSE) ?>terminal.rcvError(0,<?php echo $GLOBALS[eMYSQLI_QUERY]; ?>,{error:"Error detecting kick: <?php echo $query; ?>"});<?php
			return FALSE;
		}
		$evtKick=$GLOBALS[kCHANNEL_EVENT_KICK];
		$evtLeave=$GLOBALS[kCHANNEL_EVENT_LEAVE];
		while ($row=$result->fetch_assoc()) {
			$evt=$row['message'];
			if (starts_with($evt,$evtKick)) {
				// KICK event! Check if this is associated with us
				$evt=substr($evt,strlen($evtKick)+1); // [kickerid] [kickernick] [userid] [msg]
				$evt=substr($evt,strpos($evt,' ')+1); // [kickernick] [userid] [msg]
				$evt=substr($evt,strpos($evt,' ')+1); // [userid] [msg]
				if (starts_with($evt,$userid)) {
					$kick=array();
					$kick['reason']=substr($evt,strlen($userid)+1);
					$kick['nick']=$row['nick'];
					$kick['timestamp']=$row['timestamp'];
					$kick['message']=$row['message'];
					$kick['type']='event';
					$kick['id']=$row['id'];
					$kick['chanid']=$chanid;
					$kick['channame']=$row['channame'];
					break;	
				}
			} else if (starts_with($evt,$evtLeave)) {
				// LEAVE event! Check if this is associated with us	
				$evt=substr($evt,strlen($evtLeave)+1);
				if (starts_with($evt,$userid)) {
					$kick=FALSE;
					break;	
				}
			}
		}
		$result->close();
		return $kick;
	}
	
	
	while(TRUE) {
		// Ping the CommandStation
		?><script type="text/javascript">cmdStation.msgRetrievePong=true;<?php 
		
		
		///////////////////////////////
		//
		// Fetch Whispers
		///////////////////////////////
		
		$whispers=fetchWhispers($userid);
		if ($whispers) {
			echo sprintf("cmdStation.multiRetrieval(%s);",
				json_encode(array('response'=>$kRESPONSE_SUCCESS,'whispers'=>$whispers)));
		}
		
		
		
		
		
		///////////////////////////////
		//
		// Fetch Channels
		///////////////////////////////
		
		
		$prevChannelIDs=$uChannelIDs;
		fetchChannels($uChannelIDs,$userid);
		if ($missing=key_not_in($prevChannelIDs,$uChannelIDs)) {
			// One or more channels have been left
			// Detect whether or not we've been kicked from any of these channels
			foreach ($missing as $chanid) {
				if ($kick=detectKicked($chanid,$userid)) {
					echo sprintf("cmdStation.multiRetrieval(%s);",json_encode(array('response'=>$kRESPONSE_SUCCESS,'channels'=>
						array($chanid=>array($kick))))); // Print kick details for user
				}
			}
		}
		if (!$uChannelIDs) {
			?>firefox_hack(); </script><?php flush();
			usleep($kSLEEP_TMR);
			continue;
		}
		
		
		
		
		
		
		///////////////////////////////
		//
		// Fetch Channel Messages
		///////////////////////////////
		//
		//
		//	Find the latest messages in each channel
		
		$messages=fetchMessages($uChannelIDs,$userid);
		if ($messages) {
			echo sprintf("cmdStation.multiRetrieval(%s);",
				json_encode(array('response'=>$kRESPONSE_SUCCESS,'channels'=>$messages)));	
			?> cmdStation.whine("Messages found!"); <?php
		}
		?> firefox_hack(); </script><?php flush();
		
		usleep($kSLEEP_TMR);
	}
?>


</body>
</html>