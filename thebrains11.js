var callAttempts = 0;

function calculateIt() {
   var username = document.getElementById("username").value;

   username = encodeURI(username);

   var url = "http://www.boardgamegeek.com/xmlapi2/collection?username=" + username + "&played=0&stats=1&own=1&excludesubtype=boardgameexpansion";
   //var url = "http://localhost:80/GamesLeft/" + username + ".xml";

  document.getElementById("inquiry").style.visibility="hidden";
  document.getElementById("inquiry").style.display="none";

  document.getElementById("processing").style.visibility="visible";
  document.getElementById("processing").style.display="block";

  requestCrossDomain(url);
}

// Accepts a url and a callback function to run.
function requestCrossDomain( site, callback ) {
     
    // If no url was passed, exit.
    if ( !site ) {
        alert('No site was passed.');
        return false;
    }
     
    // Take the provided url, and add it to a YQL query. Make sure you encode it!
    var yql = 'http://query.yahooapis.com/v1/public/yql?q=' + encodeURIComponent('select * from xml where url="' + site + '"');
     
    // Request that YSQL string, and run a callback function.
    // Pass a defined function to prevent cache-busting.
    $.ajax({
       type : 'GET',
       dataType : 'xml',
       url : yql,
       success : getRDone
      });
     
}

function getRDone(data) {
   var x2js = new X2JS();
   var resubmit;
   callAttempts++;

   json = x2js.xml2json(data);
   console.log(json);

   var results = json.query.results;
    console.log(results);

   if(results.message === undefined && 
         results.errors === undefined &&
         results.items !== undefined &&
         results.items._totalitems > 0) {
      console.log(results.items);
      processData(results.items.item);
   } else if (results.errors !== undefined ) {
      console.log(results.errors.error.message);
      // Handle the error in the UI
      showError(results.errors.error.message);
   } else if (results.items._totalitems == 0) { 
      zeroGames();
   } else if (callAttempts < 10){
      console.log("Query Made. Waiting...");
      resubmit = setTimeout(calculateIt(),3000);
   } else {
      //Do something cause too many attempts were made.
      console.log("Time out.");
      showError("The request to BGG timed out. Please try again later.");
   }
}

function zeroGames() {
   document.getElementById("processing").style.visibility="hidden";
   document.getElementById("processing").style.display="none";

   document.getElementById("zero").style.visibility="visible";
   document.getElementById("zero").style.display="block";
}

function showError(message) {
   document.getElementById("processing").style.visibility="hidden";
   document.getElementById("processing").style.display="none";

   document.getElementById("error").style.visibility="visible";
   document.getElementById("error").style.display="block";

   document.getElementById("errorMessage").innerHTML = message;
}

function processData(gamesList) {
      document.getElementById("processing").style.visibility="hidden";
      document.getElementById("processing").style.display="none";

      document.getElementById("results").style.visibility="visible";
      document.getElementById("results").style.display="block";

      //console.log(gamesList);
      var answer = getTime(gamesList);

      var prettyTime = new PrettyTime(answer.time);


      console.log(prettyTime.toString());

      document.getElementById("gamesUnplayed").innerHTML = answer.unplayedGames + " unplayed " + plural(answer.unplayedGames,"game");
      document.getElementById("timeNeeded").innerHTML = prettyTime.toString();
      document.getElementById("numPlayers").innerHTML = answer.players + " unique " + plural(answer.players,"friend");
      document.getElementById("minPlayers").innerHTML = answer.minPlayers;

      var miniTime = prettyTime.miniTime();

      var twitterText = "It will take me & " + answer.players + " " + plural(answer.players, "friend") + " " + miniTime + "to play through my " + answer.unplayedGames + " #UnplayedGames!";

      addSocial(twitterText);
}

function addSocial(twitterText) {

   twttr.widgets.createShareButton(
         'http://BebopDevelopment.com/UnplayedGames',
         document.getElementById('twitterLink'),
      {
         count: 'none',
         text: twitterText
      }).then(function (el) {
      });


}

function getTime(games) {
   var length = 0;
   var time = 0;
   var players = 0;
   var gameStats = {};
   var tempTime = 0;
   var tempPlayers = 0;
   var min = 0;
   var minPlayers = 0;
   if (games.length === undefined) {
      console.log("Only One GAME!?" + games);
      length = 1;
      gameStats = games.stats;
      tempTime = Number(gameStats._playingtime);
      time += isNaN(tempTime) ? 0 : tempTime;
      min = Number(gameStats._minplayers);
      tempPlayers = avgPlayers(min, Number(gameStats._maxplayers));
      players += isNaN(tempPlayers) ? 0 : tempPlayers;
      minPlayers += isNaN(min) ? 0 : (min-1);
   } else {
      length = games.length;
      for (var i = length - 1; i >= 0; i--) {
         if(games[i].stats === undefined) {
            continue;
         }
         gameStats = games[i].stats;
         tempTime = Number(gameStats._playingtime);
         time += isNaN(tempTime) ? 0 : tempTime;
         min = Number(gameStats._minplayers);
         tempPlayers = avgPlayers(min, Number(gameStats._maxplayers));
         players += isNaN(tempPlayers) ? 0 : tempPlayers;
         minPlayers += isNaN(min) ? 0 : (min-1);
      };
   }
   return {unplayedGames: length, time: time, players: players, minPlayers: minPlayers};
}

/**
 * Converts a time given in minutes to something nicer to read.
 */
function PrettyTime(time) {
   var MINS_PER_YEAR = 24 * 365 * 60;
   var MINS_PER_MONTH = 24 * 30 * 60;
   var MINS_PER_WEEK = 24 * 7 * 60;
   var MINS_PER_HOUR = 60;
   var MINS_PER_DAY = 24 * 60;

   var remains = 0;

   this.years = Math.floor(time / MINS_PER_YEAR);
   remains = time % MINS_PER_YEAR;
   this.months = Math.floor(remains / MINS_PER_MONTH);
   remains = remains % MINS_PER_MONTH;
   this.weeks = Math.floor(remains / MINS_PER_WEEK);
   remains = remains % MINS_PER_WEEK;
   this.days = Math.floor(remains / MINS_PER_DAY);
   remains = remains % MINS_PER_DAY;
   this.hours = Math.floor(remains / MINS_PER_HOUR);
   this.minutes = remains % MINS_PER_HOUR;
}

PrettyTime.prototype.toString = function prettyTimeToString() {
   var ret = "";
   ret += (this.years > 0) ? this.years + " " + plural(this.years, 'year') + ", " : "";
   ret += (this.months > 0) ? this.months + " " + plural(this.months, 'months') + ", " : "";
   ret += (this.weeks > 0) ? this.weeks + " " + plural(this.weeks, 'week') + ", " : "";
   ret += (this.days > 0) ? this.days + " " + plural(this.days, 'day') + ", " : "";
   ret += (this.hours > 0) ? this.hours + " " + plural(this.hours, 'hour') + ", " : "";
   ret += (this.minutes > 0) ? "and " + this.minutes + " " + plural(this.minutes, 'minute') : "";

   return ret;
}

PrettyTime.prototype.miniTime = function prettyMiniToString() {
   var ret = "";
   ret += (this.years > 0) ? this.years + plural(this.years, 'yr') + " "  : "";
   ret += (this.months > 0) ? this.months + plural(this.months, 'mo') + " "  : "";
   ret += (this.weeks > 0) ? this.weeks + plural(this.weeks, 'wk') + " " : "";
   ret += (this.days > 0) ? this.days + plural(this.days, 'day') + " " : "";
   ret += (this.hours > 0) ? this.hours + plural(this.hours, 'hr') + " " : "";
   ret += (this.minutes > 0) ? "and " + this.minutes + plural(this.minutes, 'min') + " " : "";

   return ret;
}

function plural(num, word) {
   if (num > 1) {
      return word + "s";
   }
   return word;
}

function avgPlayers(min, max) {
   if (min === undefined || isNaN(min)) {
      return max;
   }
   if (max === undefined || isNaN(max)) {
      return min;
   }

   // Minus one because we don't include the inquirer.
   return (Math.floor((max + min)/2) - 1);
}
