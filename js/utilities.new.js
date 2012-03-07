// JavaScript Document

var setFromBottom=function(elem,px){
	var height=$(elem).height();
	$(elem).css({position:'absolute',top:($(window).height()-height-px)});
};