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
}

function extractData(IdAppProveedor,IdUser, token, after, conn, cb){
  // console.log(IdUser, token, after);
  strava.athlete.listActivities({'access_token':token, 'after': moment(after).unix()},function(err,payload) {
      //do something with your payload
      // console.log(err, payload)
      async.each(payload, function(activity, callback){
        //console.log(activity);
        var result = {
          Id_Usuario: IdUser,
          IdActividad: 0,
          IdAppProveedor: IdAppProveedor,
          IdTipoActividad: typesTranslator[activity.type] || DEFAULT,
          Duracion: activity.moving_time,
          Distancia: activity.distance,
          Velocidad: activity.average_speed,
          Pasos: activity.steps || null,
          FechaInicioActividad: moment(activity.start_date).format('YYYY-MM-DD HH:mm:ss'),
          FechaFinActividad: moment(activity.start_date).add({'seconds':activity.elapsed_time}).format('YYYY-MM-DD HH:mm:ss'),
          Raw: JSON.stringify(activity)
        }
        // console.log(result);
        var data = squel.insert()
        .into("mivfit_datos")
        .setFields(result);
        console.log(data.toString());

        conn.query(data.toString());
        callback();
      }, cb)
  });
}

module.exports = {
  'getAndStoreActivities': extractData,
  'LIMIT': LIMIT
}
