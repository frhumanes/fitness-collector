var FitbitApiClient = require("fitbit-node");
var _ = require('underscore');
var async = require('async');
var squel = require('squel');
var moment = require('moment');
var config = require("../config.js");

var LIMIT = 600;

var DEFAULT = 39; // Otros
var typesTranslator = {
  90001 : 15, // Bike
  90009: 1, // Run
  'Swim': 37,
  90012 : 51, // hike
  90013 : 2, // Walk
  'AlpineSki': 25,
  'BackcountrySki': 27,
  'Caanoeing': DEFAULT, //Piraguismo
  'Crossfit': DEFAULT,
  'EBikeRide': DEFAULT, //Bici ELectrica
  'Elliptical': DEFAULT,
  'IceSkate': DEFAULT,
  'InlineSkate': DEFAULT,
  'Kayaking': DEFAULT,
  'Kitesurf': DEFAULT,
  'NordicSki': DEFAULT,
  'RockClimb': DEFAULT,
  'RollerSKi': DEFAULT, //Esqui sobre ruedas
  'Rowing': DEFAULT, //remo
  'Snowboard': DEFAULT,
  'Snowshoe': DEFAULT, //
  'StairStepper': DEFAULT,
  'StandUpPaddling': DEFAULT, //Surf de remo
  'Surfing': DEFAULT,
  'VirtualRide': DEFAULT, //Entrenamiento Virtual
  'WeightTraining': DEFAULT, //Pesas
  'Windsurf': DEFAULT,
  3000 : DEFAULT, //Ejercicios
  'Yoga': DEFAULT
}

RESOURCE = "https://api.fitbit.com/1/user/-/activities/list.json";

function extractData(obj, conn, cb){
  var IdAppProveedor = obj.IdAppProveedor,
      IdUser = obj.Id_Usuario,
      token = obj.token,
      after = obj.last_query,
      refresh_token = obj.refresh_token;
  // Refresh token, then save it, and then get activitities
  var fitbit = new FitbitApiClient(config.fitbit.clientID, config.fitbit.clientSecret);

  fitbit.refreshAccesstoken(token, refresh_token).then(function(result){
    console.log(result);
    var access_token = result.access_token,
        refresh_token = result.refresh_token;
    console.log("Fetching activities for User "+ IdUser +" from " + after, moment(after).format('YYYY-MM-DDTHH:mm:ss'));

    fitbit.get("/activities/list.json?sort=asc&limit=20&offset=0&afterDate="+moment(after).format('YYYY-MM-DDTHH:mm:ss'), access_token).then(
      function(result) {
        //do something with your payload
        console.log(result[0]);
        var last_activity_date = after;
        async.each(result[0].activities, function(activity, callback){
          console.log(activity);
          var start_date = moment(activity.startTime).format('YYYY-MM-DD HH:mm:ss');
          var end_date = moment(activity.startTime).add({'seconds':activity.duration}).format('YYYY-MM-DD HH:mm:ss');
          var result = {
            Id_Usuario: IdUser,
            IdActividad: activity.logId,
            IdAppProveedor: IdAppProveedor,
            IdTipoActividad: typesTranslator[activity.activityTypeId] || DEFAULT,
            Calorias: activity.calories,
            Duracion: activity.duration,
            Distancia: activity.distance,
            Velocidad: activity.speed,
            Pasos: activity.steps || null,
            FechaInicioActividad: start_date,
            FechaFinActividad: end_date,
            Raw: JSON.stringify(activity)
          }
          if (last_activity_date && start_date > last_activity_date){
            last_activity_date = start_date;
            // console.log('update', last_activity_date);
          } else {
            last_activity_date = start_date;
            // console.log('set', last_activity_date);
          }
          // console.log(result);
          var data = squel.insert()
          .into("mivfit_datos")
          .setFields(result);
          console.log(data.toString());

          conn.query(data.toString(), callback);
          //callback();
        }, function(){
          console.log(last_activity_date, access_token, refresh_token);
          cb(last_activity_date, access_token, refresh_token);
        })
      }
    ).catch(function(error){
      console.log(error);
      cb(after, access_token, refresh_token);
    });
  }).catch(function(error){
    console.log(error.message, error.context.errors);
    cb();
  })
}

module.exports = {
  'getAndStoreActivities': extractData,
  'LIMIT': LIMIT
}
