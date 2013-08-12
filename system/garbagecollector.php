<?php


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
	require_once "environment.php";
	require_once "utilities.php";
	require_once "channel.php";
	
	
	/********************
		TODO LIST
		
		* 
	
	********************/



/************************************ ADMIN MANAGEMENT AREA BELOW *****************************************/

	// 
	// ..........
	$kMAX_PINGTIME      = "1 MINUTE"; // Max time since last ping before logging out user
	$kMAX_WHISPERTIME   = "1 MONTH";  // Max time for whispers to stay in db
	$kMAX_CLEARTIME     = "2 MINUTE"; // Max time before clearing out auto-clear channels
	$kMAX_RECONNECTTIME = "1 HOUR";   // Max time before clearing the user/chan from `disconnects`
	
	$kNEUTRAL_MODE=FALSE; // TRUE to NOT garbage collect anything, but instead cry out the queries
	
	
	
/************************************ END OF ADMIN MANAGEMENT AREA *****************************************/



$mysqli=getMySQLIi();


///////////////////
//
//  D/C delayed users
/////////////

if (!$result=$mysqli->query(sprintf("SELECT userchan.chanid, userchan.userid, users.nick FROM `userchan` JOIN `users` ON userchan.userid=users.id WHERE userchan.ping<(NOW() + INTERVAL -%s)",$kMAX_PINGTIME))) {
	// Error	
	$err=sprintf("Error finding dc/d users: %s",$mysqli->error);
	echo '<b>'.$err.'</b>';
	mailWarning($err);
}

// Go through EACH pre-D/C user, and D/C them manually from the given channel
if ($result->num_rows) {
	$queryRem="DELETE FROM `userchan` WHERE (";
	$queryLog="INSERT INTO `logs` (chanid,userid,message,type,timestamp) VALUES";
	$queryDC="INSERT INTO `disconnects` (chanid,userid,timestamp) VALUES";
	while ($row=$result->fetch_assoc()) {
		$queryRem.=sprintf("(chanid='%d' AND userid='%d') OR ",$row['chanid'],$row['userid']);
		$queryLog.=sprintf("('%d','%d','%d %d %s','event',NOW()),",$row['chanid'],$row['userid'],$kCHANNEL_EVENT_DC,$row['userid'],$row['nick']);
		$queryDC .=sprintf("('%d','%d',NOW()),",$row['chanid'],$row['userid']);
	}
	$queryRem=substr($queryRem,0,strlen($queryRem)-4).')';
	$queryLog=substr($queryLog,0,strlen($queryLog)-1);
	$queryDC=substr($queryDC,0,strlen($queryDC)-1);
	
	if ($kVERBOSE) {
		echo "D/C all the expired users!<br />".$queryRem."<br />";
		echo "Log all D/C's!<br />".$queryLog."<br />";
		echo "Store all D/C's!<br />".$queryDC."<br />";
	}
	if (!$kNEUTRAL_MODE) {
		if (!$result=$mysqli->query($queryRem) or !$result=$mysqli->query($queryLog) or !$result=$mysqli->query($queryDC)) {
			// Error
			$err=sprintf("Error removing d/c's: %s",$mysqli->error);
			echo '<b>'.$err.'</b>';
			mailWarning($err);
		}
	}
}





///////////////////
//
//  Remove Expired Bans
////////////

if (!$result=$mysqli->query("SELECT bans.chanid, bans.ipid, ip_list.ip FROM `bans` JOIN `ip_list` ON bans.ipid=ip_list.id WHERE until<NOW()")) {
	// Error	
}

// Go through EACH pre-D/C user, and D/C them manually from the given channel
if ($result->num_rows) {
	$queryRem="DELETE FROM `bans` WHERE (";
	$queryLog="INSERT INTO `logs` (chanid,userid,message,type,timestamp) VALUES";
	while ($row=$result->fetch_assoc()) {
		$queryRem.=sprintf("(chanid='%d' AND ipid='%d') OR ",$row['chanid'],$row['ipid']);
		$queryLog.=sprintf("('%d',1,'%d 1 Server %s Ban has reached expiration date','event',NOW()),",$row['chanid'],$kCHANNEL_EVENT_BAN_REMOVE,$row['ip']);
	}
	$queryRem=substr($queryRem,0,strlen($queryRem)-4).')';
	$queryLog=substr($queryLog,0,strlen($queryLog)-1);
	
	if ($kVERBOSE) {
		echo "Remove all expired bans!<br />".$queryRem."<br />";
		echo "Log all ban-expirations!<br/>".$queryLog."<br />";
	}
	if (!$kNEUTRAL_MODE) {
		if (!$result=$mysqli->query($queryRem) or !$result=$mysqli->query($queryLog)) {
			// Error
			$err=sprintf("Error removing bans: %s",$mysqli->error);
			echo '<b>'.$err.'</b>';
			mailWarning($err);
		}
	}
}



///////////////////
//
//  Remove users/channels from `disconnects`
/////////////

if (!$kNEUTRAL_MODE and !$result=$mysqli->query(sprintf("DELETE FROM `disconnects` WHERE timestamp<(NOW() + INTERVAL -%s)",$kMAX_RECONNECTTIME))) {
	// Error
	$err=sprintf("Error removing disconnects: %s",$mysqli->error);
	echo '<b>'.$err.'</b>';
	mailWarning($err);
} else if ($kVERBOSE) {
	echo "Removed all expired disconnects<br />";
}



///////////////////
//
//  Remove Expired Whispers
////////////

if (!$kNEUTRAL_MODE and !$result=$mysqli->query(sprintf("DELETE FROM `whispers` WHERE timestamp<(NOW() + INTERVAL -%s)",$kMAX_WHISPERTIME))) {
	// Error	
	$err=sprintf("Error removing whispers: %s",$mysqli->error);
	echo '<b>'.$err.'</b>';
	mailWarning($err);
} else if ($kVERBOSE) {
	echo "Removed all expired whispers<br />";
}





///////////////////
//
//  Clear Logs from Autoclear-enabled Channels
////////////

if (!$result=$mysqli->query("SELECT id FROM `channels` WHERE autoclear=1")) {
	// Error	
	$err=sprintf("Error finding autoclear-enabled channels: %s",$mysqli->error);
	echo '<b>'.$err.'</b>';
	mailWarning($err);
} else {
	if (!$kNEUTRAL_MODE) {
		$deleteMe=array(); // Array of chanid's
		while ($row=$result->fetch_assoc()) {
			array_push($deleteMe,$row['id']);	
		}
		if (!empty($deleteMe)) {
			$query=sprintf("DELETE FROM `logs` WHERE timestamp<(NOW() + INTERVAL -%s) AND chanid IN (",$kMAX_CLEARTIME);
			foreach($deleteMe as $chanid) {
				$query.=$chanid.',';	
			}
			$query=substr($query,0,strlen($query)-1).')';
			
			if (!$result=$mysqli->query($query)) {
				// Error	
				$err=sprintf("Error removing logs from autoclear-enabled channels: %s",$mysqli->error);
				echo '<b>'.$err.'</b>';
				mailWarning($err);
			} else {
				if ($kVERBOSE)
					echo sprintf("Removed all expired logs (%d) from autoclearing channels<br />",$mysqli->affected_rows);
			}
		}
		
		
	}
}





///////////////////
//
//  Remove Old Channels
////////////

/**
 *  RULES
 *
 *	n messages		last active
 *		< 5			2 days
 *		< 30		1 week
 *		< 100		2 weeks
 *		< 300		3 months
 *		< 20000		12 months
 ***********************************/
 
 // isOldChan
 //	 Check if the given conditions require us to remove the channel
 //
 //	@n: Number of logs/messages from the given channel
 //	@active: Most recent timestamp
 function isOldChan($n, $active) {
	$active=strtotime($active);
	if ($n>20000)
		return FALSE;
	else if (($n<5 and strtotime("2 days ago")>$active) or
			($n<30 and strtotime("1 week ago")>$active) or
			($n<100 and strtotime("2 weeks ago")>$active) or
			($n<300 and strtotime("3 months ago")>$active))
		return TRUE;
	return FALSE;
 }

$query="SELECT COUNT(*) as count, chanid, MAX(timestamp) as timestamp FROM `logs` GROUP BY chanid";
if (!$result=$mysqli->query($query)) {
	// Error
	$err=sprintf("Error selecting logs for old-channel removal: %s",$mysqli->error);
	echo '<b>'.$err.'</b>';
	mailWarning($err);
} else {
	$deleteMe=array(); // Array of chanid's to remove
	while ($row=$result->fetch_assoc()) {
		if (isOldChan($row['count'],$row['timestamp'])) {
			array_push($deleteMe,$row['chanid']);
		}
	}
	$result->close();	
	if (!empty($deleteMe)) {
		$queryDelChan="DELETE FROM `channels` WHERE id IN (";
		$queryDelLogs="DELETE FROM `logs` WHERE chanid IN (";
		foreach($deleteMe as $chanid) {
			$queryDelChan.=$chanid.',';
			$queryDelLogs.=$chanid.',';	
		}
		$queryDelChan=substr($queryDelChan,0,strlen($queryDelChan)-1).')';
		$queryDelLogs=substr($queryDelLogs,0,strlen($queryDelLogs)-1).')';
		
		$query=$queryDelChan.';'.$queryDelLogs;
		$chansRemoved=0;
		$logsRemoved=0;
		if (!$kNEUTRAL_MODE) {
			if (!$mysqli->multi_query($query)) {
				// Error
				$err=sprintf("Error removing old channels: %s",$mysqli->error);
				echo '<b>'.$err.'</b>';
				mailWarning($err);
			} else {
				$result=$mysqli->use_result();
				$chansRemoved=$mysqli->affected_rows;
				if (!$mysqli->next_result()) {
					// Error	
					$err=sprintf("Error removing old channel's logs: %s",$mysqli->error);
					echo '<b>'.$err.'</b>';
					mailWarning($err);
				} else {
					$result=$mysqli->use_result();
					$logsRemoved=$mysqli->affected_rows;
					
					if ($kVERBOSE) {
						echo sprintf("<br/>Successfully Removed Old Channels: (<b>%d</b>) channels removed, (<b>%d</b>) logs removed<br/>",$chansRemoved,$logsRemoved);
					}
				}
			}
		}
	}
	
}






///////////////////
//
//  Garbage Collection Complete
////////////

if ($mysqli)
	$mysqli->close();
if ($kVERBOSE)
	echo "<br /><br /><br />Garbage Collector is now <b>Complete</b>";
