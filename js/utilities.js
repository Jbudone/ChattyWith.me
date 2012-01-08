
// testWordWrap
//	Tests if the CSS property wordwrap exists
/*function testWordWrap() {
	var text='Neque porro quisquam est qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit...';
	var width='10em';
	var container=$('<channel/>').css({ width: width, 'word-wrap':'break-word' }).appendTo($('body')); // 'word-wrap':'break-word'
	var el=$('<span/>').text(text).css({ }).appendTo(container);
	var exists=el.outerWidth()<=width;
	container.remove();
	return exists;
}*/


function getScrollFromBottom() {
	//if (mobileEnabled)
	//	return $('#subconsole').height()-$('.console').height()+consoleScroller.y	
	//else
		return ($('.console .open').height()>$('.console').height())?$('.console .open').height()-$('.console').height()-$('.console').scrollTop():0;	
}


function resize() {
	var absMinHeight=122; // Absolute minimum height before it just becomes silly
	var minHeight=500;
	var minUsrHeight=100;
	
	
	
	
	//
	// HEIGHT
	////////////
	$('.toosmall').css({ display: 'none' });
	if ($(window).height()<absMinHeight) {
		$('header').css({ display: 'none' });
		$('section').css({ display: 'none' });
		$('.toosmall').css({ display: '' });
		return;
	} else if ($(window).height()<minHeight) {
		// Mini-view (netbook or small-screen)
		
		// Hide the unnecessary
		$('section').css({ display: '' });
		$('header').css({ display: 'none' });
		
		
		var height=$(window).height()-10;
		var consoleHeight=height-$('.console').position().top-28;
		$('section').css({
			width: $(window).width(),
			height: (height),
			margin: '0px 0px 0px 0px',
			left: '0px',
		});
		$('.leftpanel').css({ height: '' });
		$('.leftpanelinner').css({ height: '' });
		$('.console').css({ 'height': consoleHeight });
		
		// Firefox doesn't allow edits to css on non-existant keys
		if ($('section').width()!=$(window).width()) {
			$('section').attr('style','width:'+($(window).width())+'px !important; margin:0px 0px 0px 0px; left: 0px');
		}
		
		
		
		
		
		
		// USERS Height (this is completely dynamic, so that it hides the mentions and actions panel
		//	as neccessary..
		$('.mentions').css({ display: '' });
		$('.actions').css({ display: '' });
		var usrHeight=height-$('.users').position().top-20;
		usrHeight-=$('.actions').height();
		if (usrHeight<minUsrHeight) {
			// Hide the mentions first
			$('.mentions').css({ display: 'none' });
			usrHeight+=$('.mentions').height()+5;
			if (usrHeight<minUsrHeight) {
				$('.actions').css({ display: 'none' });
				usrHeight+=$('.actions').height()+5;
			}
		}
		$('.users').css({ height: usrHeight+10 , margin: '0px 0px 0px 0px' });
		
	} else {
		// Normal View
		$('section').css({ display: '' });
		$('header').css({ display: '' });
		$('.mentions').css({ display: '' });
		$('.actions').css({ display: '' });
		
		var height=($(window).height()-$('section').position().top)*0.92;
		var consoleHeight=height-$('.console').position().top-28;
		var usrHeight=height-$('.users').position().top-$('.actions').height()-20;
		
		$('section').css({
				height: height,
				margin: '',
				width: '',
				left: '',
		});
		$('.leftpanel').css({ 'height': height });
		$('.leftpanelinner').css({ 'height': height });
		
		
		$('.console').css({ 'height': consoleHeight });
		$('.users').css({'height': usrHeight, margin: '' });
		
	}
	
	
	
	
	//
	// WIDTH
	////////////
	
	$('.rightpanel').css({ display: '', 'margin-left': '' });
	$('.leftpanelinner').css({ 'margin-right': '' });	
	if ($('.console').width()<350) {
		// Hide the sidebar
		$('.rightpanel').css({ display: 'none', 'margin-left': 0 });
		$('.leftpanelinner').css({ 'margin-right': 10 });	
	}
	
	Terminal.prompt.css({ 'margin-left':0, 'width': $('.leftpanelinner').width()-27 });
}


// setupWinblurDetector
//	Binds to window.blur window.focus to detect if the window is in view or not
function setupWinblurDetector() {
	$(window).bind('blur',function(){ windowOpened=false; });
	$(window).bind('focus',function(){ windowOpened=true; });	
}



// setTimeOffset
//	Set the offset time between server and client
//
//	@srvTime
function setTimeOffset(srvTime) {
	var srvHr=parseInt(srvTime);
	var now=new Date();
	var offset=srvHr-now.getHours();
	if (offset!=0)
		Terminal.printMsg("Server-Client Timezone offset applied: ^12"+(offset>=0?'+':'')+offset+" hours");
	kOFFSET_TIMEFROMSERVER=offset*60*60;
}



// setMenuClearing
//	When ANYTHING else than the usermenu gets clicked the usermenu should close
//	This function sets that for every element in the body
function setMenuClearing() {
	if (!mobileEnabled) {
		$(':not(.usermenu,#emoteButton,#emoteButton img)').each(function(){$(this).bind('click',function(){ Terminal.usermenu.close(); Terminal.colourwin.close(); Terminal.chanmenu.close(); Terminal.emotewin.close(); });});
	}
}


// get_key
//	Returns the first matching value's key in an array
//
//	@arr
//	@val
// return: key/FALSE
function get_key(arr,val) {
	for (var i in arr) {
		if (arr[i]==val)
			return i;	
	}
	return false;
}

// in_array
//	Find if a given key exists within an array
//
//	@arr
//	@key
// return: TRUE/FALSE
function in_array(arr, key) {
	for (var i in arr) {
		if (i===key)
			return true;	
	}
	return false;
}


// exists
//	Find if a given value exists or not
//
//	@val
// return: TRUE/FALSE
function exists(val) {
	if (val===undefined)
		return false;
	return true;
}


// shortenText
//	Shorten a snippet of text width with \n
//
//	@msg
//	@width
// return: Shortened text
//
//	WARNING WARNING WARNING
//	Note: use the shortenTextFunctionInUse variable to check if the helper is currently in use
var shortenTextFunctionInUse=false; // NOTE: Check this variable BEFORE calling the function (to avoid conflicts)
var charWidth=[];
function shorterText(msg,width) {
return msg;
	msg=msg.split('\n');
	var zmsg="";
	for (var i in msg) {
		zmsg+=shortenText(msg[i],width,false);
		zmsg+='\n';
	}
	return zmsg;
}
/*function shortenText(msg,width,inner) {
	var len=0;
	for(var i in msg) {
		if (msg[i]=='^') {
			i+=2; continue;	
		}
		len+=getCharW(msg[i]);
		if (len>width) {
			return msg.substring(0,i)+'\n'+shortenText(msg.substring(i),width);	
		}
	}
	return msg;
}*/
/*function shortenText(msg,width,inner) {
	var len=0;
	for(var i in msg) {
		if (msg[i]=='^') {
			var cont=false;
			try {
				var n1=msg[i+1];
				if (!isNaN(n1) && parseInt(n1)==msg[i+1]) {
					// This is an int, we may skip it
					i+=1;
					cont=true;
					if (n1==1) {
						var n2=msg[i+1];
						if (!isNaN(n2) && parseInt(n2)==msg[i+1]) {
							i+=1;
						}
					}
				}
				continue;
			} catch(e) {
				if (cont) continue;
			}
		}
		len+=getCharW(msg[i]);
		if (len>width) {
			return msg.substring(0,i)+'\n'+shortenText(msg.substring(i),width);	
		}
	}
	return msg;
}*/
function shortenText(msg,width,inner) {
return msg;
	var len=0;
	for (var i=0; i<msg.length; i++) {
		if (msg[i]=='^') {
			var cont=false;
			try {
				var n1=msg[parseInt(i)+1];
				if (!isNaN(n1) && parseInt(n1)==msg[parseInt(i)+1]) {
					// This is an int, we may skip it
					i++;
					cont=true;
					if (n1=='1') {
						var n2=msg[parseInt(i)+1];
						if (!isNaN(n2) && parseInt(n2)==msg[parseInt(i)+1]) {
							i++;
						}
					}
				}
				continue;
			} catch(e) {
				if (cont) continue;
			}
		}
		len+=getCharW(msg[i]);
		if (len>width) {
			return msg.substring(0,i)+'\n'+shortenText(msg.substring(i),width);	
		}
	}
	return msg;
}
function getCharW(chr) {
	return charWidth[chr.charCodeAt(0)];
}
function setupCharW() {
return;
	$('<span/>').addClass('textTester').css({'font-family':'Georgia'}).appendTo('body');
	for (var i=0; i<256; i++) {
		charWidth[i]=$('.textTester').text(String.fromCharCode(i)).width();
	}
}
/*function shortenText(msg,width,inner) {
	shortenTextFunctionInUse=true;
	var textTester=$('span.textTester');
	if (!textTester.hasClass('textTester'))
		textTester=$('<span></span>').addClass('textTester').addClass('message').css({'white-space':'pre'}).appendTo('body');
	textTester.text(msg);
	if (textTester.width()<=width) { shortenTextFunctionInUse=inner; return msg; }
	
	// Find the exact position in which this text surpasses the expected width
	var zmsg="";
	var _msg="";
	var _sub=null;
	for (var j=50,k=0; k<msg.length; k=j,j+=50) {
		_sub=msg.substring(k,j-k);
		if (textTester.text(_msg+_sub).width()>width) {
			for (var i in _sub) {
				textTester
			}
		}
	}
	for (var i in msg) {
		if (msg[i]=='\n') { zmsg+=_msg+'\n'; _msg=""; continue; }
		_msg+=msg[i];
		textTester.text(_msg);
		if (textTester.width()>width) {
			if (i==0) {
				shortenTextFunctionInUse=inner;
				return msg; // Impossible to shorten this text this much
			}
			zmsg+=_msg.substring(0,i);
			zmsg+='\n';
			zmsg+=shortenText(msg.substring(i),width,true);
			shortenTextFunctionInUse=inner;
			return zmsg;
		}
	}
	shortenTextFunctionInUse=inner;
	return msg;
}*/


// join
//	Joins a given array starting from a given index
function join(arr,index) {
	var str="";
	var start=false;
	for (var i in arr) {
		if (!start && i!=index)
			continue;
		else if (!start)
			start=true;
		str+=arr[i]+" ";
	}
	str=str.substring(0,str.length-1);
	return str;
}



function objToStr(object) {
	if (object instanceof Object) {
		var str=" ";
		for(var i in object) {
			str+=i+": "+objToStr(object[i])+"\n ";	
		}
		str=str.substring(0,str.length-2);
		return str;
	} else
		return object;
}




function objMaximize(lObject, remains) {
	
	// Maximize the object (ie. header.outerWidth = document.width)
	lObject.width($('body').width()-(lObject.outerWidth()-lObject.width()));	
	
	// Remains: Onresize = re-maximize object
	if (remains) {
		$(window).resize(function(){
			objMaximize(lObject,false);
		});
	}
}


// objStretchTo: Stretches an object vertically to x distance from the end of the window
//
//   TODO: Make an option to stretch horizontally
//
//		lObject: Object handle
//		lRelative:
//		side:
//		spacing:
//		minsize:
//		remains:
function objStretchTo(lObject, lRelative, side, spacing, minsize, remains) {
	
	// Stretch the object to its destination
	switch(side) {
		case 1:
			//var _height=lRelative.height()-(lObject.position().top)+(lObject.outerHeight(true)-lObject.innerHeight())-spacing;
			var _height=lRelative.height()-(lObject.parent().position().top)-(lObject.outerHeight(true)-lObject.height())-spacing;
			if (!minsize || _height>=minsize)
				lObject.height(_height);
		break;
		case 2:
			var _width=lRelative.width()-(lObject.position().left)+(lObject.outerWidth(true)-lObject.innerWidth())-spacing;
			if (!minsize || _width>=minsize)
				lObject.width(_width);
		break;
		default:
		break;
	}
	
	
	// Remains: Onresize = re-stretch object
	if (remains) {
		$(window).resize(function(){
			objStretchTo(lObject,lRelative,side,spacing,minsize,false);
		});
	}
}