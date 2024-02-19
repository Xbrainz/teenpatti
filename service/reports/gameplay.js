
var tableId = getUrlParameter('tableId');
console.log(tableId);
var socket,clientId;
var CurrentPlayerPlaying = "no";
var CurrentPlayerJoined = "no";
var JsonTable,JsonAllPlayer,JsonCurrentPlayer;
var iscardseen = false;
var activeplayercount = 0;
var ChaalAmount = 0;
var Myturn = false;
var CurrentAction = "Blind";
var LastBet =0;
var BlindCount =0;
var SideShowPlaceTo, SideShowPlaceBy;
var arrowInterval;
var SendTipAmount = "";
let ContiuesPacked = 0;
var myTimeout;

let reconnectNo = 0;

var isreconnect = false;
function myGreeting() {
  document.getElementById("demo").innerHTML = "Happy Birthday to You !!"
}

function sitHere(ee){
    console.log(ee);
    var bet_amt = $('#bet_amt').text();
    console.log("ddddd:",bet_amt);
   
    var jsonforsend =  new Object();
    jsonforsend.userId =  readCookie('userId');
    jsonforsend.tableId = getUrlParameter('tableId');
    jsonforsend.userName = readCookie('userName');
    jsonforsend.clientId = clientId;
    jsonforsend.sit = ee;
    jsonforsend.chips = readCookie('chips');
 
     socket.emit("joinTable", jsonforsend);
     console.log("Emit joinTable " , jsonforsend);

    $("#sit_box_p1,#sit_box_p2,#sit_box_p3,#sit_box_p4,#sit_box_p5").addClass("custom_hidden"); 

    $(".js_alert_main").html('<div class="alert alert-danger text-center fade show animated bounceIn toaster" style="font-weight:600" role="alert">Joining Table...</div>');

    setTimeout(function() {
        $(".js_alert_main").html("");
    }, 2000);

    $('.js_standup').removeAttr('disabled');
    $('.js_standup').text('Stand Up');

}

function ClickSendTip()
{

    var SendTipAmount = $("#tip_slider").val();

    if(SendTipAmount >=  $("#coin_p3").val())
    {  
       

    }else{

        console.log("TIP:",SendTipAmount);
        var jsonforsend =  new Object();
    
        jsonforsend.tip =  SendTipAmount;
        jsonforsend.tableId = getUrlParameter('tableId');
        jsonforsend.fromId = $("#id_p3").val();
        jsonforsend.players = JsonAllPlayer;
        jsonforsend.player = JsonCurrentPlayer;
        jsonforsend.current = JsonCurrentPlayer;

        socket.emit("TipToGirl", jsonforsend);
        console.log("Emit TipToGirl " , jsonforsend);
    }

}

function ClickViewAllCard()
{
   
    var jsonforsend =  new Object();
    jsonforsend.players = JsonAllPlayer;
    jsonforsend.table = JsonTable;
    jsonforsend.tableId = JsonTable._id;
    // jsonforsend.current = JsonCurrentPlayer;
     
    socket.emit("seeAllCards", jsonforsend);
    console.log("emit seeAllCards ",  jsonforsend);
   
}

function ClickBetPlace()
{
    ContiuesPacked = 0;
    $("#Bottom_menu,#Bottom_menu2").addClass("custom_hidden");
    Myturn = false;
    if(activeplayercount ==2 && ChaalAmount >=  $("#coin_p3").val())
    {  
        ClickShow();

    }else{

        if(ChaalAmount >=  $("#coin_p3").val())
        {
            //insufficient coin
            ClickPack();
        }else{
            var jsonforsend =  new Object();
            jsonforsend.players = JsonAllPlayer;
            jsonforsend.player = JsonCurrentPlayer;
            jsonforsend.tableInfo = JsonTable;
                var jsonforsendChild =  new Object();
                jsonforsendChild.action = CurrentAction;
                jsonforsendChild.amount = ChaalAmount;
                jsonforsendChild.show = false;
                jsonforsendChild.tableId = JsonTable._id;
                if(iscardseen)
                    jsonforsendChild.blind = false;
                else
                {
                    BlindCount++;
                    jsonforsendChild.blind = true;
                }
                   
            jsonforsend.bet = jsonforsendChild;
            socket.emit("placeBet", jsonforsend);
            console.log("Emit placeBet ",  jsonforsend);
        }

      

    }
    
}

function ClickPack()
{
    ContiuesPacked++;
    $("#Bottom_menu,#Bottom_menu2").addClass("custom_hidden");
    Myturn = false;
    CurrentAction = "Packed";
    var jsonforsend =  new Object();
    jsonforsend.players = JsonAllPlayer;
    jsonforsend.player = JsonCurrentPlayer;
    jsonforsend.tableId = JsonTable._id;
    jsonforsend.table = JsonTable;
        var jsonforsendChild =  new Object();
        jsonforsendChild.action = CurrentAction;
        jsonforsendChild.amount = ChaalAmount;
        jsonforsendChild.show = false;
        jsonforsendChild.tableId = JsonTable._id;
        if(iscardseen)
            jsonforsendChild.blind = false;
        else
            jsonforsendChild.blind = true;
    jsonforsend.bet = jsonforsendChild;
    socket.emit("placePack", jsonforsend);
    console.log("Emit placePack ",  jsonforsend);

    if(ContiuesPacked ==3)
    {
        setTimeout(() => { goBack(); }, 100);
    }
   
    // $("#box_p5").removeClass("packed");
}

function ClickShow()
{
    ContiuesPacked = 0;
    $("#Bottom_menu,#Bottom_menu2").addClass("custom_hidden");
    Myturn = false;
    var jsonforsend =  new Object();
    jsonforsend.players = JsonAllPlayer;
    jsonforsend.player = JsonCurrentPlayer;
    jsonforsend.tableInfo = JsonTable;
        var jsonforsendChild =  new Object();
        jsonforsendChild.action = CurrentAction;
        jsonforsendChild.amount = ChaalAmount;
        jsonforsendChild.show = true;
        jsonforsendChild.tableId = JsonTable._id;
       
            jsonforsendChild.blind = false;
     
    jsonforsend.bet = jsonforsendChild;
    socket.emit("placeBet", jsonforsend);
    console.log("Emit placeBet ",  jsonforsend);
}

function ClickPlus()
{
    var plus = parseInt($("#bet_amt").text());
    var plus = plus+plus;

    
    $("#bet_amt").text(plus);

    ChaalAmount = plus;

    
    if(LastBet < parseInt(ChaalAmount) )
    {
     
    $("#btn_plus").addClass("packed");
    $("#btn_minus").removeClass("packed");
    var maxbett = JsonTable.maxBet;
    if(CurrentAction == "Blind")
    maxbett = JsonTable.maxBet/2;
    if((ChaalAmount +  parseInt($("#bet_amt").text()) >= maxbett))
    {
        $("#btn_plus").addClass("packed");
    }
    }

}

function ClickMinus()
{
    var minus = parseInt($("#bet_amt").text());
    var minus = minus/2;
    $("#bet_amt").text(minus);
    ChaalAmount = minus;
    if(LastBet == parseInt(ChaalAmount))
    {
     
      $("#btn_plus").removeClass("packed");
        $("#btn_minus").addClass("packed");
        var maxbett = JsonTable.maxBet;
        if(CurrentAction == "Blind")
        maxbett = JsonTable.maxBet/2;
        if((ChaalAmount +  parseInt($("#bet_amt").text()) >= maxbett))
        {
            $("#btn_plus").addClass("packed");
        }
    }

}

function SeeMyCard()
{
    iscardseen = true;
    CurrentAction = "Chaal";
    $("#btn_blindchaaltext").text(CurrentAction);
    var jsonforsend =  new Object();
    jsonforsend.players = JsonAllPlayer;
    jsonforsend.player = JsonCurrentPlayer;
    jsonforsend.table = JsonTable;
    jsonforsend.tableId = JsonTable._id;
    jsonforsend.current = JsonCurrentPlayer;
     
    socket.emit("seeMyCards", jsonforsend);
    console.log("emit seeMyCards ",  jsonforsend);
    $(".seebtn").attr("hidden","hidden");
}

function ClickStandUp()
{
    var jsonforsend =  new Object();
    jsonforsend.userId =  readCookie('userId');
    jsonforsend.tableId = getUrlParameter('tableId');
    jsonforsend.userName = readCookie('userName');
    jsonforsend.clientId = clientId;
    jsonforsend.chips = readCookie('chips');
    $(".tip-div").hide();
 
     socket.emit("standUp", jsonforsend);
     console.log("Emit standUp " , jsonforsend);
    $('.js_standup').attr('disabled','disabled');
    $('.js_standup').text('Please Wait...');
    
}

function ClicksideshowPressed()
{
    $("#Bottom_menu,#Bottom_menu2").addClass("custom_hidden");
    Myturn = false;
    if(ChaalAmount >=  $("#coin_p3").val())
    {
        //insufficient coin
        ClickPack();
    }else{
        var jsonforsend =  new Object();
        jsonforsend.players = JsonAllPlayer;
        jsonforsend.player = JsonCurrentPlayer;
        jsonforsend.table = JsonTable;
        jsonforsend.tableId = JsonTable._id;
        jsonforsend.placeTo = SideShowPlaceTo;

            var jsonforsendChild =  new Object();
            jsonforsendChild.amount = ChaalAmount;
            jsonforsendChild.blind = false;
        
        jsonforsend.bet = jsonforsendChild;
        socket.emit("placeSideShow", jsonforsend);
        console.log("Emit placeSideShow ",  jsonforsend);
    }

}

function sideshowAccept()
{
    $('#sideshow_modal').modal('hide');
    var jsonforsend =  new Object();
    jsonforsend.players = JsonAllPlayer;
    jsonforsend.player = JsonCurrentPlayer;
    jsonforsend.table = JsonTable;
    jsonforsend.tableId = JsonTable._id;
    jsonforsend.placedTo = SideShowPlaceBy;
    jsonforsend.lastAction = "Accepted";
        var jsonforsendChild =  new Object();
        jsonforsendChild.amount = ChaalAmount;
        jsonforsendChild.blind = false;
        jsonforsendChild.lastAction = "Accepted";
    
    jsonforsend.bet = jsonforsendChild;
    socket.emit("respondSideShow", jsonforsend);
    console.log("Emit respondSideShow ",  jsonforsend);
}

function sideshowDecline()
{
    $('#sideshow_modal').modal('hide');
    var jsonforsend =  new Object();
    jsonforsend.players = JsonAllPlayer;
    jsonforsend.player = JsonCurrentPlayer;
    jsonforsend.table = JsonTable;
    jsonforsend.tableId = JsonTable._id;
    jsonforsend.placedTo = SideShowPlaceBy;
    jsonforsend.lastAction = "Denied";
        var jsonforsendChild =  new Object();
        jsonforsendChild.amount = ChaalAmount;
        jsonforsendChild.blind = false;
        jsonforsendChild.lastAction = "Denied";
    
    jsonforsend.bet = jsonforsendChild;
    socket.emit("respondSideShow", jsonforsend);
    console.log("Emit respondSideShow ",  jsonforsend);
}
function timeoutClear() {
    $(".countdown_new").removeClass("startTimer");
    ClickPack();
}

// Turn Timer
function turnTrue(whichTurn){
    var angle = 0;
    var p1_turn,p2_turn,p3_turn,p4_turn,p5_turn = false;

    console.log("turntrue",whichTurn);
    $(".countdown_new").removeClass("startTimer");
    clearTimeout(myTimeout);


    if(whichTurn == "p1_turn"){ 
        p1_turn = true; 
        $(".turntimer1").addClass("startTimer");    
    }
    if(whichTurn == "p2_turn"){
        p2_turn = true; 
        $(".turntimer2").addClass("startTimer");    
    }
    if(whichTurn == "p3_turn"){
        p3_turn = true; 
        $(".turntimer3").addClass("startTimer");
        myTimeout = setTimeout(timeoutClear, 15000);
    }
    if(whichTurn == "p4_turn"){
        p4_turn = true; 
        $(".turntimer4").addClass("startTimer");
    }
    if(whichTurn == "p5_turn"){
        p5_turn = true; 
        $(".turntimer5").addClass("startTimer");
    }

    
    // clearInterval(arrowInterval);

    // arrowInterval = setInterval(function(){
    
    //     if(whichTurn == "p1_turn"){
    //         console.log("pl_true",p1_turn);
    //         $(".countdown_new").removeClass("startTimer");
    //     }
    //     if(whichTurn == "p2_turn"){
    //         console.log("p2_true",p2_turn);
    //         $('.conic2').removeClass("custom_hidden");
    //         document.querySelector('.conic2').style.setProperty('--angle', ++angle + "deg");
    //         if (angle === 360) {    angle = 0 ; };
    //     }
    //     if(whichTurn == "p3_turn"){
    //         console.log("p3_turn",p3_turn);
    //         $('.conic3').removeClass("custom_hidden");
    //         document.querySelector('.conic3').style.setProperty('--angle', ++angle + "deg");
    //         if (angle === 360) {
    //             angle = 0 ;
    //             ClickPack();
    //         };

    //     }
    //     if(whichTurn == "p4_turn"){
    //         console.log("p4_turn",p4_turn);
    //         $('.conic4').removeClass("custom_hidden");
    //         document.querySelector('.conic4').style.setProperty('--angle', ++angle + "deg");
    //         if (angle === 360) {    angle = 0 ; };
    //     }
    //     if(whichTurn == "p5_turn"){
    //         console.log("p5_turn",p5_turn);
    //         $('.conic5').removeClass("custom_hidden");
    //         document.querySelector('.conic5').style.setProperty('--angle', ++angle + "deg");
    //         if (angle === 360) {    angle = 0 ; };
    //     }
    // }, 36);
    

}
function getRandomColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}
function randomHsl() {
    return 'hsla(' + (Math.random() * 360) + ', 100%, 50%, 0.3)';
}

function changeDealer(e,req_dealer) {
    
    $('.dealer-girl-img').attr("src","images/dealers/dealer-"+req_dealer+".webp");

    var imgLarge = new Image();
    imgLarge.src = "images/dealers/dealer-"+req_dealer+".webp"; 
    $(".dealer-girl").addClass("dealer_loading");
    imgLarge.onload = function () {
      $(".dealer-girl").removeClass("dealer_loading");
    };
  
    if($(e).hasClass("selected") == true){
        console.log("currentttt");
        $("#dealerPopup").modal("hide");
        $('.dealer_ul li').removeClass("selected");
        $(e).addClass("selected");
    }else{
        console.log("others");
        $("#dealerPopup").modal("hide");
        $('.dealer_ul li').removeClass("selected");
        $(e).addClass("selected");

        var jsonforsend =  new Object();
    
        jsonforsend.delear =  Math.round(parseInt(JsonTable.boot) /2);
        jsonforsend.tableId = getUrlParameter('tableId');
        jsonforsend.fromId = readCookie('userId');
        
        socket.emit("ChangeDelar", jsonforsend);
        console.log("Emit ChangeDelar " , jsonforsend);
    
    }



    
}
function imgError(image) {
    image.onerror = "";
    image.src = "images/dealers/no-dealer.png";
    return true;
}

function dealerPopup() {
    $('.dealer_ul').html("");

    setTimeout(() => {
        for(var i=1;i<=6;i++){
            var selected_class = "";
            if(i==1){ selected_class = "selected"; }
            $('.dealer_ul').append('<li\
                onclick=changeDealer(this,"'+i+'")\
                class="'+selected_class+'"\
            >\
                <div class="key">\
                    <span class="bg" style="background-color:'+randomHsl()+'"></span>\
                    <img \
                        src="images/dealers/thumb/d-thumb-'+i+'.webp" \
                        data-src="images/dealers/dealer-'+i+'.webp" \
                        class="img-fluid" alt="" \
                    />\
                    <input type="hidden" value="images/dealers/dealer-'+i+'.webp" class="images" />\
                </div>\
                <div class="val"><img src="images/coin.png" width="15" class="mr-1"><span class="text">---</span></div>\
            </li>');
        }
    }, 100);
    
}

$(document).ready(function(){
    tableInfoPopup();
    dealerPopup();
    
    $(".cardanimation").attr("hidden","hidden");
    // $(".conic").addClass("custom_hidden");
    $(".countdown_new").removeClass("startTimer");

  /*  socket = io.connect(socket_url,{
        'reconnection': true,
        'reconnectionDelay': 50000,
        'reconnectionAttempts': 10000
		
    });
	*/
	
	 socket = io.connect(socket_url,{
       'reconnection': true,
        'reconnectionDelay': 1000,
        'reconnectionAttempts': 4,
		 'reconnectionDelayMax': 5000
		
    });
	
	
	socket.on("connect", () => {
   console.log("connect",socket.connected); // true
   
   
 
   if(!isreconnect)
   {
      var jsonforsend =  new Object();
     
         socket.emit("connectttt", jsonforsend);
		 console.log("false reconnecttt....");
   }else
   {
    
 
   }
   
    var jsonforsend =  new Object();
	   jsonforsend.tableId = getUrlParameter('tableId');
	    jsonforsend.userId = readCookie('userId');
	 socket.emit("reconnectt", jsonforsend);
  	});

 socket.on('connectionSuccess', function(data) {
    console.log("On connectionSuccess : " , data);
    clientId = data.id;

 //   $("#box_p3 #name_p3").text(data.id);
  //  example("xyz");

    // $("#box_p5").attr("hidden","hidden");
    // $("#box_p5").removeAttr("hidden","hidden");
   // $("#box_p5").addClass("custom_hidden");
    // $("#box_p5").removeClass("custom_hidden");
   // turnTrue("p2_turn");

    if(readCookie('userId') == ""){
        $("#sit_box_p1,#sit_box_p2,#sit_box_p3,#sit_box_p4,#sit_box_p5").addClass("custom_hidden"); 
    }else{
        var jsonforsend =  new Object();
        jsonforsend.userId =  readCookie('userId');
        jsonforsend.tableId = getUrlParameter('tableId');
        jsonforsend.userName = readCookie('userName');
        jsonforsend.clientId = data.id;
        jsonforsend.chips = readCookie('chips');
     
         socket.emit("watchTable", jsonforsend);
    
    }


});



socket.on("connect_error", (err) => {
  
    console.log("connect_error");
    $(".js_alert_main").html('<div class="alert alert-danger text-center fade show animated bounceIn toaster" style="font-weight:600" role="alert">Server Error</div>');

/*
    CurrentPlayerPlaying = "no";
    CurrentPlayerJoined = "no";
    $("#box_p1").addClass("custom_hidden"); $("#box_p2").addClass("custom_hidden"); $("#box_p3").addClass("custom_hidden"); $("#box_p4").addClass("custom_hidden"); $("#box_p5").addClass("custom_hidden");
  
    $("#sit_box_p1").removeClass("custom_hidden"); $("#sit_box_p2").removeClass("custom_hidden"); $("#sit_box_p3").removeClass("custom_hidden"); $("#sit_box_p4").removeClass("custom_hidden"); $("#sit_box_p5").removeClass("custom_hidden");

*/

    setTimeout(function() {
        $(".js_alert_main").html("");
    }, 3000);

});

 
 socket.on("disconnect", () => {
  console.log("disconnect",socket.connected); // false
  
 
 // socket.io.reconnect();
 
/* CurrentPlayerPlaying = "no";
  CurrentPlayerJoined = "no";
  $("#box_p1").addClass("custom_hidden"); $("#box_p2").addClass("custom_hidden"); $("#box_p3").addClass("custom_hidden"); $("#box_p4").addClass("custom_hidden"); $("#box_p5").addClass("custom_hidden");

  $("#sit_box_p1").removeClass("custom_hidden"); $("#sit_box_p2").removeClass("custom_hidden"); $("#sit_box_p3").removeClass("custom_hidden"); $("#sit_box_p4").removeClass("custom_hidden"); $("#sit_box_p5").removeClass("custom_hidden");


*/
 });

socket.io.on("reconnect_attempt", () => {
    console.log("reconnect_attemp");
	// socket.io.reconnect();
	
	
   

	
});

socket.io.on("reconnect", () => {
    console.log("reconnect");
	//socket.io.reconnect();
	isreconnect = true;
	reconnectNo++;
	
	if(reconnectNo==4)
	{
		console.log("backtolobby");
		goBack();
	}
});


socket.on('reconnectttt', function(data) {
    console.log("On reconnectttt : " , data);

    $("#table_amount").text(data.table.amount);
    
   // SideShowPlaceTo = data.placedBy;
    var otherPlayers = data.table.players;
    var issideshow = 0;
    activeplayercount = 0;
  
    for (var key in otherPlayers)
    {
     
        if( otherPlayers[key].active == true && otherPlayers[key].packed == false &&  otherPlayers[key].idle == false )
        activeplayercount++;

      

        if($("#slot_p1").val() == otherPlayers[key].slot)
        {
          if(otherPlayers[key].turn == true)
            {
                turnTrue("p1_turn");
            }
        }else  if($("#slot_p2").val() == otherPlayers[key].slot)
        {
             if(otherPlayers[key].turn == true)
            {
                turnTrue("p2_turn");
            }
        }else if($("#slot_p3").val() == otherPlayers[key].slot)
        {
            console.log(CurrentPlayerPlaying + "   curentplayerplying");
            if(CurrentPlayerPlaying=="yes" && otherPlayers[key].active == true && otherPlayers[key].turn == true)
            {
                Myturn = true;
             //   console.log("hid...." ,otherPlayers[key].turn);
                JsonCurrentPlayer = otherPlayers[key];
              
                if(otherPlayers[key].isSideShowAvailable == true )
                issideshow =1;
            }
            if(CurrentPlayerPlaying=="yes")
            {
                $("#name_p3").text(otherPlayers[key].playerInfo.chips);
            }
        }else  if($("#slot_p4").val() == otherPlayers[key].slot)
        {
            if(otherPlayers[key].turn == true)
            {
                turnTrue("p4_turn");
            }
        }else if($("#slot_p5").val() == otherPlayers[key].slot)
        {
            if(otherPlayers[key].turn == true)
            {
                turnTrue("p5_turn");
            }
        }

    }


    if(Myturn && CurrentPlayerPlaying =="yes" && JsonTable.gameType != 1)
    {
        $("#Bottom_menu,#Bottom_menu2").removeClass("custom_hidden");
        turnTrue("p3_turn");

        $("#btn_sideshow").addClass("custom_hidden");
        $("#btn_show").addClass("custom_hidden");

        if(activeplayercount ==2)
        {
            $("#btn_show").removeClass("custom_hidden");
        }else{
            console.log("Sideshowwwww..............actie.." + activeplayercount);
            if(issideshow ==1 && CurrentAction == "Chaal")
            {
                console.log("Sideshowwwww................");
                $("#btn_sideshow").removeClass("custom_hidden");
            }
        }

        LastBet = data.table.lastBet;
        
        $("#btn_blindchaaltext").text(CurrentAction);
      

        if(data.table.lastBlind == true)
        {
            if(CurrentAction == "Chaal")
            {
                LastBet= LastBet + LastBet;
            }
        }else{
            if(CurrentAction == "Blind")
            {
                var minus = LastBet /2;
                LastBet = LastBet - minus;
            }
        }

        ChaalAmount = LastBet;
        $("#bet_amt").text(ChaalAmount);
     
        
        $("#btn_plus").removeClass("packed");
        $("#btn_minus").addClass("packed");
        var maxbett = JsonTable.maxBet;
        if(CurrentAction == "Blind")
        maxbett = JsonTable.maxBet/2;
        if((ChaalAmount +  parseInt($("#bet_amt").text()) >= maxbett))
        {
            $("#btn_plus").addClass("packed");
        }


       
    }

});





socket.on('watchTable', function(data) {
    console.log("On watchTable : " , data);

    $("#slot_p3").val("slot3");
    $("#slot_p4").val("slot4");
    $("#slot_p5").val("slot5");
    $("#slot_p1").val("slot1");
    $("#slot_p2").val("slot2");

    $("#id_p1").val(""); $("#id_p2").val(""); $("#id_p3").val(""); $("#id_p4").val(""); $("#id_p5").val("");

    $("#box_p1").addClass("custom_hidden"); $("#box_p2").addClass("custom_hidden"); $("#box_p3").addClass("custom_hidden"); $("#box_p4").addClass("custom_hidden"); $("#box_p5").addClass("custom_hidden");

  
    var otherPlayers = data.players;
    JsonTable = data.table;
    $(".dealer_ul .val .text").text(Math.round(parseInt(JsonTable.boot) /2));

    for (var key in otherPlayers)
    {
        console.log(otherPlayers[key].slot + "  " + $("#slot_p4").val() );
        if($("#slot_p1").val() == otherPlayers[key].slot)
        {
            $("#box_p1").removeClass("custom_hidden");
            $("#id_p1").val(otherPlayers[key].id);
            $("#sit_box_p1").addClass("custom_hidden");
            $("#name_p1").text(getDotDotName(otherPlayers[key].playerInfo.displayName));

            if(otherPlayers[key].cardSeen)
                $("#action_p1").text("Seen");
            else
                $("#action_p1").text("Blind");

        }else  if($("#slot_p2").val() == otherPlayers[key].slot)
        {
            $("#box_p2").removeClass("custom_hidden");
            $("#id_p2").val(otherPlayers[key].id);
            $("#sit_box_p2").addClass("custom_hidden");
            $("#name_p2").text(getDotDotName(otherPlayers[key].playerInfo.displayName));

            if(otherPlayers[key].cardSeen)
            $("#action_p2").text("Seen");
        else
            $("#action_p2").text("Blind");
        }else if($("#slot_p3").val() == otherPlayers[key].slot)
        {
            console.log("hid.................")
            $("#box_p3").removeClass("custom_hidden");
            $("#id_p3").val(otherPlayers[key].id);
            $("#sit_box_p3").addClass("custom_hidden");
            $("#name_p3").text(getDotDotName(otherPlayers[key].playerInfo.displayName));


            if(otherPlayers[key].cardSeen)
            $("#action_p3").text("Seen");
        else
            $("#action_p3").text("Blind");

        }else  if($("#slot_p4").val() == otherPlayers[key].slot)
        {
            $("#box_p4").removeClass("custom_hidden");
            $("#id_p4").val(otherPlayers[key].id);
            $("#sit_box_p4").addClass("custom_hidden");
            $("#name_p4").text(getDotDotName(otherPlayers[key].playerInfo.displayName));


            if(otherPlayers[key].cardSeen)
            $("#action_p4").text("Seen");
        else
            $("#action_p4").text("Blind");
        }else if($("#slot_p5").val() == otherPlayers[key].slot)
        {
            $("#box_p5").removeClass("custom_hidden");
            $("#id_p5").val(otherPlayers[key].id);
            $("#sit_box_p5").addClass("custom_hidden");
            $("#name_p5").text(getDotDotName(otherPlayers[key].playerInfo.displayName));
            if(otherPlayers[key].cardSeen)
            $("#action_p5").text("Seen");
        else
            $("#action_p5").text("Blind");
        }

    }


});


socket.on('EndGame', function(data) {
    console.log("On EndGame : " , data);
  if(data.id ==  $("#id_p3").val() && CurrentPlayerPlaying == "yes")
  {

    ClickPack();
    setTimeout(() => { goBack(); }, 100);
    // back to lobby
  }
   //back to lobbyy

});


socket.on('standUp_Own', function(data) {
    console.log("On standUp_Own : " , data);
    $('#setting_popup').modal('hide');
    $('.js_standup').text('Stand Up');
    $(".seebtn").attr("hidden","hidden");
    $("#Bottom_menu,#Bottom_menu2").addClass("custom_hidden");
    CurrentPlayerPlaying = "no";
    CurrentPlayerJoined = "no";
    $("#slot_p3").val("slot3");
    $("#slot_p4").val("slot4");
    $("#slot_p5").val("slot5");
    $("#slot_p1").val("slot1");
    $("#slot_p2").val("slot2");

    $("#id_p1").val(""); $("#id_p2").val(""); $("#id_p3").val(""); $("#id_p4").val(""); $("#id_p5").val("");

    $("#box_p1").addClass("custom_hidden"); $("#box_p2").addClass("custom_hidden"); $("#box_p3").addClass("custom_hidden"); $("#box_p4").addClass("custom_hidden"); $("#box_p5").addClass("custom_hidden");

    $("#sit_box_p1").removeClass("custom_hidden"); 
    $("#sit_box_p2").removeClass("custom_hidden");
    $("#sit_box_p3").removeClass("custom_hidden");
    $("#sit_box_p4").removeClass("custom_hidden");
    $("#sit_box_p5").removeClass("custom_hidden");
  
    var otherPlayers = data.players;
 
    for (var key in otherPlayers)
    {
        console.log(otherPlayers[key].slot + "  " + $("#slot_p4").val() );
        if($("#slot_p1").val() == otherPlayers[key].slot)
        {
            $("#box_p1").removeClass("custom_hidden");
            $("#id_p1").val(otherPlayers[key].id);
            $("#sit_box_p1").addClass("custom_hidden");
            $("#name_p1").text(getDotDotName(otherPlayers[key].playerInfo.displayName));
        }else  if($("#slot_p2").val() == otherPlayers[key].slot)
        {
            $("#box_p2").removeClass("custom_hidden");
            $("#id_p2").val(otherPlayers[key].id);
            $("#sit_box_p2").addClass("custom_hidden");
            $("#name_p2").text(getDotDotName(otherPlayers[key].playerInfo.displayName));
        }else if($("#slot_p3").val() == otherPlayers[key].slot)
        {
            console.log("hid.................")
            $("#box_p3").removeClass("custom_hidden");
            $("#id_p3").val(otherPlayers[key].id);
            $("#sit_box_p3").addClass("custom_hidden");
            $("#name_p3").text(getDotDotName(otherPlayers[key].playerInfo.displayName));
        }else  if($("#slot_p4").val() == otherPlayers[key].slot)
        {
            $("#box_p4").removeClass("custom_hidden");
            $("#id_p4").val(otherPlayers[key].id);
            $("#sit_box_p4").addClass("custom_hidden");
            $("#name_p4").text(getDotDotName(otherPlayers[key].playerInfo.displayName));
        }else if($("#slot_p5").val() == otherPlayers[key].slot)
        {
            $("#box_p5").removeClass("custom_hidden");
            $("#id_p5").val(otherPlayers[key].id);
            $("#sit_box_p5").addClass("custom_hidden");
            $("#name_p5").text(getDotDotName(otherPlayers[key].playerInfo.displayName));
        }

    }



});


socket.on('allCards', function(data) {
    console.log("On allCards : " , data);


  //  var otherPlayers = data[];
 
    for (var key in data)
    {

        console.log(data[key][1] + "  "  );

        var cardss =data[key][1];
        if(data[key][0].slot == $("#slot_p1").val() )
        {
            for(var i = 1; i<4; i++)
            {
                var card_dynamic = "player1_cards li:nth-child("+i+") img";
                CardDeck1(cardss["cards"][(i-1)]["type"],cardss["cards"][(i-1)]["name"] , card_dynamic);
            }
        }else  if(data[key][0].slot == $("#slot_p2").val() )
        {
            for(var i = 1; i<4; i++)
            {
                var card_dynamic = "player2_cards li:nth-child("+i+") img";
                CardDeck1(cardss["cards"][(i-1)]["type"],cardss["cards"][(i-1)]["name"] , card_dynamic);
            }
        }else  if(data[key][0].slot == $("#slot_p3").val() )
        {
            for(var i = 1; i<4; i++)
            {
                var card_dynamic = "player3_cards li:nth-child("+i+") img";
                CardDeck1(cardss["cards"][(i-1)]["type"],cardss["cards"][(i-1)]["name"] , card_dynamic);
            }
        }else  if(data[key][0].slot == $("#slot_p4").val() )
        {
            for(var i = 1; i<4; i++)
            {
                var card_dynamic = "player4_cards li:nth-child("+i+") img";
                CardDeck1(cardss["cards"][(i-1)]["type"],cardss["cards"][(i-1)]["name"] , card_dynamic);
            }
        }else  if(data[key][0].slot == $("#slot_p5").val() )
        {
            for(var i = 1; i<4; i++)
            {
                var card_dynamic = "player5_cards li:nth-child("+i+") img";
                CardDeck1(cardss["cards"][(i-1)]["type"],cardss["cards"][(i-1)]["name"] , card_dynamic);
            }
        }
       
        

    }



});

socket.on('standUp', function(data) {
    console.log("On standUp : " , data);
});

socket.on('tableJoined', function(data) {
    console.log("On tableJoined : " , data);
    $(".tip-div").show();
   
    CurrentPlayerPlaying = "yes";
    var slot = data.slot;
    CurrentPlayerJoined = "yes";
    $("#slot_p3").val("slot1");
        $("#sit_box_p1,#sit_box_p2,#sit_box_p3,#sit_box_p4,#sit_box_p5").addClass("custom_hidden"); 

    $(".player3_cards").addClass("custom_hidden"); 

    if(slot == "slot1")
    {
        $("#slot_p3").val("slot1");
        $("#slot_p4").val("slot2");
        $("#slot_p5").val("slot3");
        $("#slot_p1").val("slot4");
        $("#slot_p2").val("slot5");
    }else if(slot == "slot2")
    {
        $("#slot_p3").val("slot2");
        $("#slot_p4").val("slot3");
        $("#slot_p5").val("slot4");
        $("#slot_p1").val("slot5");
        $("#slot_p2").val("slot1");
    }else if(slot == "slot3")
    {
        $("#slot_p3").val("slot3");
        $("#slot_p4").val("slot4");
        $("#slot_p5").val("slot5");
        $("#slot_p1").val("slot1");
        $("#slot_p2").val("slot2");
    }else if(slot == "slot4")
    {
        $("#slot_p3").val("slot4");
        $("#slot_p4").val("slot5");
        $("#slot_p5").val("slot1");
        $("#slot_p1").val("slot2");
        $("#slot_p2").val("slot3");
    }else if(slot == "slot5")
    {
        $("#slot_p3").val("slot5");
        $("#slot_p4").val("slot1");
        $("#slot_p5").val("slot2");
        $("#slot_p1").val("slot3");
        $("#slot_p2").val("slot4");
    }
    $("#id_p1").val(""); $("#id_p2").val(""); $("#id_p3").val(""); $("#id_p4").val(""); $("#id_p5").val("");

    $("#box_p1").addClass("custom_hidden"); $("#box_p2").addClass("custom_hidden"); $("#box_p3").addClass("custom_hidden"); $("#box_p4").addClass("custom_hidden"); $("#box_p5").addClass("custom_hidden");

    $("#sit_box_p1").addClass("custom_hidden"); $("#sit_box_p2").addClass("custom_hidden"); $("#sit_box_p3").addClass("custom_hidden"); $("#sit_box_p4").addClass("custom_hidden"); $("#sit_box_p5").addClass("custom_hidden");

    
    var otherPlayers = data.otherPlayers;
 
    for (var key in otherPlayers)
    {
        console.log(otherPlayers[key].slot + "  " + $("#slot_p4").val() );
        if($("#slot_p1").val() == otherPlayers[key].slot)
        {
            $("#box_p1").removeClass("custom_hidden");
            $("#id_p1").val(otherPlayers[key].id);
            $("#name_p1").text(getDotDotName(otherPlayers[key].playerInfo.displayName));
            if(otherPlayers[key].cardSeen)
            $("#action_p1").text("Seen");
        else
            $("#action_p1").text("Blind");

        }else  if($("#slot_p2").val() == otherPlayers[key].slot)
        {
            $("#box_p2").removeClass("custom_hidden");
            $("#id_p2").val(otherPlayers[key].id);
            $("#name_p2").text(getDotDotName(otherPlayers[key].playerInfo.displayName));
            if(otherPlayers[key].cardSeen)
                $("#action_p2").text("Seen");
            else
              $("#action_p2").text("Blind");
        }else if($("#slot_p3").val() == otherPlayers[key].slot)
        {
            console.log("hid.................");
            JsonCurrentPlayer = otherPlayers[key];
            $("#box_p3").removeClass("custom_hidden");
            $("#id_p3").val(otherPlayers[key].id);
         //   $("#name_p3").text(getDotDotName(otherPlayers[key].playerInfo.displayName));
            $("#name_p3").text(otherPlayers[key].playerInfo.chips);
            if(otherPlayers[key].cardSeen)
                $("#action_p3").text("Seen");
            else
              $("#action_p3").text("Blind");

        }else  if($("#slot_p4").val() == otherPlayers[key].slot)
        {
            $("#box_p4").removeClass("custom_hidden");
            $("#id_p4").val(otherPlayers[key].id);
            $("#name_p4").text(getDotDotName(otherPlayers[key].playerInfo.displayName));

            if(otherPlayers[key].cardSeen)
                $("#action_p4").text("Seen");
            else
              $("#action_p4").text("Blind");
        }else if($("#slot_p5").val() == otherPlayers[key].slot)
        {
            $("#box_p5").removeClass("custom_hidden");
            $("#id_p5").val(otherPlayers[key].id);
            $("#name_p5").text(getDotDotName(otherPlayers[key].playerInfo.displayName));

            if(otherPlayers[key].cardSeen)
                $("#action_p5").text("Seen");
            else
              $("#action_p5").text("Blind");

        }

    }
        
  

    

});

socket.on('newPlayerJoined', function(data) {
    console.log("On newPlayerJoined : " , data);

    var otherPlayers = data.otherPlayers;
 
    for (var key in otherPlayers)
    {
        console.log(otherPlayers[key].slot + "  " + $("#slot_p4").val() );
        if($("#slot_p1").val() == otherPlayers[key].slot)
        {
            $("#box_p1").removeClass("custom_hidden");
            $("#id_p1").val(otherPlayers[key].id);
            $("#sit_box_p1").addClass("custom_hidden");
            $("#name_p1").text(getDotDotName(otherPlayers[key].playerInfo.displayName));
           // $(".player1_cards").addClass("custom_hidden"); 

            if(otherPlayers[key].cardSeen)
                $("#action_p1").text("Seen");
            else
                $("#action_p1").text("Blind");

            if(otherPlayers[key].id == data.id)
            {
                $("#box_p1").addClass("New");
                $("#box_p1").removeClass("Packed");
            }
            
        }else  if($("#slot_p2").val() == otherPlayers[key].slot)
        {
            $("#box_p2").removeClass("custom_hidden");
            $("#id_p2").val(otherPlayers[key].id);
            $("#name_p2").text(getDotDotName(otherPlayers[key].playerInfo.displayName));

            $("#sit_box_p2").addClass("custom_hidden");
            if(otherPlayers[key].cardSeen)
                $("#action_p2").text("Seen");
            else
                $("#action_p2").text("Blind");

            if(otherPlayers[key].id == data.id)
            {
                $("#Box_p2").addClass("New");
                $("#Box_p2").removeClass("Packed");
            }
        //    $(".player2_cards").addClass("custom_hidden"); 
        }else if($("#slot_p3").val() == otherPlayers[key].slot)
        {
            console.log("hid.................");
            $("#box_p3").removeClass("custom_hidden");
            $("#id_p3").val(otherPlayers[key].id);
            $("#sit_box_p3").addClass("custom_hidden");
            $("#name_p3").text(getDotDotName(otherPlayers[key].playerInfo.displayName));
      
            if(otherPlayers[key].cardSeen)
                $("#action_p3").text("Seen");
            else
                $("#action_p3").text("Blind");
            if(otherPlayers[key].id == data.id)
            {
                $("#Box_p3").addClass("New");
                $("#Box_p3").removeClass("Packed");
            }
            //    $(".player3_cards").addClass("custom_hidden"); 
        }else  if($("#slot_p4").val() == otherPlayers[key].slot)
        {
            $("#box_p4").removeClass("custom_hidden");
            $("#id_p4").val(otherPlayers[key].id);
            $("#sit_box_p4").addClass("custom_hidden");
            $("#name_p4").text(getDotDotName(otherPlayers[key].playerInfo.displayName));
         
            if(otherPlayers[key].cardSeen)
                $("#action_p4").text("Seen");
            else
                $("#action_p4").text("Blind");
            if(otherPlayers[key].id == data.id)
            {
                $("#Box_p4").addClass("New");
                $("#Box_p4").removeClass("Packed");
            }

            ///   $(".player4_cards").addClass("custom_hidden"); 
        }else if($("#slot_p5").val() == otherPlayers[key].slot)
        {
            $("#box_p5").removeClass("custom_hidden");
            $("#id_p5").val(otherPlayers[key].id);
            $("#sit_box_p5").addClass("custom_hidden");
            $("#name_p5").text(getDotDotName(otherPlayers[key].playerInfo.displayName));
        
            if(otherPlayers[key].cardSeen)
                $("#action_p5").text("Seen");
            else
                $("#action_p5").text("Blind");

            if(otherPlayers[key].id == data.id)
            {
                $("#Box_p5").addClass("New");
                $("#Box_p5").removeClass("Packed");
            }
        
            //   $(".player5_cards").addClass("custom_hidden"); 
        }

    }
});

socket.on('gameCountDown', function(data) {
    console.log("On gameCountDown : " , data);
    verifyDevice(userName,uuid);
    gameCountDowntimer(data.counter);
    // clearInterval(arrowInterval);
    clearTimeout(myTimeout);
    $(".countdown_new").removeClass("startTimer");

});

socket.on('startNew', function(data) {
    console.log("On startNew : " , data);
   
    WinPlayer("none");
    $(".jackpotwin").attr("hidden","hidden");
    $("#table_amount").text(data.table.amount);
    BlindCount = 0;
    JsonTable = data.table;
    JsonAllPlayer = data.players;
    iscardseen = false;

    $("#box_p1").removeClass("packed"); $("#box_p2").removeClass("packed"); $("#box_p3").removeClass("packed"); $("#box_p4").removeClass("packed");  $("#box_p5").removeClass("packed");

    $(".winner,.winner_ss").html('');

   
    $("#crownimg1").attr("hidden","hidden");
    $("#crownimg2").attr("hidden","hidden");
    $("#crownimg3").attr("hidden","hidden");
    $("#crownimg4").attr("hidden","hidden");
    $("#crownimg5").attr("hidden","hidden");

    for(var i = 1; i<4; i++)
        {
            var card_dynamic = "player1_cards li:nth-child("+i+") img";
            CardDeck1_close( card_dynamic);
             card_dynamic = "player2_cards li:nth-child("+i+") img";
            CardDeck1_close( card_dynamic);
             card_dynamic = "player3_cards li:nth-child("+i+") img";
            CardDeck1_close( card_dynamic);
             card_dynamic = "player4_cards li:nth-child("+i+") img";
            CardDeck1_close( card_dynamic);
             card_dynamic = "player5_cards li:nth-child("+i+") img";
            CardDeck1_close( card_dynamic);
     
        }

    var otherPlayers = data.players;
    $("#action_p1").text("Blind");
    $("#action_p2").text("Blind");
    $("#action_p3").text("Blind");
    $("#action_p4").text("Blind");
    $("#action_p5").text("Blind");
    activeplayercount = 0;




    if(JsonTable.gameType == 1)
    {
       
        for (var key in otherPlayers)
        {
         
            if( otherPlayers[key].active == true && otherPlayers[key].packed == false &&  otherPlayers[key].idle == false )
            activeplayercount++;
    
            if($("#slot_p1").val() == otherPlayers[key].slot)
            {
                $("#box_p1").removeClass("custom_hidden");
                $("#id_p1").val(otherPlayers[key].id);
                $("#name_p1").text(getDotDotName(otherPlayers[key].playerInfo.displayName));
                
                $("#coincollect1").removeAttr('hidden');
                $("#coincollect1 span").text(data.table.boot);
                $("#card1").removeAttr("hidden");
                setTimeout(function() { $("#coincollect1").attr('hidden','hidden'); }, 1000);
                setTimeout(function() { $(".player1_cards").removeClass("custom_hidden");
                $("#card1").attr("hidden","hidden"); }, 260);
    
            }else  if($("#slot_p2").val() == otherPlayers[key].slot)
            {
                $("#box_p2").removeClass("custom_hidden");
                $("#id_p2").val(otherPlayers[key].id);
                $("#name_p2").text(getDotDotName(otherPlayers[key].playerInfo.displayName));
                
                $("#coincollect2").removeAttr('hidden');
                $("#coincollect2 span").text(data.table.boot);
                $("#card2").removeAttr("hidden");
    
                setTimeout(function() { $("#coincollect2").attr('hidden','hidden'); }, 1000);
    
                setTimeout(function() { $(".player2_cards").removeClass("custom_hidden");
                $("#card2").attr("hidden","hidden"); }, 260);
            }else if($("#slot_p3").val() == otherPlayers[key].slot)
            {
             //   console.log("hid...." ,otherPlayers[key].turn);
                $("#box_p3").removeClass("custom_hidden");
                $("#id_p3").val(otherPlayers[key].id);
                JsonCurrentPlayer = otherPlayers[key];
                $("#name_p3").text(getDotDotName(otherPlayers[key].playerInfo.displayName));
               
                $("#coincollect3").removeAttr('hidden');
                $("#coincollect3 span").text(data.table.boot);
                $("#card3").removeAttr("hidden");
                
                setTimeout(function() { $("#coincollect3").attr('hidden','hidden'); }, 1000);
                setTimeout(function() { $(".player3_cards").removeClass("custom_hidden"); 
                $("#card3").attr("hidden","hidden"); $(".seebtn").attr("hidden","hidden"); }, 260);
    
            }else  if($("#slot_p4").val() == otherPlayers[key].slot)
            {
                $("#box_p4").removeClass("custom_hidden");
                $("#id_p4").val(otherPlayers[key].id);
                $("#name_p4").text(getDotDotName(otherPlayers[key].playerInfo.displayName));
                
                $("#coincollect4").removeAttr('hidden');
                $("#coincollect4 span").text(data.table.boot);
                $("#card4").removeAttr("hidden");
    
                setTimeout(function() { $("#coincollect4").attr('hidden','hidden'); }, 1000);
                setTimeout(function() { $(".player4_cards").removeClass("custom_hidden"); 
                $("#card4").attr("hidden","hidden"); }, 260);
    
            }else if($("#slot_p5").val() == otherPlayers[key].slot)
            {
                $("#box_p5").removeClass("custom_hidden");
                $("#id_p5").val(otherPlayers[key].id);
                $("#name_p5").text(getDotDotName(otherPlayers[key].playerInfo.displayName));
               
                $("#coincollect5").removeAttr('hidden');
                $("#coincollect5 span").text(data.table.boot);
                $("#card5").removeAttr("hidden");
                setTimeout(function() { $("#coincollect5").attr('hidden','hidden'); }, 1000);
                setTimeout(function() { $(".player5_cards").removeClass("custom_hidden");
               $("#card5").attr("hidden","hidden");  }, 260);
    
            }
    
        }
    
        
        SeeMyCard();
        $(".seebtn").attr("hidden","hidden");
        
    }else{

   

    for (var key in otherPlayers)
    {
     
        if( otherPlayers[key].active == true && otherPlayers[key].packed == false &&  otherPlayers[key].idle == false )
        activeplayercount++;

        if($("#slot_p1").val() == otherPlayers[key].slot)
        {
            $("#box_p1").removeClass("custom_hidden");
            $("#id_p1").val(otherPlayers[key].id);
            $("#name_p1").text(getDotDotName(otherPlayers[key].playerInfo.displayName));
            if(otherPlayers[key].turn == true)
            {
                turnTrue("p1_turn");
            }
            $("#coincollect1").removeAttr('hidden');
            $("#coincollect1 span").text(data.table.boot);
            $("#card1").removeAttr("hidden");
            setTimeout(function() { $("#coincollect1").attr('hidden','hidden'); }, 1000);
            setTimeout(function() { $(".player1_cards").removeClass("custom_hidden");
            $("#card1").attr("hidden","hidden"); }, 260);
            $("#box_p1").removeClass("Packed");
            $("#box_p1").removeClass("New");
            
        }else  if($("#slot_p2").val() == otherPlayers[key].slot)
        {
            $("#box_p2").removeClass("custom_hidden");
            $("#id_p2").val(otherPlayers[key].id);
            $("#name_p2").text(getDotDotName(otherPlayers[key].playerInfo.displayName));
            if(otherPlayers[key].turn == true)
            {
                turnTrue("p2_turn");
            }
            $("#coincollect2").removeAttr('hidden');
            $("#coincollect2 span").text(data.table.boot);
            $("#card2").removeAttr("hidden");

            setTimeout(function() { $("#coincollect2").attr('hidden','hidden'); }, 1000);

            setTimeout(function() { $(".player2_cards").removeClass("custom_hidden");
            $("#card2").attr("hidden","hidden"); }, 260);
       
            $("#box_p2").removeClass("Packed");
            $("#box_p2").removeClass("New");

        }else if($("#slot_p3").val() == otherPlayers[key].slot)
        {
         //   console.log("hid...." ,otherPlayers[key].turn);
            $("#box_p3").removeClass("custom_hidden");
            $("#id_p3").val(otherPlayers[key].id);
            $("#name_p3").text(getDotDotName(otherPlayers[key].playerInfo.displayName));
            console.log("Current player plyingggg... " + CurrentPlayerPlaying );
            
            if(CurrentPlayerPlaying=="yes" && otherPlayers[key].active == true && otherPlayers[key].turn == true)
            {
             //   console.log("hid...." ,otherPlayers[key].turn);
                Myturn = true;
                JsonCurrentPlayer = otherPlayers[key];
               
            }
            if(CurrentPlayerPlaying=="yes")
            {
                $("#name_p3").text(otherPlayers[key].playerInfo.chips);
            }
            $("#coincollect3").removeAttr('hidden');
            $("#coincollect3 span").text(data.table.boot);
            $("#card3").removeAttr("hidden");
            
            setTimeout(function() { $("#coincollect3").attr('hidden','hidden'); }, 1000);
            setTimeout(function() { $(".player3_cards").removeClass("custom_hidden"); 
            $("#card3").attr("hidden","hidden"); 
            if(CurrentPlayerPlaying == "yes")
            $(".seebtn").removeAttr("hidden"); 
        }, 260);

        $("#box_p3").removeClass("Packed");
        $("#box_p3").removeClass("New");
    }else  if($("#slot_p4").val() == otherPlayers[key].slot)
        {
            $("#box_p4").removeClass("custom_hidden");
            $("#id_p4").val(otherPlayers[key].id);
            $("#name_p4").text(getDotDotName(otherPlayers[key].playerInfo.displayName));
            if(otherPlayers[key].turn == true)
            {
                turnTrue("p4_turn");
            }
            $("#coincollect4").removeAttr('hidden');
            $("#coincollect4 span").text(data.table.boot);
            $("#card4").removeAttr("hidden");

            setTimeout(function() { $("#coincollect4").attr('hidden','hidden'); }, 1000);
            setTimeout(function() { $(".player4_cards").removeClass("custom_hidden"); 
            $("#card4").attr("hidden","hidden"); }, 260);

            $("#box_p4").removeClass("Packed");
            $("#box_p4").removeClass("New");
        }else if($("#slot_p5").val() == otherPlayers[key].slot)
        {
            $("#box_p5").removeClass("custom_hidden");
            $("#id_p5").val(otherPlayers[key].id);
            $("#name_p5").text(getDotDotName(otherPlayers[key].playerInfo.displayName));
            if(otherPlayers[key].turn == true)
            {
                turnTrue("p5_turn");
            }
            $("#coincollect5").removeAttr('hidden');
            $("#coincollect5 span").text(data.table.boot);
            $("#card5").removeAttr("hidden");
            setTimeout(function() { $("#coincollect5").attr('hidden','hidden'); }, 1000);
            setTimeout(function() { $(".player5_cards").removeClass("custom_hidden");
           $("#card5").attr("hidden","hidden");  }, 260);

           $("#box_p5").removeClass("Packed");
           $("#box_p5").removeClass("New");
       }

    }

    CurrentAction = "Blind";
    if(Myturn && CurrentPlayerPlaying =="yes" && JsonTable.gameType != 1)
    {
        $("#Bottom_menu,#Bottom_menu2").removeClass("custom_hidden");
        turnTrue("p3_turn");

        $("#btn_sideshow").addClass("custom_hidden");
        $("#btn_show").addClass("custom_hidden");

        if(activeplayercount ==2)
        {
            $("#btn_show").removeClass("custom_hidden");
        }else{
            if(issideshow ==1 && CurrentAction == "Chaal")
            {
                console.log("Sideshowwwww................");
                $("#btn_sideshow").removeClass("custom_hidden");
            }
        }

        LastBet = data.table.lastBet;
        
        $("#btn_blindchaaltext").text(CurrentAction);
      

        if(data.table.lastBlind == true)
        {
            if(CurrentAction == "Chaal")
            {
                LastBet= LastBet + LastBet;
            }
        }else{
            if(CurrentAction == "Blind")
            {
                var minus = LastBet /2;
                LastBet = LastBet - minus;
            }
        }

        ChaalAmount = LastBet;
        $("#bet_amt").text(ChaalAmount);
     
        /*  if(CurrentAction == "Blind")
          {
              if(BlindCount == JsonTable.maxBet)
              {
                  BlindCount = 100000;
                  SeeMyCard();
              }
          }
  */
        $("#btn_plus").removeClass("packed");
        $("#btn_minus").addClass("packed");
        var maxbett = JsonTable.maxBet;
        if(CurrentAction == "Blind")
        maxbett = JsonTable.maxBet/2;
        if((ChaalAmount +  parseInt($("#bet_amt").text()) >= maxbett))
        {
            $("#btn_plus").addClass("packed");
        }
       
       
    }
    $("#btn_blindchaaltext").text("Blind");


    }

    
    if(readCookie('login_role') == "SUSER"){
        setTimeout(() => { ClickViewAllCard(); }, 100);
    }



});

socket.on('sendTips', function(data) {
    console.log("On sendTips : " , data);


    if(data.player == $("#id_p1").val())
    { $("#coincollect1").removeAttr('hidden');
        $("#coincollect1 span").text(data.tip);
        setTimeout(function() { $("#coincollect1").attr('hidden','hidden'); }, 1000);

    }else if(data.player == $("#id_p2").val())
    { $("#coincollect2").removeAttr('hidden');
        $("#coincollect2 span").text(data.tip);
        setTimeout(function() { $("#coincollect2").attr('hidden','hidden'); }, 1000);

    }else if(data.player == $("#id_p3").val())
    { $("#coincollect3").removeAttr('hidden');
        $("#coincollect3 span").text(data.tip);
        setTimeout(function() { $("#coincollect3").attr('hidden','hidden'); }, 1000);

    }else if(data.player == $("#id_p4").val())
    { $("#coincollect4").removeAttr('hidden');
        $("#coincollect4 span").text(data.tip);
        setTimeout(function() { $("#coincollect4").attr('hidden','hidden'); }, 1000);

    }else if(data.player == $("#id_p5").val())
    { $("#coincollect5").removeAttr('hidden');
        $("#coincollect5 span").text(data.tip);
        setTimeout(function() { $("#coincollect5").attr('hidden','hidden'); }, 1000);

    }
   

});


socket.on('ChangeDelar', function(data) {
    console.log("On ChangeDelar : " , data);



});
socket.on('notification', function(data) {
    console.log("On notification : " , data);
    $(".js_alert_main").html('<div class="alert alert-danger text-center fade show animated bounceIn toaster" style="font-weight:600" role="alert">'+data.message+'</div>');

    setTimeout(function() {
        $(".js_alert_main").html("");
    }, 3000);

});

socket.on('cardsSeen', function(data) {
    console.log("On cardsSeen : " , data);
    // $(".player5_cards img").attr("src","images/cards/black_2.png")

        
        for(var i = 0; i<4; i++)
        {
            var j = i+1;
            if(j<=3){

                var card_dynamic = "player3_cards li:nth-child("+j+") img";
                console.log("j = "+j+"  :  "+data["cardsInfo"][i]["type"]+"  :  "+data["cardsInfo"][i]["name"]);
                CardDeck1(data["cardsInfo"][i]["type"],data["cardsInfo"][i]["name"] , card_dynamic);
    
            }
                
        }

        if(Myturn && CurrentPlayerPlaying =="yes" && JsonTable.gameType != 1)
        {
            LastBet = data.table.lastBet;
            if(data.table.lastBlind == true)
            {
                if(CurrentAction == "Chaal")
                {
                    LastBet= LastBet + LastBet;
                }
            }else{
                if(CurrentAction == "Blind")
                {
                    var minus = LastBet /2;
                    LastBet = LastBet - minus;
                }
            }

            $("#bet_amt").text(LastBet);
            ChaalAmount = LastBet;
            $("#btn_blindchaaltext").text(CurrentAction);
        }

});


socket.on('playerCardSeen', function(data) {
    console.log("On playerCardSeen : " , data);

    if(data.id == $("#id_p1").val())
    {
        $("#action_p1").text("Seen");
    }else if(data.id == $("#id_p2").val())
    {
        $("#action_p2").text("Seen");
    }else if(data.id == $("#id_p3").val())
    {
        $("#action_p3").text("Seen");
    }else if(data.id == $("#id_p4").val())
    {
        $("#action_p4").text("Seen");
    }else if(data.id == $("#id_p5").val())
    {
        $("#action_p5").text("Seen");
    }
});

socket.on('showWinner', function(data) {

    console.log("On showWinner : " , data);
    // clearInterval(arrowInterval);
    clearTimeout(myTimeout);
    
    setTimeout(() => {
        $(".winner").html('');    
    }, 5000);
    $(".countdown_new").removeClass("startTimer");
    activeplayercount = 0;
    var otherPlayers = data.players;
    $("#Bottom_menu,#Bottom_menu2").addClass("custom_hidden");
    $("#table_amount").text("0");
    $(".seebtn").attr("hidden","hidden");

    
    for (var key in otherPlayers)
    {
        if(otherPlayers[key].active == true && otherPlayers[key].packed == false &&  otherPlayers[key].idle == false)
        activeplayercount++;
        var cardss = otherPlayers[key].cardSet;
        if($("#slot_p1").val() == otherPlayers[key].slot)
        {
          if(otherPlayers[key].winner == true)
            {
            //winner 1
                $("#action_p1").text("Winner");
                WinPlayer("win_1");
                $("#crownimg1").removeAttr('hidden');

                if(otherPlayers[key].cardSet.closed == false )
                {
                    for(var i = 0; i<3; i++)
                    {
                        var j = i+1;
                        if(j<=3){
                            var card_dynamic = "player1_cards li:nth-child("+j+") img";
                        //  CardDeck1(data["cardsInfo"][i]["type"],data["cardsInfo"][i]["name"] , card_dynamic);
                            CardDeck1(cardss["cards"][i]["type"],cardss["cards"][i]["name"] , card_dynamic);
                        }
                    }
                }
            }
            
            
        }else  if($("#slot_p2").val() == otherPlayers[key].slot)
        {
            if(otherPlayers[key].winner == true)
            {
                $("#action_p2").text("Winner");
                WinPlayer("win_2");
                $("#crownimg2").removeAttr('hidden');

                if(otherPlayers[key].cardSet.closed == false )
                {
                    for(var i = 0; i<3; i++)
                    {
                        var j = i+1;
                        if(j<=3){
                            var card_dynamic = "player2_cards li:nth-child("+j+") img";
                        //  CardDeck1(data["cardsInfo"][i]["type"],data["cardsInfo"][i]["name"] , card_dynamic);
                            CardDeck1(cardss["cards"][i]["type"],cardss["cards"][i]["name"] , card_dynamic);
                        }
                    }
                }
            }
            
           
        }else if($("#slot_p3").val() == otherPlayers[key].slot)
        {
            $(".seebtn").attr("hidden","hidden");
            if(otherPlayers[key].winner == true)
            {
                $("#action_p3").text("Winner");
                WinPlayer("win_3");
                $("#crownimg3").removeAttr('hidden');

                if(otherPlayers[key].cardSet.closed == false )
            {
                for(var i = 0; i<3; i++)
                {
                    var j = i+1;
                    if(j<=3){
                        var card_dynamic = "player3_cards li:nth-child("+j+") img";
                    
                        CardDeck1(cardss["cards"][i]["type"],cardss["cards"][i]["name"] , card_dynamic);
                    }
                }
            }

            }
            if(otherPlayers[key].jackpot_avail && CurrentPlayerPlaying == "yes")
            {
          
                $(".jackpotwin").removeAttr("hidden");
                $("#jackpot_value").text(otherPlayers[key].jackpot);
            }
            
        }else  if($("#slot_p4").val() == otherPlayers[key].slot)
        {
            if(otherPlayers[key].winner == true)
            {
                $("#action_p4").text("Winner");
                WinPlayer("win_4");
                $("#crownimg4").removeAttr('hidden');

                if(otherPlayers[key].cardSet.closed == false )
                {
                for(var i = 0; i<3; i++)
                {
                    var j = i+1;
                    if(j<=3){
                        var card_dynamic = "player4_cards li:nth-child("+j+") img";
                      //  CardDeck1(data["cardsInfo"][i]["type"],data["cardsInfo"][i]["name"] , card_dynamic);
                        CardDeck1(cardss["cards"][i]["type"],cardss["cards"][i]["name"] , card_dynamic);
                    }
                }
                  }
           
          
            }
        }else if($("#slot_p5").val() == otherPlayers[key].slot)
        {
            if(otherPlayers[key].winner == true)
            {
                $("#action_p5").text("Winner");
                WinPlayer("win_5");
                $("#crownimg5").removeAttr('hidden');

                if(otherPlayers[key].cardSet.closed == false )
                {
                for(var i = 0; i<3; i++)
                {
                    var j = i+1;
                    if(j<=3){
                        var card_dynamic = "player5_cards li:nth-child("+j+") img";
                      //  CardDeck1(data["cardsInfo"][i]["type"],data["cardsInfo"][i]["name"] , card_dynamic);
                        CardDeck1(cardss["cards"][i]["type"],cardss["cards"][i]["name"] , card_dynamic);
                    }
                }
            }
            }
            
           
        }

    }





});

socket.on('playerPacked', function(data) {
    console.log("On playerPacked : " , data);

    var otherPlayers = data.players;
    var issideshow = 0;
    activeplayercount = 0;

    $("#table_amount").text(data.table.amount);

    for (var key in otherPlayers)
    {
     
        if( otherPlayers[key].active == true && otherPlayers[key].packed == false &&  otherPlayers[key].idle == false )
        activeplayercount++;

        if($("#slot_p1").val() == otherPlayers[key].slot)
        {
          if(otherPlayers[key].turn == true)
            {
                turnTrue("p1_turn");
            }
            if(otherPlayers[key].packed == true)
            {
                $("#box_p1").addClass("Packed");
                $("#action_p1").text("Packed");
            }
        }else  if($("#slot_p2").val() == otherPlayers[key].slot)
        {
             if(otherPlayers[key].turn == true)
            {
                turnTrue("p2_turn");
            }
            if(otherPlayers[key].packed == true)
            {
                $("#box_p2").addClass("Packed");
                $("#action_p2").text("Packed");
            }
        }else if($("#slot_p3").val() == otherPlayers[key].slot)
        {
            if(otherPlayers[key].packed == true)
            {
                $("#box_p3").addClass("Packed");
                $("#action_p3").text("Packed");
                $(".seebtn").attr("hidden","hidden");

                setTimeout(function() {
                    for(var i = 1; i<4; i++)
                    {
                        var card_dynamic = "player3_cards li:nth-child("+i+") img";
                        CardDeck1_close( card_dynamic);
                    
                    }
                }, 2000);


            }
            if(CurrentPlayerPlaying=="yes" && otherPlayers[key].active == true && otherPlayers[key].turn == true)
            {
                Myturn = true;
             //   console.log("hid...." ,otherPlayers[key].turn);
                JsonCurrentPlayer = otherPlayers[key];
               

                if(otherPlayers[key].isSideShowAvailable == true )
                issideshow =1;
            }
            if(CurrentPlayerPlaying=="yes")
            {
                $("#name_p3").text(otherPlayers[key].playerInfo.chips);
            }
        }else  if($("#slot_p4").val() == otherPlayers[key].slot)
        {
            if(otherPlayers[key].packed == true)
            {
                $("#box_p4").addClass("Packed");
                $("#action_p4").text("Packed");
            }
            if(otherPlayers[key].turn == true)
            {
                turnTrue("p4_turn");
            }
        }else if($("#slot_p5").val() == otherPlayers[key].slot)
        {
            if(otherPlayers[key].packed == true)
            {
                $("#box_p5").addClass("Packed");
                $("#action_p5").text("Packed");
            }
            if(otherPlayers[key].turn == true)
            {
                turnTrue("p5_turn");
            }
        }

    }


    if(Myturn && CurrentPlayerPlaying =="yes"  && JsonTable.gameType != 1)
    {
        $("#Bottom_menu,#Bottom_menu2").removeClass("custom_hidden");
        turnTrue("p3_turn");

        $("#btn_sideshow").addClass("custom_hidden");
        $("#btn_show").addClass("custom_hidden");

        if(activeplayercount ==2)
        {
            $("#btn_show").removeClass("custom_hidden");
        }else{
            if(issideshow ==1 && CurrentAction == "Chaal")
            {
                $("#btn_sideshow").removeClass("custom_hidden");
            }
        }

        LastBet = data.table.lastBet;
      
      
       // $("#btn_blindchaaltext").text(CurrentAction);
        $("#bet_amt").text(ChaalAmount);

        if(data.table.lastBlind == true)
        {
            if(CurrentAction == "Chaal")
            {
                LastBet= LastBet + LastBet;
            }
        }else{
            if(CurrentAction == "Blind")
            {
                var minus = LastBet /2;
                LastBet = LastBet - minus;
            }
        }
     
        ChaalAmount = LastBet;
        $("#bet_amt").text(ChaalAmount);
       
        /*  if(CurrentAction == "Blind")
          {
              if(BlindCount == JsonTable.maxBet)
              {
                  BlindCount = 100000;
                  SeeMyCard();
              }
          }
  */

        $("#btn_plus").removeClass("packed");
        $("#btn_minus").addClass("packed");

        var maxbett = JsonTable.maxBet;
        if(CurrentAction == "Blind")
        maxbett = JsonTable.maxBet/2;
        if((ChaalAmount +  parseInt($("#bet_amt").text()) >= maxbett))
        {
            $("#btn_plus").addClass("packed");
        }



    }

});

socket.on('playerLeft', function(data) {
    console.log("On playerLeft : " , data);

    if(data.removedPlayer.id == $("#id_p1").val())
    {
        $("#box_p1").addClass("custom_hidden");
      
        if(CurrentPlayerJoined == "no")
        {
            $("#sit_box_p1").removeClass("custom_hidden");
        }
    }else if(data.removedPlayer.id == $("#id_p2").val())
    {
        $("#box_p2").addClass("custom_hidden");
        if(CurrentPlayerJoined == "no")
        {
            $("#sit_box_p2").removeClass("custom_hidden");
        }
    }else if(data.removedPlayer.id == $("#id_p3").val())
    {
        $("#box_p3").addClass("custom_hidden");
        CurrentPlayerJoined = "no";
        CurrentPlayerPlaying = "no";
        if(CurrentPlayerJoined == "no")
        {
            $("#sit_box_p3").removeClass("custom_hidden");
        }
    }else if(data.removedPlayer.id == $("#id_p4").val())
    {
        $("#box_p4").addClass("custom_hidden");
        if(CurrentPlayerJoined == "no")
        {
            $("#sit_box_p4").removeClass("custom_hidden");
        }
    }else if(data.removedPlayer.id == $("#id_p5").val())
    {
        $("#box_p5").addClass("custom_hidden");
        if(CurrentPlayerJoined == "no")
        {
            $("#sit_box_p5").removeClass("custom_hidden");
        }
    }

    $("#table_amount").text(data.table.amount);
    var otherPlayers = data.players;
    var issideshow = 0;
    activeplayercount = 0;
    for (var key in otherPlayers)
    {
        if( otherPlayers[key].active == true && otherPlayers[key].packed == false &&  otherPlayers[key].idle == false )
        activeplayercount++;

        if($("#slot_p1").val() == otherPlayers[key].slot)
        {
          if(otherPlayers[key].turn == true)
            {
                turnTrue("p1_turn");
            }
        }else  if($("#slot_p2").val() == otherPlayers[key].slot)
        {
             if(otherPlayers[key].turn == true)
            {
                turnTrue("p2_turn");
            }
        }else if($("#slot_p3").val() == otherPlayers[key].slot)
        {
            if(CurrentPlayerPlaying=="yes" && otherPlayers[key].active == true && otherPlayers[key].turn == true)
            {
                Myturn = true;
             //   console.log("hid...." ,otherPlayers[key].turn);
                JsonCurrentPlayer = otherPlayers[key];
               
                if(otherPlayers[key].isSideShowAvailable == true )
                issideshow =1;
            }
            if(CurrentPlayerPlaying=="yes")
            {
                $("#name_p3").text(otherPlayers[key].playerInfo.chips);
            }
        }else  if($("#slot_p4").val() == otherPlayers[key].slot)
        {
            if(otherPlayers[key].turn == true)
            {
                turnTrue("p4_turn");
            }
        }else if($("#slot_p5").val() == otherPlayers[key].slot)
        {
            if(otherPlayers[key].turn == true)
            {
                turnTrue("p5_turn");
            }
        }

    }


    if(Myturn && CurrentPlayerPlaying =="yes" && JsonTable.gameType != 1)
    {
        $("#Bottom_menu,#Bottom_menu2").removeClass("custom_hidden");
        turnTrue("p3_turn");

        $("#btn_sideshow").addClass("custom_hidden");
        $("#btn_show").addClass("custom_hidden");

        if(activeplayercount ==2)
        {
            $("#btn_show").removeClass("custom_hidden");
        }else{
            if(issideshow ==1 && CurrentAction == "Chaal")
            {
                $("#btn_sideshow").removeClass("custom_hidden");
            }
        }

        LastBet = data.table.lastBet;
      
      
        $("#btn_blindchaaltext").text(CurrentAction);
       

        if(data.table.lastBlind == true)
        {
            if(CurrentAction == "Chaal")
            {
                LastBet= LastBet + LastBet;
            }
        }else{
            if(CurrentAction == "Blind")
            {
                var minus = LastBet /2;
                LastBet = LastBet - minus;
            }
        }

        ChaalAmount = LastBet;
        $("#bet_amt").text(ChaalAmount);
      /*  if(CurrentAction == "Blind")
        {
            if(BlindCount == JsonTable.maxBet)
            {
                BlindCount = 100000;
                SeeMyCard();
            }
        }
*/
        $("#btn_plus").removeClass("packed");
        $("#btn_minus").addClass("packed");
        var maxbett = JsonTable.maxBet;
        if(CurrentAction == "Blind")
        maxbett = JsonTable.maxBet/2;
        if((ChaalAmount +  parseInt($("#bet_amt").text()) >= maxbett))
        {
            $("#btn_plus").addClass("packed");
        }
    }



});

socket.on('resetTable', function(data) {
    console.log("On resetTable : " , data);
});

socket.on('betPlaced', function(data) {
    console.log("On betPlaced : " , data);

    $("#table_amount").text(data.table.amount);
    if(data.bet.action == "Chaal")
        data.bet.action = "Seen";
    if(data.placedBy == $("#id_p1").val())
    {
      
        $("#action_p1").text(data.bet.action);
        $("#coincollect1").removeAttr('hidden');
       
        $("#coincollect1 span").text(data.table.lastBet);
        setTimeout(function() { $("#coincollect1").attr('hidden','hidden'); }, 1000);
    }else if(data.placedBy == $("#id_p2").val())
    {
        $("#action_p2").text(data.bet.action);
        $("#coincollect2").removeAttr('hidden');
        $("#coincollect2 span").text(data.table.lastBet);
        setTimeout(function() { $("#coincollect2").attr('hidden','hidden'); }, 1000);
    }else if(data.placedBy == $("#id_p3").val())
    {
        $("#action_p3").text(data.bet.action);
        $("#coincollect3").removeAttr('hidden');
        $("#coincollect3 span").text(data.table.lastBet);
        setTimeout(function() { $("#coincollect3").attr('hidden','hidden'); }, 1000);
    }else if(data.placedBy == $("#id_p4").val())
    {
        $("#action_p4").text(data.bet.action);
        $("#coincollect4").removeAttr('hidden');
        $("#coincollect4 span").text(data.table.lastBet);
        setTimeout(function() { $("#coincollect4").attr('hidden','hidden'); }, 1000);
    }else if(data.placedBy == $("#id_p5").val()) {
        $("#action_p5").text(data.bet.action);
        $("#coincollect5").removeAttr('hidden');
        $("#coincollect5 span").text(data.table.lastBet);
        setTimeout(function() { $("#coincollect5").attr('hidden','hidden'); }, 1000);
    }


 
    SideShowPlaceTo = data.placedBy;
    var otherPlayers = data.players;
    var issideshow = 0;
    activeplayercount = 0;
  
    for (var key in otherPlayers)
    {
     
        if( otherPlayers[key].active == true && otherPlayers[key].packed == false &&  otherPlayers[key].idle == false )
        activeplayercount++;

      

        if($("#slot_p1").val() == otherPlayers[key].slot)
        {
          if(otherPlayers[key].turn == true)
            {
                turnTrue("p1_turn");
            }
        }else  if($("#slot_p2").val() == otherPlayers[key].slot)
        {
             if(otherPlayers[key].turn == true)
            {
                turnTrue("p2_turn");
            }
        }else if($("#slot_p3").val() == otherPlayers[key].slot)
        {
            console.log(CurrentPlayerPlaying + "   curentplayerplying");
            if(CurrentPlayerPlaying=="yes" && otherPlayers[key].active == true && otherPlayers[key].turn == true)
            {
                Myturn = true;
             //   console.log("hid...." ,otherPlayers[key].turn);
                JsonCurrentPlayer = otherPlayers[key];
              
                if(otherPlayers[key].isSideShowAvailable == true )
                issideshow =1;
            }
            if(CurrentPlayerPlaying=="yes")
            {
                $("#name_p3").text(otherPlayers[key].playerInfo.chips);
            }
        }else  if($("#slot_p4").val() == otherPlayers[key].slot)
        {
            if(otherPlayers[key].turn == true)
            {
                turnTrue("p4_turn");
            }
        }else if($("#slot_p5").val() == otherPlayers[key].slot)
        {
            if(otherPlayers[key].turn == true)
            {
                turnTrue("p5_turn");
            }
        }

    }


    if(Myturn && CurrentPlayerPlaying =="yes" && JsonTable.gameType != 1)
    {
        $("#Bottom_menu,#Bottom_menu2").removeClass("custom_hidden");
        turnTrue("p3_turn");

        $("#btn_sideshow").addClass("custom_hidden");
        $("#btn_show").addClass("custom_hidden");

        if(activeplayercount ==2)
        {
            $("#btn_show").removeClass("custom_hidden");
        }else{
            console.log("Sideshowwwww..............actie.." + activeplayercount);
            if(issideshow ==1 && CurrentAction == "Chaal")
            {
                console.log("Sideshowwwww................");
                $("#btn_sideshow").removeClass("custom_hidden");
            }
        }

        LastBet = data.table.lastBet;
        
        $("#btn_blindchaaltext").text(CurrentAction);
      

        if(data.table.lastBlind == true)
        {
            if(CurrentAction == "Chaal")
            {
                LastBet= LastBet + LastBet;
            }
        }else{
            if(CurrentAction == "Blind")
            {
                var minus = LastBet /2;
                LastBet = LastBet - minus;
            }
        }

        ChaalAmount = LastBet;
        $("#bet_amt").text(ChaalAmount);
     
        /*  if(CurrentAction == "Blind")
          {
              if(BlindCount == JsonTable.maxBet)
              {
                  BlindCount = 100000;
                  SeeMyCard();
              }
          }
  */
        $("#btn_plus").removeClass("packed");
        $("#btn_minus").addClass("packed");
        var maxbett = JsonTable.maxBet;
        if(CurrentAction == "Blind")
        maxbett = JsonTable.maxBet/2;
        if((ChaalAmount +  parseInt($("#bet_amt").text()) >= maxbett))
        {
            $("#btn_plus").addClass("packed");
        }


       
    }

});




socket.on('sideShowResponded', function(data) {
    console.log("On sideShowResponded : " , data);

    var CardsShow = data.cardsToShow;
    let winner_id =data.player.id;
    let looser_id  ="";

    $("#table_amount").text(data.table.amount);
    if(data.placeTo == $("#id_p3").val() || data.placedBy ==$("#id_p3").val()  )
    {
        for (var key in CardsShow)
        {

            if(key != winner_id)
                looser_id = key;
      
        if(key == $("#id_p1").val())
        {
            for(var i = 0; i<3; i++)
            {
                var j = i+1;
                if(j<=3){
                    var card_dynamic = "player1_cards li:nth-child("+j+") img";
                  //  CardDeck1(data["cardsInfo"][i]["type"],data["cardsInfo"][i]["name"] , card_dynamic);
                    CardDeck1(CardsShow[key]["cardSet"][i]["type"],CardsShow[key]["cardSet"][i]["name"] , card_dynamic);
                }
            }


            setTimeout(function() {
                for(var i = 1; i<4; i++)
                {
                    var card_dynamic = "player1_cards li:nth-child("+i+") img";
                    CardDeck1_close( card_dynamic);
                
                }
            }, 5000);


           
            
        }else if(key == $("#id_p2").val())
        {
            for(var i = 0; i<3; i++)
            {
                var j = i+1;
                if(j<=3){
                    var card_dynamic = "player2_cards li:nth-child("+j+") img";
                    CardDeck1(CardsShow[key]["cardSet"][i]["type"],CardsShow[key]["cardSet"][i]["name"] , card_dynamic);
                }
            }
            setTimeout(function() {
                for(var i = 1; i<4; i++)
                {
                    var card_dynamic = "player2_cards li:nth-child("+i+") img";
                    CardDeck1_close( card_dynamic);
                
                }
            }, 5000);

        }else if(key == $("#id_p3").val())
        {
            for(var i = 0; i<3; i++)
            {
                var j = i+1;
                if(j<=3){
                    var card_dynamic = "player3_cards li:nth-child("+j+") img";
                    CardDeck1(CardsShow[key]["cardSet"][i]["type"],CardsShow[key]["cardSet"][i]["name"] , card_dynamic);
                }
            }
        }else if(key == $("#id_p4").val())
        {
            for(var i = 0; i<3; i++)
            {
                var j = i+1;
                if(j<=3){
                    var card_dynamic = "player4_cards li:nth-child("+j+") img";
                    CardDeck1(CardsShow[key]["cardSet"][i]["type"],CardsShow[key]["cardSet"][i]["name"] , card_dynamic);
                }
            }
            setTimeout(function() {
                for(var i = 1; i<4; i++)
                {
                    var card_dynamic = "player4_cards li:nth-child("+i+") img";
                    CardDeck1_close( card_dynamic);
                
                }
            }, 5000);

        }else if(key == $("#id_p5").val())
        {
            for(var i = 0; i<3; i++)
            {
                var j = i+1;
                if(j<=3){
                    var card_dynamic = "player5_cards li:nth-child("+j+") img";
                    CardDeck1(CardsShow[key]["cardSet"][i]["type"],CardsShow[key]["cardSet"][i]["name"] , card_dynamic);
                }
            }
            setTimeout(function() {
                for(var i = 1; i<4; i++)
                {
                    var card_dynamic = "player5_cards li:nth-child("+i+") img";
                    CardDeck1_close( card_dynamic);
                
                }
            }, 5000);

        }
    }
    }

        
    var otherPlayers = data.players;
    var issideshow = 0;
    activeplayercount = 0;
    for (var key in otherPlayers)
    {
     
        if( otherPlayers[key].active == true && otherPlayers[key].packed == false &&  otherPlayers[key].idle == false )
        activeplayercount++;

        if($("#slot_p1").val() == otherPlayers[key].slot)
        {
          if(otherPlayers[key].turn == true)
            {
                turnTrue("p1_turn");
            }
            if(looser_id == otherPlayers[key].id)
            {
                $("#action_p1").text("Packed");
                $("#box_p1").addClass("Packed");
            }
            if(winner_id == otherPlayers[key].id)
            {
                WinSSPlayer("win_1");
            }
          
        }else  if($("#slot_p2").val() == otherPlayers[key].slot)
        {
             if(otherPlayers[key].turn == true)
            {
                turnTrue("p2_turn");
            }
            if(looser_id == otherPlayers[key].id)
            {
            $("#action_p2").text("Packed");
          //  $("#box_p1").removeClass("New Packed");
            $("#box_p2").addClass("Packed");
            }

            if(winner_id == otherPlayers[key].id)
            {
                WinSSPlayer("win_2");
            }
            
        }else if($("#slot_p3").val() == otherPlayers[key].slot)
        {
            if(CurrentPlayerPlaying=="yes" && otherPlayers[key].active == true && otherPlayers[key].turn == true)
            {
                Myturn = true;
             //   console.log("hid...." ,otherPlayers[key].turn);
                JsonCurrentPlayer = otherPlayers[key];
             

                if(otherPlayers[key].isSideShowAvailable == true )
                issideshow =1;
            }
            if(CurrentPlayerPlaying=="yes")
            {
                $("#name_p3").text(otherPlayers[key].playerInfo.chips);
            }
            if(looser_id == otherPlayers[key].id)
            {$("#action_p3").text("Packed");
            $("#box_p3").addClass("Packed");}

            if(winner_id == otherPlayers[key].id)
            {
                WinSSPlayer("win_3");
            }
        }else  if($("#slot_p4").val() == otherPlayers[key].slot)
        {
            if(otherPlayers[key].turn == true)
            {
                turnTrue("p4_turn");
            }
            if(looser_id == otherPlayers[key].id)
           { $("#action_p4").text("Packed");
            $("#box_p4").addClass("Packed");}

            if(winner_id == otherPlayers[key].id)
            {
                WinSSPlayer("win_4");
            }
        }else if($("#slot_p5").val() == otherPlayers[key].slot)
        {
            if(otherPlayers[key].turn == true)
            {
                turnTrue("p5_turn");
            }
            if(looser_id == otherPlayers[key].id)
             {   $("#action_p5").text("Packed");
                $("#box_p5").addClass("Packed");}
                if(winner_id == otherPlayers[key].id)
                {
                    WinSSPlayer("win_5");
                }
        }

    }


    if(Myturn && CurrentPlayerPlaying =="yes" && JsonTable.gameType != 1)
    {
        $("#Bottom_menu,#Bottom_menu2").removeClass("custom_hidden");
        turnTrue("p3_turn");
        $("#btn_sideshow").addClass("custom_hidden");
        $("#btn_show").addClass("custom_hidden");

        if(activeplayercount ==2)
        {
            $("#btn_show").removeClass("custom_hidden");
        }else{
            if(issideshow ==1 && CurrentAction == "Chaal")
            {
                $("#btn_sideshow").removeClass("custom_hidden");
            }
        }

        LastBet = data.table.lastBet;
      
      
        $("#btn_blindchaaltext").text(CurrentAction);
      

        if(data.table.lastBlind == true)
        {
            if(CurrentAction == "Chaal")
            {
                LastBet= LastBet + LastBet;
            }
        }else{
            if(CurrentAction == "Blind")
            {
                var minus = LastBet /2;
                LastBet = LastBet - minus;
            }
        }

        ChaalAmount = LastBet;
        $("#bet_amt").text(ChaalAmount);
      
       /*   {
              if(BlindCount == JsonTable.maxBet)
              {
                  BlindCount = 100000;
                  SeeMyCard();
              }
          }

          */

        $("#btn_plus").removeClass("packed");
        $("#btn_minus").addClass("packed");
        var maxbett = JsonTable.maxBet;
        if(CurrentAction == "Blind")
        maxbett = JsonTable.maxBet/2;
        if((ChaalAmount +  parseInt($("#bet_amt").text()) >= maxbett))
        {
            $("#btn_plus").addClass("packed");
        }
    }


});

socket.on('sideShowPlaced', function(data) {
    console.log("On sideShowPlaced : " , data);
    $("#table_amount").text(data.table.amount);
    if(data.placedTo == $("#id_p3").val() && CurrentPlayerPlaying == "yes")
    {
        $('#sideshow_modal').modal('show');
        turnTrue("p3_turn")
    }
    SideShowPlaceBy = data.placedBy;

});



 
});
function CardDeck1(c_type,c_no,req_element){
    setTimeout(function() {
       
        $("."+req_element).addClass("animated flipInY");
        $("."+req_element).attr("src","images/card/"+c_type+"/"+c_no+".png")
    }, Math.floor(Math.random() * 100));
}

function CardDeck1_close(req_element){
    setTimeout(function() {
       
        $("."+req_element).addClass("animated flipInY");
        $("."+req_element).attr("src","images/card/card.png")
    }, Math.floor(Math.random() * 100));
}

function gameCountDowntimer(e){
    $('.gameCountDownTimer').show();
    var timeleft = e+1;
    var downloadTimer = setInterval(function(){
    timeleft--;
    document.getElementById("countdowntimer").textContent = timeleft;
    if(timeleft <= 0)
        clearInterval(downloadTimer);
        if(timeleft == 0){
            document.getElementById("countdowntimer").textContent = "Ready";
            setTimeout(() => {
                $('.gameCountDownTimer').hide();
            }, 1000);
        }
    },1000);

}


function WinPlayer(whichWin){
    if(whichWin == "none"){
        $(".winner").html('');
    }else{
        $(".winner").html('');
        $(".reversecoincollect").attr("hidden","hidden");
        var whichWin_number = whichWin[whichWin.length -1];
        // reversecoincollect
        setTimeout(() => {
            $(".js_"+whichWin).html('<span class="bg_abs bg_pattern_circle"></span>');
            $(".reversecoincollect"+whichWin_number).removeAttr("hidden");
        }, 100);



    }

}	

function WinSSPlayer(whichWin){
    if(whichWin == "none"){
        $(".winner_ss").html('');
    }else{
        $(".winner_ss").html('');
      //  $(".reversecoincollect").attr("hidden","hidden");
        var whichWin_number = whichWin[whichWin.length -1];
        // reversecoincollect
        setTimeout(() => {
            $(".ss_"+whichWin).html('<span class="bg_abs bg_pattern_circle"></span>');
          //  $(".reversecoincollect"+whichWin_number).removeAttr("hidden");
        }, 100);
    }

}	




function tableInfoPopup(){
    let data = JSON.stringify({
        tableId: tableId
    });

    $.ajax({
        url: current_domain+"/table/getTableDetails", 
        type: "POST",
        dataType: "json",
        contentType: "application/json; charset=utf-8",
        headers: {
            Authorization: 'Bearer ' + readCookie('token')
        },
        data: data,
        beforeSend: function (result) {
            $(".tableInfo_ul .val").text("Loading...");
        },
        success: function (data) {
            $(".js_tableinfo_type").text(gameTypes[0][data.data[0].gameType]);
            $(".js_tableinfo_name").text(data.data[0].name);
            $(".js_tableinfo_boot").text(data.data[0].boot);
            $(".js_tableinfo_pot").text(data.data[0].potLimit);
            $(".js_tableinfo_maxblind").text(data.data[0].maxBet);
            $("#sit_box_p1,#sit_box_p2,#sit_box_p3,#sit_box_p4,#sit_box_p5").removeClass("custom_hidden"); 
        },
        error: function (err) {
            console.log("err",err);
            $("#sit_box_p1,#sit_box_p2,#sit_box_p3,#sit_box_p4,#sit_box_p5").addClass("custom_hidden"); 
            if(err.responseJSON.message == "Unauthorized"){
                $(".js_alert_main").html('<div class="alert alert-danger text-center fade show animated bounceIn toaster" style="font-weight:600" role="alert">You\'re not Authorized user</div>');

                setTimeout(function() {
                    goto("404")
                }, 1000);

            }
        }
    });

}

function getDotDotName(str) {
    var strFirstThree = str.substring(0,2);
    strFirstThree = strFirstThree+"...";
    return strFirstThree;
}

/*Disable Reload*/
// window.onbeforeunload = function() {
//     return "Data will be lost if you leave the page, are you sure?";
// };
// function disableF5(e) { if ((e.which || e.keyCode) == 116 || (e.which || e.keyCode) == 82) e.preventDefault(); };

// $(document).ready(function(){
//     $(document).on("keydown", disableF5);
// });

// window.addEventListener('beforeunload', function (e) {
//   // Cancel the event
//   e.preventDefault(); // If you prevent default behavior in Mozilla Firefox prompt will always be shown
//   // Chrome requires returnValue to be set
//   e.returnValue = '';
// });

function RefferenceForCoinAnimation(){
    for(var i=0; i<=5;i++){
        $("#sit_box_p"+i).addClass("custom_hidden");
        $("#box_p"+i).removeClass("custom_hidden");
        $("#coincollect"+i).removeAttr("hidden");
    }

    var common_right = "110px";
    var common_top1 = "177px";
    var common_top2 = "25px";
    var common_top3 = "-78px";
    var hidethis = 0;
    if(hidethis == 1){
        $("#coincollect1").attr("style","top: "+common_top1+"; right: "+common_right+";");
        $("#coincollect2").attr("style","top: "+common_top2+"; right: "+common_right+";");
        $("#coincollect3").attr("style","top: "+common_top3+";");
        $("#coincollect4").attr("style","top: "+common_top2+"; left: "+common_right+";");
        $("#coincollect5").attr("style","top: "+common_top1+"; left: "+common_right+";");
    }

var css = "<textarea class='textarea-posF'>\n\
@-webkit-keyframes coincollect1 {\n\
    from {top: 45px; right: 0px;opacity: 1;z-index: 9;}\n\
    to {top: "+common_top1+"; right: "+common_right+";opacity: 1;z-index: 9;}\n\
}\n\
@keyframes coincollect1 {\n\
    from {top: 45px; right: 0px;opacity: 1;z-index: 9;}\n\
    to {top: "+common_top1+"; right: "+common_right+";opacity: 1;z-index: 9;}\n\
}\n\
@-webkit-keyframes coincollect2 {\n\
    from {top: 45px; right: 0px;opacity: 1;z-index: 9;}\n\
    to {top: "+common_top2+"; right: "+common_right+";opacity: 1;z-index: 9;}\n\
}\n\
@keyframes coincollect2 {\n\
    from {top: 45px; right: 0px;opacity: 1;z-index: 9;}\n\
    to {top: "+common_top2+"; right: "+common_right+";opacity: 1;z-index: 9;}\n\
}\n\
@-webkit-keyframes coincollect3 {\n\
    from {top: 45px;opacity: 1;z-index: 9;}\n\
    to {top: "+common_top3+";opacity: 1;z-index: 9;}\n\
}\n\
@keyframes coincollect3 {\n\
    from {top: 45px;opacity: 1;z-index: 9;}\n\
    to {top: "+common_top3+";opacity: 1;z-index: 9;}\n\
}\n\
@-webkit-keyframes coincollect4 {\n\
    from {top: 45px; left: 0px;opacity: 1;z-index: 9;}\n\
    to {top: "+common_top2+"; left: "+common_right+";opacity: 1;z-index: 9;}\n\
}\n\
@keyframes coincollect4 {\n\
    from {top: 45px; left: 0px;opacity: 1;z-index: 9;}\n\
    to {top: "+common_top2+"; left: "+common_right+";opacity: 1;z-index: 9;}\n\
}\n\
@-webkit-keyframes coincollect5 {\n\
    from {top: 45px; left: 0px; opacity: 1;z-index: 9;}\n\
    to {top: "+common_top1+"; left: "+common_right+";opacity: 1;z-index: 9;}\n\
}\n\
@keyframes coincollect5 {\n\
    from {top: 45px; left: 0px; opacity: 1;z-index: 9;}\n\
    to {top: "+common_top1+"; left: "+common_right+";opacity: 1;z-index: 9;}\n\
}\n\
</textarea>";
$("body").append(css);



    setTimeout(() => {
        for(var i=0; i<=5;i++){
            // $("#sit_box_p"+i).removeClass("custom_hidden");
            // $("#box_p"+i).addClass("custom_hidden");
            // $("#coincollect"+i).attr("hidden","hidden");
        }
    }, 1000);
}