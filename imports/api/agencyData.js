import { Mongo } from 'meteor/mongo';

const AgencyDataCollection = new Mongo.Collection('agencyData');
AgencyDataCollection.attachBehaviour('timestampable');

export {
  AgencyDataCollection
};
