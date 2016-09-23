var strava = require('strava-v3');
var _ = require('underscore');
var async = require('async');
var squel = require('squel');
var moment = require('moment');

var LIMIT = 600;

var DEFAULT = 39; // Otros
var typesTranslator = {
  'Ride': 15,
  'Run': 1,
  'Swim': 37,
  'Hike': 51,
  'Walk': 2,
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
  'Workout': DEFAULT, //Ejercicios
  'Yoga': DEFAULT
}

function extractData(IdAppProveedor,IdUser, token, after, conn, cb){
  console.log("Fetching activities for User "+ IdUser +" from " + after);

  strava.athlete.listActivities({'access_token':token, 'after': moment(after).unix()},function(err,payload) {
      //do something with your payload
      // console.log(err, payload)
      var last_activity_date;
      async.each(payload, function(activity, callback){
        //console.log(activity);
        var end_date = moment(activity.start_date).add({'seconds':activity.elapsed_time}).format('YYYY-MM-DD HH:mm:ss');
        var result = {
          Id_Usuario: IdUser,
          IdActividad: activity.id,
          IdAppProveedor: IdAppProveedor,
          IdTipoActividad: typesTranslator[activity.type] || DEFAULT,
          Duracion: activity.moving_time,
          Distancia: activity.distance,
          Velocidad: activity.average_speed,
          Pasos: activity.steps || null,
          FechaInicioActividad: moment(activity.start_date).format('YYYY-MM-DD HH:mm:ss'),
          FechaFinActividad: end_date,
          Raw: JSON.stringify(activity)
        }
        if (last_activity_date && end_date > last_activity_date){
          last_activity_date = end_date;
          // console.log('update', last_activity_date);
        } else {
          last_activity_date = end_date;
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
        cb(last_activity_date);
      })
  });
}

module.exports = {
  'getAndStoreActivities': extractData,
  'LIMIT': LIMIT
}
