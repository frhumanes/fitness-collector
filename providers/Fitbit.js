var FitbitApiClient = require("fitbit-node");
var _ = require('underscore');
var async = require('async');
var squel = require('squel');
var moment = require('moment');
var config = require("../config.js");

var LIMIT = 0;

var DEFAULT = 39; // Otros
var typesTranslator = {
  'Bike': 15,
  90001 : 15, // Bike
  'Run': 1,
  90009: 1, // Run
  'Swim': 37,
  'Hike': 51,
  90012 : 51, // hike
  'Walk': 2,
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
  'Workout': DEFAULT,
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
    console.log('Refresh token info', result);
    var access_token = result.access_token,
        refresh_token = result.refresh_token;
    console.log("Fetching activities for User "+ IdUser +" from " + moment(after).subtract(1, 'day').format('YYYY-MM-DD'));

    fitbit.get("/activities/list.json?sort=asc&limit=20&offset=0&afterDate="+moment(after).subtract(1, 'day').format('YYYY-MM-DDTHH:mm:ss'), access_token).then(
      function(result) {
        //do something with your payload
        if ( !result[0].activities.length ){
          console.log("Any new activity");
        }
        var last_activity_date = after;
        async.each(result[0].activities, function(activity, callback){
          console.log(activity);
          var start_date = moment(activity.startTime).format('YYYY-MM-DD HH:mm:ss');
          var end_date = moment(activity.startTime).add({'milliseconds':activity.duration}).format('YYYY-MM-DD HH:mm:ss');
          var distance = activity.distance;
          var speed = activity.speed;
          switch(activity.distanceUnit){
            case 'Kilometer':
              distance *= 1000;
              speed *= (1000/3600);
              break;
            case 'Mile':
              distance *= 1609;
              speed *= (1609/3600);
              break;
          }
          var result = {
            Id_Usuario: IdUser,
            IdActividad: activity.logId,
            IdAppProveedor: IdAppProveedor,
            IdTipoActividad: typesTranslator[activity.activityName] || typesTranslator[activity.activityTypeId] || DEFAULT,
            Calorias: activity.calories,
            Duracion: activity.duration/1000,
            Distancia: distance,
            Velocidad: speed,
            Pasos: activity.steps || null,
            FechaInicioActividad: start_date,
            FechaFinActividad: end_date,
            Raw: JSON.stringify(activity)
          }
          last_activity_date = moment().format('YYYY-MM-DD HH:mm:ss');
          // if (last_activity_date && start_date > last_activity_date){
          //   last_activity_date = start_date;
          //   // console.log('update', last_activity_date);
          // } else {
          //   last_activity_date = start_date;
          //   // console.log('set', last_activity_date);
          // }
          // console.log(result);
          var data = squel.insert()
          .into("mivfit_datos")
          .setFields(result);
          console.log(data.toString());

          conn.query(data.toString(), function(err, result){
            if (err && err.code == 'ER_DUP_ENTRY') {
              console.log('Skipping already registered activitity', err);
              callback();
            } else {
              callback(err)
            }
          });
        }, function(){
          // console.log(last_activity_date, access_token, refresh_token);
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
