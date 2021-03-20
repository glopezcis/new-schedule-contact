import { Mongo } from 'meteor/mongo';

const CellPhoneCarrierCollection = new Mongo.Collection('cellPhoneCarrier');
CellPhoneCarrierCollection.attachBehaviour('timestampable');

export {
  CellPhoneCarrierCollection
};
