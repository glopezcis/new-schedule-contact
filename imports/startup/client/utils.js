import { Slingshot } from 'meteor/edgee:slingshot';

const methodToPromise = function(methodName, ...params) {
  return new Promise((resolve, reject) =>
    Meteor.call(methodName, ...params, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    })
  );
};

const uploadFileToS3 = function(file, notifyProgress = function(){}) {
  const upload = new Slingshot.Upload("documentsUploads");
  function showProgress() {
    setTimeout(function() {
      let progress = upload.progress() || 0;
      progress = progress * 100;
      notifyProgress(progress);
      if (progress < 100) {
        showProgress();
      }
    }, 200);
  }

  return new Promise((resolve, reject) => {
    showProgress();
    upload.send(file, function (error, downloadUrl) {
      if (error) {
        console.log('Error => ', error);
        reject(error);
      } else {
        console.log(downloadUrl);
        resolve(downloadUrl);
      }
    });
  });
};

const persistData = function(key, value) {
  Meteor.call('updatePreference', key, value, (error, result) => {
    if (error) {
      alert(error);
    }
  });
};

const retriveData = function(key, defaultValue = null)  {
  const user = Meteor.user();
  if (!user) {
    return defaultValue;
  }
  const { profile } = user;
  if (!profile) {
    return defaultValue;
  }

  const { preferences } = profile;
  if (!preferences) {
    return defaultValue;
  }

  const data = preferences[key];
  if (!data) {
    return defaultValue;
  }
  return data;
};

export {
  methodToPromise,
  uploadFileToS3,
  persistData,
  retriveData,
}
