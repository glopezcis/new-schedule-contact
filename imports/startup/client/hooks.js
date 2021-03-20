import { useTracker } from 'meteor/react-meteor-data';

import { AgencyDataCollection } from '/imports/api/agencyData';
import { QueuesCollection } from '/imports/api/queues';
import { QueueItemsCollection } from '/imports/api/queueItems';
import { QueueContactsCollection } from '/imports/api/queueContact';
import { CellPhoneCarrierCollection } from '/imports/api/cellPhoneCarrier';

// User account hook
export const useAccount = () => useTracker(() => {
  const rolessSubscription = Meteor.subscribe('rolesBySelfUser');
  const agencySubscription = Meteor.subscribe('agencyData');

  const user = Meteor.user();
  const userId = Meteor.userId();
  const isLoggingIn = Meteor.loggingIn();
  const roles = Roles.getRolesForUser(userId);

  return {
    user,
    userId,
    isLoggingIn,
    isLoggedIn: !!userId,
    roles,
    loading: !rolessSubscription.ready(),
    agencyData: AgencyDataCollection.findOne(),
  }
}, []);

export const useAgencyData = () => useTracker(() => {
  const agencySubscription = Meteor.subscribe('agencyData');
  const loading = !agencySubscription.ready();

  return {
    agencyData: AgencyDataCollection.findOne(),
    loading,
    handlers: [ agencySubscription ]
  };
}, []);

export const useQueueById = (queueId) => useTracker(() => {
  const queuesSubscription = Meteor.subscribe('queueById', queueId);
  const loading = !queuesSubscription.ready();

  return {
    queue: QueuesCollection.findOne({ _id: queueId }),
    loading,
  };
}, [queueId]);


export const useAllCarriers = () => useTracker(() => {
  const CarriersSubscription = Meteor.subscribe('allCarriers');
  const loading = !CarriersSubscription.ready();

  let allCarriers = CellPhoneCarrierCollection.find({}, { sort: { "name": 1 } }).fetch();

  allCarriers = allCarriers.sort((a, b) => {
    const order = ["Metro PCS", "Boost", "Verizon", "Sprint", "T Mobile", "AT&T"];
    return (order.indexOf(b.name) - order.indexOf(a.name)) || (order.indexOf(b.name) - order.indexOf(a.name));
  });

  return {
    allCarriers,
    loading,
  };
}, []);

