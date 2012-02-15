// JavaScript Document

var setFromBottom=function(elem,px){
	var height=$(elem).height();
	$(elem).css({position:'absolute',top:(window.innerHeight-height-px)});
};