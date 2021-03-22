import { Meteor } from 'meteor/meteor';
import {CellPhoneCarrierCollection} from "../../imports/api/cellPhoneCarrier";

Meteor.methods({

  allCarriers() {
    return CellPhoneCarrierCollection.find({}, { sort: { "name": 1 } }).fetch();
  },

  getCarrierById(carrierId) {
    return CellPhoneCarrierCollection.findOne(carrierId);
  }

});
